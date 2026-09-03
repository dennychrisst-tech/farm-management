"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({
  name: z.string().min(1, "Wajib diisi"),
  timezone: z.string().min(1, "Wajib diisi"),
  traySize: z.number().int().min(1),
  sackWeightKg: z.number().min(0.1),
  containerSacks: z.number().int().min(1),
})

type FormValues = z.infer<typeof schema>

export function FarmSettingsForm({ farm }: { farm: Tables<"farms"> }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: farm.name,
      timezone: farm.timezone,
      traySize: farm.tray_size,
      sackWeightKg: farm.sack_weight_kg,
      containerSacks: farm.container_sacks,
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("farms")
      .update({
        name: values.name,
        timezone: values.timezone,
        tray_size: values.traySize,
        sack_weight_kg: values.sackWeightKg,
        container_sacks: values.containerSacks,
      })
      .eq("id", farm.id)
    setSubmitting(false)

    if (error) {
      toast.error("Gagal menyimpan", { description: error.message })
      return
    }
    toast.success("Data farm tersimpan")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Farm</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zona Waktu</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="traySize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Butir/Piring</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sackWeightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kg/Sak (default)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={0.1}
                    {...field}
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
          name="containerSacks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kapasitas Kontainer (sak)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  )
}
