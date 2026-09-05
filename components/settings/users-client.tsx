"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  async function changeRole(u: Profile, role: string) {
    if (u.id === currentUserId) {
      toast.error("Tidak bisa mengubah peran akun sendiri")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ role }).eq("id", u.id)
    if (error) {
      toast.error("Gagal mengubah peran", { description: error.message })
      return
    }
    toast.success(`${u.name} sekarang ${role}`)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <Card key={u.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-sm font-medium">{u.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {u.role}
                </Badge>
                {!u.active && <Badge variant="destructive">Menunggu Aktivasi</Badge>}
                {u.phone && <span className="text-xs text-muted-foreground">{u.phone}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {u.role !== "owner" && (
                <Select
                  value={u.role}
                  onValueChange={(role) => changeRole(u, role)}
                  disabled={u.id === currentUserId}
                >
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} disabled={u.id === currentUserId} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
