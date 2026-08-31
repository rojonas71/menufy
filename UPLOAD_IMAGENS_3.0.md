# Menufy 3.0 — Enviar imagens

## Produtos
Agora o cadastro/edição possui:
- botão **Enviar imagem**;
- upload direto do computador ou celular;
- preview;
- trocar imagem;
- remover imagem;
- fallback opcional por URL;
- limite de 5 MB;
- JPG, PNG, WEBP e GIF.

## Aparência
Upload direto para:
- logo do estabelecimento;
- capa do cardápio;
- preview;
- troca;
- remoção.

## Supabase Storage
Bucket:
`menufy-media`

Estrutura:
- `<business_id>/products/...`
- `<business_id>/branding/...`

As policies permitem upload e exclusão somente para:
- proprietário do estabelecimento;
- membro autorizado;
- Admin Dev.

A leitura é pública para que o cardápio consiga carregar as imagens.

## Migration obrigatória
Execute:
`supabase/migrations/011_storage_images.sql`
