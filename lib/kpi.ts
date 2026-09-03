/**
 * Client-side preview mirrors of the SQL KPI formulas (see
 * supabase/migrations/0007_views.sql) -- for instant form feedback only.
 * The database triggers/views remain the source of truth.
 */

export function calcEggs(trays: number, loose: number, traySize: number): number {
  return trays * traySize + loose
}

export function calcHdpPct(totalEggs: number, liveBirds: number): number {
  if (!liveBirds) return 0
  return (totalEggs / liveBirds) * 100
}

export function calcFeedKg(sacks: number, looseKg: number, sackWeightKg: number): number {
  return sacks * sackWeightKg + looseKg
}

export function calcFeedTargetKg(liveBirds: number, targetGPerBird: number): number {
  return (liveBirds * targetGPerBird) / 1000
}

export function calcFeedIntakeGPerBird(actualFeedKg: number, liveBirds: number): number {
  if (!liveBirds) return 0
  return (actualFeedKg * 1000) / liveBirds
}
