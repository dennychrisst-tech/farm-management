import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiTile({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  tone?: "default" | "warning" | "danger"
  icon?: LucideIcon
}) {
  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-start gap-3 px-4">
        {Icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "text-2xl font-bold tracking-tight tabular-nums",
              tone === "warning" && "text-yellow-600 dark:text-yellow-500",
              tone === "danger" && "text-destructive"
            )}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
