"use server";

import { db } from "@/src/db";
import { mobilityStats } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

const logMobilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frontSplitGapCm: z.number().min(0).max(100).optional().nullable(),
  middleSplitGapCm: z.number().min(0).max(100).optional().nullable(),
  wallHsHoldS: z.number().int().min(0).max(3600).optional().nullable(),
  freestandingHsHoldS: z.number().int().min(0).max(3600).optional().nullable(),
  lsitHoldS: z.number().int().min(0).max(3600).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function logMobility(input: z.infer<typeof logMobilitySchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const parsed = logMobilitySchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    const data = parsed.data;

    const [entry] = await db
      .insert(mobilityStats)
      .values({
        userId: session.user.id,
        date: data.date,
        frontSplitGapCm: data.frontSplitGapCm?.toString() ?? null,
        middleSplitGapCm: data.middleSplitGapCm?.toString() ?? null,
        wallHsHoldS: data.wallHsHoldS ?? null,
        freestandingHsHoldS: data.freestandingHsHoldS ?? null,
        lsitHoldS: data.lsitHoldS ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/mobility");

    return { data: entry };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
