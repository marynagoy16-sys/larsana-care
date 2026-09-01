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

## 3. Chave Pix da conta recebedora

No painel Asaas da **DELUMA SSE LTDA**, cadastre e ative uma **chave Pix** na conta principal.
Sem chave Pix, o QR Code pode ser gerado, mas **vários bancos recusam o pagamento** com mensagem genérica de indisponibilidade.

Passos no Asaas:
1. Acesse **Pix → Minhas chaves**
2. Cadastre uma chave (EVP aleatória é suficiente)
3. Aguarde status **Ativa**
4. Gere uma **nova cobrança** no app (ou toque em **Gerar novo PIX**)

Após cadastrar a chave, cobranças antigas podem continuar falhando — sempre gere um PIX novo.

## 4. Diagnóstico rápido

Edge function `asaas-pix-health` (interno) consulta:
- chaves Pix ativas na conta
- status de uma cobrança Asaas (`payment_id`)

Sintomas quando falta chave Pix:
- QR Code e copia-e-cola aparecem normalmente
- Banco recusa na hora de autorizar (Nubank, Itaú, etc.)
- Payload começa com `pix.asaas.com/qr/cobv/...` (formato válido, mas recebedor não habilitado)

## 5. Subcontas PP

Após credenciamento, chamar edge function `create-asaas-subaccount` com `professional_id`.
Campo `asaas_wallet_id` também pode ser importado via CSV admin.

## 6. Fluxo de teste recomendado

1. Paciente solicita avaliação → paga taxa (`charge_kind = assessment_request`)
2. Webhook confirma → demanda aberta automaticamente
3. PP avalia → família aceita plano → cobrança ciclo com abatimento da avaliação
4. Pagamento ciclo → sessões geradas + alerta PP para agendar
5. Repasse via `transfer-wallet` após regras de retenção

## 7. Simulação em dev

Pacientes podem usar "Simular pagamento" na tela de cobrança quando Asaas não está ativo.
Em produção, desabilitar simulação para papéis não-staff (já restrito via RLS/RPC).
