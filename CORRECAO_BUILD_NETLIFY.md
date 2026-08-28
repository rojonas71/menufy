# Correção do build Netlify

Foram corrigidos os erros:

- TS18047: `supabase` possivelmente `null`
- TS2339: `secondary_color` ausente em `Business`
- TS5096: `allowImportingTsExtensions` sem `noEmit`
- fallback SPA do Netlify para React Router

## Atualizar o GitHub

Substitua os arquivos do repositório por esta versão e rode:

```bash
npm install
npm run build
git add .
git commit -m "Corrige build TypeScript e Netlify"
git push
```

## Variáveis no Netlify

Configure em Environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Não envie `.env` ou `.env.local` para o GitHub.
