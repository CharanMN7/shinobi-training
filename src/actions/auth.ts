"use server";

import { db } from "@/src/db";
import { users, userSettings, skillCheckpoints, skillKeyEnum } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as argon2 from "argon2";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { SKILL_ORDER } from "@/src/lib/engines";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(64).optional(),
});

export async function registerUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ success: true } | { error: string }> {
  if (process.env.SINGLE_USER === "true") {
    const existing = await db.query.users.findMany({ columns: { id: true } });
    if (existing.length > 0) return { error: "Registration disabled." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input." };

  const { email, password, displayName } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, lowerEmail),
    columns: { id: true },
  });
  if (existing) return { error: "Email already registered." };

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

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!user) return { error: "User not found" };

  const valid = await argon2.verify(user.passwordHash, input.currentPassword);
  if (!valid) return { error: "Current password is incorrect" };

  if (input.newPassword.length < 8) return { error: "New password must be at least 8 characters" };

  const newHash = await argon2.hash(input.newPassword, {
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

    await db
      .update(users)
      .set({ displayName: input.displayName })
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
