"use client";

import { RANK_CONFIG, type NinjaRank } from "@/src/lib/engines";
import { cn, clampPct } from "@/lib/utils";
import { SpiralIcon } from "@/components/shared/spiral-icon";

interface RankCardProps {
  rank: NinjaRank;
  avgPctToStrong: number;
  allAtStrong: boolean;
  allAtAdvanced: boolean;
}

const RANK_ORDER: NinjaRank[] = [
  "Academy Student",
  "Genin",
  "Chūnin",
  "Jōnin",
  "ANBU",
  "Kage",
];

function getNextRank(rank: NinjaRank): NinjaRank | null {
  const idx = RANK_ORDER.indexOf(rank);
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
}

function rankProgressPct(rank: NinjaRank, avgPct: number): number {
  const thresholds: Record<NinjaRank, [number, number]> = {
    "Academy Student": [0, 40],
    "Genin":           [40, 60],
    "Chūnin":          [60, 80],
    "Jōnin":           [80, 100],
    "ANBU":            [100, 100],
    "Kage":            [100, 100],
  };
  const [low, high] = thresholds[rank];
  if (high === low) return 100;
  return clampPct(((avgPct - low) / (high - low)) * 100);
}

const MOTIVATIONAL: Record<NinjaRank, string> = {
  "Academy Student": "The day starts now.",
  Genin:             "Ikuzo — keep climbing.",
  "Chūnin":          "Yoshi, iko — mid-rank shinobi.",
  "Jōnin":           "Elite strength. Push for ANBU.",
  ANBU:              "Saate… Advanced awaits.",
  Kage:              "The summit. You are the strongest.",
};

export function RankCard({ rank, avgPctToStrong, allAtStrong, allAtAdvanced }: RankCardProps) {
  const cfg = RANK_CONFIG[rank];
  const nextRank = getNextRank(rank);
  const progress = rankProgressPct(rank, avgPctToStrong);

  return (
    <div className={cn("relative rounded-2xl p-5 border border-[#2A2D31] overflow-hidden", cfg.bgClass, cfg.glowClass)}>
      {/* Background spiral watermark */}
      <SpiralIcon
        size={120}
        className="absolute -right-6 -top-6 opacity-5"
        style={{ color: cfg.color } as React.CSSProperties}
      />

      <div className="relative z-10">
        {/* Eyebrow */}
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-3">
          忍 Current Rank
        </p>

        {/* Rank name */}
        <h2
          className={cn("text-3xl font-black font-[var(--font-archivo)] uppercase tracking-tight", cfg.textClass)}
          style={{ textShadow: `0 0 20px ${cfg.color}40` }}
        >
          {rank}
        </h2>

        <p className="text-xs text-[#A1A6AD] mt-1 italic">{MOTIVATIONAL[rank]}</p>

        {/* Progress to next rank */}
        {nextRank && rank !== "ANBU" && rank !== "Kage" && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-[#A1A6AD] uppercase tracking-wider">
                → {nextRank}
              </span>
              <span className={cn("text-xs font-bold tabular-nums", cfg.textClass)}>
                {avgPctToStrong.toFixed(0)}% avg
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0D0D0F] overflow-hidden">
              <div
                className="h-full rounded-full chakra-bar transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {allAtStrong && !allAtAdvanced && (
          <p className="mt-3 text-xs text-[#F97316] font-semibold">
            All lifts at Strong ✓ — grinding toward Advanced
          </p>
        )}
        {allAtAdvanced && (
          <p className="mt-3 text-xs text-[#E63946] font-bold">
            🔥 ALL LIFTS AT ADVANCED — Kage achieved
          </p>
        )}
      </div>
    </div>
  );
}
