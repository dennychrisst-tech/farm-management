-- Row Level Security: farm-scoping + role permissions. This is the real security
-- boundary; app-level route guards are UX only.

alter table public.farms enable row level security;
alter table public.profiles enable row level security;
alter table public.flocks enable row level security;
alter table public.feed_products enable row level security;
alter table public.daily_reports enable row level security;
alter table public.egg_production enable row level security;
alter table public.feed_usage enable row level security;
alter table public.evidence enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.alert_thresholds enable row level security;
alter table public.alerts enable row level security;
alter table public.milestones_reached enable row level security;
alter table public.daily_report_revisions enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or farm_id = (select farm_id from public.auth_profile()));

create policy profiles_update on public.profiles for update to authenticated
using ((select role from public.auth_profile()) in ('owner','admin')
       and farm_id = (select farm_id from public.auth_profile()));

create policy profiles_insert on public.profiles for insert to authenticated
with check ((select role from public.auth_profile()) in ('owner','admin'));

-- farms
create policy farms_select on public.farms for select to authenticated
using (id = (select farm_id from public.auth_profile()));

create policy farms_update on public.farms for update to authenticated
using (id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

-- flocks
create policy flocks_select on public.flocks for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy flocks_write on public.flocks for all to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'))
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

-- feed_products
create policy feed_products_select on public.feed_products for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy feed_products_write on public.feed_products for all to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'))
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

-- alert_thresholds
create policy alert_thresholds_select on public.alert_thresholds for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy alert_thresholds_update on public.alert_thresholds for update to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

-- daily_reports
create policy daily_reports_select on public.daily_reports for select to authenticated
using (
  reporter_id = auth.uid()
  or (farm_id = (select farm_id from public.auth_profile())
      and (select role from public.auth_profile()) in ('owner','admin'))
);

create policy daily_reports_insert on public.daily_reports for insert to authenticated
with check (
  farm_id = (select farm_id from public.auth_profile())
  and (select active from public.auth_profile())
  and reporter_id = auth.uid()
);

create policy daily_reports_update on public.daily_reports for update to authenticated
using (
  (reporter_id = auth.uid() and status = 'draft')
  or (farm_id = (select farm_id from public.auth_profile())
      and (select role from public.auth_profile()) in ('owner','admin'))
);

-- egg_production / feed_usage / evidence: same access rule as their parent daily_report
create policy egg_production_all on public.egg_production for all to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = auth.uid()
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
))
with check (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = auth.uid()
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));

create policy feed_usage_all on public.feed_usage for all to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = auth.uid()
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
))
with check (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = auth.uid()
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));

create policy evidence_all on public.evidence for all to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = auth.uid()
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
))
with check (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = auth.uid()
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));

-- inventory_transactions: clients may never insert USAGE rows directly -- only the
-- SECURITY DEFINER finalize_daily_report()/correct_daily_report() functions do that.
create policy inventory_select on public.inventory_transactions for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy inventory_insert on public.inventory_transactions for insert to authenticated
with check (
  farm_id = (select farm_id from public.auth_profile())
  and (select role from public.auth_profile()) in ('owner','admin')
  and type <> 'USAGE'
);

-- alerts: select-only for clients; all writes go through the alert-evaluator functions
create policy alerts_select on public.alerts for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy alerts_update on public.alerts for update to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner','admin'));

-- milestones_reached / daily_report_revisions: select-only for clients (function-only writes)
create policy milestones_select on public.milestones_reached for select to authenticated
using (exists (
  select 1 from public.flocks fl where fl.id = flock_id
  and fl.farm_id = (select farm_id from public.auth_profile())
));

create policy revisions_select on public.daily_report_revisions for select to authenticated
using (exists (
  select 1 from public.daily_reports dr where dr.id = daily_report_id
  and (dr.reporter_id = auth.uid()
       or (dr.farm_id = (select farm_id from public.auth_profile())
           and (select role from public.auth_profile()) in ('owner','admin')))
));
