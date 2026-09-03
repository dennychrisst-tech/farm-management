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
        Penambahan akun baru saat ini dilakukan lewat Supabase Dashboard (Authentication → Users),
        lalu tambahkan baris profil dengan role yang sesuai.
      </p>
      <UsersClient users={users ?? []} currentUserId={userId} />
    </div>
  )
}
