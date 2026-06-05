# Mapa de Páginas — LarsanaCare Fisioterapia Domiciliar

**Versão:** 1.0  
**Data:** 05/06/2026  
**Base:** PRD v1.1 · `modulos.md` · `DESIGN_SYSTEM.md`  
**App:** `app.larsanacare.com.br` (web unificada)

---

## 1. Visão geral

Uma única aplicação web com **login unificado** e roteamento por perfil após autenticação.

```
/                          → redireciona (logado: área do perfil | anônimo: /login)
/login                     → entrada única
/recuperar-senha           → fluxo de reset
/aceite-termos             → reaceite obrigatório (qualquer perfil, se versão mudou)

/admin/*                   → Admin · Financeiro · Gestão
/profissional/*            → Profissional Parceiro (PP)
/paciente/*                → Paciente / Responsável
```

| Área | Perfis | Layout desktop | Layout mobile |
|------|--------|----------------|---------------|
| **Admin** | Admin, Financeiro, Gestão | Sidebar fixa `w-60` | Drawer (hamburger) — **sem bottom nav** |
| **Portal PP** | Profissional Parceiro | Sidebar fixa | Bottom nav **5 itens** + FAB central |
| **Portal Paciente** | Paciente / Responsável | Header simples | Bottom nav **5 itens** (botões grandes) |

**Princípio de dados:** cada perfil vê apenas o escopo RBAC. PP **nunca** vê valor integral cobrado do paciente. Paciente **nunca** vê evolução clínica do prontuário.

---

## 2. Matriz de acesso (RBAC)

Legenda: ● completo · ◐ parcial / só leitura · ○ sem acesso

| Módulo / dado | Admin | Financeiro | Gestão | PP | Paciente |
|---------------|:-----:|:----------:|:------:|:--:|:--------:|
| Dashboard operacional | ● | ◐ | ● | — | — |
| Dashboard financeiro | ● | ● | ◐ | — | — |
| Cadastro pacientes | ● | ○ | ● | ○ | ◐ próprio |
| Workflow avaliação | ● | ○ | ● | ◐ seus pacientes | ◐ própria |
| Credenciamento PP | ● | ○ | ● | ◐ próprio | ○ |
| Ciclos e sessões | ● | ◐ | ● | ◐ alocados | ◐ próprio |
| Prontuário clínico | ● | ○ | ● | ● seus pacientes | ○ |
| Cobranças / Asaas | ● | ● | ◐ | ○ | ◐ próprias |
| Repasses e NF | ● | ● | ◐ | ◐ próprios | ○ |
| Exportação DELUMA | ● | ● | ○ | ○ | ○ |
| Tabela V1-2026 / config | ● | ○ | ◐ | ○ | ○ |
| Usuários e permissões | ● | ○ | ○ | ○ | ○ |
| Auditoria / logs | ● | ◐ | ◐ | ○ | ○ |
| NPS / qualidade | ● | ○ | ● | ◐ próprio score | ◐ próprias avaliações |
| Demandas / matching | ● | ○ | ● | ● | ○ |

---

## 3. Páginas públicas e autenticação

| Rota | Página | Objetivo | Dados exibidos |
|------|--------|----------|----------------|
| `/login` | Login | Entrada única e-mail/senha | Formulário; link recuperar senha |
| `/recuperar-senha` | Recuperar senha | Reset por e-mail | E-mail; confirmação envio |
| `/redefinir-senha/:token` | Nova senha | Conclusão do reset | Nova senha + confirmação |
| `/aceite-termos` | Reaceite obrigatório | Bloqueia app até aceitar nova versão | PDF termos; checkbox; IP/timestamp |
| `/credenciamento-pendente` | Gate PP | PP sem credenciamento completo | Checklist etapas; CTA continuar onboarding |

**Pós-login:** `WEB-02` redireciona para `/admin`, `/profissional` ou `/paciente` conforme perfil.

---

## 4. Área Administrativa (`/admin/*`)

**Perfis:** Admin · Financeiro · Gestão  
**Objetivo geral:** substituir planilhas; comando operacional e financeiro em tempo real.

### 4.1 Sidebar desktop (todos os perfis admin)

Estrutura fixa com itens **ocultos por permissão** (não mudar layout entre subperfis).

