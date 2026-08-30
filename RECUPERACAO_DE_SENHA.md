# Menufy — Recuperação de senha

## Novas rotas

```text
/esqueci-senha
/redefinir-senha
```

## Fluxo

1. Na tela `/login`, clique em **Esqueci minha senha**.
2. Informe o email.
3. O Supabase envia o link de recuperação.
4. O link volta para:
   `/redefinir-senha`
5. O usuário cria uma nova senha.
6. Após salvar, é redirecionado para `/dashboard`.

## Supabase

Em:

`Authentication > URL Configuration`

Configure o **Site URL** com o domínio do Netlify.

Exemplo:

```text
https://seu-site.netlify.app
```

Em **Redirect URLs**, adicione:

```text
https://seu-site.netlify.app/redefinir-senha
```

Se você usar domínio próprio, adicione também:

```text
https://seudominio.com/redefinir-senha
```

## Segurança

- recuperação usa `resetPasswordForEmail`;
- nova senha usa `updateUser`;
- senha mínima de 8 caracteres;
- confirmação de senha obrigatória;
- não revela se um email existe ou não na base.
