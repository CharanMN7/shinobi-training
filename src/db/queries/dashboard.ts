import { db } from "@/src/db";
import {
  liftEntries,
  bodyStats,
  runningSessions,
  mobilityStats,
  skillCheckpoints,
  userSettings,
  users,
} from "@/src/db/schema";
import { eq, desc, max, sql } from "drizzle-orm";
import {
  getLiftTargets,
  getPctToTarget,
  computeNinjaRank,
  computeLiftRank,
  LIFT_LABELS,
  type LiftKey,
  type LiftStat,
} from "@/src/lib/engines";

export interface DashboardData {
  user: { id: string; displayName: string | null; email: string };
  settings: { goalWeightKg: number; timezone: string };
  currentWeightKg: number | null;
  previousWeightKg: number | null;
  weightDelta: number | null;
  lifts: LiftStat[];
  rank: ReturnType<typeof computeNinjaRank>;
  skillsAchieved: number;
  skillsTotal: number;
  runningTotals: {
    sessionsTotal: number;
    kmTotal: number;
    minutesTotal: number;
    weeklyKm: number;
    weeklyEasyKm: number;
    weeklyHardKm: number;
  };
  latestMobility: {
    frontSplitGapCm: number | null;
    middleSplitGapCm: number | null;
    wallHsHoldS: number | null;
    freestandingHsHoldS: number | null;
    lsitHoldS: number | null;
  } | null;
  recentActivity: Array<{
    type: "lift" | "body" | "run" | "mobility";
    date: string;
    summary: string;
  }>;
  weightHistory: Array<{ date: string; weightKg: number }>;
  liftHistory: Array<{ date: string; lift: LiftKey; weightKg: number; reps: number }>;
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const LIFTS: LiftKey[] = ["squat", "deadlift", "bench", "ohp", "pullup"];

