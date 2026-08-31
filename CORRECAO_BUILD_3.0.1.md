# Menufy 3.0.1 — Correção de build

Correções aplicadas em `AppearancePage.tsx`:

- removido import duplicado de `Upload`;
- removido código duplicado de upload de logo/capa;
- removidas referências inválidas a `businessId`;
- mantido o fluxo já existente de branding usando `business.id`;
- upload de imagens de produtos continua usando `menufy-media`.

A migration `011_storage_images.sql` continua necessária para o upload das imagens de produtos.
