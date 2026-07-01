import { cn, formatKg } from "@/lib/utils";
import type { DashboardData } from "@/src/db/queries/dashboard";

interface KpiStripProps {
  data: DashboardData;
}

export function KpiStrip({ data }: KpiStripProps) {
  const { currentWeightKg, weightDelta, settings, skillsAchieved, skillsTotal } = data;
  const goalKg = settings.goalWeightKg;
  const toGo = currentWeightKg != null ? goalKg - currentWeightKg : null;

  const kpis = [
    {
      label: "Current Weight",
      kanji: "体",
      value: currentWeightKg != null ? `${currentWeightKg.toFixed(1)} kg` : "—",
      delta: weightDelta != null ? weightDelta : null,
      deltaPositive: weightDelta != null && weightDelta >= 0, // gaining = green for bulking
      accent: "#3B82F6",
    },
    {
      label: "Goal Weight",
      kanji: "目",
      value: `${goalKg} kg`,
      delta: null,
      deltaPositive: true,
      accent: "#F4C20D",
    },
    {
      label: "To Go",
      kanji: "差",
      value: toGo != null ? `${Math.abs(toGo).toFixed(1)} kg` : "—",
      delta: null,
      deltaPositive: toGo != null && toGo <= 0,
      accent: toGo != null && toGo <= 0 ? "#2F9E44" : "#F97316",
    },
    {
      label: "Skills",
      kanji: "技",
      value: `${skillsAchieved}/${skillsTotal}`,
      delta: null,
      deltaPositive: skillsAchieved > 0,
      accent: "#F97316",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-[#A1A6AD] uppercase tracking-wider">
              {kpi.label}
            </span>
            <span className="text-[10px] text-[#6B7076]">{kpi.kanji}</span>
          </div>
          <div
            className="text-2xl font-black font-[var(--font-archivo)] tabular-nums"
            style={{ color: kpi.accent }}
          >
            {kpi.value}
          </div>
          {kpi.delta != null && (
            <div
              className={cn(
                "text-xs font-semibold mt-0.5 tabular-nums",
                kpi.deltaPositive ? "text-[#2F9E44]" : "text-[#E63946]"
              )}
            >
              {kpi.delta > 0 ? "▲" : "▼"} {Math.abs(kpi.delta).toFixed(1)} kg
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
