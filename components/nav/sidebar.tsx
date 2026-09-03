"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Egg, LogOut } from "lucide-react"

import { navItemsForRole, ownerSidebarExtraItems } from "@/lib/nav-items"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function Sidebar({
  role,
  farmName,
  userName,
}: {
  role: string
  farmName: string
  userName: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isOwner = role === "owner" || role === "admin"
  const items = isOwner ? [...navItemsForRole(role), ...ownerSidebarExtraItems] : navItemsForRole(role)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Egg className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Farm</p>
          <p className="text-sm font-semibold">Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
        <p className="truncate px-3 text-xs text-sidebar-foreground/60">{farmName}</p>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4.5" />
          Keluar ({userName})
        </button>
      </div>
    </aside>
  )
}
