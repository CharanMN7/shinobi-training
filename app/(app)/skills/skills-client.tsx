"use client";

import { useTransition } from "react";
import { updateSkillStatus } from "@/src/actions/skills";
import { toast } from "sonner";
import { SKILL_LABELS, type SkillKey } from "@/src/lib/engines";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2, AlertTriangle } from "lucide-react";

type Checkpoint = {
  id: string;
  skillKey: string;
  status: "not_started" | "working" | "achieved";
  notes: string | null;
};

const STATUS_CONFIG = {
  not_started: { icon: Circle, color: "#6B7076", label: "Not started", bg: "bg-[#161719]" },
  working:     { icon: Loader2, color: "#F97316", label: "Working",     bg: "bg-[#3d1a00]" },
  achieved:    { icon: CheckCircle2, color: "#2F9E44", label: "Achieved", bg: "bg-[#1a3d26]" },
};

const STATUS_ORDER: Array<"not_started" | "working" | "achieved"> = [
  "not_started", "working", "achieved",
];

export function SkillsClient({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const [isPending, startTransition] = useTransition();

  const achieved = checkpoints.filter((c) => c.status === "achieved").length;

  function cycleStatus(checkpoint: Checkpoint) {
    const current = checkpoint.status as (typeof STATUS_ORDER)[number];
    const idx = STATUS_ORDER.indexOf(current);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];

    startTransition(async () => {
      const result = await updateSkillStatus({
        skillKey: checkpoint.skillKey as SkillKey,
        status: next,
      });
      if ("error" in result) toast.error(result.error);
      else if (next === "achieved") toast.success("Skill achieved — ikuzo!");
    });
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-[#A1A6AD] uppercase tracking-wider">Skills Achieved</span>
          <span className="text-sm font-black font-[var(--font-archivo)] text-[#F97316]">{achieved}/{checkpoints.length}</span>
        </div>
        <div className="h-2 bg-[#0D0D0F] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full chakra-bar transition-all duration-500"
            style={{ width: `${(achieved / Math.max(checkpoints.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Skill ladder */}
      <div className="space-y-2">
        {checkpoints.map((checkpoint, index) => {
          const key = checkpoint.skillKey as SkillKey;
          const info = SKILL_LABELS[key];
          const statusCfg = STATUS_CONFIG[checkpoint.status];
          const Icon = statusCfg.icon;

          return (
            <div
              key={checkpoint.id}
              className={cn(
                "border border-[#2A2D31] rounded-2xl overflow-hidden transition-all",
                statusCfg.bg
              )}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Index + status icon */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[9px] text-[#6B7076] font-mono">{String(index + 1).padStart(2, "0")}</span>
                    <button
                      onClick={() => cycleStatus(checkpoint)}
                      disabled={isPending}
                      className="p-0.5 rounded-full transition-colors hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                      aria-label={`Toggle ${info.name} status`}
                    >
                      <Icon
                        size={20}
                        style={{ color: statusCfg.color }}
                        strokeWidth={checkpoint.status === "achieved" ? 2 : 1.5}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#F5F6F7]">{info.name}</h3>
                      {info.coached && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-[#E63946] bg-[#3d0a0e] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                          <AlertTriangle size={8} />
                          COACHED — on mats
                        </span>
                      )}
                      <span
                        className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                        style={{ color: statusCfg.color, background: `${statusCfg.color}20` }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7076] mt-1 leading-relaxed">{info.progression}</p>
                  </div>
                </div>
              </div>

              {/* Status progress dots */}
              <div className="flex h-1">
                {STATUS_ORDER.map((s) => (
                  <div
                    key={s}
                    className="flex-1 transition-colors duration-300"
                    style={{
                      background:
                        STATUS_ORDER.indexOf(s) <= STATUS_ORDER.indexOf(checkpoint.status)
                          ? statusCfg.color
                          : "#2A2D31",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
