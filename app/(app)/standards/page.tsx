import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { userSettings, liftEntries } from "@/src/db/schema";
import { eq, max } from "drizzle-orm";
import { Header, DesktopPageHeader } from "@/components/layout/header";
import { StandardsClient } from "./standards-client";
import {
  getLiftTargets,
  getPctToTarget,
  computeNinjaRank,
  computeLiftRank,
  LIFT_LABELS,
  RANK_CONFIG,
  type LiftKey,
} from "@/src/lib/engines";
import type { Metadata } from "next";

export default async function StandardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [settings, bests] = await Promise.all([
    db.query.userSettings.findFirst({ where: eq(userSettings.userId, session.user.id) }),
    db
      .select({ lift: liftEntries.lift, bestKg: max(liftEntries.weightKg) })
      .from(liftEntries)
      .where(eq(liftEntries.userId, session.user.id))
      .groupBy(liftEntries.lift),
  ]);

  const goalKg = settings ? parseFloat(settings.goalWeightKg) : 80;
  const bestMap: Record<string, number> = {};
  for (const b of bests) bestMap[b.lift] = parseFloat(b.bestKg ?? "0");

  const LIFTS: LiftKey[] = ["squat", "deadlift", "bench", "ohp", "pullup"];
  const liftStats = LIFTS.map((lift) => {
    const best = bestMap[lift] ?? 0;
    const targets = getLiftTargets(lift, goalKg);
    const pctToStrong = getPctToTarget(best, targets.strong);
    const pctToAdvanced = getPctToTarget(best, targets.advanced);
    const liftRank = computeLiftRank(pctToStrong, pctToAdvanced);
    return {
      lift,
      label: LIFT_LABELS[lift],
      bestKg: best,
      strongTarget: targets.strong,
      advancedTarget: targets.advanced,
      pctToStrong,
      pctToAdvanced,
      liftRank,
    };
  });

  const rank = computeNinjaRank(liftStats);

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="STANDARDS" subtitle="準" />
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-3xl mx-auto">
        <DesktopPageHeader title="Strength Standards" subtitle="準 — your targets by rank" />
        <StandardsClient
          liftStats={liftStats}
          rank={rank}
          goalKg={goalKg}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