```
┌─────────────────────────────────────┐
│  LarsanaCare · Admin                │
├─────────────────────────────────────┤
│  VISÃO GERAL                        │
│    Dashboard                        │  ← todos
├─────────────────────────────────────┤
│  OPERAÇÃO                           │  ← Gestão + Admin
│    Pacientes                        │
│    Avaliações                       │
│    Ciclos                           │
│    Prontuários                      │
│    Profissionais                    │
│    Credenciamento                   │
│    Demandas                         │
├─────────────────────────────────────┤
│  FINANCEIRO                         │  ← Financeiro + Admin
│    Cobranças                        │
│    Repasses                         │
│    Caixa                            │
│    Exportação DELUMA                │
├─────────────────────────────────────┤
│  RELATÓRIOS                         │  ← Gestão + Financeiro + Admin
│    Operacional                      │
│    Conversão                        │
│    Horas CREFITO                    │
├─────────────────────────────────────┤
│  SISTEMA                            │  ← Admin (maioria)
│    Tabela de preços                 │
│    Termos e contratos               │
│    Regiões e cidades                │
│    Usuários                         │
│    Auditoria                        │
│    Suporte                          │
├─────────────────────────────────────┤
│  Configurações · Perfil · Sair      │
└─────────────────────────────────────┘
```

### 4.2 Mobile admin

- **Header:** hamburger + título da página + notificações
- **Navegação:** drawer lateral (mesma árvore da sidebar)
- **Sem bottom nav** — operação desktop-first; gestão em campo usa drawer

### 4.3 Páginas detalhadas — Admin

#### VISÃO GERAL

| Rota | Página | Objetivo | Dados principais | Perfis |
|------|--------|----------|------------------|--------|
| `/admin` | Dashboard | Centro de comando | KPIs: pacientes ativos, ciclos abertos, pagamentos pendentes, repasses a liberar; fila alertas; atalhos ação | Todos* |

\* Financeiro vê painel com ênfase financeira (widget caixa, cobranças vencidas).

**Widgets do dashboard:**

| Widget | Gestão | Financeiro | Admin |
|--------|:------:|:----------:|:-----:|
| Pacientes ativos / em pausa | ● | ○ | ● |
| Ciclos abertos | ● | ◐ | ● |
| Fila avaliações (estado) | ● | ○ | ● |
| Pagamentos pendentes/vencidos | ◐ | ● | ● |
| Repasses a liberar | ○ | ● | ● |
| Alertas 24h prontuário | ● | ○ | ● |
| Gráfico faturamento vs repasse | ◐ | ● | ● |
| Mapa cobertura A/B/C | ● | ○ | ● |
| Atalhos: liberar repasse, reenviar cobrança, aprovar credenciamento | ◐ | ● | ● |

---

#### OPERAÇÃO

| Rota | Página | Objetivo | Dados principais | Perfis |
|------|--------|----------|------------------|--------|
| `/admin/pacientes` | Lista de pacientes | Gestão da carteira | Nome, status (ATIVO/PAUSA), nível, região, PP, ciclo atual, flags incompleto/sem aceite | Gestão, Admin |
| `/admin/pacientes/novo` | Cadastro paciente | Onboarding multi-etapas | Wizard: dados → responsável → endereço → docs → aceites | Gestão, Admin |
| `/admin/pacientes/:id` | Ficha do paciente | Visão 360° | Abas: resumo, avaliações, ciclos, prontuário, financeiro, documentos, histórico | Gestão, Admin |
| `/admin/pacientes/:id/editar` | Editar paciente | Manutenção cadastro | Mesmos campos do wizard | Gestão, Admin |
| `/admin/avaliacoes` | Fila de avaliações | Workflow rastreável | Estados: feita → proposta enviada → em análise → SIM/NÃO; timer 5d; vencidas | Gestão, Admin |
| `/admin/avaliacoes/:id` | Detalhe avaliação | Ação sobre proposta | Timeline, laudo, enviar proposta, registrar resposta manual, cobrança R$50 | Gestão, Admin |
| `/admin/ciclos` | Lista de ciclos | Operação de ciclos | Paciente, nº ciclo, 4/8 sessões, status pagamento, sessões realizadas, PP | Gestão, Admin |
| `/admin/ciclos/novo` | Abrir ciclo | Criar ciclo N+1 | Paciente, qtd sessões, valor calculado (tabela), bloqueio se sem pagamento anterior | Gestão, Admin |
| `/admin/ciclos/:id` | Detalhe ciclo | Grade de sessões | Previstas vs realizadas; falta/remarcada/intercorrência; encerrar ciclo | Gestão, Admin |
| `/admin/prontuarios` | Painel prontuários | Conformidade CREFITO | Alertas 24h; pendentes 7 dias; filtros por PP/paciente | Gestão, Admin |
| `/admin/prontuarios/:pacienteId` | Prontuário (gestão) | Leitura/auditoria | Timeline sessões, evoluções, anexos, trilha edição | Gestão, Admin |
| `/admin/profissionais` | Lista PP | Carteira de parceiros | Nome, classe B/P/O, status, horas/semana, pacientes ativos, NPS | Gestão, Admin |
| `/admin/profissionais/:id` | Ficha PP | Visão gestão | Dados, pacientes alocados, ciclos, horas, histórico repasses | Gestão, Admin |
| `/admin/credenciamento` | Fila credenciamento | Aprovar onboarding | Estados: docs → termos → contrato → aguardando aprovação | Gestão, Admin |
| `/admin/credenciamento/:id` | Detalhe credenciamento | Validar e ativar | Documentos, preview LRS-PROF, aprovar/reprovar, Wallet Asaas | Gestão, Admin |
| `/admin/demandas` | Demandas | Matching geográfico | Mapa/lista oportunidades; status; PP atribuído | Gestão, Admin |
| `/admin/demandas/:id` | Detalhe demanda | Alocar PP | Paciente, endereço, região, sugestões PP, aceite/recusa | Gestão, Admin |

