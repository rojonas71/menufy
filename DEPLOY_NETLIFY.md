# Atualizar GitHub e publicar no Netlify

Repositório:

https://github.com/rojonas71/menufy

## 1. Substitua os arquivos locais pelo conteúdo desta pasta

Abra o terminal dentro da pasta do projeto.

## 2. Confirme o remote

```bash
git remote -v
```

Se ainda não existir:

```bash
git remote add origin https://github.com/rojonas71/menufy.git
```

Se estiver apontando para outro repositório:

```bash
git remote set-url origin https://github.com/rojonas71/menufy.git
```

## 3. Atualize o GitHub

```bash
git add .
git commit -m "feat: atualiza Menufy com Supabase, realtime, QR Code, aparência e PWA"
git branch -M main
git push -u origin main
```

Se o repositório remoto já tiver commits que não estão localmente:

```bash
git pull origin main --rebase
git push origin main
```

## 4. Netlify

No Netlify:

- Import from Git
- GitHub
- Repository: rojonas71/menufy
- Branch: main
- Build command: npm run build
- Publish directory: dist

O `netlify.toml` já contém essas configurações.

## 5. Variáveis no Netlify

Site configuration → Environment variables:

```env
VITE_SUPABASE_URL=https://scvogzbazqaworztdrvr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_vSL6VGJ9AK4NaxxmsmsxEA_5RzekCZV
```

Depois execute:

Deploys → Trigger deploy → Deploy site

## 6. Supabase

No Supabase → Authentication → URL Configuration:

Site URL:
https://SEU-SITE.netlify.app

Redirect URLs:
https://SEU-SITE.netlify.app/**
http://localhost:5173/**

## 7. Banco

Se ainda não executou a instalação:

Supabase → SQL Editor → execute:

```text
supabase/000_SETUP_SUPABASE.sql
```

## 8. Testes finais

Teste:

- cadastro;
- login;
- onboarding;
- criação do estabelecimento;
- categoria;
- produto;
- aparência;
- QR Code;
- cardápio público;
- carrinho;
- checkout;
- pedido no Supabase;
- WhatsApp;
- atualização realtime;
- instalação PWA.
