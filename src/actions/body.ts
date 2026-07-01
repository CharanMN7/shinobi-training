"use server";

import { db } from "@/src/db";
import { bodyStats } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

const logBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().max(300),
  waistCm: z.number().positive().max(300).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function logBodyStat(input: z.infer<typeof logBodySchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const parsed = logBodySchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    const { date, weightKg, waistCm, notes } = parsed.data;

    const [entry] = await db
      .insert(bodyStats)
      .values({
        userId: session.user.id,
        date,
        weightKg: weightKg.toString(),
        waistCm: waistCm?.toString() ?? null,
        notes: notes ?? null,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/body");

    return { data: entry };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteBodyStat(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    await db
      .delete(bodyStats)
      .where(and(eq(bodyStats.id, id), eq(bodyStats.userId, session.user.id)));

    revalidatePath("/body");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
