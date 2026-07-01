"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface WeightChartProps {
  data: Array<{ date: string; weightKg: number }>;
  goalKg: number;
}

export function WeightChart({ data, goalKg }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-[#6B7076] text-sm">
        No weight data yet. Log your first bodyweight.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), "MMM d"),
    weight: d.weightKg,
  }));

  const minY = Math.min(data[0]?.weightKg ?? goalKg, goalKg) - 2;
  const maxY = Math.max(...data.map((d) => d.weightKg), goalKg) + 2;

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D31" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "#6B7076" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fontSize: 9, fill: "#6B7076" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ background: "#1E2023", border: "1px solid #2A2D31", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "#A1A6AD" }}
            itemStyle={{ color: "#3B82F6" }}
            formatter={(v: number) => [`${v.toFixed(1)} kg`, "Weight"]}
          />
          <ReferenceLine
            y={goalKg}
            stroke="#F4C20D"
            strokeDasharray="4 2"
            label={{ value: `Goal ${goalKg}`, position: "right", fontSize: 9, fill: "#F4C20D" }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
