-- ============================================================
-- MENUFY - Administração Global Completa
-- ============================================================

-- Métricas consolidadas da plataforma.
create or replace function public.dev_admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
begin
  if not public.is_dev_admin() then
    raise exception 'Acesso negado';
  end if;

  select jsonb_build_object(
    'businesses_total', (select count(*) from public.businesses),
    'businesses_active', (select count(*) from public.businesses where is_active = true),
    'businesses_inactive', (select count(*) from public.businesses where is_active = false),

    'plan_starter', (select count(*) from public.businesses where plan = 'starter'),
    'plan_pro', (select count(*) from public.businesses where plan = 'pro'),
    'plan_premium', (select count(*) from public.businesses where plan = 'premium'),

    'subscriptions_active', (select count(*) from public.businesses where subscription_status = 'active'),
    'subscriptions_trial', (select count(*) from public.businesses where subscription_status = 'trial'),
    'subscriptions_past_due', (select count(*) from public.businesses where subscription_status = 'past_due'),
    'subscriptions_cancelled', (select count(*) from public.businesses where subscription_status = 'cancelled'),

    'owners_total', (
      select count(distinct owner_id)
      from public.businesses
      where owner_id is not null
    ),

    'orders_total', (select count(*) from public.orders),
    'orders_today', (
      select count(*)
      from public.orders
      where created_at >= date_trunc('day', now())
    ),
    'orders_7d', (
      select count(*)
      from public.orders
      where created_at >= now() - interval '7 days'
    ),
    'orders_30d', (
      select count(*)
      from public.orders
      where created_at >= now() - interval '30 days'
    ),

    'revenue_total', (
      select coalesce(sum(total), 0)
      from public.orders
      where status <> 'cancelled'
    ),
    'revenue_30d', (
      select coalesce(sum(total), 0)
      from public.orders
      where status <> 'cancelled'
        and created_at >= now() - interval '30 days'
    ),
    'average_ticket', (
      select coalesce(avg(total), 0)
      from public.orders
      where status <> 'cancelled'
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.dev_admin_metrics() from public;
grant execute on function public.dev_admin_metrics() to authenticated;


-- Usuários/owners para uso exclusivo do Admin Dev.
create or replace function public.dev_admin_users()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  business_count bigint
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_dev_admin() then
    raise exception 'Acesso negado';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    count(b.id)::bigint as business_count
  from auth.users u
  left join public.businesses b on b.owner_id = u.id
  group by u.id, u.email, u.created_at, u.last_sign_in_at
  order by u.created_at desc;
end;
$$;

revoke all on function public.dev_admin_users() from public;
grant execute on function public.dev_admin_users() to authenticated;


-- Pedidos recentes globais com nome do estabelecimento.
create or replace function public.dev_admin_orders(p_limit integer default 250)
returns table (
  id uuid,
  order_number bigint,
  business_id uuid,
  business_name text,
  customer_name text,
  customer_phone text,
  status text,
  order_type text,
  payment_method text,
  total numeric,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_dev_admin() then
    raise exception 'Acesso negado';
  end if;

  return query
  select
    o.id,
    o.order_number,
    o.business_id,
    b.name,
    o.customer_name,
    o.customer_phone,
    o.status,
    o.order_type,
    o.payment_method,
    o.total,
    o.created_at
  from public.orders o
  join public.businesses b on b.id = o.business_id
  order by o.created_at desc
  limit greatest(1, least(coalesce(p_limit, 250), 1000));
end;
$$;

revoke all on function public.dev_admin_orders(integer) from public;
grant execute on function public.dev_admin_orders(integer) to authenticated;

notify pgrst, 'reload schema';
