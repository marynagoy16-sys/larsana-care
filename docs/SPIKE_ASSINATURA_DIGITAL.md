# Spike — Assinatura digital de evoluções clínicas (CREFITO)

**Status:** Em análise (Fase 0)  
**Data:** 11/08/2026  
**Origem:** Alinhamento DELUMA 03/08/2026 · transcrição `Alinhamento_Larsana_Care_Transcricao.md`  
**Responsáveis sugeridos:** Marina (jurídico/fiscal) · Elias (validação técnica/jurídica) · Dev (implementação)

---

## 1. Contexto

Cada **terapia realizada** (evolução clínica no prontuário) precisa de assinatura válida para CREFITO/LGPD. Hoje o sistema registra **nome + CREFITO + timestamp** — identificação, não assinatura eletrônica avançada.

Requisitos de negócio (Marina):

- Evolução **lacrada** após emissão — Larsana não pode editar conteúdo do PP
- PP **não deve editar** livremente após emitir (discutido: sem edição ou janela de 24h; append com motivo como alternativa)
- Assinatura deve valer se paciente imprimir evolução para levar ao médico
- Fluxo aceitável: redirecionar ao Gov.br **se** for a opção mais segura para o time

---

## 2. Opções avaliadas

| Opção | Descrição | Prós | Contras | Custo estimado |
|-------|-----------|------|---------|----------------|
| **A — Gov.br redirect** | Após salvar evolução, redireciona ao Gov.br para assinar PDF | Gratuito; respaldo gov | UX ruim (CPF, senha, download manual); sem fila; instável | Baixo dev |
| **B — Certificado Larsana (CNPJ)** | Plataforma assina com certificado DELUMA; PP informa CPF/CREFITO | UX in-app | Validade jurídica incerta se PP não tem certificado próprio; risco judicial | Certificado ~R$120/ano + dev alto |
| **C — Certificado por PP (e-CPF A1/A3)** | Cada PP sobe certificado ICP-Brasil (modelo ClinicDocs) | Assinatura vinculada ao profissional | Custo e fricção para cada PP (~R$120+/ano); abandono | Médio dev + ops |
| **D — Terceiro (Autentique / similar)** | API de assinatura eletrônica avançada | Trilha de auditoria pronta; menos dev que ICP próprio | Custo recorrente; validar aceitação na área saúde | Médio dev + SaaS |
| **E — Fase 1 interna (sem ICP)** | Imutabilidade + hash + trilha + consentimento explícito | Rápido; desbloqueia go-live | **Não** substitui assinatura ICP para auditoria CREFITO plena | Baixo dev |

**Decisão Fase 0:** implementar **E** no V1.1 (imutabilidade) e decidir A/C/D para **V1.2** após validação jurídica.

---

## 3. Checklist jurídico e técnico (Elias — reunião 03/08)

Para qualquer opção que não seja Gov.br puro, o sistema deve demonstrar:

| # | Requisito | Implementável hoje? | Notas |
|---|-----------|---------------------|-------|
| 1 | Identificação do fisioterapeuta (nome, CPF, CREFITO) | Sim | Já no insert de `medical_records` |
| 2 | Autenticação do profissional no momento da assinatura | Parcial | Login e-mail/senha; considerar 2FA / confirmação explícita |
| 3 | Consentimento e intenção de assinar | Não | Checkbox + modal “Assino esta evolução” antes de finalizar |
| 4 | Data e hora confiáveis | Sim | `recorded_at`, server timestamp |
| 5 | Integridade do documento (hash) | Não | SHA-256 do conteúdo + metadados no finalize |
| 6 | Impossibilidade de alteração sem evidência | Parcial | RLS + trigger; falta `locked_at` / status |
| 7 | Trilha de auditoria | Parcial | `medical_record_versions` + `medical_record_access_log` existem |
| 8 | Vínculo inequívoco profissional ↔ assinatura | Parcial | Depende da opção de certificado |

---

## 4. Recomendação técnica por fases

### V1.1 (não bloqueia go-live paciente)

1. Campos: `signature_status` (`draft` | `finalized`), `finalized_at`, `content_hash`
2. UI PP: botão **“Finalizar e assinar evolução”** → lock permanente
3. Política: admin/gestão **read-only** no `content_richtext` após finalized
4. Append opcional: nova entrada em `medical_record_versions` com `append_reason` (decidir com Marina se permite ou bloqueio total)
5. Export PDF: incluir bloco “Assinado digitalmente por [nome] CREFITO [nº] em [data]” + hash

### V1.2 (pós-spike jurídico)

Implementar integração escolhida (A, C ou D) **antes** de exigir assinatura em produção para todos os PPs.

---

## 5. Perguntas abertas para Marina / contabilidade

- [ ] Assinatura via certificado **CNPJ DELUMA** cobre evoluções de PFs parceiros (contrato prestação de serviço)?
- [ ] Contador validou emissão de NF como intermediação (Marina mencionou reunião fiscal)?
- [ ] PP deve poder **editar** evolução em até 24h ou **nunca** após finalizar?
- [ ] Append com motivo é aceitável clinicamente/juridicamente?

---

## 6. Referências

- PRD §4.3 · PRT-11 · PRT-12 — [PRD.md](./PRD.md)
- Transcrição 03/08 — assinatura e imutabilidade (~00:05–00:45)
- MP 2.200-2 / Lei 14.063 — assinatura eletrônica avançada
- ICP-Brasil e-CPF A1/A3 — exigência mencionada para prontuário eletrônico em saúde

---

## 7. Próximo passo

| Ação | Owner | Prazo sugerido |
|------|-------|----------------|
| Responder checklist §5 | Marina + advogado | Antes de V1.2 |
| Cotar Autentique vs certificado CNPJ | Marina | Em andamento |
| Implementar imutabilidade V1.1 | Dev | Fase 3 do roadmap |
| POC Gov.br redirect (1 evolução) | Dev | Opcional pós-resposta jurídica |
