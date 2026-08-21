# Larsana Care — Relatório de Atualizações

**Destinatário:** Larsana Care (Marina e equipe)  
**Elaborado por:** Sagitta Digital  
**Data:** 15 de agosto de 2026  
**Versão do sistema:** ambiente web atualizado (imagem Docker publicada em 15/08/2026)

---

## Como gerar este documento em PDF

1. Abra este arquivo no Cursor/VS Code ou em qualquer visualizador Markdown.
2. Use **Markdown PDF** (extensão) ou **Print → Salvar como PDF** no preview.
3. Alternativa via navegador: copie o conteúdo renderizado ou abra no GitHub e use Imprimir (Ctrl+P) → **Salvar como PDF**.

---

## 1. Resumo executivo

Nas últimas semanas o ecossistema Larsana Care avançou em três frentes principais alinhadas às regras de negócio discutidas com a cliente:

1. **Remarcação de sessões e fluxo SUB** — antecedência mínima de **12 horas**, janela de **14 dias** para remarcar com o mesmo profissional, aceite da família antes de confirmar novo horário, taxa de **50%** em remarcações tardias com atestado e oferta de profissional substituto (SUB) quando o PP remarca com menos de 12h.
2. **Formulário de solicitação do paciente** — cadastro estruturado com origem da indicação (como conheceu a Larsana), termos legais (Contrato de Intermediação e Termo de Consentimento) e envio integrado ao fluxo de demanda.
3. **Experiência mobile e operacional** — melhorias na tela de repasses do PP, navegação inferior, mapa de demandas com distância e publicação da versão web em container Docker para homologação.

O **banco de dados em produção (Supabase)** já recebeu as migrations correspondentes. A **imagem web** foi compilada e publicada, pronta para deploy no ambiente `larsana.sagittadigital.com.br`.

---

## 2. Principais entregas deste ciclo (ago/2026)

### 2.1 Remarcação e SUB (regras V1)

| Regra acordada | Implementação |
|----------------|---------------|
| Antecedência mínima **12h** (antes 2h) | Configuração operacional + validação em cancelamentos e remarcações |
| Paciente remarca com **mesmo PP** em até **14 dias** | Dialog de remarcação no portal paciente + RPC dedicada |
| PP remarca com **≥12h** | Proposta de novo horário; paciente **aceita ou recusa** antes de confirmar |
| Paciente remarca com **menos de 12h** | Exige **atestado**; repõe sessão e registra cobrança de **50%** |
| PP remarca com **menos de 12h** | Oferta de **SUB**; se recusada, PP titular pode remarcar em 14 dias |
| Notificações | Tipos: remarcação pendente, oferta SUB, SUB confirmado/recusado |

**Onde testar (web):**

- **Paciente:** Início → Tratamento → detalhe do ciclo → **Remarcar sessão**; também em Agendamentos (aceite/recusa de proposta e SUB).
- **Profissional:** Agenda → arrastar sessão ou card de janela pós-recusa SUB.
- **Admin/Gestão:** Cancelamento de sessão exibe regra de **12h**.

### 2.2 Formulário de solicitação de atendimento (paciente)

- Campos: dados pessoais, período de preferência, hipótese diagnóstica, **como conheceu a Larsana**, aceite de termos.
- Termos legais versionados no banco: **Contrato de Intermediação** e **Termo de Consentimento**.
- Integração com fluxo existente: demanda + mapa de cobertura + lista de espera regional.

**Onde testar (web):** Portal Paciente → **Solicitar atendimento** (`/paciente/solicitar`).

### 2.3 Portal Profissional Parceiro (PP)

- **Indique um colega:** código único por PP (ex.: visível em Minha Evolução); **50 pontos** por indicação confirmada (máx. **3** na patente Alumínio), creditados quando o indicado **conclui o envio do credenciamento**.
- **Repasses (mobile):** filtros fixos no topo; lista rolável; layout alinhado ao restante do app.
- **Demandas:** distância calculada a partir do endereço do PP; mapa com centro inteligente.

### 2.4 Infraestrutura e deploy

- Migrations aplicadas no Supabase remoto (15/08/2026).
- Build de produção do frontend corrigido e **imagem Docker publicada:** `sagittadigital/larsana-care-frontend:latest`.
- Ambiente de homologação: **https://larsana.sagittadigital.com.br** (após deploy da stack).

---

## 3. O que já está funcional

Legenda: ✅ pronto para uso · ⚠️ funcional com ressalvas · ❌ não disponível

