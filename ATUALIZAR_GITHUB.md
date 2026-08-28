# Atualização Menufy 1.4.1

Repositório:
https://github.com/rojonas71/menufy

## Alterações desta atualização

- GitHub Actions corrigido para funcionar sem `package-lock.json`;
- build usando Node.js 20;
- build recebe variáveis Supabase via GitHub Secrets;
- `netlify.toml` reforçado para SPA/PWA;
- redirect de todas as rotas para `index.html`;
- cache correto para service worker;
- cache longo para assets versionados.

## Enviar para o GitHub

Dentro da pasta:

```bash
git add .
git commit -m "fix: prepara Menufy 1.4.1 para GitHub Actions e Netlify"
git push origin main
```

## Secrets do GitHub

GitHub → Settings → Secrets and variables → Actions → New repository secret

Crie:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Variáveis do Netlify

Netlify → Site configuration → Environment variables

Crie as mesmas variáveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Depois:

Deploys → Trigger deploy → Deploy site