---

#### FINANCEIRO

| Rota | Página | Objetivo | Dados principais | Perfis |
|------|--------|----------|------------------|--------|
| `/admin/cobrancas` | Cobranças | Controle recebíveis | Ciclo, paciente, valor, PIX/boleto, status Asaas, vencimento | Financeiro, Admin |
| `/admin/cobrancas/:id` | Detalhe cobrança | Ação sobre cobrança | Webhook status, reenviar link, comprovante, histórico | Financeiro, Admin |
| `/admin/repasses` | Fila de repasses | Pós-ciclo + NF | Ciclo encerrado, valor repasse (% classe), NF pendente, status transferência | Financeiro, Admin |
| `/admin/repasses/:id` | Detalhe repasse | Liberar transferência | Simulador %, anexo NF PP, folha comparecimento, validar, liberar Wallet | Financeiro, Admin |
| `/admin/caixa` | Caixa / capital de giro | Visão recebido vs a repassar | Recebido no período, retido, repassado, margem Larsana | Financeiro, Admin |
| `/admin/exportacao-deluma` | Exportação DELUMA | Pacote contábil mensal | Filtro mês; XLSX/CSV: recebimentos, repasses, NF, recibos por ciclo | Financeiro, Admin |

---

#### RELATÓRIOS

| Rota | Página | Objetivo | Dados principais | Perfis |
|------|--------|----------|------------------|--------|
| `/admin/relatorios` | Hub relatórios | Acesso a BI | Cards para cada relatório | Gestão, Financeiro, Admin |
| `/admin/relatorios/faturamento` | Faturamento | Recebido vs repassado vs margem | Gráficos mensais, drill-down por ciclo | Financeiro, Admin |
| `/admin/relatorios/conversao` | Conversão avaliação→ciclo | KPI comercial | Taxa SIM/NÃO, tempo médio, por região | Gestão, Admin |
| `/admin/relatorios/horas-crefito` | Horas por PP | Conformidade 30h | Horas semanais, alertas limite | Gestão, Admin |
| `/admin/relatorios/nps` | NPS e qualidade | Score por PP | Médias, alertas ≤6 em 2 ciclos | Gestão, Admin |
| `/admin/relatorios/repasses-aging` | Aging repasses | Ciclo fechado sem NF | Dias em fila, por PP | Financeiro, Admin |

---

#### SISTEMA

