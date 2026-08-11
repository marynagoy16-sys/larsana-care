# Fase 0 — Checklist de alinhamento (transcrição + PDFs + código)

**Data:** 11/08/2026  
**Fontes:** `Alinhamento_Larsana_Care_Transcricao.md` · `Transcricao_Larsana_Care_Alinhamento_2026-06-30.md` · PDFs Marina · codebase

Legenda: ✅ feito · ⚠️ parcial · ❌ pendente · 🔍 decisão externa

---

## A. Prioridades estratégicas (03/08/2026)

| Item | Status | Evidência / nota |
|------|--------|------------------|
| Lançamento app **paciente** nas lojas | ❌ | PRD atualizado §4.3; build/store pendente |
| PP em validação paralela | ⚠️ | App PP funcional; UX não alinhada |
| Identidade visual (logo, paleta) | ✅ | Commit `8123656` — `DESIGN_SYSTEM.md` v6 |
| Academy LMS | ✅ | `docs/ACADEMY.md`, rotas admin/PP/paciente |
| Academy vendas Asaas | ❌ | Track Elias; sem checkout no código |
| Assinatura evoluções CREFITO | 🔍 | Spike: `SPIKE_ASSINATURA_DIGITAL.md` |

---

## B. App Profissional Parceiro (mobile)

| Requisito transcrição | Status | Arquivo / gap |
|----------------------|--------|---------------|
| Nav: Início · Agenda · **Demandas (centro)** · Repasses · Academy | ❌ | Atual: Evolução FAB central — `_layout.tsx` |
| Perfil fora da tab bar (menu ⋮) | ⚠️ | Perfil ainda é tab; drawer existe |
| Agenda **semanal** (não diária) | ❌ | `agenda/index.tsx` — só dia a dia |
| Sub-aba evoluções pendentes na agenda | ⚠️ | Tab Evolução separada; falta integrar na agenda |
| "Criar evolução" / "Evoluir terapia" | ⚠️ | Fluxo create existe; copy "sessão" |
| "Prontuário" em vez de "Ver paciente" | ❌ | `pacientes/[id].tsx` — resumo sem ciclos |
| Prontuário agrupado por ciclos (desc) | ❌ | Admin tem flat list; PP sem prontuário |
| Avaliação inicial destacada no prontuário | ❌ | — |
| Repasses UX intuitivo | ⚠️ | Lista básica em `repasses.tsx` |
| Credenciamento/perfil repaginado | ⚠️ | Fluxo existe; Marina pediu simplificação |
| Demandas: aceitar/recusa + alerta | ✅ | `demandas.tsx`, `[id].tsx` |
| Mapa demandas PP | ✅ | `DemandMap.tsx` |

---

## C. App Paciente (mobile) — prioridade go-live

| Requisito transcrição | Status | Arquivo / gap |
|----------------------|--------|---------------|
| LarsanaPill destaque (FAB centro) | ✅ | `(tabs)/_layout.tsx` |
| Tab "Solicitar atendimento" (não "Tratamento") | ❌ | Ainda `tratamento` tab |
| Documentos dentro de Conta | ❌ | Tab Docs separada |
| Pagar como ação (não tab) | ❌ | Tab Pagar separada |
| Mapa SVG "procurando PP" | ❌ | Não implementado |
| "Estamos chegando" sem cobertura | ❌ | Sem lógica regional no paciente |
| Botão "Desejo iniciar tratamento" | ❌ | Sem tabela waitlist |
| Timeline Correios da solicitação | ❌ | `PatientHomeJourney` = pós-cadastro |
| Timeline tratamento existente | ⚠️ | Parcial |
| LarsanaPill conteúdo PHIL | ✅ | `larsanapill/` |
| Responsividade mobile paciente web | ⚠️ | Eduardo citou ajustes pendentes |

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
| Fila lista de espera admin | ❌ | Rota planejada em `PAGES.md` |

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
