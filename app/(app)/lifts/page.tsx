import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { liftEntries, userSettings } from "@/src/db/schema";
import { eq, desc, max } from "drizzle-orm";
import { Header, DesktopPageHeader } from "@/components/layout/header";
import { LiftLogClient } from "./lift-log-client";
import { getLiftTargets, LIFT_LABELS, type LiftKey } from "@/src/lib/engines";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lift Log" };

export default async function LiftLogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [settings, bests, recentEntries] = await Promise.all([
    db.query.userSettings.findFirst({ where: eq(userSettings.userId, session.user.id) }),
    db
      .select({ lift: liftEntries.lift, bestKg: max(liftEntries.weightKg) })
      .from(liftEntries)
      .where(eq(liftEntries.userId, session.user.id))
      .groupBy(liftEntries.lift),
    db.query.liftEntries.findMany({
      where: eq(liftEntries.userId, session.user.id),
      orderBy: [desc(liftEntries.date), desc(liftEntries.createdAt)],
      limit: 100,
    }),
  ]);

  const goalKg = settings ? parseFloat(settings.goalWeightKg) : 80;
  const bestMap: Record<string, number> = {};
  for (const b of bests) bestMap[b.lift] = parseFloat(b.bestKg ?? "0");

  const liftSummary = (["squat", "deadlift", "bench", "ohp", "pullup"] as LiftKey[]).map((lift) => {
    const best = bestMap[lift] ?? 0;
    const targets = getLiftTargets(lift, goalKg);
    return { lift, label: LIFT_LABELS[lift], best, ...targets };
  });

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="LIFTS" subtitle="力" />
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-3xl mx-auto">
        <DesktopPageHeader title="Lift Log" subtitle="力 — track every working set" />
        <LiftLogClient
          liftSummary={liftSummary}
          recentEntries={recentEntries.map((e) => ({
            ...e,
            weightKg: e.weightKg.toString(),
            rpe: e.rpe?.toString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
