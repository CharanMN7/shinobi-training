"use server";

import { db } from "@/src/db";
import { liftEntries } from "@/src/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

const logLiftSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lift: z.enum(["squat", "deadlift", "ohp", "pullup", "bench"]),
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().positive().max(100),
  rpe: z.number().min(1).max(10).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function logLift(input: z.infer<typeof logLiftSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const parsed = logLiftSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    const { date, lift, weightKg, reps, rpe, notes } = parsed.data;

    const [entry] = await db
      .insert(liftEntries)
      .values({
        userId: session.user.id,
        date,
        lift,
        weightKg: weightKg.toString(),
        reps,
        rpe: rpe?.toString() ?? null,
        notes: notes ?? null,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/lifts");

    return { data: entry };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteLiftEntry(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    await db
      .delete(liftEntries)
      .where(and(eq(liftEntries.id, id), eq(liftEntries.userId, session.user.id)));

    revalidatePath("/lifts");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
