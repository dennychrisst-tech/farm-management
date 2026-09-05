"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"

export type ChecklistItem = {
  id: string
  label: string
  done: boolean
}

export function DailyChecklist({
  farmId,
  items,
  todayISO,
}: {
  farmId: string
  items: ChecklistItem[]
  todayISO: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function toggle(item: ChecklistItem) {
    setPending(item.id)
    const supabase = createClient()

    if (item.done) {
      const { error } = await supabase
        .from("daily_checklist_completions")
        .delete()
        .eq("item_id", item.id)
        .eq("completion_date", todayISO)
      if (error) toast.error("Gagal memperbarui checklist", { description: error.message })
    } else {
      const { error } = await supabase.from("daily_checklist_completions").insert({
        farm_id: farmId,
        item_id: item.id,
        completion_date: todayISO,
      })
      if (error) toast.error("Gagal memperbarui checklist", { description: error.message })
    }

    setPending(null)
    router.refresh()
  }

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2.5 rounded-md px-1 py-1.5 text-sm hover:bg-muted/50"
          >
            <Checkbox
              checked={item.done}
              disabled={pending === item.id}
              onCheckedChange={() => toggle(item)}
            />
            <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
          </label>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada item checklist. Atur di Pengaturan.
          </p>
        )}
      </div>
    </div>
  )
}
