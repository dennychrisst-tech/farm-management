-- Fix advisor findings:
-- 1) Views defaulted to security-definer semantics (owner privileges), which bypasses
--    the querying user's RLS entirely -- a real cross-farm data leak. Force
--    security_invoker so each view runs with the caller's own RLS-scoped permissions.
alter view public.daily_report_kpis set (security_invoker = true);
alter view public.feed_stock_balances set (security_invoker = true);
alter view public.feed_stock_coverage set (security_invoker = true);

-- 2) Trigger functions without a pinned search_path are vulnerable to search_path
--    hijacking. Pin them.
alter function public.set_opening_population() set search_path = public;
alter function public.touch_updated_at() set search_path = public;
alter function public.calc_egg_totals() set search_path = public;
alter function public.calc_feed_usage_total() set search_path = public;
alter function public.block_negative_inventory() set search_path = public;

-- 3) Every function in the public schema got a default EXECUTE grant to PUBLIC
--    (which anon/authenticated inherit) on creation. Lock that down: revoke from
--    PUBLIC and anon everywhere, then grant back only what each role actually needs.
--    - auth_profile(): needed by authenticated for RLS policy checks.
--    - finalize_daily_report()/correct_daily_report(): the two client-facing RPCs.
--    - evaluate_*()/check_missing_reports(): internal-only, invoked via `perform` from
--      the SECURITY DEFINER functions above (nested calls don't need a fresh grant
--      check) or by pg_cron -- never called directly by a client.
revoke execute on function public.auth_profile() from public, anon;
grant execute on function public.auth_profile() to authenticated;

revoke execute on function public.finalize_daily_report(uuid) from public, anon;
revoke execute on function public.correct_daily_report(uuid,int,int,int,jsonb,jsonb,text) from public, anon;
-- (authenticated grants for these two were already set explicitly in 0008)

revoke execute on function public.evaluate_feed_variance_alert(uuid) from public, anon, authenticated;
revoke execute on function public.evaluate_mortality_spike_alert(uuid) from public, anon, authenticated;
revoke execute on function public.evaluate_low_stock_alert(uuid) from public, anon, authenticated;
revoke execute on function public.evaluate_production_decline_alert(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.evaluate_milestone_alert(uuid) from public, anon, authenticated;
revoke execute on function public.check_missing_reports() from public, anon, authenticated;
