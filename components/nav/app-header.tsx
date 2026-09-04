"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
          <Image src="/images/logo-master.png" alt={farmName} width={32} height={32} className="size-full object-cover" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-none">{farmName}</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
        </div>
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
