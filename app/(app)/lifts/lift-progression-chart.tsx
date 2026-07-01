"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { format, parseISO } from "date-fns";

type Entry = { date: string; weightKg: string; reps: number };

interface LiftProgressionChartProps {
  entries: Entry[];
  color: string;
  liftLabel: string;
}

export function LiftProgressionChart({ entries, color, liftLabel }: LiftProgressionChartProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-8 text-center text-[#6B7076] text-sm">
        No data yet for {liftLabel}.
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const data = sorted.map((e) => ({
    date: e.date,
    label: format(parseISO(e.date), "MMM d"),
    weight: parseFloat(e.weightKg),
    reps: e.reps,
  }));

  const maxEntry = data.reduce((max, d) => (d.weight > max.weight ? d : max), data[0]);

  return (
    <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
      <p className="text-xs font-bold text-[#A1A6AD] uppercase tracking-wider mb-3">
        {liftLabel} Progression
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D31" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#6B7076" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#6B7076" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ background: "#1E2023", border: "1px solid #2A2D31", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#A1A6AD" }}
              itemStyle={{ color }}
              formatter={(v: number, _, p) => [
                `${v.toFixed(1)} kg × ${p.payload.reps}`,
                liftLabel,
              ]}
            />
            <ReferenceDot
              x={maxEntry.label}
              y={maxEntry.weight}
              r={5}
              fill="#E63946"
              stroke="none"
              label={{ value: "PB", position: "top", fontSize: 9, fill: "#E63946" }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
