"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RANK_CONFIG, computeLiftRank, computeNinjaRank, type NinjaRank } from "@/src/lib/engines";
import { cn, clampPct } from "@/lib/utils";
import { updateSettings } from "@/src/actions/settings";
import { toast } from "sonner";
import { RankCard } from "@/components/dashboard/rank-card";

type LiftStat = {
  lift: string;
  label: string;
  bestKg: number;
  strongTarget: number;
  advancedTarget: number;
  pctToStrong: number;
  pctToAdvanced: number;
  liftRank: NinjaRank;
};

const LIFT_COLORS: Record<string, string> = {
  squat: "#F97316", deadlift: "#E63946", bench: "#3B82F6", ohp: "#F4C20D", pullup: "#2F9E44",
};

export function StandardsClient({
  liftStats,
  rank,
  goalKg: initialGoalKg,
  userId,
}: {
  liftStats: LiftStat[];
  rank: ReturnType<typeof computeNinjaRank>;
  goalKg: number;
  userId: string;
}) {
  const [goalKg, setGoalKg] = useState(initialGoalKg);
  const [isPending, startTransition] = useTransition();

  function handleGoalUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newGoal = parseFloat(fd.get("goalKg") as string);
    if (isNaN(newGoal)) return;

    startTransition(async () => {
      const result = await updateSettings({ goalWeightKg: newGoal, timezone: "Asia/Kolkata" });
      if ("error" in result) toast.error(result.error);
      else { toast.success("Goal updated — targets recalculated!"); setGoalKg(newGoal); }
    });
  }

  return (
    <div className="space-y-5">
      {/* Current rank */}
      <RankCard
        rank={rank.rank}
        avgPctToStrong={rank.avgPctToStrong}
        allAtStrong={rank.allAtStrong}
        allAtAdvanced={rank.allAtAdvanced}
      />

      {/* Goal weight editor */}
      <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#A1A6AD] uppercase tracking-wider mb-3">Goal Weight</p>
        <form onSubmit={handleGoalUpdate} className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs text-[#6B7076]">Target bodyweight (kg)</Label>
            <Input
              name="goalKg"
              type="number"
              step="0.5"
              defaultValue={goalKg}
              min="30"
              max="200"
              required
              className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1 text-xl h-12 font-bold font-[var(--font-archivo)]"
            />
          </div>
          <Button type="submit" disabled={isPending} className="bg-[#F97316] text-[#0D0D0F] font-bold h-12 px-5">
            Update
          </Button>
        </form>
        <p className="text-[10px] text-[#6B7076] mt-2">All strength targets derive from this value.</p>
      </div>

      {/* Lift standards table */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-[#A1A6AD] uppercase tracking-wider">Per-Lift Standards (at {goalKg} kg)</h2>
        {liftStats.map((lift) => {
          const color = LIFT_COLORS[lift.lift] ?? "#F97316";
          const rankCfg = RANK_CONFIG[lift.liftRank];
          return (
            <div key={lift.lift} className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">力</p>
                  <p className="text-sm font-black font-[var(--font-archivo)] uppercase" style={{ color }}>
                    {lift.label}
                  </p>
                </div>
                <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm", rankCfg.textClass, rankCfg.bgClass)}>
                  {lift.liftRank}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">Best</p>
                  <p className="text-lg font-black font-[var(--font-archivo)] tabular-nums" style={{ color }}>
                    {lift.bestKg > 0 ? `${lift.bestKg.toFixed(1)}` : "—"}
                    <span className="text-[10px] font-normal text-[#6B7076]"> kg</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[#A1A6AD] uppercase tracking-wider">Strong</p>
                  <p className="text-lg font-black font-[var(--font-archivo)] tabular-nums text-[#F5F6F7]">
                    {lift.strongTarget}
                    <span className="text-[10px] font-normal text-[#6B7076]"> kg</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[#F4C20D] uppercase tracking-wider">Advanced</p>
                  <p className="text-lg font-black font-[var(--font-archivo)] tabular-nums text-[#F4C20D]">
                    {lift.advancedTarget}
                    <span className="text-[10px] font-normal text-[#6B7076]"> kg</span>
                  </p>
                </div>
              </div>

              {/* Dual progress bars */}
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] text-[#6B7076] uppercase">→ Strong</span>
                    <span className="text-[9px] font-bold tabular-nums" style={{ color }}>
                      {lift.pctToStrong.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full chakra-bar"
                      style={{ width: `${clampPct(lift.pctToStrong)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] text-[#F4C20D] uppercase">→ Advanced</span>
                    <span className="text-[9px] font-bold tabular-nums text-[#F4C20D]">
                      {lift.pctToAdvanced.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${clampPct(lift.pctToAdvanced)}%`,
                        background: "linear-gradient(90deg, #F4C20D, #FBD74F)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rank thresholds legend */}
      <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
        <p className="text-xs font-black text-[#A1A6AD] uppercase tracking-wider mb-3">Rank Thresholds</p>
        <div className="space-y-2">
          {(["Academy Student", "Genin", "Chūnin", "Jōnin", "ANBU", "Kage"] as NinjaRank[]).map((r) => {
            const cfg = RANK_CONFIG[r];
            const threshold = {
              "Academy Student": "Avg < 40% to Strong",
              "Genin": "Avg 40–59% to Strong",
              "Chūnin": "Avg 60–79% to Strong",
              "Jōnin": "Avg 80–99% to Strong",
              "ANBU": "All lifts ≥ 100% of Strong",
              "Kage": "All lifts ≥ 100% of Advanced",
            }[r];
            return (
              <div key={r} className="flex items-center gap-3">
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase shrink-0", cfg.textClass, cfg.bgClass)}>
                  {r}
                </span>
                <span className="text-xs text-[#A1A6AD]">{threshold}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
