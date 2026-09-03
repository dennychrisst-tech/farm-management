import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: "default" | "warning" | "danger"
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-xl font-semibold tabular-nums",
            tone === "warning" && "text-yellow-600 dark:text-yellow-500",
            tone === "danger" && "text-destructive"
          )}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}
