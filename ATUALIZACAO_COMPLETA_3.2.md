# Menufy 3.2 — Atualização Completa Consolidada

Esta versão reúne em um único projeto tudo que foi criado até aqui.

## Landing
- landing premium responsiva;
- sem seção pública "Planos simples";
- hero, recursos, como funciona, FAQ e CTA.

## Autenticação
- login premium;
- cadastro;
- mostrar/ocultar senha;
- força da senha;
- confirmação de email;
- recuperação e redefinição de senha.

## Painel do estabelecimento
### Visão geral
- pedidos de hoje;
- volume;
- ticket médio;
- finalizados;
- catálogo;
- ações rápidas;
- pedidos em tempo real.

### Categorias
- criar, editar, ativar, ocultar e ordenar;
- busca;
- quantidade de produtos;
- proteção de exclusão.

### Produtos
- cadastro e edição;
- categorias;
- preço normal e promocional;
- destaque;
- selo;
- tempo de preparo;
- esgotado;
- ativar/ocultar;
- exclusão;
- upload direto de imagem.

### Pedidos
- tempo real;
- filtros por período e status;
- busca;
- alteração de status;
- WhatsApp do cliente;
- subtotal, taxa e total;
- CSV.

### Aparência e operação
- logo e capa;
- cores e presets;
- aberto/fechado;
- entrega, retirada e consumo no local;
- taxa fixa de entrega;
- entrega grátis acima de valor configurável;
- pedido mínimo;
- prazo estimado.

### QR Code
- customização;
- copiar link;
- PNG/SVG;
- imprimir;
- compartilhar.

## Cardápio público
- busca;
- categorias;
- destaques;
- promoções;
- esgotado;
- tempo de preparo;
- modal do produto;
- quantidade;
- carrinho;
- checkout;
- entrega/retirada/local;
- taxa de entrega;
- frete grátis por valor mínimo;
- pedido mínimo;
- tempo real.

## Upload de imagens
Bucket: `menufy-media`

Pastas:
- `<business_id>/products/...`
- `<business_id>/branding/...`

A migration `013_storage_rls_hardening.sql` fortalece as policies e evita falhas de RLS quando o usuário autenticado é proprietário, membro autorizado ou Admin Dev.

## Administração Global
- métricas;
- estabelecimentos;
- usuários;
- pedidos;
- configurações;
- auditoria;
- exclusão segura de estabelecimento;
- exclusão segura de usuário.

## Migrations
Execute somente as que ainda não estiverem aplicadas:

1. `001_initial_schema.sql`
2. `002_realtime.sql`
3. `003_admin_crud_policies.sql`
4. `004_dev_admin.sql`
5. `005_business_plans.sql`
6. `006_global_admin.sql`
7. `007_advanced_admin.sql`
8. `007_branding_assets.sql`
9. `008_business_delete_admin.sql`
10. `009_dev_admin_delete_user.sql`
11. `010_menu_pro.sql`
12. `011_storage_images.sql`
13. `012_delivery_fee_pro.sql`
14. `013_storage_rls_hardening.sql`