| Rota | Página | Objetivo | Dados principais | Perfis |
|------|--------|----------|------------------|--------|
| `/admin/config/precos` | Tabela V1-2026 | Matriz Região × Nível | Versões, histórico, simulador ciclo 4/8 | Admin |
| `/admin/config/termos` | Termos e contratos | Versionamento legal | Upload PDF; dispara reaceite | Admin |
| `/admin/config/contratos` | Templates LRS-PROF | Modelos por profissão | FISIO, NUTI, MED, CUID, FONO | Admin |
| `/admin/config/regioes` | Regiões e cidades | Matching automático | Cidade → Região A/B/C | Admin, Gestão* |
| `/admin/config/usuarios` | Usuários | CRUD contas painel | Perfis Admin/Financeiro/Gestão | Admin |
| `/admin/config/auditoria` | Auditoria | LGPD / compliance | Log acessos prontuário, edições financeiras | Admin, Gestão* |
| `/admin/suporte` | Tickets | Pós-go-live | Abertura e acompanhamento | Admin |
| `/admin/configuracoes` | Configurações conta | Preferências usuário logado | Tema, notificações, senha | Todos admin |

\* Gestão com leitura ou edição limitada conforme política.

---

## 5. Portal do Profissional (`/profissional/*`)

**Perfil:** Profissional Parceiro (PP)  
**Objetivo:** operação em campo — agenda, evolução, demandas, status da proposta, repasses.  
**Gate:** sem credenciamento `ativo` → redireciona `/credenciamento-pendente` ou `/profissional/credenciamento`.

### 5.1 Sidebar desktop

```
┌─────────────────────────────────────┐
│  LarsanaCare · Profissional         │
├─────────────────────────────────────┤
│  HOJE                               │
│    Agenda                           │
│    Demandas                         │
├─────────────────────────────────────┤
│  CLÍNICO                            │
│    Evoluções pendentes              │
│    Meus pacientes                   │
│    Avaliações (rastreio)            │
├─────────────────────────────────────┤
│  FINANCEIRO                         │
│    Repasses                         │
│    Simulador de ganhos              │
├─────────────────────────────────────┤
│  CONTA                              │
│    Credenciamento                   │
│    Cartão de visita                 │
│    Configurações                    │
└─────────────────────────────────────┘
```

### 5.2 Bottom nav mobile (5 itens)

Padrão **2 + FAB + 2** (conforme design system).

| # | Ícone | Rota | Label (acessibilidade) | Objetivo |
|---|-------|------|------------------------|----------|
| 1 | `Calendar` | `/profissional/agenda` | Agenda | Sessões do dia, endereços, navegação |
| 2 | `MapPin` | `/profissional/demandas` | Demandas | Oportunidades, aceitar/recusar |
| 3 | `ClipboardPlus` | `/profissional/evolucao/nova` | **FAB** Registrar evolução | Atalho principal — nova evolução |
| 4 | `Wallet` | `/profissional/repasses` | Repasses | Ganhos liberados e pendentes |
| 5 | `User` | `/profissional/perfil` | Perfil | Conta, credenciamento, sair |

> **Avaliações (rastreio)** e **evoluções pendentes** ficam na Agenda (badges) e em Meus pacientes — não ocupam slot no bottom nav.

### 5.3 Páginas detalhadas — PP

| Rota | Página | Objetivo | Dados exibidos (escopo PP) |
|------|--------|----------|----------------------------|
| `/profissional` | Redirect | — | → `/profissional/agenda` |
| `/profissional/agenda` | Agenda do dia | Planejar visitas | Sessões hoje/semana; endereço; status pagamento ciclo (só ícone bloqueio); alertas prontuário |
| `/profissional/agenda/:sessaoId` | Detalhe sessão | Antes/durante visita | Horário, paciente, endereço, mapa, botões: iniciar evolução, check-in, comparecimento |
| `/profissional/demandas` | Demandas | Novas oportunidades | Lista/mapa por proximidade; região; aceitar/recusar + motivo |
| `/profissional/demandas/:id` | Detalhe demanda | Decisão | Resumo paciente (sem dados financeiros integrais); distância; carga horária restante |
| `/profissional/evolucoes` | Evoluções pendentes | Conformidade 24h/7d | Sessões sem registro; prazo restante |
| `/profissional/evolucao/nova` | Nova evolução | Registrar prontuário | Editor rich-text; templates; anexos; rascunho (offline no app) |
| `/profissional/evolucao/:id` | Editar evolução | Complementar registro | Versão, metadados CREFITO, ciclo |
| `/profissional/pacientes` | Meus pacientes | Carteira alocada | Lista pacientes do PP; status tratamento |
| `/profissional/pacientes/:id` | Ficha paciente (PP) | Contexto clínico | Dados básicos, ciclos, prontuário (seus registros), avaliações |
| `/profissional/avaliacoes` | Avaliações — rastreio | Status proposta família | Cards estilo Correios: feita → enviada → análise → SIM/NÃO |
| `/profissional/avaliacoes/:id` | Detalhe avaliação | Acompanhar + registrar | Timeline; laudo; sem valor financeiro do ciclo futuro |
| `/profissional/repasses` | Repasses | Ganhos pós-ciclo | **Somente valor de repasse**; status: pendente NF, em fila, liberado |
| `/profissional/repasses/:id` | Detalhe repasse | Upload NF | Valor repasse, % classe, upload NF, histórico |
| `/profissional/simulador` | Simulador ganhos | Estimar repasse | Valor repasse estimado (não valor paciente) |
| `/profissional/credenciamento` | Credenciamento | Onboarding self-service | Checklist: docs → termos → contrato → aprovação |
| `/profissional/credenciamento/contrato` | Contrato LRS-PROF | Aceite digital | Preview PDF, aceite, download |
| `/profissional/cartao` | Cartão de visita | Apresentação ao paciente | Nome, CREFITO, contato Larsana |
| `/profissional/perfil` | Perfil | Conta | Dados, bancários, notificações, classe B/P/O, horas/semana |
| `/profissional/notificacoes` | Notificações | Centro in-app | Resposta família, repasse liberado, alerta prontuário |

