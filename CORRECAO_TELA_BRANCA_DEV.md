# Correção da tela branca em /dev

A versão 1.5.4 adiciona:

- rota `/dev` explicitamente registrada;
- página 404 para rotas inexistentes;
- Error Boundary para evitar tela branca em erros React;
- mensagem específica quando `dev_admins` não existe no Supabase;
- tela de recuperação para Admin Dev.

## 1. Confirme no GitHub

Abra:

```text
src/App.tsx
```

e confirme que existe:

```tsx
<Route path="/dev" element={<DevAdminPage />} />
```

Se não existir, o Netlify ainda está usando uma versão anterior.

## 2. Atualize o GitHub

```bash
git add .
git commit -m "Corrige tela branca do Admin Dev"
git push
```

## 3. No Netlify

Aguarde o deploy terminar com status `Published`.

Depois use:

```text
https://SEU-SITE.netlify.app/dev
```

Faça um hard refresh:

```text
Ctrl + Shift + R
```

## 4. Ative o Admin Dev no Supabase

No SQL Editor execute:

```text
supabase/migrations/004_dev_admin.sql
```

Depois faça login com o usuário autorizado.