  const [
    user,
    settings,
    bestPerLift,
    recentBodyStats,
    allBodyStats,
    skillStats,
    runTotals,
    weeklyRuns,
    latestMobility,
    recentLifts,
    recentRuns,
    recentBody,
  ] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) }),
    db
      .select({
        lift: liftEntries.lift,
        bestKg: max(liftEntries.weightKg),
      })
      .from(liftEntries)
      .where(eq(liftEntries.userId, userId))
      .groupBy(liftEntries.lift),
    db.query.bodyStats.findMany({
      where: eq(bodyStats.userId, userId),
      orderBy: [desc(bodyStats.date)],
      limit: 2,
    }),
    db.query.bodyStats.findMany({
      where: eq(bodyStats.userId, userId),
      orderBy: [desc(bodyStats.date)],
      limit: 90,
      columns: { date: true, weightKg: true },
    }),
    db.query.skillCheckpoints.findMany({
      where: eq(skillCheckpoints.userId, userId),
    }),
    db
      .select({
        sessionsTotal: sql<number>`count(*)::int`,
        kmTotal: sql<number>`sum(distance_km)::numeric`,
        minutesTotal: sql<number>`sum(duration_min)::numeric`,
      })
      .from(runningSessions)
      .where(eq(runningSessions.userId, userId)),
    db
      .select({
        type: runningSessions.type,
        distanceKm: runningSessions.distanceKm,
      })
      .from(runningSessions)
      .where(
        sql`${runningSessions.userId} = ${userId} AND ${runningSessions.date} >= current_date - interval '7 days'`
      ),
    db.query.mobilityStats.findFirst({
      where: eq(mobilityStats.userId, userId),
      orderBy: [desc(mobilityStats.date)],
    }),
    db.query.liftEntries.findMany({
      where: eq(liftEntries.userId, userId),
      orderBy: [desc(liftEntries.date), desc(liftEntries.createdAt)],
      limit: 5,
    }),
    db.query.runningSessions.findMany({
      where: eq(runningSessions.userId, userId),
      orderBy: [desc(runningSessions.date)],
      limit: 3,
    }),
    db.query.bodyStats.findMany({
      where: eq(bodyStats.userId, userId),
      orderBy: [desc(bodyStats.date)],
      limit: 3,
    }),
  ]);

  const goalWeightKg = settings ? parseFloat(settings.goalWeightKg) : 80;
  const timezone = settings?.timezone ?? "Asia/Kolkata";

  const bestMap: Record<string, number> = {};
  for (const row of bestPerLift) {
    bestMap[row.lift] = parseFloat(row.bestKg ?? "0");
  }

  const liftStats: LiftStat[] = LIFTS.map((lift) => {
    const best = bestMap[lift] ?? 0;
    const targets = getLiftTargets(lift, goalWeightKg);
    const pctToStrong = getPctToTarget(best, targets.strong);
    const pctToAdvanced = getPctToTarget(best, targets.advanced);
    return {
      lift,
      bestKg: best,
      pctToStrong,
      pctToAdvanced,
      strongTarget: targets.strong,
      advancedTarget: targets.advanced,
    };
  });

  const rank = computeNinjaRank(liftStats);

  const skillsAchieved = skillStats.filter((s) => s.status === "achieved").length;
  const skillsTotal = skillStats.length;

  const rt = runTotals[0];
  const weeklyEasyKm = weeklyRuns
    .filter((r) => r.type === "easy" || r.type === "long_easy" || r.type === "recovery")
    .reduce((sum, r) => sum + parseFloat(r.distanceKm), 0);
  const weeklyHardKm = weeklyRuns
    .filter((r) => r.type === "intervals")
    .reduce((sum, r) => sum + parseFloat(r.distanceKm), 0);
  const weeklyKm = weeklyEasyKm + weeklyHardKm;

  const currentWeight = recentBodyStats[0] ? parseFloat(recentBodyStats[0].weightKg) : null;
  const previousWeight = recentBodyStats[1] ? parseFloat(recentBodyStats[1].weightKg) : null;

  const recentActivity: DashboardData["recentActivity"] = [
    ...recentLifts.map((l) => ({
      type: "lift" as const,
      date: l.date,
      summary: `${LIFT_LABELS[l.lift as LiftKey] ?? l.lift}: ${l.weightKg} kg × ${l.reps}`,
    })),
    ...recentRuns.map((r) => ({
      type: "run" as const,
      date: r.date,
      summary: `Run (${r.type}): ${parseFloat(r.distanceKm).toFixed(1)} km`,
    })),
    ...recentBody.map((b) => ({
      type: "body" as const,
      date: b.date,
      summary: `Weight: ${parseFloat(b.weightKg).toFixed(1)} kg`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const weightHistory = allBodyStats
    .map((b) => ({ date: b.date, weightKg: parseFloat(b.weightKg) }))
    .reverse();

  const liftHistory = recentLifts.map((l) => ({
    date: l.date,
    lift: l.lift as LiftKey,
    weightKg: parseFloat(l.weightKg),
    reps: l.reps,
  }));

  return {
    user: {
      id: user?.id ?? userId,
      displayName: user?.displayName ?? null,
      email: user?.email ?? "",
    },
    settings: { goalWeightKg, timezone },
    currentWeightKg: currentWeight,
    previousWeightKg: previousWeight,
    weightDelta: currentWeight != null && previousWeight != null ? currentWeight - previousWeight : null,
    lifts: liftStats,
    rank,
    skillsAchieved,
    skillsTotal,
    runningTotals: {
      sessionsTotal: rt?.sessionsTotal ?? 0,
      kmTotal: parseFloat((rt?.kmTotal as unknown as string) ?? "0"),
      minutesTotal: parseFloat((rt?.minutesTotal as unknown as string) ?? "0"),
      weeklyKm,
      weeklyEasyKm,
      weeklyHardKm,
    },
    latestMobility: latestMobility
      ? {
          frontSplitGapCm: latestMobility.frontSplitGapCm ? parseFloat(latestMobility.frontSplitGapCm) : null,
          middleSplitGapCm: latestMobility.middleSplitGapCm ? parseFloat(latestMobility.middleSplitGapCm) : null,
          wallHsHoldS: latestMobility.wallHsHoldS,
          freestandingHsHoldS: latestMobility.freestandingHsHoldS,
          lsitHoldS: latestMobility.lsitHoldS,
        }
      : null,
    recentActivity,
    weightHistory,
    liftHistory,
  };
}
