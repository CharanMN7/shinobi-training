"use server";

import { db } from "@/src/db";
import { runningSessions } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

const logRunSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["easy", "long_easy", "intervals", "recovery"]),
  distanceKm: z.number().positive().max(1000),
  durationMin: z.number().positive().max(1440),
  notes: z.string().max(500).optional().nullable(),
});

export async function logRun(input: z.infer<typeof logRunSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const parsed = logRunSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    const { date, type, distanceKm, durationMin, notes } = parsed.data;

    const [entry] = await db
      .insert(runningSessions)
      .values({
        userId: session.user.id,
        date,
        type,
        distanceKm: distanceKm.toString(),
        durationMin: durationMin.toString(),
        notes: notes ?? null,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/running");

    return { data: entry };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteRun(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    await db
      .delete(runningSessions)
      .where(and(eq(runningSessions.id, id), eq(runningSessions.userId, session.user.id)));

    revalidatePath("/running");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
