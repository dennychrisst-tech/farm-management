import { requireOwnerContext, flockAgeDays } from "@/lib/data/app-context"
import { createClient } from "@/lib/supabase/server"
import { BodyWeightClient } from "@/components/monitoring/body-weight-client"
import { VaccinationClient } from "@/components/monitoring/vaccination-client"
import { BiosecurityClient } from "@/components/monitoring/biosecurity-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function MonitoringPage() {
  const { farm, flock } = await requireOwnerContext()

  if (!flock) {
    return <p className="text-sm text-muted-foreground">Belum ada flock aktif untuk farm ini.</p>
  }

  const supabase = await createClient()
  const currentAgeDays = flockAgeDays(flock)

  const [
    { data: samples },
    { data: standardRows },
    { data: plans },
    { data: records },
    { data: biosecurityLogs },
  ] = await Promise.all([
    supabase
      .from("body_weight_samples")
      .select("*")
      .eq("flock_id", flock.id)
      .order("sample_date", { ascending: false }),
    supabase.from("flock_targets").select("day_number, target_body_weight_g").eq("flock_id", flock.id),
    supabase.from("vaccination_plan").select("*").eq("flock_id", flock.id),
    supabase
      .from("vaccination_records")
      .select("*")
      .eq("flock_id", flock.id)
      .order("administered_date", { ascending: false }),
    supabase
      .from("biosecurity_log")
      .select("*")
      .eq("farm_id", farm.id)
      .order("visit_date", { ascending: false })
      .limit(30),
  ])

  const standardByAgeDays = new Map(
    (standardRows ?? [])
      .filter((r) => r.target_body_weight_g !== null)
      .map((r) => [r.day_number, r.target_body_weight_g as number])
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Monitoring Kesehatan &amp; Kerja</h1>

      <Tabs defaultValue="weight">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="weight">Berat Badan</TabsTrigger>
          <TabsTrigger value="vaccination">Vaksinasi</TabsTrigger>
          <TabsTrigger value="biosecurity">Biosekuriti</TabsTrigger>
        </TabsList>
        <TabsContent value="weight" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Standar berat badan yang dipakai adalah estimasi umum ayam petelur coklat komersial,
            bukan kurva resmi dari breeder/supplier tertentu. Sesuaikan interpretasinya jika Anda
            punya data resmi dari strain ayam Anda.
          </p>
          <BodyWeightClient
            farmId={farm.id}
            flockId={flock.id}
            arrivalAgeWeeks={flock.arrival_age_weeks}
            arrivalDate={flock.arrival_date}
            samples={samples ?? []}
            standardByAgeDays={standardByAgeDays}
          />
        </TabsContent>
        <TabsContent value="vaccination" className="mt-4">
          <VaccinationClient
            farmId={farm.id}
            flockId={flock.id}
            currentAgeDays={currentAgeDays}
            plans={plans ?? []}
            records={records ?? []}
          />
        </TabsContent>
        <TabsContent value="biosecurity" className="mt-4">
          <BiosecurityClient farmId={farm.id} logs={biosecurityLogs ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
