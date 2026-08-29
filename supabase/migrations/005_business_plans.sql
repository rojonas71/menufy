-- ============================================================
-- MENUFY - Planos e assinatura do estabelecimento
-- ============================================================

alter table public.businesses
  add column if not exists plan text not null default 'starter',
  add column if not exists subscription_status text not null default 'active';

alter table public.businesses
  drop constraint if exists businesses_plan_check;

alter table public.businesses
  add constraint businesses_plan_check
  check (plan in ('starter', 'pro', 'premium'));

alter table public.businesses
  drop constraint if exists businesses_subscription_status_check;

alter table public.businesses
  add constraint businesses_subscription_status_check
  check (subscription_status in ('active', 'trial', 'past_due', 'cancelled'));

create index if not exists businesses_plan_idx
  on public.businesses(plan);

create index if not exists businesses_subscription_status_idx
  on public.businesses(subscription_status);

notify pgrst, 'reload schema';
