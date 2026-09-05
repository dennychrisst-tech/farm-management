-- Daily operational checklist (feeding, water check, egg collection,
-- cleaning) so routine tasks stay consistent regardless of who's on shift,
-- plus a biosecurity visitor log to protect the flock from disease
-- introduction -- both are "ease the work" items, not report-tied so
-- workers can tick things off through the day without waiting for the
-- daily report to exist yet.

create table public.daily_checklist_items (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.daily_checklist_completions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  item_id uuid not null references public.daily_checklist_items(id),
  completion_date date not null default current_date,
  completed_by uuid references public.profiles(id),
  completed_at timestamptz not null default now(),
  unique (item_id, completion_date)
);

create table public.biosecurity_log (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  visit_date date not null default current_date,
  visitor_name text not null,
  purpose text,
  vehicle_disinfected boolean not null default false,
  foot_dip_used boolean not null default false,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_biosecurity_log_farm_date on public.biosecurity_log (farm_id, visit_date desc);

alter table public.daily_checklist_items enable row level security;
alter table public.daily_checklist_completions enable row level security;
alter table public.biosecurity_log enable row level security;

create policy checklist_items_select on public.daily_checklist_items for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy checklist_items_insert on public.daily_checklist_items for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner', 'admin'));

create policy checklist_items_update on public.daily_checklist_items for update to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select role from public.auth_profile()) in ('owner', 'admin'));

create policy checklist_completions_select on public.daily_checklist_completions for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy checklist_completions_insert on public.daily_checklist_completions for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select active from public.auth_profile()));

create policy checklist_completions_delete on public.daily_checklist_completions for delete to authenticated
using (farm_id = (select farm_id from public.auth_profile())
       and (select active from public.auth_profile()));

create policy biosecurity_log_select on public.biosecurity_log for select to authenticated
using (farm_id = (select farm_id from public.auth_profile()));

create policy biosecurity_log_insert on public.biosecurity_log for insert to authenticated
with check (farm_id = (select farm_id from public.auth_profile())
       and (select active from public.auth_profile()));

insert into public.daily_checklist_items (farm_id, label, sort_order)
select id, label, sort_order
from public.farms
cross join (values
  ('Pakan Pagi', 1),
  ('Cek Air Minum', 2),
  ('Kumpulkan Telur Pagi', 3),
  ('Kumpulkan Telur Sore', 4),
  ('Pakan Sore', 5),
  ('Bersihkan Kandang', 6)
) as defaults(label, sort_order);
