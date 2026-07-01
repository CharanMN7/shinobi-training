"use server";

import { db } from "@/src/db";
import { skillCheckpoints } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

const updateSkillSchema = z.object({
  skillKey: z.enum([
    "rolls_cartwheel", "handstand_2h", "handstand_pushup",
    "pistol_squat", "lsit_planche", "front_split", "middle_split",
    "windmill", "backflip", "front_flip", "one_arm_handstand",
  ]),
  status: z.enum(["not_started", "working", "achieved"]),
  notes: z.string().max(500).optional().nullable(),
});

export async function updateSkillStatus(input: z.infer<typeof updateSkillSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const parsed = updateSkillSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    const { skillKey, status, notes } = parsed.data;

    await db
      .update(skillCheckpoints)
      .set({ status, notes: notes ?? null, updatedAt: new Date() })
      .where(
        and(
          eq(skillCheckpoints.userId, session.user.id),
          eq(skillCheckpoints.skillKey, skillKey)
        )
      );

    revalidatePath("/skills");
    revalidatePath("/");

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
