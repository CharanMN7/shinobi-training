import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/src/db";
import { users, loginAttempts } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as argon2 from "argon2";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const MAX_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

async function checkRateLimit(email: string): Promise<boolean> {
  const now = new Date();
  const existing = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, email),
  });

  if (existing?.lockedUntil && existing.lockedUntil > now) {
    return false; // locked
  }

  return true;
}

async function recordFailedAttempt(email: string) {
  const now = new Date();
  const existing = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, email),
  });

  if (!existing) {
    await db.insert(loginAttempts).values({
      identifier: email,
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
    .where(eq(loginAttempts.identifier, email));
}

async function clearAttempts(email: string) {
  await db
    .update(loginAttempts)
    .set({ attempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(loginAttempts.identifier, email));
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

        const allowed = await checkRateLimit(email);
        if (!allowed) throw new Error("Too many attempts. Try again later.");

        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });

        if (!user) {
          await recordFailedAttempt(email);
          return null;
        }

        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) {
          await recordFailedAttempt(email);
          return null;
        }

        await clearAttempts(email);
        return { id: user.id, email: user.email, displayName: user.displayName };
      },
    }),
  ],
});
