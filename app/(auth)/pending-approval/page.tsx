import { redirect } from "next/navigation"
import { Clock } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PendingApprovalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, name")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.active) {
    redirect("/home")
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Clock className="size-5" />
            </span>
            <CardTitle className="text-xl leading-tight">Menunggu Aktivasi</CardTitle>
          </div>
          <CardDescription>
            Halo{profile?.name ? ` ${profile.name}` : ""}, akun Anda sudah terdaftar dan sedang
            menunggu aktivasi dari Owner/Admin farm. Anda akan bisa masuk setelah akun diaktifkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  )
}
