"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function AppHeader({
  farmName,
  role,
}: {
  farmName: string
  role: string
}) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
      <div>
        <p className="text-sm font-semibold leading-none">{farmName}</p>
        <p className="text-xs text-muted-foreground capitalize">{role}</p>
      </div>
      <div className="flex items-center gap-1">
        {(role === "owner" || role === "admin") && (
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/farm" aria-label="Pengaturan">
              <Settings className="size-4" />
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Keluar">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}
