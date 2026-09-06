"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_LABEL: Record<string, string> = {
  ordered: "Dipesan",
  partial: "Sebagian Diterima",
  received: "Diterima",
  cancelled: "Dibatalkan",
}
const STATUS_VARIANT: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  ordered: "outline",
  partial: "secondary",
  received: "default",
  cancelled: "destructive",
}

type FeedProduct = Tables<"feed_products">
type SupplyItem = Tables<"supply_items">

export function PurchaseOrdersClient({
  farmId,
  orders,
  feedProducts,
  supplyItems,
}: {
  farmId: string
  orders: Tables<"purchase_orders">[]
  feedProducts: FeedProduct[]
  supplyItems: SupplyItem[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [supplierName, setSupplierName] = useState("")
  const [itemKind, setItemKind] = useState<"feed" | "supply">("feed")
  const [itemId, setItemId] = useState("")
  const [qtyOrdered, setQtyOrdered] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  function itemLabel(po: Tables<"purchase_orders">) {
    if (po.item_kind === "feed") {
      const p = feedProducts.find((f) => f.id === po.feed_product_id)
      return p ? `${p.code} — ${p.name}` : "Pakan"
    }
    const s = supplyItems.find((i) => i.id === po.supply_item_id)
    return s ? s.name : "Obat/Suplemen"
  }

  function unitFor(po: Tables<"purchase_orders">) {
    if (po.item_kind === "feed") return "kg"
    return supplyItems.find((i) => i.id === po.supply_item_id)?.unit ?? "unit"
  }

  async function addOrder() {
    if (!supplierName.trim() || !itemId || !qtyOrdered) {
      toast.error("Lengkapi supplier, item, dan jumlah pesanan")
      return
    }
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from("purchase_orders").insert({
      farm_id: farmId,
      supplier_name: supplierName.trim(),
      item_kind: itemKind,
      feed_product_id: itemKind === "feed" ? itemId : null,
      supply_item_id: itemKind === "supply" ? itemId : null,
      qty_ordered: Number(qtyOrdered),
      unit_price: unitPrice ? Number(unitPrice) : null,
      expected_date: expectedDate || null,
    })
    setAdding(false)

    if (error) {
      toast.error("Gagal membuat pesanan", { description: error.message })
      return
    }
    setSupplierName("")
    setItemId("")
    setQtyOrdered("")
    setUnitPrice("")
    setExpectedDate("")
    toast.success("Pesanan dibuat")
    router.refresh()
  }

  async function receive(po: Tables<"purchase_orders">) {
    const raw = receiveQty[po.id]
    const qty = Number(raw)
    if (!raw || Number.isNaN(qty) || qty <= 0) {
      toast.error("Jumlah diterima tidak valid")
      return
    }
    setBusyId(po.id)
    const supabase = createClient()
    const { error } = await supabase.rpc("receive_purchase_order", {
      p_po_id: po.id,
      p_qty_received: qty,
    })
    setBusyId(null)
    if (error) {
      toast.error("Gagal menerima barang", { description: error.message })
      return
    }
    toast.success("Barang diterima, stok diperbarui")
    setReceiveQty((c) => ({ ...c, [po.id]: "" }))
    router.refresh()
  }

  async function cancel(po: Tables<"purchase_orders">) {
    setBusyId(po.id)
    const supabase = createClient()
    const { error } = await supabase.rpc("cancel_purchase_order", { p_po_id: po.id })
    setBusyId(null)
    if (error) {
      toast.error("Gagal membatalkan pesanan", { description: error.message })
      return
    }
    toast.success("Pesanan dibatalkan")
    router.refresh()
  }

  const itemOptions = itemKind === "feed" ? feedProducts : supplyItems

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {orders.map((po) => (
          <Card key={po.id}>
            <CardContent className="space-y-2 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{itemLabel(po)}</p>
                <Badge variant={STATUS_VARIANT[po.status]}>{STATUS_LABEL[po.status] ?? po.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {po.supplier_name} · dipesan {po.qty_ordered} {unitFor(po)}, diterima {po.qty_received}{" "}
                {unitFor(po)}
                {po.total_amount !== null && ` · Rp ${po.total_amount.toLocaleString("id-ID")}`}
              </p>
              {(po.status === "ordered" || po.status === "partial") && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder={`Jumlah diterima (${unitFor(po)})`}
                    className="h-8 flex-1"
                    value={receiveQty[po.id] ?? ""}
                    onChange={(e) => setReceiveQty((c) => ({ ...c, [po.id]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => receive(po)} disabled={busyId === po.id}>
                    Terima
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancel(po)}
                    disabled={busyId === po.id}
                  >
                    Batalkan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada pesanan pembelian.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 py-3">
          <p className="text-sm font-medium">Buat Pesanan Pembelian</p>
          <Input
            placeholder="Nama supplier"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Select
              value={itemKind}
              onValueChange={(v) => {
                setItemKind(v as "feed" | "supply")
                setItemId("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feed">Pakan</SelectItem>
                <SelectItem value="supply">Obat/Suplemen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih item" />
              </SelectTrigger>
              <SelectContent>
                {itemOptions.map((it) => (
                  <SelectItem key={it.id} value={it.id}>
                    {"code" in it ? `${it.code} — ${it.name}` : it.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              placeholder={`Jumlah dipesan (${itemKind === "feed" ? "kg" : "unit"})`}
              value={qtyOrdered}
              onChange={(e) => setQtyOrdered(e.target.value)}
            />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Harga satuan (opsional)"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          <Input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
          <Button size="sm" onClick={addOrder} disabled={adding} className="w-full">
            <Plus className="size-4" /> Buat Pesanan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
