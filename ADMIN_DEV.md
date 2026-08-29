# Admin Dev — Menufy

Admin autorizado:

```text
rojonas71@gmail.com
```

## Ativar no Supabase

Execute no SQL Editor:

```text
supabase/migrations/004_dev_admin.sql
```

Ou execute novamente o arquivo completo:

```text
supabase/000_SETUP_SUPABASE.sql
```

> Se o banco já estiver configurado, prefira executar somente `004_dev_admin.sql`.

## Como acessar

1. O usuário precisa existir no Supabase Auth com o email autorizado.
2. Faça login normalmente.
3. O menu `Admin Dev` aparecerá automaticamente.
4. Acesse:

```text
/dev
```

## Segurança

O acesso não depende apenas do email no frontend.

O banco usa:

- tabela `dev_admins`;
- `auth.uid()`;
- função `is_dev_admin()`;
- políticas RLS específicas.

O Admin Dev pode acessar globalmente:

- estabelecimentos;
- membros;
- categorias;
- produtos;
- pedidos;
- itens dos pedidos.

Nunca use `service_role` no frontend.
