# Planos pelo WhatsApp

Os botões dos planos agora abrem o WhatsApp com uma mensagem pronta contendo:

- plano escolhido;
- período mensal ou anual;
- valor;
- pedido de ativação do cardápio.

## Configurar o número no Netlify

No Netlify, vá em:

`Project configuration > Environment variables`

Adicione:

```text
VITE_SALES_WHATSAPP
```

Valor no formato:

```text
5517999999999
```

Use apenas números:

- `55` = Brasil
- `17` = DDD
- restante = número do WhatsApp

Depois faça um novo deploy.

## Comportamento sem variável

Se `VITE_SALES_WHATSAPP` não estiver configurada, o WhatsApp ainda abre com a mensagem pronta e o usuário escolhe para quem enviar.

## Publicar

```bash
npm run build
git add .
git commit -m "Adiciona contratação de planos pelo WhatsApp"
git push
```
