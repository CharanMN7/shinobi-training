"use server";

import { db } from "@/src/db";
import { users, userSettings, skillCheckpoints, skillKeyEnum, loginAttempts } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as argon2 from "argon2";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { SKILL_ORDER } from "@/src/lib/engines";

const registerSchema = z.object({
  email: z.string().email().max(254),
  // max 128 prevents argon2 DoS; mirrors loginSchema
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(64).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(64),
});

export async function registerUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ success: true } | { error: string }> {
  if (process.env.SINGLE_USER === "true") {
    return { error: "Registration disabled." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input." };

  const { email, password, displayName } = parsed.data;
  const lowerEmail = email.toLowerCase();

  // Rate-limit registration by email to prevent brute-force account creation
  const now = new Date();
  const attempt = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, `register:${lowerEmail}`),
  });
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    return { error: "Too many registration attempts. Try again later." };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, lowerEmail),
    columns: { id: true },
  });
  // Generic error — don't reveal whether the email is already taken
  if (existing) return { error: "Registration failed. Please try a different email." };

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const [user] = await db
    .insert(users)
    .values({ email: lowerEmail, passwordHash, displayName: displayName ?? null })
    .returning({ id: users.id });

  await db.insert(userSettings).values({ userId: user.id });

  await db.insert(skillCheckpoints).values(
    SKILL_ORDER.map((skillKey) => ({
      userId: user.id,
      skillKey: skillKey as (typeof skillKeyEnum.enumValues)[number],
      status: "not_started" as const,
    }))
  );

  return { success: true };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input." };

  const { currentPassword, newPassword } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!user) return { error: "User not found" };

  const valid = await argon2.verify(user.passwordHash, currentPassword);
  if (!valid) return { error: "Current password is incorrect" };

  const newHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export async function updateProfile(input: {
  displayName: string;
}): Promise<{ success: true } | { error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input." };

    await db
      .update(users)
      .set({ displayName: parsed.data.displayName })
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
