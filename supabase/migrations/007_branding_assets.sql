-- ============================================================
-- MENUFY - Logo e imagem de capa com Supabase Storage
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menufy-assets',
  'menufy-assets',
  true,
  6291456,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read menufy assets" on storage.objects;
create policy "public read menufy assets"
on storage.objects
for select
using (bucket_id = 'menufy-assets');

drop policy if exists "authenticated upload own menufy assets" on storage.objects;
create policy "authenticated upload own menufy assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'menufy-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "authenticated update own menufy assets" on storage.objects;
create policy "authenticated update own menufy assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'menufy-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'menufy-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "authenticated delete own menufy assets" on storage.objects;
create policy "authenticated delete own menufy assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'menufy-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';
