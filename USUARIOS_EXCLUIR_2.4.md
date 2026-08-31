# Menufy 2.4 — Excluir usuários da plataforma

A aba **Administração Global > Usuários** agora permite excluir contas com segurança.

## Proteções
- somente Admin Dev pode executar;
- Admin Dev não pode excluir a própria conta;
- exige digitar exatamente o email do usuário;
- usuário com estabelecimento próprio não pode ser excluído;
- primeiro exclua ou transfira os estabelecimentos;
- exclusão ocorre diretamente no Supabase Auth por RPC SECURITY DEFINER;
- nenhuma `service_role` é exposta no frontend;
- auditoria é registrada antes da exclusão.

## Migration
Execute:
`supabase/migrations/009_dev_admin_delete_user.sql`

## Interface
Cada usuário possui botão **Excluir**. A própria conta administrativa mostra
**Sua conta • Admin Dev** no lugar do botão de exclusão.
