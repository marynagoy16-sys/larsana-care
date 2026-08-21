# Fase 0 — Checklist de alinhamento (transcrição + PDFs + código)

**Data:** 11/08/2026 · **Atualizado:** 18/08/2026 (gaps transcrição 17/08)
**Fontes:** `Alinhamento_Larsana_Care_Transcricao.md` · `Transcricao_Larsana_Care_Alinhamento_2026-06-30.md` · PDFs Marina · codebase

Legenda: ✅ feito · ⚠️ parcial · ❌ pendente · 🔍 decisão externa

---

## A. Prioridades estratégicas (03/08/2026)

| Item | Status | Evidência / nota |
|------|--------|------------------|
| Lançamento app **paciente** nas lojas | ⚠️ | `eas.json` adicionado; submit store pendente |
| PP em validação paralela | ✅ | UX review 13/08 implementada (Minha jornada, agenda 5–22h, wizard agendamento) |
| Identidade visual (logo, paleta) | ✅ | Commit `8123656` — `DESIGN_SYSTEM.md` v6 |
| Academy LMS | ✅ | `docs/ACADEMY.md`, rotas admin/PP/paciente |
| Academy vendas Asaas | ❌ | Track Elias; sem checkout no código |
| Assinatura evoluções CREFITO | 🔍 | Spike: `SPIKE_ASSINATURA_DIGITAL.md` |

---

## B. App Profissional Parceiro (mobile)

| Requisito transcrição | Status | Arquivo / gap |
|----------------------|--------|---------------|
| Nav: Início · Agenda · **Demandas (centro)** · Academy · Conta | ✅ | `_layout.tsx`, `navigation.ts` |
| Minha **jornada** (não evolução) | ✅ | `PPEvolucaoPage`, mobile `minha-evolucao.tsx` |
| Cartão de visita oculto | ✅ | Removido de Conta/nav |
| Recusa demanda sem motivo | ✅ | `PPDemandDetailPage`, mobile `[id].tsx` |
| Gate credenciamento no aceite | ✅ | Modal redirect credenciamento |
| Agenda semanal 5h–22h + 1º nome | ✅ | `agendaTimeline.ts`, `AgendaWeekSessionBlock` |
| Evoluir terapia (copy) | ✅ | Agenda + detalhe sessão |
| Drag remarcar + notify paciente | ✅ | `AgendaWeekTimeline`, RPC `pp_reschedule_session` |
| Wizard pós-aceite demanda | ✅ | `PPDemandSchedulePage`, migration scheduling |
| Prontuário por ciclos (desc) | ✅ | `PPPatientProntuarioSection` |
| Repasses UX padronizado | ✅ | `PPRepassesPage` |
| Demandas: aceitar/recusa | ✅ | `demandas.tsx`, `[id].tsx` |
| Mapa demandas PP | ✅ | `DemandMap.tsx` |

---

## C. App Paciente (mobile) — prioridade go-live

| Requisito transcrição | Status | Arquivo / gap |
|----------------------|--------|---------------|
| LarsanaPill destaque (FAB centro) | ✅ | `(tabs)/_layout.tsx` |
| Tab "Solicitar atendimento" | ✅ | `solicitar.tsx` (+ tab Tratamento mantida) |
| Documentos dentro de Conta | ✅ | `conta.tsx` |
| Pagar como ação (não tab) | ✅ | Conta + CTAs |
| Mapa SVG "procurando PP" | ✅ | `CoverageMapIllustration.tsx` |
| "Estamos chegando" sem cobertura | ✅ | `PacienteSolicitarPage.tsx` |
| Botão "Desejo iniciar tratamento" / waitlist | ✅ | RPC `patient_join_waitlist` |
| Timeline solicitação (Correios) | ⚠️ | `ServiceRequestTimeline.tsx` enriquecida |
| Confirmação horário pelo paciente | ✅ | `PacienteAgendamentoPage`, RPC confirm/reject |
| Cadastro / primeiro acesso | ⚠️ | `/cadastro` web; vínculo admin ainda necessário |
| Aceite legal funcional | ⚠️ | `PacienteAceitePage` reescrita; gate global pendente |
| LarsanaPill conteúdo PHIL | ✅ | `larsanapill/` |

---

## D. Admin / Web

| Requisito | Status | Nota |
|-----------|--------|------|
| Revisão admin pacientes | ⚠️ | Maduro; revisão contínua |
| Sessões + criação ciclos | ✅ | `CycleDetailPage.tsx` |
| Assinatura textual evolução | ⚠️ | `RecordSignature` — não ICP |
| Regiões A/B/C | ✅ | Bug `regions.map` corrigido |
| Atalho prontuário na lista pacientes | ✅ | Transcrição 30/06 confirmada |
| "Nível confirmado" (não "proposto") | ⚠️ | `AssessmentDetailView` ok; `AssessmentProposalFields` ainda "sugerido/proposto" |
| Fila lista de espera admin | ✅ | `AdminWaitlistPage` — `/admin/lista-espera` |

---

## E. PDF — Categorias técnicas PP

Fonte: `cadastro_categorias_tecnicas_larsana_programador.pdf`

