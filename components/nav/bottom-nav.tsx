"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { navItemsForRole } from "@/lib/nav-items"
import { cn } from "@/lib/utils"

export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const items = navItemsForRole(role)

  return (
    <nav className="sticky bottom-0 z-10 border-t bg-background md:hidden">
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