**Dados que o PP NÃO vê:** valor integral do ciclo cobrado do paciente; margem Larsana; dados de outros PP; área admin.

---

## 6. Portal do Paciente (`/paciente/*`)

**Perfil:** Paciente / Responsável (login do responsável vinculado ao paciente)  
**Objetivo:** acompanhar tratamento, pagar ciclo, responder proposta, aceitar termos — linguagem simples, botões grandes.  
**Gate:** sem aceite vigente → `/aceite-termos` ou wizard `/paciente/aceite-inicial`.

### 6.1 Navegação desktop

Header horizontal simplificado (sem sidebar densa):

```
Início · Pagamentos · Meu tratamento · Documentos · Ajuda · Conta
```

### 6.2 Bottom nav mobile (5 itens)

| # | Ícone | Rota | Label | Objetivo |
|---|-------|------|-------|----------|
| 1 | `Home` | `/paciente` | Início | Timeline, próxima sessão, alertas |
| 2 | `CreditCard` | `/paciente/pagamentos` | Pagar | Cobrança ciclo ativo PIX/boleto |
| 3 | `Heart` | `/paciente/tratamento` | Tratamento | Ciclo, sessões, profissional |
| 4 | `FileText` | `/paciente/documentos` | Documentos | Aceites, comprovantes, termos |
| 5 | `User` | `/paciente/conta` | Conta | Dados responsável, ajuda, sair |

> **Proposta SIM/NÃO** aparece como **banner/modal na Início** quando pendente — não ocupa item fixo do nav.

### 6.3 Páginas detalhadas — Paciente

| Rota | Página | Objetivo | Dados exibidos (escopo paciente) |
|------|--------|----------|----------------------------------|
| `/paciente` | Início / Timeline | Visão do tratamento | PP atual, ciclo nº, próximas sessões, status pagamento, banner proposta pendente |
| `/paciente/tratamento` | Meu tratamento | Plano em andamento | Ciclo 4/8 sessões, realizadas vs previstas, pausa — **sem evolução clínica** |
| `/paciente/tratamento/ciclo/:id` | Detalhe ciclo | Acompanhar sessões | Datas, status (realizada/falta/remarcada), nome PP |
| `/paciente/pagamentos` | Pagamentos | Pagar ciclo antecipado | Valor do ciclo, PIX/boleto Asaas, vencimento, status |
| `/paciente/pagamentos/:id` | Detalhe pagamento | Pagar / comprovante | QR PIX, boleto PDF, comprovante após confirmação |
| `/paciente/proposta` | Responder proposta | Workflow AVL | Proposta pós-avaliação; botões SIM/NÃO; timer 5 dias |
| `/paciente/documentos` | Documentos | Arquivo do responsável | Termos aceitos, comprovantes pagamento, recibos |
| `/paciente/aceite-inicial` | Aceite 1º acesso | Onboarding legal | Termo Adesão + Diretrizes + LGPD (checkbox, versão) |
| `/paciente/nps/:cicloId` | NPS fim de ciclo | Avaliar cuidado | Escala 0–10 + comentário (24h pós última sessão) |
| `/paciente/conta` | Conta | Dados responsável | Nome, telefone, e-mail, endereço (edição com validação gestão) |
| `/paciente/ajuda` | Ajuda | Suporte família | FAQ, contato Larsana, como pagar |
| `/paciente/notificacoes` | Notificações | Alertas | Cobrança, proposta, sessão amanhã |

