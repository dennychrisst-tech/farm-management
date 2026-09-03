"use client"

import { useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type TrendPoint = {
  report_date: string
  hdp_pct: number | null
  total_eggs: number | null
}

const chartConfig = {
  hdp_pct: { label: "HDP %", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [range, setRange] = useState<"7" | "14" | "30">("14")
  const n = Number(range)
  const filtered = data.slice(-n).map((d) => ({
    date: d.report_date.slice(5),
    hdp_pct: d.hdp_pct ?? 0,
  }))

  return (
    <div className="space-y-2">
      <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
        <TabsList>
          <TabsTrigger value="7">7 hari</TabsTrigger>
          <TabsTrigger value="14">14 hari</TabsTrigger>
          <TabsTrigger value="30">30 hari</TabsTrigger>
        </TabsList>
      </Tabs>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data.</p>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
          <LineChart data={filtered} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="hdp_pct"
              stroke="var(--color-hdp_pct)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
  )
}
