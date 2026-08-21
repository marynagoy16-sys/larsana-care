# E-mail transacional (Supabase Auth)

Configuração para confirmação de e-mail e recuperação de senha (Fase F).

## Supabase Dashboard

1. **Authentication → Providers → Email**: habilitar confirmação de e-mail
2. **Project Settings → Auth → SMTP Settings**: configurar provedor

### Opções recomendadas

| Provedor | Uso |
|----------|-----|
| Brevo (Sendinblue) | SMTP transacional + boa entregabilidade BR |
| Google Workspace | `smtp.gmail.com` com app password |
| Resend | API/SMTP moderno |

## URLs de produção

- Site URL: `https://app.larsanacare.com.br`
- Redirect URLs: incluir `/login`, `/recuperar-senha`, callbacks mobile

## Templates

Personalizar e-mails em **Authentication → Email Templates** (confirmação, reset, magic link).

## Cron confirmação de sessão (12h)

Executar periodicamente (pg_cron ou Supabase scheduled function):

```sql
SELECT public.process_session_presence_reminders();
```

Recomendado: a cada 15–30 minutos.
