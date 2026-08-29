# Menufy — Administração Global 1.7

## Visão geral
- total de estabelecimentos;
- ativos/inativos;
- owners;
- pedidos hoje;
- pedidos 7 e 30 dias;
- volume total;
- volume últimos 30 dias;
- ticket médio;
- distribuição Starter / Pro / Premium;
- status das assinaturas.

## Estabelecimentos
- busca;
- filtro por plano;
- filtro por assinatura;
- alterar plano;
- alterar assinatura;
- ativar/desativar cardápio;
- abrir cardápio;
- exportar CSV.

## Pedidos
- últimos 500 pedidos globais;
- busca;
- filtro por status;
- alterar status;
- visualizar cliente/telefone/estabelecimento;
- exportar CSV.

## Usuários
- email;
- UUID;
- data de cadastro;
- último login;
- quantidade de estabelecimentos;
- busca;
- exportar CSV.

## Segurança
As funções RPC:
- `dev_admin_metrics`
- `dev_admin_orders`
- `dev_admin_users`

validam `is_dev_admin()` antes de devolver dados.

## Atualizar Supabase

Execute:

```text
supabase/migrations/006_global_admin.sql
```

Se ainda não executou as migrations anteriores do Admin:

```text
004_dev_admin.sql
005_business_plans.sql
006_global_admin.sql
```

## Publicar

```bash
npm run build
git add .
git commit -m "Atualiza Administração global 1.7"
git push
```
