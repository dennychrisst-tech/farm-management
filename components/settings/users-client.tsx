"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

type Profile = Tables<"profiles">

export function UsersClient({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter()

  async function toggleActive(u: Profile) {
    if (u.id === currentUserId) {
      toast.error("Tidak bisa menonaktifkan akun sendiri")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ active: !u.active }).eq("id", u.id)
    if (error) {
      toast.error("Gagal memperbarui", { description: error.message })
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <Card key={u.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{u.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {u.role}
                </Badge>
                {u.phone && <span className="text-xs text-muted-foreground">{u.phone}</span>}
              </div>
            </div>
            <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
