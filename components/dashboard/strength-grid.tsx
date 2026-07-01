import { cn, formatKg, clampPct } from "@/lib/utils";
import { LIFT_LABELS, RANK_CONFIG, computeLiftRank, type LiftKey, type LiftStat } from "@/src/lib/engines";

interface StrengthGridProps {
  lifts: LiftStat[];
  goalWeightKg: number;
}

const LIFT_ACCENTS: Record<LiftKey, string> = {
  squat:    "#F97316",
  deadlift: "#E63946",
  bench:    "#3B82F6",
  ohp:      "#F4C20D",
  pullup:   "#2F9E44",
};

export function StrengthGrid({ lifts, goalWeightKg }: StrengthGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {lifts.map((lift) => {
        const liftRank = computeLiftRank(lift.pctToStrong, lift.pctToAdvanced);
        const rankCfg = RANK_CONFIG[liftRank];
        const accent = LIFT_ACCENTS[lift.lift];
        const displayPct = clampPct(lift.pctToStrong);
        const isPR = lift.pctToStrong >= 100;
        const label = LIFT_LABELS[lift.lift];

        return (
          <div
            key={lift.lift}
            className={cn(
              "bg-[#161719] border border-[#2A2D31] rounded-2xl p-4 relative overflow-hidden",
              isPR && "chakra-glow-red"
            )}
          >
            {/* PR badge */}
            {isPR && (
              <div className="absolute top-3 right-3 bg-[#E63946] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-hard-sm">
                PB
              </div>
            )}

            {/* Lift name */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">力</p>
                <p className="text-xs font-bold text-[#F5F6F7] uppercase tracking-wide mt-0.5">
                  {label}
                </p>
              </div>
              <span
                className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase", rankCfg.textClass, rankCfg.bgClass)}
              >
                {liftRank === "Academy Student" ? "Acad." : liftRank}
              </span>
            </div>

            {/* Best weight */}
            <div
              className="text-3xl font-black font-[var(--font-archivo)] tabular-nums"
              style={{ color: accent, textShadow: `0 0 16px ${accent}50` }}
            >
              {lift.bestKg > 0 ? `${lift.bestKg.toFixed(1)}` : "—"}
              <span className="text-sm font-normal text-[#6B7076] ml-1">kg</span>
            </div>

            {/* Relative strength */}
            <div className="text-[10px] text-[#A1A6AD] mt-0.5">
              ×{goalWeightKg > 0 ? (lift.bestKg / goalWeightKg).toFixed(2) : "—"} BW
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-[#6B7076] uppercase tracking-wider">Strong</span>
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ color: accent }}
                >
                  {lift.pctToStrong.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#0D0D0F] overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${displayPct}%`,
                    background: `linear-gradient(90deg, ${accent} 0%, ${accent}CC 100%)`,
                  }}
                />
                {/* Advanced ghost marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#F4C20D] opacity-50"
                  style={{
                    left: `${clampPct((lift.pctToStrong / lift.pctToAdvanced) * 100 * (lift.strongTarget / lift.advancedTarget) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-[#6B7076]">
                  Target: {lift.strongTarget} kg
                </span>
                <span className="text-[9px] text-[#F4C20D]">
                  Adv: {lift.advancedTarget} kg
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
