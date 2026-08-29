# Menufy 1.8 — Logo e imagem de capa

## Novidades
- upload real de logo pelo painel;
- upload real de imagem de capa pelo painel;
- bucket público `menufy-assets` no Supabase Storage;
- políticas de segurança para cada usuário enviar apenas seus próprios arquivos;
- remover logo/capa com um clique;
- prévia visual da marca;
- suporte a URL manual da logo e da capa;
- onboarding com campos opcionais de logo e capa.

## Onde usar
No painel do estabelecimento:

```text
/dashboard/aparencia
```

## No Supabase
Execute:

```text
supabase/migrations/007_branding_assets.sql
```

Se ainda não executou as migrations anteriores do Admin Dev:

```text
004_dev_admin.sql
005_business_plans.sql
006_global_admin.sql
007_branding_assets.sql
```

## Formatos aceitos
- PNG
- JPG
- WEBP
- SVG

## Limites
- Logo: até 3 MB
- Capa: até 6 MB

## Publicar
```bash
npm run build
git add .
git commit -m "Atualiza logo e imagem de capa 1.8"
git push
```
