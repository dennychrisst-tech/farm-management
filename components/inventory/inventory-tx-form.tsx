"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { inventoryTxSchema, type InventoryTxInput } from "@/lib/validation/inventory"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function InventoryTxForm({
  farmId,
  feedProducts,
}: {
  farmId: string
  feedProducts: Tables<"feed_products">[]
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<InventoryTxInput>({
    resolver: zodResolver(inventoryTxSchema),
    defaultValues: {
      type: "IN",
      direction: "add",
      feedProductId: feedProducts[0]?.id ?? "",
      sacks: 0,
      looseKg: 0,
      reason: "",
      reference: "",
    },
  })

  const type = form.watch("type")

  async function onSubmit(values: InventoryTxInput) {
    setSubmitting(true)
    const supabase = createClient()

    const product = feedProducts.find((p) => p.id === values.feedProductId)
    const sackWeight = product?.sack_weight_kg ?? 50
    const magnitudeKg = values.sacks * sackWeight + values.looseKg
    const sign = values.type === "ADJUSTMENT" && values.direction === "subtract" ? -1 : 1

    const { error } = await supabase.from("inventory_transactions").insert({
      farm_id: farmId,
      feed_product_id: values.feedProductId,
      type: values.type,
      qty_sacks: sign * values.sacks,
      qty_kg: sign * magnitudeKg,
      reason: values.reason || null,
      reference: values.reference || null,
    })

    setSubmitting(false)

    if (error) {
      toast.error("Gagal menyimpan transaksi", { description: error.message })
      return
    }

    toast.success("Transaksi tersimpan")
    router.replace("/inventory")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Transaksi</FormLabel>
              <Tabs
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v)
                  if (v === "IN") form.setValue("direction", "add")
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="IN" className="flex-1">
                    Stok Masuk
                  </TabsTrigger>
                  <TabsTrigger value="ADJUSTMENT" className="flex-1">
                    Penyesuaian
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </FormItem>
          )}
        />

        {type === "ADJUSTMENT" && (
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arah Penyesuaian</FormLabel>
                <Tabs value={field.value} onValueChange={field.onChange}>
                  <TabsList className="w-full">
                    <TabsTrigger value="add" className="flex-1">
                      Tambah
                    </TabsTrigger>
                    <TabsTrigger value="subtract" className="flex-1">
                      Kurangi
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="feedProductId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produk Pakan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feedProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="sacks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sak</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="looseKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kg tambahan</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.1}
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referensi (opsional)</FormLabel>
              <FormControl>
                <Input placeholder="mis. No. kontainer / invoice" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Alasan {type === "ADJUSTMENT" ? "(wajib jika mengurangi stok)" : "(opsional)"}
              </FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </form>
    </Form>
  )
}
