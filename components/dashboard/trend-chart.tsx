"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
  total_eggs: { label: "Telur", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [range, setRange] = useState<"7" | "14" | "30">("7")
  const n = Number(range)
  const filtered = data.slice(-n).map((d) => ({
    date: d.report_date.slice(5),
    total_eggs: d.total_eggs ?? 0,
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
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={filtered} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
            <defs>
              <linearGradient id="fillTotalEggs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total_eggs)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-total_eggs)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="total_eggs"
              stroke="var(--color-total_eggs)"
              strokeWidth={2.5}
              fill="url(#fillTotalEggs)"
              dot={{ r: 3, fill: "var(--color-total_eggs)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  )
}
