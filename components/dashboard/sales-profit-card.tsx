"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type SalesProfitDay = {
  date: string
  revenue: number
  feedCost: number
  supplyCost: number
}

const chartConfig = {
  revenue: { label: "Pendapatan", color: "var(--chart-1)" },
  cost: { label: "Biaya", color: "var(--chart-5)" },
} satisfies ChartConfig

function formatRupiah(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`
}

export function SalesProfitCard({
  data,
  hasUnpricedCost,
}: {
  data: SalesProfitDay[]
  hasUnpricedCost: boolean
}) {
  const [range, setRange] = useState<"7" | "14" | "30">("7")
  const n = Number(range)
  const filtered = data.slice(-n)

  const totalRevenue = filtered.reduce((s, d) => s + d.revenue, 0)
  const totalFeedCost = filtered.reduce((s, d) => s + d.feedCost, 0)
  const totalSupplyCost = filtered.reduce((s, d) => s + d.supplyCost, 0)
  const totalCost = totalFeedCost + totalSupplyCost
  const profit = totalRevenue - totalCost

  const chartData = filtered.map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenue,
    cost: d.feedCost + d.supplyCost,
  }))

  return (
    <div className="space-y-3">
      <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
        <TabsList>
          <TabsTrigger value="7">7 hari</TabsTrigger>
          <TabsTrigger value="14">14 hari</TabsTrigger>
          <TabsTrigger value="30">30 hari</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Pendapatan</p>
          <p className="font-semibold tabular-nums">{formatRupiah(totalRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Biaya Pakan</p>
          <p className="font-semibold tabular-nums">{formatRupiah(totalFeedCost)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Biaya Obat</p>
          <p className="font-semibold tabular-nums">{formatRupiah(totalSupplyCost)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Untung/Rugi Bersih</p>
          <p className={`font-semibold tabular-nums ${profit < 0 ? "text-destructive" : "text-primary"}`}>
            {formatRupiah(profit)}
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</p>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={3} />
            <Bar dataKey="cost" fill="var(--color-cost)" radius={3} />
          </BarChart>
        </ChartContainer>
      )}

      <p className="text-xs text-muted-foreground">
        Estimasi biaya dihitung dari harga rata-rata pembelian yang tercatat.
        {hasUnpricedCost && " Sebagian pakan/obat belum ada data harga, jadi biaya aktual bisa lebih tinggi."}
      </p>
    </div>
  )
}
