"use server";

import { db } from "@/src/db";
import { userSettings } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const updateSettingsSchema = z.object({
  goalWeightKg: z.number().positive().min(30).max(200),
  timezone: z
    .string()
    .min(1)
    .max(64)
    .refine(isValidIANATimezone, { message: "Invalid timezone identifier" }),
});

export async function updateSettings(input: z.infer<typeof updateSettingsSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const parsed = updateSettingsSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    await db
      .update(userSettings)
      .set({
        goalWeightKg: parsed.data.goalWeightKg.toString(),
        timezone: parsed.data.timezone,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, session.user.id));

    revalidatePath("/");
    revalidatePath("/standards");
    revalidatePath("/settings");

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
