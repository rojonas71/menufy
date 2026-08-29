# WhatsApp comercial do Menufy

Número configurado:

```text
5517982265866
```

## Netlify

Abra:

`Project configuration > Environment variables`

Crie:

```text
VITE_SALES_WHATSAPP
```

Valor:

```text
5517982265866
```

Depois faça um novo deploy.

## Como funciona

O código usa primeiro a variável do Netlify:

```text
VITE_SALES_WHATSAPP
```

Se ela não estiver configurada, o Menufy usa automaticamente:

```text
5517982265866
```

Assim os botões **Contratar pelo WhatsApp** continuam funcionando mesmo sem a variável.

## Formato

O número está no padrão:

```text
55 17 982265866
```

- 55 = Brasil
- 17 = DDD
- 982265866 = número
