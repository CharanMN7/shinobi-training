import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/src/db";
import { users, loginAttempts } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as argon2 from "argon2";

const loginSchema = z.object({
  email: z.string().email(),
  // max 128 prevents argon2 DoS via multi-MB inputs
  password: z.string().min(8).max(128),
});

const MAX_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

// Cached dummy hash — used for constant-time comparison when user not found,
// preventing timing-based user enumeration.
let _dummyHash: string | null = null;
async function getDummyHash(): Promise<string> {
  if (!_dummyHash) {
    _dummyHash = await argon2.hash("__shinobi_dummy_sentinel__", {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }
  return _dummyHash;
}

// All rate-limit keys are lowercased to prevent case-variant bypass attacks
// (e.g., USER@example.com vs user@example.com treated as different identifiers).
async function checkRateLimit(normalizedEmail: string): Promise<boolean> {
  const now = new Date();
  const existing = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, normalizedEmail),
  });

  if (existing?.lockedUntil && existing.lockedUntil > now) {
    return false; // locked
  }

  return true;
}

async function recordFailedAttempt(normalizedEmail: string) {
  const now = new Date();
  const existing = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, normalizedEmail),
  });

  if (!existing) {
    await db.insert(loginAttempts).values({
      identifier: normalizedEmail,
      attempts: 1,
      updatedAt: now,
    });
    return;
  }

  const newAttempts = existing.attempts + 1;
  const lockedUntil =
    newAttempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
      : null;

  await db
    .update(loginAttempts)
    .set({ attempts: newAttempts, lockedUntil, updatedAt: now })
    .where(eq(loginAttempts.identifier, normalizedEmail));
}

async function clearAttempts(normalizedEmail: string) {
  await db
    .update(loginAttempts)
    .set({ attempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(loginAttempts.identifier, normalizedEmail));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // refresh daily
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.displayName = (user as { displayName?: string }).displayName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      (session.user as { displayName?: string }).displayName = token.displayName as string;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const allowed = await checkRateLimit(normalizedEmail);
        if (!allowed) throw new Error("Too many attempts. Try again later.");

        const user = await db.query.users.findFirst({
          where: eq(users.email, normalizedEmail),
        });

        if (!user) {
          // Run dummy verify to keep response time constant regardless of
          // whether the email exists — prevents timing-based enumeration.
          await argon2.verify(await getDummyHash(), password).catch(() => {});
          await recordFailedAttempt(normalizedEmail);
          return null;
        }

        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) {
          await recordFailedAttempt(normalizedEmail);
          return null;
        }

        await clearAttempts(normalizedEmail);
        return { id: user.id, email: user.email, displayName: user.displayName };
      },
    }),
  ],
});
