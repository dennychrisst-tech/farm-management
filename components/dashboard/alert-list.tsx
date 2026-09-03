import { AlertTriangle, Info, OctagonAlert } from "lucide-react"

import type { Tables } from "@/lib/types/database"
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

export function AlertList({
  alerts,
  emptyLabel = "Tidak ada alert.",
  actions,
}: {
  alerts: Pick<Tables<"alerts">, "id" | "type" | "severity" | "message" | "status" | "created_at">[]
  emptyLabel?: string
  actions?: (alert: { id: string; status: string }) => React.ReactNode
}) {
  if (alerts.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2">
      {alerts.map((a) => {
        const Icon = SEVERITY_ICON[a.severity] ?? Info
        return (
          <li key={a.id} className="flex items-start gap-2 rounded-md border p-2.5">
            <Icon className={cn("mt-0.5 size-4 shrink-0", SEVERITY_CLASS[a.severity])} />
            <div className="flex-1 space-y-0.5">
              <p className="text-sm">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            {actions?.(a)}
          </li>
        )
      })}
    </ul>
  )
}
