# Integração — Mapa de Documentos Legais Larsana Care

Documento de referência para o mapeamento entre peças jurídicas (DOCX/PDF), tipos `legal_term_type`, fluxos do app e tabelas de auditoria.

## Versão base

- **Mapa:** PDF v1.0 (Ago/2026)
- **Conteúdo seed:** DOCX em `DOC PP/` e `DOC Paciente/` → migration `20260903130000_legal_documents_seed_v1.sql`
- **Schema:** migration `20260903120000_legal_documents_foundation.sql`

## Mapeamento tipo → arquivo → fluxo

| Tipo DB | Perfil | Fluxo / tela | Aceite |
|---------|--------|--------------|--------|
| `TERMO_USO_PP` / `DIRETRIZES_PP` | pp | Credenciamento → Termos | express |
| `LGPD_PP` | pp | Credenciamento → Termos | express |
| `ANEXO_III_CATEGORIAS_PP` | pp | Credenciamento → Categorias | express |
| `ANEXO_IV_SIGILO_PP` | pp | Credenciamento → Sigilo | express + gate prontuário |
| `ANEXO_I_COMERCIAL_PP` | pp | Credenciamento → Regras + snapshot demanda | awareness |
| `ANEXO_II_OPERACIONAL_PP` | pp | Credenciamento → Regras | awareness |
| Contrato LRS-PROF | pp | Tabela `contracts` | express (etapa Contrato) |
| `TERMO_ADESAO` | paciente | Onboarding | express |
| `LGPD` | paciente | Onboarding / solicitação | express |
| `AVISO_DADOS_SAUDE` | paciente | Onboarding | awareness |
| `ANEXO_I_COMERCIAL_PACIENTE` | paciente | Aceite por ciclo (snapshot valores) | express |
| `ANEXO_II_CANCELAMENTO_PACIENTE` | paciente | Aceite por ciclo + cancelamento | awareness |
| `TCLE_FISIO` / `TERMO_CONSENTIMENTO` | paciente | Pré-atendimento / solicitação | express |
| `AUTORIZACAO_FAMILIAR` | paciente | Fluxo familiar (RPC `record_patient_representation`) | express |
| `REPRESENTACAO_LEGAL` | paciente | Menor/incapaz | express |
| `POLITICA_COOKIES` | publico | Banner web | awareness (placeholder) |

## RPCs principais

- `record_legal_acceptance` — grava aceite com IP/UA e contexto
- `get_required_legal_terms(profile, flow)` — pendências por fluxo
- `get_legal_documents_hub(profile)` — central Documentos/Termos
- `record_cycle_legal_acceptances(cycle_id)` — Anexo I/II com snapshot comercial
- `record_demand_commercial_snapshot(demand_id)` — Anexo I PP na demanda
- `assert_pp_can_access_clinical_data` — gate Anexo IV (trigger em `medical_records`)
- `has_pending_reaccept(profile)` — modal de reaceite no login

## Regenerar tipos

Após aplicar migrations no Supabase:

```bash
cd data/supabase && supabase gen types typescript --local > types/database.types.ts
```

Sincronizar cópias em `frontend/src/types/` e `packages/shared/`.

## Seed / nova versão

1. Colocar DOCX atualizado nas pastas `DOC PP/` ou `DOC Paciente/`
2. Rodar `python scripts/generate-legal-seed.py` (ajustar versão no script)
3. Publicar via admin (`TermsConfigPage`) com `is_current=true` e `requires_reaccept` conforme jurídico

## Bucket Storage

- `legal-documents` — PDFs publicados pelo admin (`storage_path` em `legal_terms`)
