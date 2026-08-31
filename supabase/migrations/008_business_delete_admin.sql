-- Menufy 2.5 - Exclusão segura de estabelecimentos pelo Admin Dev

drop policy if exists "dev_admin_delete_businesses" on public.businesses;
create policy "dev_admin_delete_businesses"
on public.businesses
for delete
to authenticated
using (public.is_dev_admin());

notify pgrst, 'reload schema';
