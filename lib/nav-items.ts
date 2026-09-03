import {
  Home,
  ClipboardList,
  LayoutDashboard,
  Package,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const workerNavItems: NavItem[] = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/reports", label: "Laporan", icon: ClipboardList },
]

export const ownerNavItems: NavItem[] = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/alerts", label: "Alert", icon: Bell },
]

export const ownerSidebarExtraItems: NavItem[] = [
  { href: "/settings", label: "Pengaturan", icon: Settings },
]

export function navItemsForRole(role: string): NavItem[] {
  return role === "owner" || role === "admin" ? ownerNavItems : workerNavItems
}
