-- Menufy 2.4 - Exclusão segura de usuários pelo Admin Dev

create or replace function public.dev_admin_delete_user(
  p_user_id uuid,
  p_confirm_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_target_email text;
  v_business_count bigint;
  v_admin_email text;
begin
  if not public.is_dev_admin() then
    raise exception 'Acesso negado';
  end if;

  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Admin Dev não pode excluir a própria conta';
  end if;

  select email::text
  into v_target_email
  from auth.users
  where id = p_user_id;

  if v_target_email is null then
    raise exception 'Usuário não encontrado';
  end if;

  if lower(trim(coalesce(p_confirm_email, ''))) <> lower(trim(v_target_email)) then
    raise exception 'Email de confirmação não corresponde ao usuário';
  end if;

  select count(*)
  into v_business_count
  from public.businesses
  where owner_id = p_user_id;

  if v_business_count > 0 then
    raise exception 'Usuário possui estabelecimento vinculado';
  end if;

  select email::text
  into v_admin_email
  from auth.users
  where id = auth.uid();

  insert into public.audit_logs (
    actor_user_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    business_id,
    metadata
  )
  values (
    auth.uid(),
    v_admin_email,
    'user.deleted_by_admin',
    'auth_user',
    p_user_id::text,
    null,
    jsonb_build_object(
      'deleted_user_id', p_user_id,
      'deleted_email', v_target_email
    )
  );

  delete from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'Falha ao excluir usuário';
  end if;

  return jsonb_build_object(
    'success', true,
    'deleted_user_id', p_user_id,
    'deleted_email', v_target_email
  );
end;
$$;

revoke all on function public.dev_admin_delete_user(uuid,text) from public;
grant execute on function public.dev_admin_delete_user(uuid,text) to authenticated;

notify pgrst, 'reload schema';