**Dados que o paciente NÃO vê:** prontuário/evolução clínica; repasses ao PP; dados de outros pacientes; painel admin.

---

## 7. Fluxos que cruzam páginas

### 7.1 Avaliação inicial → 1º ciclo

```
Gestão cadastra paciente (/admin/pacientes/novo)
    → PP realiza avaliação (/profissional/pacientes/:id)
    → Gestão envia proposta (/admin/avaliacoes/:id)
    → Família responde (/paciente/proposta ou banner /paciente)
         SIM → Gestão abre 1º ciclo (/admin/ciclos/novo)
         NÃO → Cobrança R$50 (/admin/cobrancas)
    → PP acompanha rastreio (/profissional/avaliacoes)
```

### 7.2 Ciclo com pagamento antecipado

```
Gestão abre ciclo → cobrança gerada
    → Responsável paga (/paciente/pagamentos)
    → Webhook confirma → sessões liberadas
    → PP atende e registra evolução (/profissional/evolucao/nova)
    → Ciclo encerra → fila repasse (/admin/repasses)
    → PP envia NF (/profissional/repasses/:id)
    → Financeiro libera (/admin/repasses/:id)
    → Exportação DELUMA (/admin/exportacao-deluma)
```

### 7.3 Credenciamento PP

```
PP se cadastra / recebe convite
    → Self-service (/profissional/credenciamento)
    → Gestão aprova (/admin/credenciamento/:id)
    → PP ativo → demandas e alocação liberadas
```

---

## 8. Resumo — Sidebars e mobile por perfil

| Perfil | Sidebar (desktop) | Bottom nav mobile | Qtd itens mobile |
|--------|-------------------|-------------------|------------------|
| **Admin** | Completa (4 seções + sistema) | Drawer only | — |
| **Financeiro** | Visão + Financeiro + Relatórios financeiros | Drawer only | — |
| **Gestão** | Visão + Operação + Relatórios operacionais | Drawer only | — |
| **PP** | Hoje · Clínico · Financeiro · Conta | Agenda · Demandas · **FAB** · Repasses · Perfil | 5 |
| **Paciente** | Header links (6 itens) | Início · Pagar · Tratamento · Documentos · Conta | 5 |

---

## 9. Priorização V1 (Fase 1 — web completa)

### P0 — obrigatório go-live

| Área | Páginas |
|------|---------|
| Auth | login, recuperar-senha, aceite-termos |
| Admin | dashboard, pacientes (lista+detail+novo), avaliações, ciclos, cobranças, repasses, exportação DELUMA, credenciamento, profissionais, config/precos, config/usuarios |
| PP | agenda, evolução nova/editar, pacientes, avaliações rastreio, repasses, credenciamento |
| Paciente | início, pagamentos, proposta, aceite-inicial, tratamento, conta |

### P1 — logo após go-live

| Área | Páginas |
|------|---------|
| Admin | prontuários painel, demandas, caixa, relatórios, config/termos |
| PP | demandas mapa, simulador, notificações |
| Paciente | documentos, nps |

### P2 — evolução

| Área | Páginas |
|------|---------|
| Admin | mapa cobertura, suporte, auditoria avançada |
| PP | cartão visita, check-in GPS |
| Paciente | ajuda expandida |

---

## 10. Convenções técnicas

| Convenção | Regra |
|-----------|-------|
| **Rotas** | kebab-case em português: `/admin/exportacao-deluma` |
| **IDs** | UUID na URL: `/admin/pacientes/:patientId` |
| **Breadcrumbs** | Admin e PP: `Área > Seção > Página` |
| **Títulos** | `font-display font-bold text-lg` (design system §3) |
| **Empty states** | CTA claro para próxima ação (ex.: "Nenhum ciclo — abrir ciclo") |
| **403** | Redireciona para dashboard do perfil, não mostra área admin |
| **404** | Página amigável com link para início do perfil |

---

*Documento vivo — alinhar com `PRD.md` em cada sprint.*