### 3.1 Visão geral por portal

| Área | Web | Mobile | Situação |
|------|:---:|:------:|----------|
| Admin / Gestão / Financeiro | ✅ | — | Operacional para cadastros, ciclos, demandas, credenciamento, regiões e preços |
| Portal Profissional (PP) | ✅ | ✅ | Agenda, demandas, jornada, credenciamento, evoluções, repasses, Academy, patentes |
| Portal Paciente | ✅ | ✅ | Solicitação, tratamento, proposta, agendamento, LarsanaPill |
| Pagamentos reais (Asaas produção) | ⚠️ | ⚠️ | Simulação/dev; integração produção pendente |
| Apps nas lojas (App Store / Play) | ❌ | ❌ | Builds locais ok; publicação pendente |

### 3.2 Fluxo comercial completo (quando dados de teste existem)

```
Cadastro → Solicitar atendimento (sem pagamento)
  → Demanda aberta → PP aceita → Avaliação → Proposta comercial
  → Família responde SIM → Gestão abre ciclo → Pagamento antecipado (simulado)
  → Sessões → Evoluções → Repasse pós-ciclo (com upload de NF)
```

### 3.3 Módulos estáveis (recomendados para demonstração)

| Módulo | Descrição |
|--------|-----------|
| Cadastro dual | Paciente ou Profissional Parceiro na mesma tela de cadastro |
| Credenciamento PP | Wizard self-service até envio para aprovação da gestão |
| Demandas + mapa | PP visualiza, aceita ou recusa; admin acompanha |
| Agenda PP | Grade 5h–22h, detalhe de sessão, remarcar (com novas regras) |
| Avaliação e proposta | PP avalia; família responde SIM/NÃO na web |
| Ciclos e sessões | Admin abre ciclo; sessões com status e evolução |
| LarsanaPill | Conteúdo PHIL e planos semanais |
| Academy | Trilhas M1–M5 com gates de credenciamento |
| Gamificação PP | Patentes, pontos, indicação de colega (validado em teste técnico) |
| Lista de espera | Paciente entra na fila; admin vê em `/admin/lista-espera` |
| Repasses PP | Lista, detalhe, envio de nota fiscal |

---

## 4. O que está parcial ou aguardando validação da cliente

| Item | Status | O que falta / observação |
|------|:------:|-------------------------|
| Remarcação/SUB mobile | ⚠️ | Regras novas implementadas na **web**; apps nativos ainda sem paridade |
| Timeline solicitação (estilo Correios) | ⚠️ | Existe, mas copy e etapas podem ser refinadas |
| Aceite legal (gate global paciente) | ⚠️ | Termos no formulário ok; bloqueio em todas as rotas a validar |
| Pagamento PIX/boleto (Asaas) | ⚠️ | Regra de negócio definida; produção não conectada |
| Pausas e encerramentos (PDF v6) | ⚠️ | Lógica no banco; casos de borda em validação com financeiro |
| Split PF/PJ + retenção 1º ciclo | ⚠️ | Migrations parciais; auditoria Fase 4 |
| Copy “nível confirmado” vs “proposto” | ⚠️ | Ajuste de texto em telas admin |
| Validação manual de atestado (remarcação) | ⚠️ | Upload previsto; fluxo de conferência pela gestão a definir |
| Matching SUB avançado | ⚠️ | Substituto básico; critérios região/categoria/ouro evoluíveis |
| Repasse avulso PPSUB | ✅ | Por sessão após check-out; % classe do substituto; sem NF |
| 3ª remarcação → pausa automática | ⚠️ | Regra documentada; automação completa pendente |

---

## 5. O que ainda não foi implementado

| Item | Prioridade sugerida | Impacto |
|------|---------------------|---------|
| Asaas em produção (cobrança + webhook) | Alta | Bloqueia receita real e pagamento antecipado |
| Publicação apps Paciente e PP nas lojas | Alta | Go-live mobile |
| Exportação contábil DELUMA | Média | Pós soft launch |
| Assinatura digital ICP (CREFITO) | Média | Spike técnico em andamento |
| App Gestão mobile | Baixa | Placeholder |
| Check-in GPS / cartão de visita PP | Baixa | P2 |
| Academy vendas (checkout Asaas) | Baixa | Track separado (Elias) |
| Backend API dedicada | Baixa | Supabase + RPCs atendem o momento |

---

## 6. Roteiro de testes para a cliente

### 6.1 Acesso

