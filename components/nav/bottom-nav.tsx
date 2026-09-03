"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ClipboardList,
  LayoutDashboard,
  Package,
  Bell,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const workerItems: NavItem[] = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/reports", label: "Laporan", icon: ClipboardList },
]

const ownerItems: NavItem[] = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/alerts", label: "Alert", icon: Bell },
]

export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const items = role === "owner" || role === "admin" ? ownerItems : workerItems

  return (
    <nav className="sticky bottom-0 z-10 border-t bg-background">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
