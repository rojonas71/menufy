# Menufy 1.6

Atualização geral mantendo:

- PWA instalável;
- mobile com bottom navigation;
- Aparência;
- QR Code;
- planos por WhatsApp;
- Admin Dev;
- Netlify + GitHub;
- Supabase.

## Admin Dev 1.6

O Admin Dev agora pode:

- pesquisar estabelecimentos;
- visualizar plano atual;
- trocar entre Starter, Pro e Premium;
- definir assinatura como Ativa, Teste, Pendente ou Cancelada;
- ativar/desativar o cardápio;
- abrir o cardápio público;
- acompanhar pedidos recentes.

## Atualizar Supabase

Se o Admin Dev já está instalado, execute apenas:

```text
supabase/migrations/005_business_plans.sql
```

## Publicar

```bash
npm run build
git add .
git commit -m "Atualiza Menufy 1.6"
git push
```
