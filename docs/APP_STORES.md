# Publicação App Store / Play Store

Checklist operacional (Fase F). Submit depende de contas Apple/Google da Larsana.

## Pré-requisitos

- Domínio produção: `https://app.larsanacare.com.br`
- Supabase Auth URLs configuradas
- Ícones, splash e screenshots por loja
- Política de privacidade publicada (Marina)

## Expo EAS

Configuração em `mobile/apps/*/eas.json`.

```bash
cd mobile/apps/paciente
eas build --platform all --profile production
eas submit --platform all
```

Repetir para `mobile/apps/profissional`.

## Variáveis

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Paridade web ↔ mobile

Após build, validar:

- Solicitar avaliação (3 passos + PIX)
- Proposta com 3 planos dinâmicos
- PP: demandas, check-in, alerta nova demanda
- Remarcação paciente (web completo; mobile conforme última sprint)
