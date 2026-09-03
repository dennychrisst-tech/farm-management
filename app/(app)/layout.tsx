import { getAppContext } from "@/lib/data/app-context"
import { AppHeader } from "@/components/nav/app-header"
import { BottomNav } from "@/components/nav/bottom-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, farm } = await getAppContext()

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader farmName={farm.name} role={profile.role} />
      <main className="mx-auto w-full max-w-lg flex-1 p-4">{children}</main>
      <BottomNav role={profile.role} />
    </div>
  )
}
