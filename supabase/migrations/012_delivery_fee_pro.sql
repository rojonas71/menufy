-- Menufy 3.1 - Taxa de entrega avançada

alter table public.businesses
  add column if not exists free_delivery_above numeric(10,2)
  check (free_delivery_above is null or free_delivery_above >= 0);

comment on column public.businesses.delivery_fee is 'Taxa fixa padrão de entrega do estabelecimento.';
comment on column public.businesses.free_delivery_above is 'Subtotal mínimo para liberar entrega grátis. NULL desativa.';

notify pgrst, 'reload schema';
