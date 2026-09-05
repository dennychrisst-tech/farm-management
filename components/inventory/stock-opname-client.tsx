"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Item = {
  key: string
  itemKind: "feed" | "supply"
  feedProductId: string | null
  supplyItemId: string | null
  label: string
  unit: string
  systemQty: number
}

export function StockOpnameClient({
  feedItems,
  supplyItems,
  recentCounts,
}: {
  feedItems: Tables<"feed_stock_coverage">[]
  supplyItems: Tables<"supply_balances">[]
  recentCounts: (Tables<"stock_counts"> & { item_name: string })[]
}) {
  const router = useRouter()
  const [counted, setCounted] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  const items: Item[] = [
    ...feedItems.map((f) => ({
      key: `feed:${f.feed_product_id}`,
      itemKind: "feed" as const,
      feedProductId: f.feed_product_id,
      supplyItemId: null,
      label: `${f.code} — ${f.name}`,
      unit: "kg",
      systemQty: f.balance_kg ?? 0,
    })),
    ...supplyItems.map((s) => ({
      key: `supply:${s.supply_item_id}`,
      itemKind: "supply" as const,
      feedProductId: null,
      supplyItemId: s.supply_item_id,
      label: s.name ?? "Obat/Suplemen",
      unit: s.unit ?? "unit",
      systemQty: s.balance ?? 0,
    })),
  ]

  async function submitCount(item: Item) {
    const raw = counted[item.key]
    if (raw === undefined || raw === "") return
    const qty = Number(raw)
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Jumlah hitung fisik tidak valid")
      return
    }

    setSubmitting(item.key)
    const supabase = createClient()
    const { data, error } = await supabase.rpc("record_stock_count", {
      p_item_kind: item.itemKind,
      p_feed_product_id: item.feedProductId ?? undefined,
      p_supply_item_id: item.supplyItemId ?? undefined,
      p_counted_qty: qty,
    })
    setSubmitting(null)

    if (error) {
      toast.error("Gagal mencatat stock opname", { description: error.message })
      return
    }

    const variance = data?.variance ?? 0
    if (variance === 0) {
      toast.success("Stok sesuai — tidak ada selisih")
    } else {
      toast.warning(`Selisih tercatat: ${variance > 0 ? "+" : ""}${variance} ${item.unit}`, {
        description: "Penyesuaian otomatis sudah dibuat di kartu stok.",
      })
    }
    setCounted((c) => ({ ...c, [item.key]: "" }))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Masukkan hasil hitung fisik gudang. Sistem akan bandingkan dengan saldo tercatat dan
        otomatis membuat penyesuaian jika ada selisih.
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.key}>
            <CardContent className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  Sistem: {item.systemQty.toFixed(1)} {item.unit}
                </p>
              </div>
              <Input
                type="number"
                min={0}
                step={0.1}
                placeholder="Hitung fisik"
                className="w-28"
                value={counted[item.key] ?? ""}
                onChange={(e) => setCounted((c) => ({ ...c, [item.key]: e.target.value }))}
              />
              <Button
                size="sm"
                onClick={() => submitCount(item)}
                disabled={submitting === item.key || !counted[item.key]}
              >
                Simpan
              </Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada item pakan/obat untuk dihitung.</p>
        )}
      </div>

      {recentCounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Riwayat Opname Terbaru</p>
          {recentCounts.map((c) => {
            const variance = c.variance ?? 0
            return (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{c.item_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.counted_at).toLocaleString("id-ID")} · sistem {c.system_qty} → fisik{" "}
                    {c.counted_qty}
                  </p>
                </div>
                {variance !== 0 ? (
                  <Badge variant={Math.abs(variance) / Math.max(c.system_qty, 1) > 0.15 ? "destructive" : "outline"}>
                    {variance > 0 ? "+" : ""}
                    {variance}
                  </Badge>
                ) : (
                  <Badge variant="outline">Sesuai</Badge>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
