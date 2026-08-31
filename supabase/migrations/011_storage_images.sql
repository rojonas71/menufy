-- Menufy 3.0 - Upload de imagens no Supabase Storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menufy-media',
  'menufy-media',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_read_menufy_media" on storage.objects;
create policy "public_read_menufy_media"
on storage.objects
for select
to public
using (bucket_id = 'menufy-media');

drop policy if exists "business_users_upload_menufy_media" on storage.objects;
create policy "business_users_upload_menufy_media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'menufy-media'
  and exists (
    select 1
    from public.businesses b
    left join public.business_members bm
      on bm.business_id = b.id
      and bm.user_id = auth.uid()
    where b.id::text = (storage.foldername(name))[1]
      and (
        b.owner_id = auth.uid()
        or bm.user_id = auth.uid()
        or public.is_dev_admin()
      )
  )
);

drop policy if exists "business_users_update_menufy_media" on storage.objects;
create policy "business_users_update_menufy_media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'menufy-media'
  and exists (
    select 1
    from public.businesses b
    left join public.business_members bm
      on bm.business_id = b.id
      and bm.user_id = auth.uid()
    where b.id::text = (storage.foldername(name))[1]
      and (
        b.owner_id = auth.uid()
        or bm.user_id = auth.uid()
        or public.is_dev_admin()
      )
  )
)
with check (
  bucket_id = 'menufy-media'
  and exists (
    select 1
    from public.businesses b
    left join public.business_members bm
      on bm.business_id = b.id
      and bm.user_id = auth.uid()
    where b.id::text = (storage.foldername(name))[1]
      and (
        b.owner_id = auth.uid()
        or bm.user_id = auth.uid()
        or public.is_dev_admin()
      )
  )
);

drop policy if exists "business_users_delete_menufy_media" on storage.objects;
create policy "business_users_delete_menufy_media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'menufy-media'
  and exists (
    select 1
    from public.businesses b
    left join public.business_members bm
      on bm.business_id = b.id
      and bm.user_id = auth.uid()
    where b.id::text = (storage.foldername(name))[1]
      and (
        b.owner_id = auth.uid()
        or bm.user_id = auth.uid()
        or public.is_dev_admin()
      )
  )
);

notify pgrst, 'reload schema';
