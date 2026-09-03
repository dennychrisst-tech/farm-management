-- Feed inventory ledger. Balance is always sum(qty_kg) -- see 0007 views, no cached stock column.

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id),
  feed_product_id uuid not null references public.feed_products(id),
  occurred_at timestamptz not null default now(),
  type text not null check (type in ('IN','USAGE','ADJUSTMENT')),
  qty_sacks numeric(10,2) not null default 0,
  qty_kg numeric(12,2) not null,   -- signed: IN>0, USAGE<0, ADJUSTMENT either
  reference text,
  daily_report_id uuid references public.daily_reports(id),
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint adjustment_negative_requires_reason
    check (not (type = 'ADJUSTMENT' and qty_kg < 0 and reason is null))
);
create index idx_inv_tx_farm_product_time on public.inventory_transactions (farm_id, feed_product_id, occurred_at);
create index idx_inv_tx_daily_report on public.inventory_transactions (daily_report_id);
