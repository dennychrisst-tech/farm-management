"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { supplyTxSchema, type SupplyTxInput } from "@/lib/validation/supply"
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

export function SupplyTxForm({
  farmId,
  items,
}: {
  farmId: string
  items: Tables<"supply_items">[]
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SupplyTxInput>({
    resolver: zodResolver(supplyTxSchema),
    defaultValues: {
      type: "IN",
      direction: "add",
      supplyItemId: items[0]?.id ?? "",
      qty: 0,
      unitPrice: undefined,
      reason: "",
      reference: "",
    },
  })

  const type = form.watch("type")
  const selectedItem = items.find((i) => i.id === form.watch("supplyItemId"))

  function handleTypeChange(v: string) {
    form.setValue("type", v as SupplyTxInput["type"])
    if (v === "IN") form.setValue("direction", "add")
    if (v === "USAGE") form.setValue("direction", "subtract")
  }

  async function onSubmit(values: SupplyTxInput) {
    setSubmitting(true)
    const supabase = createClient()

    const sign = values.direction === "subtract" ? -1 : 1

    const { error } = await supabase.from("supply_transactions").insert({
      farm_id: farmId,
      supply_item_id: values.supplyItemId,
      type: values.type,
      qty: sign * values.qty,
      unit_price: values.type === "IN" ? values.unitPrice || null : null,
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
              <Tabs value={field.value} onValueChange={handleTypeChange}>
                <TabsList className="w-full">
                  <TabsTrigger value="IN" className="flex-1">
                    Stok Masuk
                  </TabsTrigger>
                  <TabsTrigger value="USAGE" className="flex-1">
                    Pemakaian
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
          name="supplyItemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah {selectedItem ? `(${selectedItem.unit})` : ""}</FormLabel>
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

        {type === "IN" && (
          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga per {selectedItem?.unit ?? "unit"} (opsional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    placeholder="mis. 15000"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Dipakai untuk estimasi biaya obat/suplemen di laporan penjualan &amp; profit.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referensi (opsional)</FormLabel>
              <FormControl>
                <Input placeholder="mis. no. invoice" {...field} />
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
                Alasan / Keterangan {type !== "IN" ? "(wajib jika mengurangi stok)" : "(opsional)"}
              </FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={submitting || items.length === 0}>
          {submitting ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </form>
    </Form>
  )
}
