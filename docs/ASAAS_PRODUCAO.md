# Asaas — ativação em produção

Checklist para go-live financeiro (Fase A4).

## 1. Variáveis de ambiente (Supabase Edge Functions)

No projeto Supabase (`kispjnlmklzfhxhtdyvm`), configure os secrets:

```bash
supabase secrets set ASAAS_API_KEY=<sua_api_key_producao>
supabase secrets set ASAAS_WEBHOOK_TOKEN=<token_aleatorio_forte>
supabase secrets set ASAAS_ENV=production
```

Remova ou deixe vazio `ASAAS_MOCK` / flags de simulação em produção.

## 2. Webhook Asaas

URL: `https://kispjnlmklzfhxhtdyvm.supabase.co/functions/v1/payment-webhook`

Eventos mínimos:

- `PAYMENT_RECEIVED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_OVERDUE`

Header/token conforme `validateAsaasWebhookToken` em `data/supabase/functions/_shared/asaas.ts`.

## 3. Subcontas PP

Após credenciamento, chamar edge function `create-asaas-subaccount` com `professional_id`.
Campo `asaas_wallet_id` também pode ser importado via CSV admin.

## 4. Fluxo de teste recomendado

1. Paciente solicita avaliação → paga taxa (`charge_kind = assessment_request`)
2. Webhook confirma → demanda aberta automaticamente
3. PP avalia → família aceita plano → cobrança ciclo com abatimento da avaliação
4. Pagamento ciclo → sessões geradas + alerta PP para agendar
5. Repasse via `transfer-wallet` após regras de retenção

## 5. Simulação em dev

Pacientes podem usar "Simular pagamento" na tela de cobrança quando Asaas não está ativo.
Em produção, desabilitar simulação para papéis não-staff (já restrito via RLS/RPC).
