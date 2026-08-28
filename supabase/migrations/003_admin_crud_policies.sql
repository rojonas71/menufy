-- Menufy - políticas para CRUD do painel administrativo

drop policy if exists "owners delete categories" on public.categories;
create policy "owners delete categories"
on public.categories for delete
to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = categories.business_id
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.business_members bm
    where bm.business_id = categories.business_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner','manager')
  )
);

drop policy if exists "owners delete products" on public.products;
create policy "owners delete products"
on public.products for delete
to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = products.business_id
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.business_members bm
    where bm.business_id = products.business_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner','manager')
  )
);

NOTIFY pgrst, 'reload schema';
