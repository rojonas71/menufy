# Recuperação de senha usando o link principal

Domínio:

```text
https://menufy26.netlify.app/
```

## Comportamento

Acesso normal ao domínio:
- mostra a landing page normalmente.

Acesso vindo do email de recuperação:
- o Supabase retorna para o mesmo domínio;
- o Menufy detecta `type=recovery` / token de recuperação;
- a landing é substituída automaticamente pela tela **Criar nova senha**;
- após alterar a senha, o usuário segue para o painel.

## Supabase

Authentication > URL Configuration

### Site URL
```text
https://menufy26.netlify.app/
```

### Redirect URLs
Adicione:
```text
https://menufy26.netlify.app/
```

Pode manter também:
```text
https://menufy26.netlify.app/redefinir-senha
```

para compatibilidade.
