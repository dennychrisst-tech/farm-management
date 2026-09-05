-- Same gap as 0012: PostgREST exposes every function to anon/authenticated
-- by default on creation. Lock down the functions added in 0017-0021.

alter function public.calc_egg_totals() set search_path = public;
alter function public.calc_egg_sale_totals() set search_path = public;
alter function public.calc_po_total() set search_path = public;

-- Trigger-only functions: never meant to be called directly via RPC.
revoke execute on function public.calc_egg_totals() from public, anon, authenticated;
revoke execute on function public.calc_egg_sale_totals() from public, anon, authenticated;
revoke execute on function public.calc_po_total() from public, anon, authenticated;

-- Cron-only: never meant to be called directly via RPC.
revoke execute on function public.evaluate_low_supply_stock_alerts() from public, anon, authenticated;

-- Client-facing RPCs: authenticated only, never anon.
revoke execute on function public.record_stock_count(text, uuid, uuid, numeric, text) from public, anon;
revoke execute on function public.receive_purchase_order(uuid, numeric, text) from public, anon;
revoke execute on function public.cancel_purchase_order(uuid) from public, anon;
