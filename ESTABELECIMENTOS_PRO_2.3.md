# Menufy 2.3 — Estabelecimentos Pro

## Administração Global > Estabelecimentos
- busca por estabelecimento, owner, slug, cidade e WhatsApp;
- filtros por plano, assinatura e online/offline;
- ordenação por mais recente, nome, pedidos ou volume;
- proprietário exibido no card;
- quantidade de pedidos;
- volume movimentado;
- exportação CSV enriquecida;
- botão Gerenciar.

## Gestão individual
Nova rota:
`/dev/estabelecimentos/:id`

Permite:
- editar nome, slug e descrição;
- WhatsApp, telefone e Instagram;
- endereço, cidade, estado e CEP;
- logo e capa;
- cores do cardápio;
- plano e assinatura;
- ativar/desativar estabelecimento;
- visualizar owner e último login;
- visualizar equipe;
- produtos e categorias;
- pedidos recentes, volume e ticket médio;
- auditoria ao salvar alterações.

Não exige nova migration além das migrations Admin já aplicadas (004–007).
