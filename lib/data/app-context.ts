import "server-only"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/types/database"

export type AppContext = {
  userId: string
  profile: Tables<"profiles">
  farm: Tables<"farms">
  flock: Tables<"flocks"> | null
}

/**
 * Server-only helper for authenticated pages: loads the caller's profile,
 * farm, and active flock. Redirects to /login if any of that is missing --
 * middleware already guards unauthenticated requests, this covers the edge
 * case of a Supabase Auth user with no matching profile row yet.
 */
export async function getAppContext(): Promise<AppContext> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  const { data: farm } = await supabase
    .from("farms")
    .select("*")
    .eq("id", profile.farm_id)
    .single()

  if (!farm) {
    redirect("/login")
  }

  const { data: flock } = await supabase
    .from("flocks")
    .select("*")
    .eq("farm_id", farm.id)
    .eq("status", "active")
    .maybeSingle()

  return { userId: user.id, profile, farm, flock: flock ?? null }
}

/** Same as getAppContext, but redirects non owner/admin roles to /home. */
export async function requireOwnerContext(): Promise<AppContext> {
  const ctx = await getAppContext()
  if (ctx.profile.role !== "owner" && ctx.profile.role !== "admin") {
    redirect("/home")
  }
  return ctx
}

export function flockAgeWeeks(flock: Tables<"flocks">): number {
  const arrival = new Date(flock.arrival_date)
  const now = new Date()
  const daysSinceArrival = Math.floor(
    (now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)
  )
  return flock.arrival_age_weeks + Math.floor(daysSinceArrival / 7)
}
