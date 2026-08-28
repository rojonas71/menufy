# Menufy — Cardápio Digital

Projeto real de cardápio digital SaaS com React + TypeScript + Vite + Supabase.

## Sem modo demo

Esta versão não possui dados fictícios, fallback local, pedidos falsos ou estabelecimento fixo.

Tudo é carregado diretamente do Supabase.

## Recursos

- Landing page
- Login e cadastro
- Dashboard autenticado
- Cardápio público por slug
- Categorias
- Produtos
- Carrinho
- Checkout
- Pedido salvo no Supabase
- Envio do pedido pelo WhatsApp
- Supabase Realtime
- Atualização ao vivo de produtos, categorias e pedidos
- RLS
- Layout responsivo

## Instalação

```bash
npm install
npm run dev
```

## Supabase

O projeto está configurado com:

```env
VITE_SUPABASE_URL=https://scvogzbazqaworztdrvr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_vSL6VGJ9AK4NaxxmsmsxEA_5RzekCZV
```

No Supabase SQL Editor, execute:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_realtime.sql
```

Não existe `seed.sql` nesta versão.

## Criar o primeiro estabelecimento

Depois de criar uma conta pelo aplicativo, obtenha o UUID do usuário em:

Supabase → Authentication → Users

Depois crie o estabelecimento no SQL Editor:

```sql
insert into public.businesses (
  owner_id,
  name,
  slug,
  description,
  whatsapp,
  city,
  state,
  is_active
)
values (
  'UUID_DO_USUARIO',
  'Nome do Estabelecimento',
  'meu-restaurante',
  'Descrição do estabelecimento',
  '5517999999999',
  'Barretos',
  'SP',
  true
);
```

Depois crie uma categoria:

```sql
insert into public.categories (
  business_id,
  name,
  sort_order,
  is_active
)
values (
  'UUID_DA_EMPRESA',
  'Hambúrgueres',
  1,
  true
);
```

Depois crie um produto:

```sql
insert into public.products (
  business_id,
  category_id,
  name,
  description,
  price,
  is_active,
  is_featured,
  sort_order
)
values (
  'UUID_DA_EMPRESA',
  'UUID_DA_CATEGORIA',
  'X-Bacon',
  'Pão, hambúrguer, queijo e bacon.',
  29.90,
  true,
  true,
  1
);
```

O cardápio ficará disponível em:

```text
http://localhost:5173/menu/meu-restaurante
```

## Build

```bash
npm run build
```

## Segurança

Nunca coloque `service_role` em `VITE_*`.

Use apenas a chave pública/publishable no frontend.


## Erro: Could not find the table public.businesses in the schema cache

Abra exatamente o projeto Supabase configurado no `.env.local`.

Depois vá em:

SQL Editor → New query

e execute TODO o arquivo:

```text
supabase/000_SETUP_SUPABASE.sql
```

No final, a consulta de verificação deve retornar os nomes das tabelas.

Se a tabela já existir mas o Data API ainda não reconhecê-la, execute:

```sql
NOTIFY pgrst, 'reload schema';
```


## Onboarding automático

Agora, depois do cadastro/login:

```text
/dashboard
```

Se o usuário ainda não tiver uma empresa, ele é enviado automaticamente para:

```text
/onboarding
```

O onboarding cria:

1. estabelecimento;
2. slug público;
3. primeira categoria;
4. primeiro produto.

Depois disso, o usuário entra no painel.

## Gerenciamento sem SQL

Categorias:

```text
/dashboard/categorias
```

Produtos:

```text
/dashboard/produtos
```

## Migration adicional

Se já executou as migrations anteriores, execute também:

```text
supabase/migrations/003_admin_crud_policies.sql
```

Se ainda não configurou o banco, basta executar:

```text
supabase/000_SETUP_SUPABASE.sql
```


## Aparência

Painel:

```text
/dashboard/aparencia
```

Permite alterar:

- logo;
- imagem de capa;
- cor principal;
- cor secundária;
- prévia antes de salvar.

As alterações são gravadas na tabela `businesses` e refletidas no cardápio público.

## QR Code

Painel:

```text
/dashboard/qrcode
```

Recursos:

- QR Code automático do link público;
- copiar link;
- baixar PNG;
- baixar SVG;
- usar em mesas, embalagens e redes sociais.

O projeto usa:

```bash
npm install qrcode.react
```


## PWA instalável

O Menufy agora pode ser instalado no celular e computador.

Recursos:

- Web App Manifest;
- Service Worker;
- atualização automática;
- modo standalone;
- ícones 192x192 e 512x512;
- Apple Touch Icon;
- botão de instalação;
- cache dos arquivos principais;
- cache de imagens públicas do Supabase;
- suporte a instalação no Android/Chrome/Edge;
- instruções de instalação no iPhone/iPad.

### Instalação

```bash
npm install
npm run dev
```

Para produção:

```bash
npm run build
```

PWA exige HTTPS fora do localhost. Vercel e Netlify fornecem HTTPS.
