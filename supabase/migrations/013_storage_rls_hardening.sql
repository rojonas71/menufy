-- Menufy 3.2 - Correção robusta de RLS para upload de imagens

create or replace function public.can_manage_business_assets(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.businesses b
        where b.id = p_business_id
          and b.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.business_members bm
        where bm.business_id = p_business_id
          and bm.user_id = auth.uid()
      )
      or public.is_dev_admin()
    );
$$;

revoke all on function public.can_manage_business_assets(uuid) from public;
grant execute on function public.can_manage_business_assets(uuid) to authenticated;

drop policy if exists "business_users_upload_menufy_media" on storage.objects;
create policy "business_users_upload_menufy_media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'menufy-media'
  and array_length(storage.foldername(name), 1) >= 2
  and public.can_manage_business_assets(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "business_users_update_menufy_media" on storage.objects;
create policy "business_users_update_menufy_media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'menufy-media'
  and array_length(storage.foldername(name), 1) >= 2
  and public.can_manage_business_assets(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'menufy-media'
  and array_length(storage.foldername(name), 1) >= 2
  and public.can_manage_business_assets(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "business_users_delete_menufy_media" on storage.objects;
create policy "business_users_delete_menufy_media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'menufy-media'
  and array_length(storage.foldername(name), 1) >= 2
  and public.can_manage_business_assets(((storage.foldername(name))[1])::uuid)
);

notify pgrst, 'reload schema';
