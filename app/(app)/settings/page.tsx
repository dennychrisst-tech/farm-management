import Link from "next/link"
import { ChevronRight, Building2, Wheat, SlidersHorizontal, Users } from "lucide-react"

import { requireOwnerContext } from "@/lib/data/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { PushNotificationsCard } from "@/components/settings/push-notifications-card"

const links = [
  { href: "/settings/farm", label: "Data Farm", icon: Building2 },
  { href: "/settings/feed-products", label: "Produk & Suplai", icon: Wheat },
  { href: "/settings/thresholds", label: "Ambang Batas Alert", icon: SlidersHorizontal },
  { href: "/settings/users", label: "Pengguna", icon: Users },
]

export default async function SettingsPage() {
  const { userId } = await requireOwnerContext()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
      <PushNotificationsCard userId={userId} />
      <div className="space-y-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-sm">
                  <l.icon className="size-4" /> {l.label}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
