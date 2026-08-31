# Menufy 2.8 — Login Pro

## Login
- visual premium dividido desktop/mobile;
- aba Entrar e Criar conta;
- mostrar/ocultar senha;
- lembrar email localmente;
- mensagens amigáveis;
- detecção de sessão existente;
- redirecionamento para dashboard ou onboarding;
- link Esqueci minha senha;
- feedback de email confirmado;
- feedback de senha redefinida.

## Cadastro
- nome;
- email;
- senha;
- confirmação;
- indicador de força da senha;
- regras de segurança;
- email de confirmação;
- redirect para `/login?confirmed=1`;
- tratamento de conta já cadastrada.

## Recuperação
- tela premium;
- tratamento de rate limit;
- tratamento de erro de envio;
- cooldown visual de 60 segundos;
- orientação sobre spam;
- redefinição de senha com regras fortes;
- retorno automático ao login após sucesso.

## Supabase
Em Authentication > URL Configuration, mantenha:

Site URL:
`https://menufy26.netlify.app/`

Redirect URLs:
`https://menufy26.netlify.app/`
`https://menufy26.netlify.app/login`
`https://menufy26.netlify.app/login?confirmed=1`

Para desenvolvimento local, adicione seu endereço Vite separadamente.
