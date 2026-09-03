"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

type FeedProduct = Tables<"feed_products">

export function FeedProductsClient({
  farmId,
  initialProducts,
}: {
  farmId: string
  initialProducts: FeedProduct[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [newName, setNewName] = useState("")

  async function toggleActive(p: FeedProduct) {
    const supabase = createClient()
    const { error } = await supabase
      .from("feed_products")
      .update({ active: !p.active })
      .eq("id", p.id)
    if (error) {
      toast.error("Gagal memperbarui", { description: error.message })
      return
    }
    router.refresh()
  }

  async function updateSackWeight(p: FeedProduct, value: number) {
    const supabase = createClient()
    const { error } = await supabase
      .from("feed_products")
      .update({ sack_weight_kg: value })
      .eq("id", p.id)
    if (error) {
      toast.error("Gagal memperbarui", { description: error.message })
      return
    }
    router.refresh()
  }

  async function addProduct() {
    if (!newCode.trim() || !newName.trim()) return
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from("feed_products").insert({
      farm_id: farmId,
      code: newCode.trim(),
      name: newName.trim(),
      sequence_order: initialProducts.length + 1,
    })
    setAdding(false)

    if (error) {
      toast.error("Gagal menambah produk", { description: error.message })
      return
    }
    setNewCode("")
    setNewName("")
    toast.success("Produk ditambahkan")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {initialProducts.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {p.code} — {p.name}
                </p>
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Label className="text-muted-foreground">Kg/sak</Label>
                <Input
                  type="number"
                  step={0.1}
                  defaultValue={p.sack_weight_kg}
                  className="h-8 w-24"
                  onBlur={(e) => {
                    const v = e.target.valueAsNumber
                    if (!Number.isNaN(v) && v !== p.sack_weight_kg) updateSackWeight(p, v)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {initialProducts.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada produk pakan.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 py-3">
          <p className="text-sm font-medium">Tambah Produk</p>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Kode (mis. 524)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
            <Input placeholder="Nama (mis. Layer)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <Button size="sm" onClick={addProduct} disabled={adding} className="w-full">
            <Plus className="size-4" /> Tambah
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
