"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logLift, deleteLiftEntry } from "@/src/actions/lifts";
import { toast } from "sonner";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Trash2, TrendingUp } from "lucide-react";
import { getOverloadStep, type LiftKey } from "@/src/lib/engines";
import { LiftProgressionChart } from "./lift-progression-chart";

type LiftEntry = {
  id: string;
  date: string;
  lift: string;
  weightKg: string;
  reps: number;
  rpe: string | null;
  notes: string | null;
};

type LiftSummary = {
  lift: LiftKey;
  label: string;
  best: number;
  strong: number;
  advanced: number;
};

const LIFT_COLORS: Record<string, string> = {
  squat: "#F97316",
  deadlift: "#E63946",
  bench: "#3B82F6",
  ohp: "#F4C20D",
  pullup: "#2F9E44",
};

export function LiftLogClient({
  liftSummary,
  recentEntries,
}: {
  liftSummary: LiftSummary[];
  recentEntries: LiftEntry[];
}) {
  const [isPending, startTransition] = useTransition();
  const [activeLift, setActiveLift] = useState<LiftKey>("squat");
  const [overloadHint, setOverloadHint] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const weightKg = parseFloat(fd.get("weightKg") as string);
    const reps = parseInt(fd.get("reps") as string, 10);
    const rpe = fd.get("rpe") ? parseFloat(fd.get("rpe") as string) : null;
    const date = fd.get("date") as string;

    startTransition(async () => {
      const result = await logLift({ date, lift: activeLift, weightKg, reps, rpe });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Set logged — ikuzo!");
      e.currentTarget.reset();

      // Overload hint
      if (reps >= 5 && (rpe == null || rpe <= 8)) {
        const step = getOverloadStep(activeLift);
        const category = ["bench", "ohp", "pullup"].includes(activeLift) ? "upper" : "lower";
        setOverloadHint(
          `Hit your reps clean — try +${step} kg (${category} lift) next time.`
        );
        setTimeout(() => setOverloadHint(null), 8000);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteLiftEntry(id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Entry deleted");
    });
  }

  const liftEntries = recentEntries.filter((e) => e.lift === activeLift);
  const grouped = liftEntries.reduce(
    (acc, e) => {
      if (!acc[e.date]) acc[e.date] = [];
      acc[e.date].push(e);
      return acc;
    },
    {} as Record<string, LiftEntry[]>
  );

  const summary = liftSummary.find((l) => l.lift === activeLift);
  const color = LIFT_COLORS[activeLift] ?? "#F97316";

  return (
    <div className="space-y-4">
      {/* Lift selector */}
      <div className="flex gap-2 flex-wrap">
        {liftSummary.map((l) => (
          <button
            key={l.lift}
            onClick={() => { setActiveLift(l.lift); setOverloadHint(null); }}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border",
              activeLift === l.lift
                ? "text-[#0D0D0F] border-transparent shadow-hard-sm"
                : "text-[#A1A6AD] border-[#2A2D31] bg-[#161719] hover:border-[#3A3D42]"
            )}
            style={activeLift === l.lift ? { background: LIFT_COLORS[l.lift] } : {}}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Current best strip */}
      {summary && (
        <div
          className="flex items-center gap-4 p-3 rounded-xl border"
          style={{ borderColor: `${color}40`, background: `${color}0A` }}
        >
          <div>
            <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">Best</p>
            <p className="text-2xl font-black font-[var(--font-archivo)] tabular-nums" style={{ color }}>
              {summary.best > 0 ? `${summary.best.toFixed(1)} kg` : "—"}
            </p>
          </div>
          <div className="h-10 w-px bg-[#2A2D31]" />
          <div>
            <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">Strong target</p>
            <p className="text-base font-bold text-[#F5F6F7] tabular-nums">{summary.strong} kg</p>
          </div>
          <div className="h-10 w-px bg-[#2A2D31]" />
          <div>
            <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">Progress</p>
            <p className="text-base font-bold tabular-nums" style={{ color }}>
              {summary.best > 0 ? `${((summary.best / summary.strong) * 100).toFixed(0)}%` : "0%"}
            </p>
          </div>
        </div>
      )}

      {/* Overload hint */}
      {overloadHint && (
        <div className="flex items-center gap-2 p-3 bg-[#1a3d26] border border-[#2F9E44] rounded-xl text-sm text-[#2F9E44]">
          <TrendingUp size={14} />
          {overloadHint}
        </div>
      )}

      <Tabs defaultValue="log">
        <TabsList className="bg-[#0D0D0F] h-9">
          <TabsTrigger value="log" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-[#0D0D0F]">
            Log Set
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-[#0D0D0F]">
            History
          </TabsTrigger>
          <TabsTrigger value="chart" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-[#0D0D0F]">
            Trend
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-3">
          <form onSubmit={handleSubmit} className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Date</Label>
                <Input
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                  required
                  className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Weight (kg)</Label>
                <Input
                  name="weightKg"
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="100"
                  className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Reps</Label>
                <Input
                  name="reps"
                  type="number"
                  min="1"
                  max="100"
                  required
                  placeholder="5"
                  className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">RPE (optional)</Label>
                <Input
                  name="rpe"
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  placeholder="8"
                  className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Notes</Label>
                <Input
                  name="notes"
                  placeholder="Optional"
                  className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full font-bold h-11 text-[#0D0D0F]"
              style={{ background: color }}
            >
              {isPending ? <SpiralIcon size={16} className="spiral-spin" /> : `Log ${summary?.label ?? "Set"}`}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-[#6B7076] text-sm py-8 italic">
              No {summary?.label} entries yet. Log your first set.
            </p>
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, entries]) => (
                <div key={date}>
                  <p className="text-xs font-bold text-[#A1A6AD] uppercase tracking-wider mb-2">
                    {format(parseISO(date), "EEEE, MMM d, yyyy")}
                  </p>
                  <div className="space-y-1.5">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 bg-[#161719] rounded-xl border border-[#2A2D31] group"
                      >
                        <div className="flex-1">
                          <span className="text-base font-bold font-[var(--font-archivo)] tabular-nums" style={{ color }}>
                            {parseFloat(entry.weightKg).toFixed(1)} kg
                          </span>
                          <span className="text-sm text-[#A1A6AD] ml-2">× {entry.reps}</span>
                          {entry.rpe && (
                            <span className="text-xs text-[#6B7076] ml-2">RPE {entry.rpe}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#E63946] p-1 rounded transition-opacity"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </TabsContent>

        <TabsContent value="chart" className="mt-3">
          <LiftProgressionChart
            entries={recentEntries.filter((e) => e.lift === activeLift)}
            color={color}
            liftLabel={summary?.label ?? activeLift}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
