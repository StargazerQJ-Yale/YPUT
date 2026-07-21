"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

const tooltipStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md, 8px)",
  fontSize: 13,
};

export function SpendingByCategoryChart({ data }: { data: { name: string; used: number }[] }) {
  const sorted = [...data].sort((a, b) => b.used - a.used);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={sorted} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={tooltipStyle}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts' Formatter generic is impractical to satisfy exactly for a numeric-only chart
          formatter={(value: any) => [formatCurrency(Number(value ?? 0)), "Used"]}
        />
        <Bar dataKey="used" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={56}>
          <LabelList
            dataKey="used"
            position="top"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts' LabelFormatter generic is impractical to satisfy exactly for a numeric-only chart
            formatter={(value: any) => formatCurrency(Number(value ?? 0))}
            fill="var(--foreground)"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
