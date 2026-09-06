"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Info, OctagonAlert, Check, CheckCheck } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const SEVERITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  red: OctagonAlert,
  yellow: AlertTriangle,
  info: Info,
}

const SEVERITY_CLASS: Record<string, string> = {
  red: "text-destructive",
  yellow: "text-yellow-600 dark:text-yellow-500",
  info: "text-muted-foreground",
}

type Alert = Tables<"alerts">

export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<"open" | "all">("open")
  const [pendingId, setPendingId] = useState<string | null>(null)

  const visible = filter === "open" ? initialAlerts.filter((a) => a.status === "open") : initialAlerts

  async function updateStatus(id: string, status: "acknowledged" | "resolved") {
    setPendingId(id)
    const supabase = createClient()
    const { error } = await supabase.from("alerts").update({ status }).eq("id", id)
    setPendingId(null)

    if (error) {
      toast.error("Gagal memperbarui alert", { description: error.message })
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="open">Terbuka</TabsTrigger>
          <TabsTrigger value="all">Semua</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada alert.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((a) => {
            const Icon = SEVERITY_ICON[a.severity] ?? Info
            return (
              <li key={a.id} className="flex items-start gap-2 rounded-md border p-2.5">
                <Icon className={cn("mt-0.5 size-4 shrink-0", SEVERITY_CLASS[a.severity])} />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("id-ID")} · {a.status}
                  </p>
                </div>
                {a.status !== "resolved" && (
                  <div className="flex gap-2">
                    {a.status === "open" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pendingId === a.id}
                        onClick={() => updateStatus(a.id, "acknowledged")}
                        aria-label="Tandai dilihat"
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pendingId === a.id}
                      onClick={() => updateStatus(a.id, "resolved")}
                      aria-label="Selesaikan"
                    >
                      <CheckCheck className="size-4" />
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
