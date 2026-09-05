import { requireOwnerContext } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { UsersClient } from "@/components/settings/users-client"

export default async function UsersSettingsPage() {
  const { farm, userId } = await requireOwnerContext()
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("farm_id", farm.id)
    .order("role")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Pengguna</h1>
      <p className="text-sm text-muted-foreground">
        Pekerja bisa mendaftar sendiri lewat halaman login. Akun baru selalu berperan worker dan
        berstatus nonaktif sampai diaktifkan di sini. Peran admin hanya bisa diberikan secara manual
        oleh Owner/Admin yang sudah ada.
      </p>
      <UsersClient users={users ?? []} currentUserId={userId} />
    </div>
  )
}
