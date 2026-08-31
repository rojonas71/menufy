# Menufy 2.3.1 — Excluir estabelecimento

A Administração Global agora possui exclusão protegida na página de detalhes.

Fluxo: confirmação inicial → digitar exatamente o nome → exclusão permanente.

A ação registra auditoria antes da exclusão e exige policy RLS específica.

Execute no Supabase: `supabase/migrations/008_business_delete_admin.sql`.

A migration não força ON DELETE CASCADE em pedidos/histórico. Se alguma foreign key bloquear, o painel informa o erro para evitar perda acidental de histórico.