| Ambiente | URL |
|----------|-----|
| Web (homologação) | https://larsana.sagittadigital.com.br |
| Web (dev local) | http://localhost:5173 (equipe técnica) |

**Senha padrão contas demo:** `LarsanaCare2026!`

| Perfil | E-mail sugerido |
|--------|-----------------|
| Admin | admin@larsanacare.com.br |
| Gestão | gestao@larsanacare.com.br |
| Financeiro | financeiro@larsanacare.com.br |
| Profissional (PP) | parceiro@larsanacare.com.br |
| Paciente | cliente@larsanacare.com.br |

> Para testar **cadastro real** (como fez o Eduardo): use `/cadastro`, escolha **Profissional Parceiro** ou **Paciente**, e complete o fluxo. Contas novas de PP iniciam em credenciamento **rascunho**.

### 6.2 Cenários recomendados (prioridade)

#### A. Novo profissional + indicação de colega

1. PP A acessa **Minha Evolução** e copia o código (ex.: `D60E3BDA`).
2. PP B cadastra-se em `/cadastro` informando o código (opcional).
3. PP B completa e **envia credenciamento**.
4. PP A deve receber **+50 pontos** e contador **1/3** indicações.

#### B. Paciente solicita atendimento

1. Login paciente ou novo cadastro.
2. **Solicitar atendimento** → preencher formulário completo + aceite de termos.
3. Verificar mapa de cobertura e, se aplicável, entrada na **lista de espera**.

#### C. Fluxo demanda → avaliação → ciclo

1. Admin/Gestão: confirmar demanda vinculada ao paciente.
2. PP: aceitar demanda → wizard de disponibilidade → avaliação → proposta.
3. Paciente: responder proposta → admin abre ciclo.
4. PP: executar sessões na agenda; registrar evolução.

#### D. Remarcação (novas regras)

1. **PP com ≥12h:** remarcar sessão na agenda → paciente recebe proposta em **Agendamentos** → aceitar ou recusar.
2. **Paciente com ≥12h:** Tratamento → ciclo → **Remarcar** (mesmo PP, até 14 dias).
3. **Paciente com menos de 12h:** remarcar exige **atestado**; verificar mensagem de taxa 50%.
4. **PP com menos de 12h:** verificar oferta **SUB** ao paciente.

#### E. Repasses (PP mobile/web)

1. PP → Conta → **Repasses**.
2. Filtrar por status; rolar lista no celular (filtros fixos no topo).
3. Enviar NF quando status permitir.

### 6.3 O que evitar na demo (ainda instável)

- Pagamento real PIX/boleto (usar simulação admin se existir).
- Assumir paridade total mobile ↔ web nas **novas** telas de remarcação.
- Exportação DELUMA e fechamento financeiro de pausa em casos complexos sem apoio técnico.

---

## 7. Próximos passos sugeridos

| # | Ação | Responsável |
|---|------|-------------|
| 1 | Cliente executar roteiro de testes (seção 6) e registrar feedback | Larsana Care |
| 2 | Validar textos legais (Contrato + Termo) com jurídico | Larsana Care |
| 3 | Confirmar regra de conferência de atestado (<12h) | Larsana Care + Sagitta |
| 4 | Deploy da imagem Docker no ambiente de homologação (se ainda não atualizado) | Sagitta |
| 5 | Paridade mobile: remarcação/SUB nos apps nativos | Sagitta |
| 6 | Integração Asaas produção | Sagitta + Financeiro Larsana |
| 7 | Preparar submissão App Store / Play Store | Sagitta + Larsana |

---

## 8. Histórico técnico recente (referência)

| Data | Entrega |
|------|---------|
| 15/08/2026 | Remarcação 12h/14d, SUB, formulário solicitação, UX repasses/bottom nav |
| 15/08/2026 | Migrations Supabase aplicadas no remoto |
| 15/08/2026 | Imagem Docker web publicada; build produção corrigido |
| 15/08/2026 | Teste técnico: indicação PP (cadastro + pontos) validado |
| 14/08/2026 | Auth completa, onboarding paciente, melhorias PP/repasses |
| 13/08/2026 | UX mobile PP (pacientes, conta, evoluções) |

---

## 9. Contato e suporte

Para dúvidas durante os testes ou solicitação de contas adicionais demo, contactar a equipe **Sagitta Digital**.

Documentação interna complementar: `docs/PRD.md`, `docs/PAGES.md`, `docs/FASE0_CHECKLIST_ALINHAMENTO.md`.

---

*Documento gerado a partir do estado do repositório e do ambiente Supabase em 15/08/2026.*
