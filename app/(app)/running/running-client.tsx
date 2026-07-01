"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logRun, deleteRun } from "@/src/actions/running";
import { toast } from "sonner";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Trash2 } from "lucide-react";
import { formatPace } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type RunEntry = {
  id: string;
  date: string;
  type: string;
  distanceKm: string;
  durationMin: string;
  notes: string | null;
};

const RUN_COLORS: Record<string, string> = {
  easy: "#2F9E44",
  long_easy: "#3B82F6",
  intervals: "#E63946",
  recovery: "#A1A6AD",
};

export function RunningClient({ entries }: { entries: RunEntry[] }) {
  const [isPending, startTransition] = useTransition();

  const totals = entries.reduce(
    (acc, e) => ({
      sessions: acc.sessions + 1,
      km: acc.km + parseFloat(e.distanceKm),
      minutes: acc.minutes + parseFloat(e.durationMin),
    }),
    { sessions: 0, km: 0, minutes: 0 }
  );

  // Weekly volume chart data (last 8 weeks)
  const weeklyData: Record<string, { easy: number; hard: number }> = {};
  for (const e of entries) {
    const weekStart = format(startOfWeek(parseISO(e.date), { weekStartsOn: 1 }), "MMM d");
    if (!weeklyData[weekStart]) weeklyData[weekStart] = { easy: 0, hard: 0 };
    const km = parseFloat(e.distanceKm);
    if (e.type === "intervals") weeklyData[weekStart].hard += km;
    else weeklyData[weekStart].easy += km;
  }
  const chartData = Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, d]) => ({ week, ...d }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await logRun({
        date: fd.get("date") as string,
        type: fd.get("type") as "easy",
        distanceKm: parseFloat(fd.get("distanceKm") as string),
        durationMin: parseFloat(fd.get("durationMin") as string),
        notes: fd.get("notes") as string || null,
      });
      if ("error" in result) toast.error(result.error);
      else { toast.success("Run logged — yoshi!"); e.currentTarget.reset(); }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const r = await deleteRun(id);
      if ("error" in r) toast.error(r.error); else toast.success("Deleted");
    });
  }

  return (
    <div className="space-y-4">
      {/* Totals strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sessions", value: totals.sessions.toString(), color: "#2F9E44" },
          { label: "Total km", value: totals.km.toFixed(1), color: "#2F9E44" },
          { label: "Hours", value: (totals.minutes / 60).toFixed(1), color: "#3B82F6" },
        ].map((s) => (
          <div key={s.label} className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-3 text-center">
            <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black font-[var(--font-archivo)] tabular-nums mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly volume chart */}
      {chartData.length > 0 && (
        <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
          <p className="text-xs font-bold text-[#A1A6AD] uppercase tracking-wider mb-3">Weekly Volume (km)</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D31" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#6B7076" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#6B7076" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1E2023", border: "1px solid #2A2D31", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="easy" fill="#2F9E44" radius={[2, 2, 0, 0]} name="Easy/Long" stackId="a" />
                <Bar dataKey="hard" fill="#E63946" radius={[2, 2, 0, 0]} name="Intervals" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Tabs defaultValue="log">
        <TabsList className="bg-[#0D0D0F] h-9">
          <TabsTrigger value="log" className="text-xs data-[state=active]:bg-[#2F9E44] data-[state=active]:text-white">Log Run</TabsTrigger>
          <TabsTrigger value="history" className="text-xs data-[state=active]:bg-[#2F9E44] data-[state=active]:text-white">History</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-3">
          <form onSubmit={handleSubmit} className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Date</Label>
                <Input name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Type</Label>
                <Select name="type" defaultValue="easy" required>
                  <SelectTrigger className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E2023] border-[#2A2D31]">
                    <SelectItem value="easy" className="text-[#F5F6F7]">Easy</SelectItem>
                    <SelectItem value="long_easy" className="text-[#F5F6F7]">Long Easy</SelectItem>
                    <SelectItem value="intervals" className="text-[#F5F6F7]">Intervals</SelectItem>
                    <SelectItem value="recovery" className="text-[#F5F6F7]">Recovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Distance (km)</Label>
                <Input name="distanceKm" type="number" step="0.1" min="0.1" required placeholder="5.0" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Duration (min)</Label>
                <Input name="durationMin" type="number" step="1" min="1" required placeholder="30" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#2F9E44] hover:bg-[#237A34] text-white font-bold h-11">
              {isPending ? <SpiralIcon size={16} className="spiral-spin" /> : "Log Run"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-2">
          {entries.length === 0 ? (
            <p className="text-center text-[#6B7076] text-sm py-8 italic">No runs logged yet. Ikuzo!</p>
          ) : (
            entries.map((e) => {
              const color = RUN_COLORS[e.type] ?? "#A1A6AD";
              const pace = formatPace(parseFloat(e.distanceKm), parseFloat(e.durationMin));
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-[#161719] rounded-xl border border-[#2A2D31] group">
                  <div className="w-2 h-10 rounded-full" style={{ background: color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-[var(--font-archivo)] tabular-nums" style={{ color }}>
                        {parseFloat(e.distanceKm).toFixed(1)} km
                      </span>
                      <span className="text-xs text-[#A1A6AD]">· {parseFloat(e.durationMin).toFixed(0)} min · {pace}</span>
                    </div>
                    <p className="text-[10px] text-[#6B7076] mt-0.5 capitalize">
                      {e.type.replace("_", " ")} · {format(parseISO(e.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 text-[#E63946] p-1 rounded" aria-label="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
