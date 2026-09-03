import { getAppContext } from "@/lib/data/app-context"
import { AppHeader } from "@/components/nav/app-header"
import { BottomNav } from "@/components/nav/bottom-nav"
import { Sidebar } from "@/components/nav/sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, farm } = await getAppContext()

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Sidebar role={profile.role} farmName={farm.name} userName={profile.name} />
      <div className="flex min-h-full flex-1 flex-col md:ml-64">
        <AppHeader farmName={farm.name} role={profile.role} />
        <main className="mx-auto w-full max-w-lg flex-1 p-4 md:max-w-7xl md:p-8">
          {children}
        </main>
        <BottomNav role={profile.role} />
      </div>
    </div>
  )
}
