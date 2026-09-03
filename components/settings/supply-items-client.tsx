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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SupplyItem = Tables<"supply_items">

const CATEGORY_OPTIONS = [
  { value: "medicine", label: "Obat" },
  { value: "supplement", label: "Suplemen" },
  { value: "disinfectant", label: "Disinfektan" },
  { value: "other", label: "Lainnya" },
]

export function SupplyItemsClient({
  farmId,
  initialItems,
}: {
  farmId: string
  initialItems: SupplyItem[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState("medicine")
  const [newUnit, setNewUnit] = useState("unit")

  async function toggleActive(item: SupplyItem) {
    const supabase = createClient()
    const { error } = await supabase
      .from("supply_items")
      .update({ active: !item.active })
      .eq("id", item.id)
    if (error) {
      toast.error("Gagal memperbarui", { description: error.message })
      return
    }
    router.refresh()
  }

  async function addItem() {
    if (!newName.trim()) return
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from("supply_items").insert({
      farm_id: farmId,
      name: newName.trim(),
      category: newCategory,
      unit: newUnit.trim() || "unit",
    })
    setAdding(false)

    if (error) {
      toast.error("Gagal menambah item", { description: error.message })
      return
    }
    setNewName("")
    toast.success("Item ditambahkan")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {initialItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.category} · {item.unit}
                </p>
              </div>
              <Switch checked={item.active} onCheckedChange={() => toggleActive(item)} />
            </CardContent>
          </Card>
        ))}
        {initialItems.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada item obat/suplemen.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 py-3">
          <p className="text-sm font-medium">Tambah Item Obat/Suplemen</p>
          <Input placeholder="Nama (mis. Kumabit)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Satuan (mis. botol)" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
          </div>
          <Button size="sm" onClick={addItem} disabled={adding} className="w-full">
            <Plus className="size-4" /> Tambah
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
