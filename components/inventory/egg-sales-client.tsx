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

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "Belum bayar",
  partial: "Sebagian",
  paid: "Lunas",
}
const PAYMENT_VARIANT: Record<string, "outline" | "secondary" | "default"> = {
  unpaid: "outline",
  partial: "secondary",
  paid: "default",
}

export function EggSalesClient({
  farmId,
  sales,
  stockBalance,
}: {
  farmId: string
  sales: Tables<"egg_sales">[]
  stockBalance: Tables<"egg_stock_balance"> | null
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [buyerName, setBuyerName] = useState("")
  const [trays, setTrays] = useState("0")
  const [loose, setLoose] = useState("0")
  const [pricePerEgg, setPricePerEgg] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("unpaid")
  const [amountPaid, setAmountPaid] = useState("0")

  async function addSale() {
    if (!buyerName.trim()) {
      toast.error("Nama pembeli wajib diisi")
      return
    }
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from("egg_sales").insert({
      farm_id: farmId,
      buyer_name: buyerName.trim(),
      trays: Number(trays) || 0,
      loose: Number(loose) || 0,
      price_per_egg: pricePerEgg ? Number(pricePerEgg) : null,
      payment_status: paymentStatus,
      amount_paid: Number(amountPaid) || 0,
    })
    setAdding(false)

    if (error) {
      toast.error("Gagal mencatat penjualan", { description: error.message })
      return
    }
    setBuyerName("")
    setTrays("0")
    setLoose("0")
    setPricePerEgg("")
    setAmountPaid("0")
    setPaymentStatus("unpaid")
    toast.success("Penjualan dicatat")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {stockBalance && (
        <Card>
          <CardContent className="grid grid-cols-3 gap-3 py-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Diproduksi</p>
              <p className="text-lg font-semibold">{(stockBalance.total_produced ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Terjual</p>
              <p className="text-lg font-semibold">{(stockBalance.total_sold ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stok di Farm</p>
              <p className="text-lg font-semibold text-primary">
                {(stockBalance.eggs_on_hand ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sales.map((s) => (
          <Card key={s.id}>
            <CardContent className="space-y-1 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{s.buyer_name}</p>
                <Badge variant={PAYMENT_VARIANT[s.payment_status]}>
                  {PAYMENT_LABEL[s.payment_status] ?? s.payment_status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(s.sale_date).toLocaleDateString("id-ID")} · {s.trays} piring + {s.loose} butir ={" "}
                {s.total_eggs} butir
              </p>
              {s.total_amount !== null && (
                <p className="text-xs text-muted-foreground">
                  Rp {s.total_amount.toLocaleString("id-ID")}
                  {s.payment_status !== "paid" && ` · dibayar Rp ${s.amount_paid.toLocaleString("id-ID")}`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {sales.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada penjualan tercatat.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 py-3">
          <p className="text-sm font-medium">Catat Penjualan</p>
          <Input
            placeholder="Nama pembeli/pengepul"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Piring (30 butir)"
              value={trays}
              onChange={(e) => setTrays(e.target.value)}
            />
            <Input
              type="number"
              min={0}
              placeholder="Butir lepas"
              value={loose}
              onChange={(e) => setLoose(e.target.value)}
            />
          </div>
          <Input
            type="number"
            min={0}
            step={0.01}
            placeholder="Harga per butir (opsional)"
            value={pricePerEgg}
            onChange={(e) => setPricePerEgg(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Belum bayar</SelectItem>
                <SelectItem value="partial">Sebagian</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              placeholder="Jumlah dibayar"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={addSale} disabled={adding} className="w-full">
            <Plus className="size-4" /> Catat Penjualan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
