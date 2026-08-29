-- ============================================================
-- MENUFY - Admin Dev
-- Admin autorizado: rojonas71@gmail.com
-- ============================================================

create table if not exists public.dev_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.dev_admins enable row level security;

create or replace function public.is_dev_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dev_admins da
    where da.user_id = auth.uid()
  );
$$;

revoke all on function public.is_dev_admin() from public;
grant execute on function public.is_dev_admin() to authenticated;

drop policy if exists "dev_admin_read_own" on public.dev_admins;
create policy "dev_admin_read_own"
on public.dev_admins
for select
to authenticated
using (user_id = auth.uid());

-- Bootstrap do administrador já cadastrado no Auth.
insert into public.dev_admins (user_id, email)
select id, email
from auth.users
where lower(email) = lower('rojonas71@gmail.com')
on conflict (user_id) do update
set email = excluded.email;

-- Se o usuário ainda não existir no Auth quando esta migration for executada,
-- esta função garante o cadastro automático quando houver login/cadastro.
create or replace function public.sync_dev_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = lower('rojonas71@gmail.com') then
    insert into public.dev_admins (user_id, email)
    values (new.id, new.email)
    on conflict (user_id) do update
    set email = excluded.email;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_dev_admin on auth.users;
create trigger on_auth_user_dev_admin
after insert or update of email on auth.users
for each row
execute function public.sync_dev_admin();

-- ============================================================
-- Políticas globais do Admin Dev
-- ============================================================

drop policy if exists "dev_admin_all_businesses" on public.businesses;
create policy "dev_admin_all_businesses"
on public.businesses
for all
to authenticated
using (public.is_dev_admin())
with check (public.is_dev_admin());

drop policy if exists "dev_admin_all_business_members" on public.business_members;
create policy "dev_admin_all_business_members"
on public.business_members
for all
to authenticated
using (public.is_dev_admin())
with check (public.is_dev_admin());

drop policy if exists "dev_admin_all_categories" on public.categories;
create policy "dev_admin_all_categories"
on public.categories
for all
to authenticated
using (public.is_dev_admin())
with check (public.is_dev_admin());

drop policy if exists "dev_admin_all_products" on public.products;
create policy "dev_admin_all_products"
on public.products
for all
to authenticated
using (public.is_dev_admin())
with check (public.is_dev_admin());

drop policy if exists "dev_admin_all_orders" on public.orders;
create policy "dev_admin_all_orders"
on public.orders
for all
to authenticated
using (public.is_dev_admin())
with check (public.is_dev_admin());

drop policy if exists "dev_admin_all_order_items" on public.order_items;
create policy "dev_admin_all_order_items"
on public.order_items
for all
to authenticated
using (public.is_dev_admin())
with check (public.is_dev_admin());

notify pgrst, 'reload schema';
