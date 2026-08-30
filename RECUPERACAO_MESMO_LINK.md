# Menufy 2.2 — Recuperação de senha no mesmo link

A recuperação inteira usa:

`/esqueci-senha`

## Fluxo

1. O usuário abre `/esqueci-senha`.
2. Digita o email.
3. O Supabase envia o email de recuperação.
4. O link enviado também retorna para `/esqueci-senha`.
5. Ao abrir o link, a página detecta `PASSWORD_RECOVERY`.
6. A interface troca automaticamente de "Digite seu email" para "Criar nova senha".
7. O usuário informa e confirma a nova senha.
8. Após sucesso, entra no dashboard.

## Supabase

Em Authentication > URL Configuration, adicione:

`https://SEU-SITE.netlify.app/esqueci-senha`

como Redirect URL.

A rota antiga `/redefinir-senha` fica somente por compatibilidade e redireciona para `/esqueci-senha`.
