import Link from "next/link"
import { Plus } from "lucide-react"

import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function FeedList({ items }: { items: Tables<"feed_stock_coverage">[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/inventory/new">
            <Plus className="size-4" /> Transaksi
          </Link>
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((s) => {
          const coverage = s.coverage_days_actual ?? s.coverage_days_target
          const low =
            coverage !== null &&
            coverage !== undefined &&
            coverage <= (s.low_stock_lead_time_days ?? 7) + (s.low_stock_safety_buffer_days ?? 3)
          return (
            <Card key={s.feed_product_id}>
              <CardContent className="space-y-1 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {s.code} — {s.name}
                  </p>
                  {low && <Badge variant="destructive">Stok Menipis</Badge>}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {(s.balance_sacks ?? 0).toFixed(1)} sak ({(s.balance_kg ?? 0).toFixed(0)} kg)
                  </span>
                  <span>{coverage !== null && coverage !== undefined ? `${coverage.toFixed(1)} hari lagi` : "-"}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada produk pakan.</p>}
      </div>
    </div>
  )
}
