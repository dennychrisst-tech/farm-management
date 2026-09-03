-- Fix perf advisor findings:
-- 1) auth.uid() re-evaluated per row -> wrap as (select auth.uid()) so the planner
--    evaluates it once per statement instead of once per row.
-- 2) "for all" policies on flocks/feed_products duplicated an existing dedicated
--    select policy (multiple permissive policies for the same role+action) -- split
--    into insert/update/delete only, since select is already covered separately.

drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or farm_id = (select farm_id from public.auth_profile()));

drop policy daily_reports_select on public.daily_reports;
create policy daily_reports_select on public.daily_reports for select to authenticated
using (
  reporter_id = (select auth.uid())
  or (farm_id = (select farm_id from public.auth_profile())
      and (select role from public.auth_profile()) in ('owner','admin'))
);

drop policy daily_reports_insert on public.daily_reports;
create policy daily_reports_insert on public.daily_reports for insert to authenticated
with check (
  farm_id = (select farm_id from public.auth_profile())
  and (select active from public.auth_profile())
  and reporter_id = (select auth.uid())
);

drop policy daily_reports_update on public.daily_reports;
create policy daily_reports_update on public.daily_reports for update to authenticated
using (
  (reporter_id = (select auth.uid()) and status = 'draft')
  or (farm_id = (select farm_id from public.auth_profile())
      and (select role from public.auth_profile()) in ('owner','admin'))
);

drop policy egg_production_all on public.egg_production;
create policy egg_production_all on public.egg_production for all to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = (select auth.uid())
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
))
with check (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = (select auth.uid())
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));

drop policy feed_usage_all on public.feed_usage;
create policy feed_usage_all on public.feed_usage for all to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = (select auth.uid())
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
))
with check (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = (select auth.uid())
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));

drop policy evidence_all on public.evidence;
create policy evidence_all on public.evidence for all to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = (select auth.uid())
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
))
with check (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = (select auth.uid())
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));

drop policy revisions_select on public.daily_report_revisions;
create policy revisions_select on public.daily_report_revisions for select to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = (select auth.uid())
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));

-- flocks: split "for all" into write-only policies so SELECT has exactly one policy
drop policy flocks_write on public.flocks;
create policy flocks_insert on public.flocks for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));
create policy flocks_update on public.flocks for update to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));
create policy flocks_delete on public.flocks for delete to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

-- feed_products: same split
drop policy feed_products_write on public.feed_products;
create policy feed_products_insert on public.feed_products for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));
create policy feed_products_update on public.feed_products for update to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));
create policy feed_products_delete on public.feed_products for delete to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));
