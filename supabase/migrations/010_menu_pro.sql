-- Menufy 2.7 - Cardápio público profissional

alter table public.businesses
  add column if not exists is_open boolean not null default true,
  add column if not exists delivery_enabled boolean not null default true,
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists dine_in_enabled boolean not null default true,
  add column if not exists delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists minimum_order numeric(10,2) not null default 0 check (minimum_order >= 0),
  add column if not exists estimated_delivery_min integer check (estimated_delivery_min is null or estimated_delivery_min >= 0),
  add column if not exists estimated_delivery_max integer check (estimated_delivery_max is null or estimated_delivery_max >= 0);

alter table public.products
  add column if not exists is_sold_out boolean not null default false,
  add column if not exists badge text,
  add column if not exists preparation_time integer check (preparation_time is null or preparation_time >= 0);

create index if not exists idx_products_business_featured
  on public.products (business_id, is_featured)
  where is_active = true;

create index if not exists idx_products_business_sold_out
  on public.products (business_id, is_sold_out)
  where is_active = true;

notify pgrst, 'reload schema';
