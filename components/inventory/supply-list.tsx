import Link from "next/link"
import { Plus } from "lucide-react"

import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const CATEGORY_LABEL: Record<string, string> = {
  medicine: "Obat",
  supplement: "Suplemen",
  disinfectant: "Disinfektan",
  other: "Lainnya",
}

export function SupplyList({ items }: { items: Tables<"supply_balances">[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/inventory/supplies/new">
            <Plus className="size-4" /> Transaksi
          </Link>
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((s) => (
          <Card key={s.supply_item_id}>
            <CardContent className="space-y-1 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{s.name}</p>
                <div className="flex items-center gap-1.5">
                  {(s.min_stock_qty ?? 0) > 0 && (s.balance ?? 0) <= (s.min_stock_qty ?? 0) && (
                    <Badge variant="destructive">Stok rendah</Badge>
                  )}
                  <Badge variant="outline">{CATEGORY_LABEL[s.category ?? "other"] ?? s.category}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {(s.balance ?? 0).toFixed(1)} {s.unit}
              </p>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada item obat/suplemen. Tambahkan lewat Pengaturan → Produk & Suplai.
          </p>
        )}
      </div>
    </div>
  )
}
