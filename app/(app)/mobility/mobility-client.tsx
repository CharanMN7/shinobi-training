"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logMobility } from "@/src/actions/mobility";
import { toast } from "sonner";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

type MobilityEntry = {
  id: string;
  date: string;
  frontSplitGapCm: string | null;
  middleSplitGapCm: string | null;
  wallHsHoldS: number | null;
  freestandingHsHoldS: number | null;
  lsitHoldS: number | null;
  notes: string | null;
};

export function MobilityClient({ entries }: { entries: MobilityEntry[] }) {
  const [isPending, startTransition] = useTransition();
  const latest = entries[0];

  const chartData = [...entries]
    .reverse()
    .map((e) => ({
      date: e.date,
      label: format(parseISO(e.date), "MMM d"),
      frontSplit: e.frontSplitGapCm ? parseFloat(e.frontSplitGapCm) : null,
      wallHs: e.wallHsHoldS,
      fsHs: e.freestandingHsHoldS,
      lsit: e.lsitHoldS,
    }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = (name: string) => fd.get(name) ? parseFloat(fd.get(name) as string) : null;
    const ival = (name: string) => fd.get(name) ? parseInt(fd.get(name) as string, 10) : null;

    startTransition(async () => {
      const result = await logMobility({
        date: fd.get("date") as string,
        frontSplitGapCm: val("frontSplitGapCm"),
        middleSplitGapCm: val("middleSplitGapCm"),
        wallHsHoldS: ival("wallHsHoldS"),
        freestandingHsHoldS: ival("freestandingHsHoldS"),
        lsitHoldS: ival("lsitHoldS"),
        notes: fd.get("notes") as string || null,
      });
      if ("error" in result) toast.error(result.error);
      else { toast.success("Mobility logged!"); e.currentTarget.reset(); }
    });
  }

  return (
    <div className="space-y-4">
      {/* Latest snapshot */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Front Split Gap", value: latest.frontSplitGapCm ? `${latest.frontSplitGapCm} cm` : "—", target: "0 cm", color: "#F4C20D" },
            { label: "Wall HS Hold", value: latest.wallHsHoldS != null ? `${latest.wallHsHoldS}s` : "—", target: "∞", color: "#F97316" },
            { label: "Free HS Hold", value: latest.freestandingHsHoldS != null ? `${latest.freestandingHsHoldS}s` : "—", target: "60s", color: "#F97316" },
            { label: "L-Sit Hold", value: latest.lsitHoldS != null ? `${latest.lsitHoldS}s` : "—", target: "10s", color: "#3B82F6" },
            { label: "Middle Split Gap", value: latest.middleSplitGapCm ? `${latest.middleSplitGapCm} cm` : "—", target: "0 cm", color: "#F4C20D" },
          ].map((s) => (
            <div key={s.label} className="bg-[#161719] border border-[#2A2D31] rounded-xl p-3">
              <p className="text-[9px] text-[#6B7076] uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-black font-[var(--font-archivo)] tabular-nums mt-0.5" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-[#6B7076] mt-0.5">Target: {s.target}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trend charts */}
      {chartData.length > 1 && (
        <div className="space-y-3">
          <TrendChart data={chartData} dataKey="frontSplit" label="Front Split Gap (cm, →0)" color="#F4C20D" inverted targetLine={0} />
          <TrendChart data={chartData} dataKey="wallHs" label="Wall HS Hold (s)" color="#F97316" />
          <TrendChart data={chartData} dataKey="fsHs" label="Freestanding HS (s, target 60)" color="#F97316" targetLine={60} />
          <TrendChart data={chartData} dataKey="lsit" label="L-Sit Hold (s, target 10)" color="#3B82F6" targetLine={10} />
        </div>
      )}

      <Tabs defaultValue="log">
        <TabsList className="bg-[#0D0D0F] h-9">
          <TabsTrigger value="log" className="text-xs data-active:bg-[#F4C20D] data-active:text-[#0D0D0F]">Log</TabsTrigger>
          <TabsTrigger value="history" className="text-xs data-active:bg-[#F4C20D] data-active:text-[#0D0D0F]">History</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-3">
          <form onSubmit={handleSubmit} className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Date</Label>
                <Input name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
              {[
                { name: "frontSplitGapCm", label: "Front Split Gap (cm)", step: "0.5", placeholder: "15" },
                { name: "middleSplitGapCm", label: "Middle Split Gap (cm)", step: "0.5", placeholder: "20" },
                { name: "wallHsHoldS", label: "Wall HS Hold (s)", step: "1", placeholder: "60" },
                { name: "freestandingHsHoldS", label: "Free HS Hold (s)", step: "1", placeholder: "5" },
                { name: "lsitHoldS", label: "L-Sit Hold (s)", step: "1", placeholder: "5" },
              ].map((f) => (
                <div key={f.name}>
                  <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">{f.label}</Label>
                  <Input name={f.name} type="number" step={f.step} min="0" placeholder={f.placeholder} className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
                </div>
              ))}
              <div className="col-span-2">
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Notes</Label>
                <Input name="notes" placeholder="Optional" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#F4C20D] hover:bg-[#D4A810] text-[#0D0D0F] font-bold h-11">
              {isPending ? <SpiralIcon size={16} className="spiral-spin" /> : "Log Mobility"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-2">
          {entries.length === 0 ? (
            <p className="text-center text-[#6B7076] text-sm py-8 italic">No mobility entries yet.</p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="p-3 bg-[#161719] rounded-xl border border-[#2A2D31]">
                <p className="text-xs font-bold text-[#A1A6AD] mb-1">{format(parseISO(e.date), "MMM d, yyyy")}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {e.frontSplitGapCm && <span className="text-[#F4C20D]">Front split: {e.frontSplitGapCm} cm</span>}
                  {e.wallHsHoldS != null && <span className="text-[#F97316]">Wall HS: {e.wallHsHoldS}s</span>}
                  {e.freestandingHsHoldS != null && <span className="text-[#F97316]">Free HS: {e.freestandingHsHoldS}s</span>}
                  {e.lsitHoldS != null && <span className="text-[#3B82F6]">L-Sit: {e.lsitHoldS}s</span>}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TrendChart({
  data, dataKey, label, color, targetLine, inverted,
}: {
  data: Record<string, number | string | null>[];
  dataKey: string;
  label: string;
  color: string;
  targetLine?: number;
  inverted?: boolean;
}) {
  const hasData = data.some((d) => d[dataKey] != null);
  if (!hasData) return null;

  return (
    <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-3">
      <p className="text-[10px] text-[#A1A6AD] uppercase tracking-wider mb-2">{label}</p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D31" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#6B7076" }} tickLine={false} axisLine={false} />
            <YAxis
              reversed={inverted}
              tick={{ fontSize: 8, fill: "#6B7076" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={{ background: "#1E2023", border: "1px solid #2A2D31", borderRadius: 8, fontSize: 10 }} />
            {targetLine != null && (
              <ReferenceLine y={targetLine} stroke="#F4C20D" strokeDasharray="4 2" />
            )}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
