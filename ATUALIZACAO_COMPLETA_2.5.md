# Menufy 2.5 — Atualização Completa

## Incluído
- Landing profissional sem “Planos simples” públicos;
- autenticação Supabase;
- recuperação de senha no mesmo domínio;
- painel responsivo/PWA;
- categorias e produtos;
- aparência, logo, capa e cores;
- QR Code;
- pedidos em tempo real e alteração de status;
- Administração Global;
- métricas globais;
- estabelecimentos com detalhes e edição completa;
- exclusão permanente de estabelecimento com confirmação em 2 etapas;
- usuários da plataforma com exclusão segura;
- bloqueio para não excluir o próprio Admin Dev;
- configurações globais;
- auditoria;
- exportação CSV;
- RLS e RPCs administrativas.

## Migrations
Execute nesta ordem:

001_initial_schema.sql
002_realtime.sql
003_admin_crud_policies.sql
004_dev_admin.sql
005_business_plans.sql
006_global_admin.sql
007_advanced_admin.sql
007_branding_assets.sql
008_business_delete_admin.sql
009_dev_admin_delete_user.sql

## Produção
Use o projeto Git correto e rode:

npm install
npm run build
git add .
git commit -m "Atualiza Menufy completo 2.5"
git push

## Supabase Auth
Site URL:
https://menufy26.netlify.app/

Redirect URL:
https://menufy26.netlify.app/
