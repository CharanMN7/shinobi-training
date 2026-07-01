"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logBodyStat, deleteBodyStat } from "@/src/actions/body";
import { toast } from "sonner";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { WeightChart } from "@/components/dashboard/weight-chart";

type BodyEntry = {
  id: string;
  date: string;
  weightKg: string;
  waistCm: string | null;
  notes: string | null;
};

export function BodyStatsClient({ entries, goalKg }: { entries: BodyEntry[]; goalKg: number }) {
  const [isPending, startTransition] = useTransition();

  const latestWeight = entries[0] ? parseFloat(entries[0].weightKg) : null;
  const toGo = latestWeight != null ? goalKg - latestWeight : null;

  // Estimate ETA from slope of last ~14 days
  let etaStr: string | null = null;
  if (entries.length >= 2) {
    const recent = entries.slice(0, 14).reverse();
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const days = (parseISO(last.date).getTime() - parseISO(first.date).getTime()) / 86400000;
      const slope = (parseFloat(last.weightKg) - parseFloat(first.weightKg)) / Math.max(days, 1); // kg/day
      if (toGo != null && Math.abs(slope) > 0.001) {
        const daysLeft = toGo / slope;
        if (daysLeft > 0 && daysLeft < 365) {
          etaStr = `~${Math.round(daysLeft)} days at current pace (estimate)`;
        }
      }
    }
  }

  const chartData = [...entries].reverse().map((e) => ({ date: e.date, weightKg: parseFloat(e.weightKg) }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const weightKg = parseFloat(fd.get("weightKg") as string);
    const waistCm = fd.get("waistCm") ? parseFloat(fd.get("waistCm") as string) : null;
    const notes = fd.get("notes") as string || null;
    const date = fd.get("date") as string;

    startTransition(async () => {
      const result = await logBodyStat({ date, weightKg, waistCm, notes });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Weight logged!");
        e.currentTarget.reset();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const r = await deleteBodyStat(id);
      if ("error" in r) toast.error(r.error);
      else toast.success("Deleted");
    });
  }

  return (
    <div className="space-y-4">
      {/* Hero stat */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Current", value: latestWeight != null ? `${latestWeight.toFixed(1)} kg` : "—", color: "#3B82F6" },
          { label: "Goal", value: `${goalKg} kg`, color: "#F4C20D" },
          { label: "To Go", value: toGo != null ? `${Math.abs(toGo).toFixed(1)} kg` : "—", color: toGo != null && toGo <= 0 ? "#2F9E44" : "#F97316" },
        ].map((s) => (
          <div key={s.label} className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-3 text-center">
            <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black font-[var(--font-archivo)] tabular-nums mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {etaStr && (
        <p className="text-xs text-[#A1A6AD] text-center italic">{etaStr}</p>
      )}

      {/* Chart */}
      <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#A1A6AD] uppercase tracking-wider mb-3">Weight Trend → {goalKg} kg</p>
        <WeightChart data={chartData} goalKg={goalKg} />
      </div>

      <Tabs defaultValue="log">
        <TabsList className="bg-[#0D0D0F] h-9">
          <TabsTrigger value="log" className="text-xs data-active:bg-[#3B82F6] data-active:text-white">Log</TabsTrigger>
          <TabsTrigger value="history" className="text-xs data-active:bg-[#3B82F6] data-active:text-white">History</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-3">
          <form onSubmit={handleSubmit} className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Date</Label>
                <Input name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Weight (kg)</Label>
                <Input name="weightKg" type="number" step="0.1" min="30" required placeholder="70.5" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1 text-xl h-12" />
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Waist (cm, optional)</Label>
                <Input name="waistCm" type="number" step="0.5" placeholder="80" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Notes (optional)</Label>
                <Input name="notes" placeholder="e.g. post-workout" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold h-11">
              {isPending ? <SpiralIcon size={16} className="spiral-spin" /> : "Log Weight"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-2">
          {entries.length === 0 ? (
            <p className="text-center text-[#6B7076] text-sm py-8 italic">No weight entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 bg-[#161719] rounded-xl border border-[#2A2D31] group">
                <div className="flex-1">
                  <span className="text-base font-bold font-[var(--font-archivo)] text-[#3B82F6] tabular-nums">{parseFloat(entry.weightKg).toFixed(1)} kg</span>
                  {entry.waistCm && <span className="text-xs text-[#A1A6AD] ml-2">waist {entry.waistCm} cm</span>}
                  <p className="text-[10px] text-[#6B7076] mt-0.5">{format(parseISO(entry.date), "MMM d, yyyy")}</p>
                </div>
                <button onClick={() => handleDelete(entry.id)} className="opacity-0 group-hover:opacity-100 text-[#E63946] p-1 rounded" aria-label="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
