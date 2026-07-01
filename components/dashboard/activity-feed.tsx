import { cn } from "@/lib/utils";
import { Dumbbell, Scale, Activity, Wind, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DashboardData } from "@/src/db/queries/dashboard";

const TYPE_CONFIG = {
  lift:     { icon: Dumbbell, color: "#F97316", bg: "bg-[#3d1a00]" },
  body:     { icon: Scale,    color: "#3B82F6", bg: "bg-[#1e3a5f]" },
  run:      { icon: Activity, color: "#2F9E44", bg: "bg-[#1a3d26]" },
  mobility: { icon: Wind,     color: "#F4C20D", bg: "bg-[#3d3100]" },
};

interface ActivityFeedProps {
  items: DashboardData["recentActivity"];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-[#6B7076] text-sm italic">
        No missions logged yet. Ikuzo — log your first set.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const cfg = TYPE_CONFIG[item.type];
        const Icon = cfg.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-[#161719] rounded-xl border border-[#2A2D31]"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
              <Icon size={14} style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#F5F6F7] truncate">{item.summary}</p>
              <p className="text-[10px] text-[#6B7076] flex items-center gap-1 mt-0.5">
                <Clock size={9} />
                {format(parseISO(item.date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