| Requisito PDF | Status | Evidência |
|---------------|--------|-----------|
| Multi-seleção categorias técnicas | ✅ | `CategoriasTecnicasStepForm.tsx` |
| Cardiorrespiratória exige habilitação | ✅ | `CARDIORRESPIRATORY_CATEGORY`, status enum |
| Upload docs habilitação cardio | ✅ | `CARDIO_HABILITATION_DOCUMENTS` |
| Filtro demandas cardio = só habilitados | 🔍 | Validar em `demands.ts` / matching |
| Status: não solicitado / em análise / habilitado / não habilitado / suspenso | ⚠️ | Confirmar enum no schema vs PDF |

---

## F. PDF — Regras financeiras (split, pausa, comissão v6)

Fonte: `regra_negocio_larsana_pagamento_split_retencao_pausas_v6_comissao.pdf`

| Requisito PDF | Status | Nota |
|---------------|--------|------|
| Pagamento antecipado antes do ciclo | ⚠️ | Schema ok; Asaas stub |
| Split PF 60/40 1º ciclo, 70/30 depois | ⚠️ | PRD Bronze 70%; validar alinhamento PF/PJ |
| Split PJ 70/30 1º, 80/20 depois | ⚠️ | Idem |
| Retenção quota PP até fim ciclo | ⚠️ | Lógica parcial em migrations |
| Pausa justificada → reembolso 100% saldo | ⚠️ | Confirmar edge cases |
| Pausa injustificada → 20% taxa operacional | ⚠️ | Transcrição 30/06: implementado |
| Fluxo 3 remarcações + confirmação | ❌ | Validar UI modais |
| Status ciclo/repasse/reembolso do PDF §13 | ⚠️ | Comparar enums DB |

> **Ação Fase 0:** auditoria dedicada financeira (Fase 4) — PDF **dentro do escopo** do produto, mas não bloqueia soft launch LarsanaPill + waitlist.

---

## G. Itens visuais Marina (PDF alterações + transcrição)

| Item | Status |
|------|--------|
| Logo e paleta oficiais | ✅ |
| Textos login ("Cuidado domiciliar…") | ✅ |
| Página inicial admin — detalhes Marina | 🔍 | Revisar PDF visual item a item |
| Home paciente — LarsanaPill vs tratamento | ⚠️ | FAB ok; tratamento ainda tab separada |

---

## G. Gaps transcrição 17/08/2026 (implementado)

| Item | Status | Evidência |
|------|--------|-----------|
| Gate credenciamento (não Academy) nas demandas PP | ✅ | `RequireCredentialingGate`, mobile `demandas.tsx` |
| Paciente escolhe horário (timeline + agendamento) | ✅ | `ServiceRequestTimeline`, `PacienteAgendamentoPage`, mobile `agendamento.tsx` |
| Demandas recusadas somem da lista | ✅ | `listOpenForPp` web + mobile |
| Km/repasse na demanda | ✅ | `PPDemandsPage`, geocoding endereço |
| GPS do PP no mapa/ranking | ✅ | `ppLocation`, `usePpDistanceOrigin`, migration live location |
| Proposta 1–5x/semana + repasse estimado | ✅ | `assessmentProposal`, `AssessmentProposalFields`, `pp_finalize_assessment` |
| Admin só se nível alterado | ✅ | RPC + `modulePages` |
| Alumínio 60% repasse | ✅ | `ppPoints`, `pp_patente_tiers`, admin config |
| Prazo evolução 7 dias | ✅ | `ppEvolutions`, alertas DB |
| Confirmação drag remarcar | ✅ | `PPAgendaPage` AlertDialog |
| Importação CSV pacientes/PPs | ✅ | `/admin/importacao/*`, RPC `bulk_import_*` |
| Asaas create-charge inicial | ✅ | Edge function + `ASAAS_API_KEY` |
| Formulário solicitação stepper + INDIFERENTE | ✅ | `ServiceRequestForm`, enum migration |
| NPS pós-sessão | ✅ | trigger DB + `PacienteNpsPage` |
| NF dupla pagamentos | ✅ | `patient_receipts.receipt_kind`, UI pagamento |
| Paridade mobile remarc/SUB | ⚠️ | Janelas SUB na agenda mobile; drag remarcar web only |

---

## H. Documentação atualizada nesta Fase 0

| Documento | Alteração |
|-----------|-----------|
| [PRD.md](./PRD.md) | v1.2 — §4.3 V1.1, PRT-11/12, APP-PAC-11/12 |
| [PAGES.md](./PAGES.md) | v1.1 — nav PP e paciente alinhada |
| [SPIKE_ASSINATURA_DIGITAL.md](./SPIKE_ASSINATURA_DIGITAL.md) | Novo — opções e checklist |
| Este arquivo | Checklist consolidado |

---

## I. Ordem sugerida pós-Fase 0

1. **Fase 1** — App paciente (nav, solicitar, waitlist, mapa SVG)
2. **Fase 2** — App PP (nav, agenda semanal, prontuário ciclos)
3. **Fase 3** — Imutabilidade evoluções
4. **Fase 4** — Asaas produção + lojas + auditoria financeira PDF v6

---

*Atualizar este checklist a cada entrega de fase.*
