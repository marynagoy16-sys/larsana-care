# Checklist de go-live — Larsana Care

Use este checklist antes do teste E2E de sexta-feira e da publicação nas lojas.

## Importação legada

- [ ] Rodar `node scripts/fix-patient-import-spreadsheet.mjs` na planilha de pacientes
- [ ] Rodar `node scripts/test-bulk-import-xlsx.mjs --dry-run` e revisar preview
- [ ] Importar via `/admin/importacao/pacientes` e `/admin/importacao/profissionais`
- [ ] Conferir relatório JSON em `scripts/test-bulk-import-xlsx-report.json` (<5% erro)
- [ ] Enviar convites Auth aos PPs que usarão o app

## Fluxo E2E (sexta-feira)

- [ ] Marina como PP credenciada + wallet Asaas
- [ ] Eduardo solicita + paga avaliação (R$1 em prod)
- [ ] Demanda aparece no mapa PP
- [ ] PP envia horários → paciente confirma inline em Solicitar
- [ ] Avaliação realizada → proposta de tratamento → pagamento ciclo
- [ ] Ciclo aparece na agenda PP

## Infra / produção

- [ ] Migration `20260831120000_go_live_import_chat_nps_nf.sql` aplicada no Supabase
- [ ] Site URL Supabase Auth: `https://app.larsanacare.com.br`
- [ ] `VITE_ENABLE_DEV_LOGIN=false` no build Docker prod
- [ ] Asaas produção: rodar `node scripts/test-asaas-prod-e2e.mjs` (avaliação + repasse + SUB)
- [ ] Termos legais publicados em `legal_terms`

## Produto

- [ ] Regiões Mauá + expansões com `patient_service_available = true`
- [ ] Taxa de avaliação visível em `/admin/config/precos`
- [ ] Chat Sara acessível em `/paciente/chat`
- [ ] NPS rolling 100 ativo (`pp_nps_score`)

## Lojas

- [ ] Build Capacitor prod (`npm run cap:sync`)
- [ ] Submit EAS Android + iOS ([docs/APP_STORES.md](APP_STORES.md))
