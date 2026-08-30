create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  business_id uuid references public.businesses(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_business_id_idx on public.audit_logs(business_id);

alter table public.system_settings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "dev_admin_all_system_settings" on public.system_settings;
create policy "dev_admin_all_system_settings"
on public.system_settings for all to authenticated
using (public.is_dev_admin())
with check (public.is_dev_admin());

drop policy if exists "dev_admin_read_audit_logs" on public.audit_logs;
create policy "dev_admin_read_audit_logs"
on public.audit_logs for select to authenticated
using (public.is_dev_admin());

create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_business_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
  v_email text;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  select email::text into v_email from auth.users where id = auth.uid();

  insert into public.audit_logs (
    actor_user_id, actor_email, action, entity_type,
    entity_id, business_id, metadata
  )
  values (
    auth.uid(), v_email, p_action, p_entity_type,
    p_entity_id, p_business_id, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_audit_log(text,text,text,uuid,jsonb) from public;
grant execute on function public.write_audit_log(text,text,text,uuid,jsonb) to authenticated;

insert into public.system_settings (key, value, description)
values (
  'platform',
  '{"name":"Menufy","maintenance_mode":false,"new_businesses_enabled":true,"support_whatsapp":"","support_email":""}'::jsonb,
  'Configurações gerais da plataforma'
)
on conflict (key) do nothing;

notify pgrst, 'reload schema';
