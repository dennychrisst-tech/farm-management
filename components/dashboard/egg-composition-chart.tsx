"use client"

import { Pie, PieChart, Cell } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  normal: { label: "Normal", color: "var(--chart-1)" },
  abnormal: { label: "Abnormal", color: "var(--chart-5)" },
} satisfies ChartConfig

export function EggCompositionChart({
  normalEggs,
  abnormalEggs,
}: {
  normalEggs: number
  abnormalEggs: number
}) {
  const total = normalEggs + abnormalEggs
  const data = [
    { key: "normal", label: "Normal", value: normalEggs, fill: "var(--color-normal)" },
    { key: "abnormal", label: "Abnormal", value: abnormalEggs, fill: "var(--color-abnormal)" },
  ]

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data hari ini.</p>
  }

  return (
    <div className="flex items-center gap-6">
      <ChartContainer config={chartConfig} className="aspect-square h-40 w-40 shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="space-y-2 text-sm">
        <p className="text-2xl font-semibold tabular-nums">{total}</p>
        <p className="-mt-2 text-xs text-muted-foreground">butir hari ini</p>
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: d.fill }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium tabular-nums">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
