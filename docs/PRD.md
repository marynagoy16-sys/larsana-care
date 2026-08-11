# PRD — Larsana Care Platform

**Produto:** Ecossistema de gestão de fisioterapia e saúde domiciliar  
**Cliente:** DELUMA Serviços de Saúde e Educação Ltda. (marca Larsana Care)  
**Versão do documento:** 1.2  
**Data:** 11/08/2026  
**Status:** Aprovado para desenvolvimento (V1.1 go-live em andamento)  

---

## 1. Visão do produto

A Larsana Care opera como **intermediadora** de serviços de saúde domiciliar — conecta famílias a profissionais parceiros (PP), sem realizar atendimentos clínicos diretamente. Hoje a operação roda em **planilhas Google, Forms e repasses manuais**, gerando risco operacional, financeiro e regulatório (CREFITO/LGPD).

O produto substitui esse modelo por um ecossistema integrado composto por:

1. **Aplicação Web completa** — única plataforma web com **todos os acessos** (Admin, Financeiro, Gestão, PP e Paciente/Responsável); funcionalidade integral por perfil, responsiva desktop e mobile  
2. **App nativo do Profissional Parceiro** (iOS/Android) — agenda em campo, demandas, prontuário, push notifications  
3. **App nativo do Paciente/Responsável** (iOS/Android) — pagamento, acompanhamento, aceites, NPS  

**Princípio de paridade:** PP e Paciente podem usar **web ou app nativo** indistintamente; a API e as regras de negócio são as mesmas. Os apps nativos complementam a web com experiência mobile otimizada (push, GPS, câmera, uso offline parcial).

---

## 1.1 Superfícies de acesso

| Superfície | Perfis | Canal |
|------------|--------|-------|
| **Web — Área Administrativa** | Admin, Financeiro, Gestão | Navegador (desktop prioritário) |
| **Web — Portal do Profissional** | Profissional Parceiro | Navegador (desktop e mobile) |
| **Web — Portal do Paciente** | Paciente / Responsável | Navegador (desktop e mobile) |
| **App nativo PP** | Profissional Parceiro | iOS / Android |
| **App nativo Paciente** | Paciente / Responsável | iOS / Android |

Todos os perfis autenticam na **mesma aplicação web** (`app.larsanacare.com.br` ou equivalente), com redirecionamento automático para a área correspondente ao papel do usuário.

---

## 2. Objetivos

| Objetivo | Métrica de sucesso |
|----------|-------------------|
| Eliminar planilhas centrais | 0 operações críticas em planilha externa |
| Garantir pagamento antecipado antes de sessões | 100% dos ciclos com cobrança confirmada antes da 1ª sessão |
| Repasse pós-ciclo auditável | Cada repasse vinculado a ciclo + NF do PP + recibo do paciente |
| Conformidade CREFITO | Alerta em 24h; prazo contratual de 7 dias úteis visível |
| Rastreio da avaliação inicial | PP e gestão veem status em tempo real (estilo rastreio) |
| Exportação contábil DELUMA | Pacote mensal XLSX/CSV sem retrabalho manual |

---

## 3. Personas e perfis de acesso

| Perfil | Web | App nativo | Responsabilidades |
|--------|-----|------------|-------------------|
| **Admin** | Área Administrativa | — | Configuração global, usuários, tabelas, contratos |
| **Financeiro** | Área Administrativa | — | Cobranças, repasses, exportação DELUMA, NF/recibos |
| **Gestão / Operacional** | Área Administrativa | — | Pacientes, avaliações, alocação, alertas, credenciamento |
| **Profissional Parceiro (PP)** | Portal do Profissional | App PP | Agenda, evolução, demandas, status de proposta, repasses |
| **Paciente / Responsável** | Portal do Paciente | App Paciente | Pagamento, timeline, aceites, NPS |

**RBAC:** perfis segregados com permissões granulares por módulo e por dado sensível (prontuário). Um usuário pode ter apenas um perfil primário por conta (ex.: PP não acessa área admin).

**Login unificado:** tela de entrada única na web; após autenticação, roteamento por perfil. Apps nativos usam as mesmas credenciais (OAuth2/JWT compartilhado).

---

## 4. Escopo

### 4.1 Dentro do escopo (V1)

- Fisioterapia domiciliar como vertical principal  
- Contratos `LRS-PROF.FISIO` (extensível a NUTI, MED, CUID, FONO)  
- Cobrança **PIX e boleto** via Asaas (sem cartão de crédito)  
- Repasse **pós-ciclo** (sem split instantâneo)  
- Aceite digital simples (checkbox + versão + timestamp + IP) — **sem Gov.br**  
- Migração dos dados das planilhas atuais  
- Tabela de preços **V1-2026** embutida no sistema  
- **Aplicação web completa** com todos os perfis (admin + PP + paciente)  
- **Apps nativos** iOS/Android para PP e Paciente (paridade funcional com a web)  

### 4.2 Fora do escopo (V1 base)

- Split instantâneo de pagamento no gateway  
- **Assinatura digital ICP-Brasil / Gov.br nas evoluções clínicas** — fora do V1 base; tratada como **V1.2** após spike jurídico (ver §4.3 e `docs/SPIKE_ASSINATURA_DIGITAL.md`)  
- Cartão de crédito para pacientes  
- Teleconsulta / atendimento remoto  
- Módulo completo de cuidadores (COREN) — preparar arquitetura, ativar após fisio  
- Vendas pagas do Academy via Asaas — track separado (Elias); não bloqueia go-live operacional  

### 4.3 Escopo V1.1 — Go-live app paciente (alinhamento 03/08/2026)

Repriorização acordada com DELUMA: **lançar o app nativo do paciente** nas lojas enquanto PP entra em validação paralela. A web permanece canal principal para admin e gestão.

| ID | Item | Descrição | Prioridade |
|----|------|-----------|------------|
| V11-01 | Publicação app paciente | TestFlight / Play Internal → produção | P0 |
| V11-02 | Soft launch regional | App funcional mesmo sem PP na região; LarsanaPill como produto principal | P0 |
| V11-03 | Solicitar atendimento | Tab/fluxo dedicado; paciente **não escolhe** PP — demanda vai ao pool | P0 |
| V11-04 | Mapa ilustrativo | SVG estático (sem Google Maps API) durante busca de PP | P0 |
| V11-05 | Mensagem “Estamos chegando” | Exibida quando região não tem PP credenciado ativo | P0 |
| V11-06 | Lista de espera | CTA “Desejo iniciar tratamento”; flag no admin por região | P0 |
| V11-07 | Timeline Correios — solicitação | Estados: enviada → procurando PP → PP atribuído → avaliação | P0 |
| V11-08 | Nav paciente mobile | Início · LarsanaPill (FAB) · Solicitar · Conta; Docs/Pagar em subtelas | P0 |
| V11-09 | Nav PP mobile | Início · Agenda · Demandas (FAB) · Repasses · Academy; Perfil no menu (⋮) | P0 |
| V11-10 | Agenda PP semanal | Vista por semana + sub-aba evoluções pendentes com badge | P0 |
| V11-11 | Prontuário PP por ciclos | Agrupamento decrescente; avaliação inicial destacada no topo | P0 |
| V11-12 | Terminologia UI | Exibir **“terapia”** na interface; schema interno mantém `care_sessions` | P1 |
| V11-13 | Imutabilidade evoluções | Registro finalizado não editável por admin; trilha em `medical_record_versions` | P0 |
| V11-14 | Integração Asaas produção | PIX/boleto real + webhook (pré-requisito pagamento ciclo) | P0 |
| V11-15 | Identidade visual | Logo, paleta e textos oficiais em toda a plataforma | P0 — concluído |

**Nota:** aceite digital de termos (checkbox + IP) permanece **sem Gov.br**, conforme §4.1. A assinatura CREFITO de evoluções clínicas é requisito regulatório distinto — ver spike.

---

## 5. Arquitetura funcional (módulos)

```
                    ┌──────────────────────────────────────┐
                    │         API / Backend único           │
                    │  regras de negócio │ RBAC │ Asaas    │
                    └───────────────────┬──────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
│  APLICAÇÃO WEB    │         │   APP NATIVO PP   │         │ APP NATIVO PACIENTE│
│     COMPLETA      │         │    iOS / Android  │         │   iOS / Android   │
├───────────────────┤         ├───────────────────┤         ├───────────────────┤
│ • Área Admin      │         │ Agenda em campo   │         │ Pagamento PIX/    │
│   (Admin/Fin/     │         │ Push notifications│         │ boleto            │
│    Gestão)        │         │ GPS / mapa        │         │ Push notifications│
│ • Portal PP       │         │ Câmera (docs)     │         │ Timeline          │
│ • Portal Paciente │         │ Offline parcial   │         │ Aceites digitais  │
└───────────────────┘         └───────────────────┘         └───────────────────┘
        │                               │                               │
        └───────────────────────────────┴───────────────────────────────┘
                          Mesmas funcionalidades por perfil
                    (web = canal principal; apps = mobile-first)
```

### 5.1 Aplicação Web — estrutura por área

| Área | Rota (exemplo) | Módulos principais |
|------|----------------|-------------------|
| **Administrativa** | `/admin/*` | Dashboard, pacientes, PP, ciclos, financeiro, relatórios, configurações |
| **Portal PP** | `/profissional/*` | Agenda, demandas, prontuário, avaliações, repasses, credenciamento |
| **Portal Paciente** | `/paciente/*` | Timeline, pagamentos, aceites, NPS, dados do responsável |

**Layout web por área:**

- **Admin:** sidebar desktop + header (conforme `DESIGN_SYSTEM.md`)  
- **Portal PP:** sidebar desktop / bottom nav mobile  
- **Portal Paciente:** layout simplificado, linguagem acessível, botões grandes (público idoso)  

### 5.2 Paridade Web × App nativo

| Funcionalidade | Web | App nativo | Observação |
|----------------|-----|------------|------------|
| Login / sessão | ✓ | ✓ | Token compartilhado |
| Agenda PP | ✓ | ✓ | App prioriza mapa e push |
| Evolução / prontuário | ✓ | ✓ | App permite rascunho offline |
| Demandas / mapa | ✓ | ✓ | App usa GPS nativo |
| Status avaliação | ✓ | ✓ | — |
| Repasses (só valor PP) | ✓ | ✓ | — |
| Pagamento ciclo | ✓ | ✓ | Web e app abrem PIX/boleto Asaas |
| Aceites digitais | ✓ | ✓ | — |
| NPS | ✓ | ✓ | Push só no app |
| Gestão / financeiro | ✓ | — | Somente web |
| Exportação DELUMA | ✓ | — | Somente web |
| Credenciamento completo | ✓ | ✓ (upload docs) | Web preferencial para contrato PDF |

---

## 6. Requisitos funcionais por módulo

### 6.0 Plataforma Web Unificada

**Objetivo:** Uma única aplicação web servindo todos os perfis, com UX adaptada por papel.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| WEB-01 | Login unificado | Uma URL de entrada; e-mail/senha; recuperação de senha | P0 |
| WEB-02 | Roteamento por perfil | Após login, redireciona para `/admin`, `/profissional` ou `/paciente` conforme RBAC | P0 |
| WEB-03 | Sessão compartilhada com apps | Mesmo JWT/API para web e apps nativos | P0 |
| WEB-04 | Layout responsivo | Admin (desktop-first); Portais PP e Paciente (mobile-first) | P0 |
| WEB-05 | Portal PP completo na web | Paridade funcional com app nativo PP (seção 6.10) | P0 |
| WEB-06 | Portal Paciente completo na web | Paridade funcional com app nativo Paciente (seção 6.11) | P0 |
| WEB-07 | Área Admin completa na web | Todos os módulos administrativos (seções 6.1–6.9, 6.12–6.15) | P0 |
| WEB-08 | Troca de contexto bloqueada | Usuário PP não acessa `/admin`; paciente não vê prontuário de terceiros | P0 |
| WEB-09 | Notificações in-app (web) | Centro de notificações no header para PP e Paciente (complementa push dos apps) | P1 |
| WEB-10 | PWA opcional | Instalável na tela inicial (PP e Paciente) sem depender das lojas | P2 |
| WEB-11 | Tema claro/escuro | Conforme design system | P2 |
| WEB-12 | Onboarding por perfil | Tour guiado no 1º acesso (credenciamento PP; aceite Paciente) | P2 |

---

### 6.1 Área Administrativa (Web) — Dashboard Operacional

**Objetivo:** Substituir planilhas centrais com visão em tempo real. **Acesso:** Admin, Financeiro, Gestão — somente web.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| ADM-01 | KPIs operacionais | Pacientes ativos, ciclos abertos, pagamentos pendentes, repasses a liberar | P0 |
| ADM-02 | Fila de avaliações | Listagem por estado: proposta enviada, em análise, respondida, vencida | P0 |
| ADM-03 | Gráfico financeiro | Faturamento vs repasse vs margem (capital de giro) | P1 |
| ADM-04 | Alertas operacionais | Cobrança vencida, contrato pendente, prontuário incompleto 24h, avaliação sem resposta 5d | P0 |
| ADM-05 | Mapa/ranking por região | Cobertura A/B/C, demanda vs capacidade | P2 |
| ADM-06 | Atalhos de ação | Liberar repasse, reenviar cobrança, aprovar credenciamento | P0 |

---

### 6.2 Cadastro de Pacientes

**Objetivo:** Ficha clínica + workflow de avaliação rastreável.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| PAC-01 | Cadastro multi-etapas | Dados pessoais, responsável, endereço, documentos | P0 |
| PAC-02 | Classificação automática | Cidade → Região (A/B/C); nível 1/2/3 ou Valor Social | P0 |
| PAC-03 | Avaliação clínica inicial | Editor rich-text; vinculada ao PP avaliador e CREFITO | P0 |
| PAC-04 | Aceite digital no cadastro | Termo de Adesão + Diretrizes + LGPD (versão, checkbox, IP, timestamp) | P0 |
| PAC-05 | Bloqueio sem aceite | Impede workflow e 1º ciclo sem aceite vigente | P0 |
| PAC-06 | Status de atendimento | ATIVO, PAUSA (sem apagar histórico) | P0 |
| PAC-07 | Flag dados incompletos | Indicador e bloqueio parcial quando cadastro incompleto | P1 |
| PAC-08 | Histórico de avaliações | Versões anteriores e trocas de profissional | P1 |
| PAC-09 | Upload de documentos | RG, laudos, exames (substituir links Google Drive) | P1 |

**Campos obrigatórios (migração planilha):** nome, CPF, data nascimento, responsável, telefone, e-mail, endereço completo, nível, região, cidade, PP alocado, frequência semanal sugerida.

---

### 6.3 Workflow de Avaliação Inicial

**Objetivo:** Rastreio completo até resposta da família — visível para PP e gestão.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| AVL-01 | Linha do tempo de estados | Avaliação feita → Proposta enviada → Em análise → SIM/NÃO | P0 |
| AVL-02 | Timer 5 dias úteis | Contagem para resposta da família após proposta enviada | P0 |
| AVL-03 | Branch SIM | Libera agendamento do 1º ciclo (avaliação = 1º atendimento registrado) | P0 |
| AVL-04 | Branch NÃO | Gera cobrança automática **R$ 50** pela avaliação (vencimento 30 dias) | P0 |
| AVL-05 | Notificação ao PP | Push/e-mail quando família responder SIM ou NÃO | P0 |
| AVL-06 | Card de status no app PP | Por paciente avaliado, estilo "rastreio dos Correios" | P0 |
| AVL-07 | Fila gestão | Propostas pendentes e vencidas com ações em lote | P1 |
| AVL-08 | Histórico auditável | Log de mudanças de estado com usuário e timestamp | P1 |

---

### 6.4 Credenciamento de Profissionais Parceiros

**Objetivo:** Onboarding completo com contrato LRS-PROF antes de alocação.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| PP-01 | Cadastro PF/PJ | Dados pessoais, bancários, conselho (CREFITO/COREN) | P0 |
| PP-02 | Upload documentação | RG/CNH, carteirinha conselho, antecedentes criminais, certificados | P0 |
| PP-03 | Aceite termos PP | Diretrizes + LGPD (checkbox, versão, IP) | P0 |
| PP-04 | Geração contrato LRS-PROF | Sequencial: `LRS-PROF.{FISIO\|NUTI\|MED\|CUID\|FONO}-2026-XXXX` | P0 |
| PP-05 | ANEXO I automático | Dados do PP preenchidos no anexo do contrato | P0 |
| PP-06 | Preview do contrato | Visualização antes do aceite (cabeçalho, partes, cláusulas) | P1 |
| PP-07 | Fluxo de assinatura em etapas | Documentos → Termos → Contrato gerado → Aceite PDF → Aprovação gestão → Ativo | P0 |
| PP-08 | Classe Bronze/Prata/Ouro | Atribuição manual ou por regra de tempo de casa | P0 |
| PP-09 | Wallet Asaas | Criação/vinculação automática no fluxo de credenciamento | P0 |
| PP-10 | Bloqueio de alocação | Sem contrato assinado + documentação completa = sem demandas | P0 |
| PP-11 | Flags Encaminhado/Assinado | Espelhar estados atuais da planilha de profissionais | P0 |
| PP-12 | Armazenamento PDF assinado | Vinculado ao credenciamento, downloadável | P1 |

**Estados do credenciamento:** `rascunho` → `documentos_pendentes` → `termos_pendentes` → `contrato_pendente` → `aguardando_aprovacao` → `ativo` → `inativo` / `descredenciado`

---

### 6.5 Motor de Ciclos de Atendimento

**Objetivo:** Ciclos de 4 ou 8 sessões com pagamento antecipado obrigatório.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| CIC-01 | Criação de ciclo | 4 ou 8 sessões; numeração contínua por paciente (Ciclo 1, 2, 24…) | P0 |
| CIC-02 | Cálculo valor do ciclo | `sessões × valor/sessão` da matriz Região × Nível vigente | P0 |
| CIC-03 | Bloqueio sem pagamento | Sessões só liberadas após confirmação PIX/boleto | P0 |
| CIC-04 | Bloqueio novo ciclo | Ciclo N+1 só abre com ciclo N encerrado e pago | P0 |
| CIC-05 | Grade sessões | Previstas vs realizadas: realizada, falta, remarcada, intercorrência | P0 |
| CIC-06 | Pausa de tratamento | Status PAUSA sem apagar histórico | P0 |
| CIC-07 | Encerramento de ciclo | Dispara fila de repasse ao PP | P0 |
| CIC-08 | Notificação 48h | Alerta antes do fechamento do ciclo (gestão + PP) | P1 |
| CIC-09 | Exceção Valor Social | Valor negociado com aprovação da gestão | P1 |
| CIC-10 | Texto padrão de recibo | Template já usado na planilha Pagamentos | P1 |

---

### 6.6 Prontuário Digital

**Objetivo:** Registro único CREFITO/LGPD com alertas operacionais.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| PRT-01 | Editor por sessão | Rich-text; templates: avaliação, evolução, alta | P0 |
| PRT-02 | Metadados obrigatórios | PP, CREFITO, data/hora, ciclo, paciente | P0 |
| PRT-03 | Alerta 24h | Flag se sessão realizada sem registro em 24h | P0 |
| PRT-04 | Prazo contratual 7 dias | Exibição do prazo LRS-PROF para registro definitivo | P0 |
| PRT-05 | Linha do tempo | Histórico cronológico por paciente | P1 |
| PRT-06 | Anexos | Upload de exames, fotos clínicas | P1 |
| PRT-07 | Exportação PDF | Prontuário completo ou por período | P2 |
| PRT-08 | Controle de versão | Trilha de edições (quem, quando, o quê) | P1 |
| PRT-09 | Acesso restrito | PP vê seus pacientes; gestão vê todos; paciente não vê evolução clínica | P0 |
| PRT-10 | Tipo intercorrência | Registrar internação, suspensão, etc. (como na planilha Aline) | P1 |
| PRT-11 | Imutabilidade pós-finalização | Admin/gestão não editam conteúdo clínico; append-only com motivo | P0 (V1.1) |
| PRT-12 | Assinatura CREFITO por terapia | Assinatura eletrônica válida por evolução (Gov.br, ICP ou terceiro) | P1 (V1.2 — spike) |

---

### 6.7 Cobrança Asaas e Repasse pós-Ciclo

**Objetivo:** Capital de giro na Larsana; repasse ao PP só após ciclo + NF.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| FIN-01 | Cadastro cliente Asaas | Automático a partir do cadastro paciente | P0 |
| FIN-02 | Cobrança antecipada | PIX e boleto por ciclo; webhook de confirmação | P0 |
| FIN-03 | Sem split instantâneo | Valor integral recebido pela Larsana primeiro | P0 |
| FIN-04 | Status de pagamento | pendente, pago, vencido, cancelado | P0 |
| FIN-05 | Comprovante digital | Disponível no app paciente após confirmação | P1 |
| FIN-06 | Fila de repasse | Ciclos encerrados aguardando NF do PP | P0 |
| FIN-07 | Upload NF do PP | Anexo obrigatório para liberar repasse | P0 |
| FIN-08 | Upload recibo paciente | Vinculado ao lançamento do ciclo | P1 |
| FIN-09 | Transferência Wallet Asaas | Liberação após validação gestão/financeiro | P0 |
| FIN-10 | Folha de comparecimento | Upload/validação assinada pelo paciente (obrigatório contrato PP) | P1 |
| FIN-11 | Histórico financeiro | Por profissional, paciente e ciclo | P0 |
| FIN-12 | Despesas internas | Registro de custos fixos/variáveis (espelhar aba Financeiro) | P2 |

**Formas de pagamento aceitas:** PIX, boleto. **Excluído:** cartão de crédito.

---

### 6.8 Motor de Repasses

**Objetivo:** Cálculo auditável Bronze/Prata/Ouro com regras especiais.

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| REP-01 | Tabela V1-2026 | Matriz Região × Nível editável com versionamento | P0 |
| REP-02 | Simulador de ciclo | Valor paciente → repasse PP % → margem Larsana | P0 |
| REP-03 | Comissionamento por classe | Bronze 70% / Prata 75% / Ouro 80% sobre valor do ciclo | P0 |
| REP-04 | Taxa 1º mês paciente novo | Retenção Larsana 40% no 1º mês de paciente captado pela plataforma | P0 |
| REP-05 | Distinção de valores | Valor cobrado do paciente ≠ repasse ao PP (PP não vê valor integral) | P0 |
| REP-06 | Liberação automática na fila | Após último atendimento do ciclo + NF + validação | P0 |
| REP-07 | Notificação PP | In-app (web) e push (app) quando repasse liberado | P1 |
| REP-08 | Exportação DELUMA | Cada repasse com NF + recibo do mesmo ciclo (XLSX/CSV) | P0 |

**Tabela V1-2026 (referência):**

| Região | Cidades | N1 | N2 | N3 |
|--------|---------|-----|-----|-----|
| A | Mauá, Ribeirão Pires, Rio Grande da Serra, Diadema | R$ 100 | R$ 130 | R$ 150 |
| B | Santo André, São Bernardo | R$ 130 | R$ 150 | R$ 170 |
| C | São Caetano, São Paulo Capital | R$ 150 | R$ 180 | R$ 200 |

---

### 6.9 Matching e Regiões

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| MAT-01 | Cadastro cidades/bairros | Vinculação automática à região | P1 |
| MAT-02 | Sugestão de PP | Por proximidade, especialidade, classe, carga horária | P2 |
| MAT-03 | Mapa de demandas | Demandas domiciliares no mapa (estilo Uber) | P1 |
| MAT-04 | Aceitar/recusar demanda | PP confirma ou recusa na web ou no app | P1 |
| MAT-05 | Limite 30h/semana | Bloqueio ou alerta conforme norma CREFITO | P1 |

---

### 6.10 Profissional Parceiro — Portal Web + App Nativo

**Superfícies:** Portal Web (`/profissional/*`) + App nativo iOS/Android. **Paridade funcional obrigatória** (exceto recursos exclusivos de device: push, GPS, offline).

| ID | Funcionalidade | Web | App | Descrição | Prioridade |
|----|----------------|-----|-----|-----------|------------|
| APP-PP-01 | Agenda do dia | ✓ | ✓ | Sessões com endereço domiciliar e navegação | P0 |
| APP-PP-02 | Lista/mapa de demandas | ✓ | ✓ | Novas oportunidades por proximidade; app usa GPS | P1 |
| APP-PP-03 | Aceitar/recusar demanda | ✓ | ✓ | Com registro de motivo | P1 |
| APP-PP-04 | Status avaliação família | ✓ | ✓ | Card rastreio por paciente avaliado | P0 |
| APP-PP-05 | Evolução clínica | ✓ | ✓ | Editor de prontuário por sessão; app com rascunho offline | P0 |
| APP-PP-06 | Check-in domiciliar | ✓ | ✓ | Registro de chegada/saída; app com geolocalização | P2 |
| APP-PP-07 | Upload comparecimento | ✓ | ✓ | Folha assinada; app com câmera nativa | P1 |
| APP-PP-08 | Ganhos / repasses | ✓ | ✓ | Somente valor de repasse — sem valor integral do paciente | P0 |
| APP-PP-09 | Notificações | In-app | Push | Resposta família, repasse liberado, alerta prontuário | P1 |
| APP-PP-10 | Cartão de visita digital | ✓ | ✓ | Dados do PP para apresentação ao paciente | P2 |
| APP-PP-11 | Credenciamento self-service | ✓ | ✓ | Upload docs, aceite termos, assinatura contrato | P0 |

---

### 6.11 Paciente e Responsável — Portal Web + App Nativo

**Superfícies:** Portal Web (`/paciente/*`) + App nativo iOS/Android. Interface simplificada para responsáveis e famílias (incluindo usuários idosos).

| ID | Funcionalidade | Web | App | Descrição | Prioridade |
|----|----------------|-----|-----|-----------|------------|
| APP-PAC-01 | Login responsável | ✓ | ✓ | Vinculado ao paciente | P0 |
| APP-PAC-02 | Timeline de tratamento | ✓ | ✓ | PP, ciclo, próximas sessões | P0 |
| APP-PAC-03 | Pagamento antecipado | ✓ | ✓ | PIX/boleto do ciclo via Asaas | P0 |
| APP-PAC-04 | Bloqueio visual | ✓ | ✓ | Indicador se pagamento pendente | P0 |
| APP-PAC-05 | Comprovante digital | ✓ | ✓ | Após confirmação de pagamento | P1 |
| APP-PAC-06 | Aceite digital 1º acesso | ✓ | ✓ | Termo + Diretrizes + LGPD | P0 |
| APP-PAC-07 | Reaceite por versão | ✓ | ✓ | Obrigatório quando termos mudarem | P1 |
| APP-PAC-08 | NPS fim de ciclo | ✓ | ✓ | 24h após última sessão; push no app | P2 |
| APP-PAC-09 | Resposta proposta avaliação | ✓ | ✓ | SIM/NÃO à proposta pós-avaliação (workflow AVL) | P0 |
| APP-PAC-10 | Dados do responsável | ✓ | ✓ | Edição de contato e endereço (com validação gestão) | P1 |
| APP-PAC-11 | Solicitar atendimento | ✓ | ✓ | Fluxo de demanda + mapa SVG + timeline Correios | P0 (V1.1) |
| APP-PAC-12 | Lista de espera regional | ✓ | ✓ | CTA quando região sem cobertura PP | P0 (V1.1) |

---

### 6.12 NPS e Qualidade

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| NPS-01 | NPS automático | 24h após última sessão do ciclo (paciente → PP e PP → paciente) | P2 |
| NPS-02 | Score por PP | Ranking no painel | P2 |
| NPS-03 | Alerta nota ≤ 6 | Em dois ciclos consecutivos | P2 |
| NPS-04 | Priorização de demandas | PP bem avaliados recebem demandas primeiro | P3 |

---

### 6.13 RBAC, LGPD e Auditoria

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| SEC-01 | Perfis segregados | Admin, Financeiro, Gestão, PP, Paciente | P0 |
| SEC-02 | Aceite versionado | Termos com histórico de aceites por titular | P0 |
| SEC-03 | Log de acessos | Quem acessou prontuário e quando | P0 |
| SEC-04 | Log de edições | Trilha em prontuário e dados financeiros | P0 |
| SEC-05 | Retenção 5 anos | Dados do PP após término do vínculo (contrato) | P1 |
| SEC-06 | Portabilidade / revogação | Fluxo de solicitação LGPD | P2 |
| SEC-07 | Proteção carteira | Registro de tentativas de desvio (alerta gestão) | P2 |

---

### 6.14 Relatórios e BI Operacional

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| REL-01 | Pacote DELUMA mensal | Recebido, repassado, margem, NF e recibo por ciclo | P0 |
| REL-02 | Relatório faturamento | Recebido vs repassado vs margem | P1 |
| REL-03 | Aging repasses | Ciclo fechado aguardando NF | P1 |
| REL-04 | Horas por PP | vs limite 30h CREFITO | P1 |
| REL-05 | Conversão avaliação → 1º ciclo | Taxa de conversão comercial | P1 |
| REL-06 | Exportação PDF/XLSX | Demais relatórios operacionais | P2 |

---

### 6.15 Configurações e Administração

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| CFG-01 | Matriz Região × Nível | Edição com versionamento (V1-2026, V2…) | P0 |
| CFG-02 | Simulador de precificação | Paciente paga vs repasse PP | P1 |
| CFG-03 | Gestão de termos | Upload nova versão; dispara reaceite | P1 |
| CFG-04 | Templates de contrato | LRS-PROF por profissão | P0 |
| CFG-05 | Tickets de suporte | Abertura e acompanhamento pós-go-live | P2 |
| CFG-06 | Usuários e permissões | CRUD de contas do painel | P0 |

---

## 7. Regras de negócio consolidadas

### 7.1 Financeiro

```
1. Valor ciclo = qtd_sessões (4 ou 8) × valor_sessão(Região, Nível)
2. Paciente paga ANTECIPADO (PIX/boleto) → valor retido Larsana
3. Sessões só ocorrem com pagamento confirmado
4. Ao encerrar ciclo → entra na fila de repasse
5. Repasse = f(classe PP, 1º mês?, valor ciclo) — ver simulador
6. Liberação repasse = ciclo encerrado + NF PP + (opcional) comparecimento + validação financeiro
7. SEM split instantâneo no Asaas
```

### 7.2 Comissionamento PP

| Classe | % PP | % Larsana |
|--------|------|-----------|
| Bronze | 70% | 30% |
| Prata | 75% | 25% |
| Ouro | 80% | 20% |

**Exceção:** 1º mês de paciente novo captado pela plataforma → Larsana retém **40%** (independente da classe, salvo regra manual).

### 7.3 Avaliação inicial

| Evento | Ação |
|--------|------|
| PP realiza avaliação | Estado: "Avaliação feita" |
| Gestão envia proposta | Estado: "Proposta enviada" → timer 5 dias úteis |
| Família aceita (SIM) | Libera 1º ciclo; avaliação conta como 1ª sessão |
| Família recusa (NÃO) | Cobrança R$ 50 (30 dias) pela avaliação |
| Sem resposta em 5d | Alerta gestão; escalação manual |

### 7.4 Prontuário (CREFITO)

- Alerta operacional: **24h** após sessão sem evolução  
- Prazo contratual exibido: **7 dias úteis** para registro definitivo  
- Obrigatório: nome PP + número CREFITO em cada registro  

### 7.5 Credenciamento

- PP **não recebe demandas** sem: documentos OK + termos aceitos + contrato LRS-PROF assinado + aprovação gestão + Wallet Asaas  
- Numeração contrato sequencial por profissão: `LRS-PROF.FISIO-2026-0001`, `0002`…  

### 7.6 Proteção de carteira (contrato)

- PP: proibido atender paciente Larsana fora da plataforma  
- Paciente: proibido negociar direto com PP por 12 meses após último atendimento  
- Multa contratual por desvio (registro de incidente no sistema)  

### 7.7 Exceções operacionais

| Caso | Tratamento |
|------|------------|
| Valor Social | Nível especial; valor negociado; aprovação gestão |
| PAUSA | Tratamento suspenso; histórico preservado |
| Intercorrência / internação | Tipo de sessão; não conta como realizada |
| PP avalia e atende mesmo paciente | Permitido; sistema deve vincular papéis corretamente |
| Profissão CUIDA (COREN) | Fluxo paralelo `LRS-PROF.CUIDA`; sem Wallet até integração |

---

## 8. Integrações

| Sistema | Uso | Prioridade |
|---------|-----|------------|
| **Asaas** | Clientes, cobranças PIX/boleto, webhooks, Wallet/transferência PP | P0 |
| **E-mail / Push** | Notificações de workflow, cobrança, repasse | P1 |
| **Exportação DELUMA** | XLSX/CSV mensal (sem API contábil V1) | P0 |
| **Google Drive** | Apenas migração inicial de documentos; depois storage próprio | P1 |

### Webhooks Asaas (mínimo)

- `PAYMENT_CONFIRMED` → libera sessões do ciclo  
- `PAYMENT_OVERDUE` → alerta gestão + bloqueio visual paciente  
- `TRANSFER_DONE` → confirma repasse ao PP  

---

## 9. Migração de dados (seed)

**Fonte:** planilhas `Banco de Dados - LARSANA CARE.xlsx`, `Financeiro`, `Atendimentos/*`.

| Entidade | Registros estimados | Observação |
|----------|---------------------|------------|
| Profissionais | 12 | Inclui 1 Ouro (Marina), 2 CUIDA pendentes |
| Pacientes | ~18 | Mix ATIVO/PAUSA; 4 Valor Social |
| Ciclos históricos | Dezenas | Manoel Ciclo 2, Rubens Ciclo 12, Jessica Ciclo 24 |
| Wallets Asaas | 10 UUIDs | Já existentes na planilha |
| Tabela preços | V1-2026 | Aba Valores |
| Pagamentos maio/2026 | ~10 lançamentos | Base para validar motor financeiro |

**Validações na migração:**

- Normalizar telefones (corrigir `#VALUE!` da aba ClientesAsaas)  
- Deduplicar linhas de pagamento duplicadas  
- Mapear links Google Drive → storage interno gradualmente  

---

## 10. Requisitos não funcionais

| Categoria | Requisito |
|-----------|-----------|
| **Stack web** | React 18 + Vite + TypeScript + Tailwind + shadcn/ui (ver DESIGN_SYSTEM.md) |
| **Stack apps nativos** | React Native ou Flutter (a definir); mesma API REST/GraphQL da web |
| **Disponibilidade** | 99,5% em horário comercial (web + API) |
| **LGPD** | Dados de saúde com criptografia em repouso; acesso logado |
| **Performance web** | Dashboard admin < 3s; portais PP/Paciente < 2s em 4G |
| **Performance apps** | Cold start < 3s; sincronização offline de rascunhos PP |
| **Responsividade** | Web admin desktop-first; portais PP e Paciente mobile-first (breakpoints design system) |
| **Acessibilidade** | WCAG 2.1 AA em toda a aplicação web (incluindo portal paciente) |
| **Apps nativos** | iOS 15+ / Android 10+; publicação lojas na Fase 3 |
| **Backup** | Diário; retenção 90 dias |
| **Garantia** | 90 dias pós-entrega com sistema de tickets |

---

## 11. Fases de entrega

### Fase 1 — Aplicação Web Completa + Motor Core (~45 dias úteis)

**Entrega:** web com **todos os acessos** operacionais — sem depender dos apps nativos.

- Login unificado + RBAC + roteamento por perfil (WEB-01 a WEB-08)  
- **Área Administrativa:** dashboard, pacientes, PP, ciclos, financeiro, relatórios, configurações  
- **Portal PP (web):** agenda, prontuário, demandas, status avaliação, repasses, credenciamento  
- **Portal Paciente (web):** timeline, pagamento PIX/boleto, aceites, resposta proposta SIM/NÃO  
- Migração cadastros (PP + pacientes + tabela V1-2026)  
- Credenciamento LRS-PROF + contratos digitais  
- Ciclos + prontuário + alertas 24h  
- Cobrança Asaas + repasse pós-ciclo + exportação DELUMA  

**Critério de go-live Fase 1:** operação Larsana 100% na web, sem planilhas.

### Fase 2 — Apps Nativos Profissional Parceiro

- Publicação iOS/Android (categoria Saúde e Bem-estar)  
- Paridade com Portal PP web (APP-PP-01 a APP-PP-11)  
- Push notifications, GPS/mapa, câmera, rascunho offline de evolução  
- Web continua disponível como alternativa completa  

### Fase 3 — Apps Nativos Paciente/Responsável

- Publicação iOS/Android  
- Paridade com Portal Paciente web (APP-PAC-01 a APP-PAC-10)  
- Push para cobrança, proposta e NPS  
- Web continua disponível (importante para famílias que preferem desktop ou não instalam apps)  

---

## 12. Critérios de aceite globais

- [ ] Nenhuma operação crítica depende de planilha externa  
- [ ] Ciclo não inicia sem pagamento antecipado confirmado  
- [ ] Repasse não libera sem NF do PP anexada  
- [ ] PP não visualiza valor integral cobrado do paciente  
- [ ] Avaliação inicial com rastreio visível na área admin, portal PP (web) e app PP  
- [ ] PP e Paciente conseguem realizar 100% das ações do seu perfil pela **web** (sem app)  
- [ ] Apps nativos em paridade funcional com os portais web correspondentes  
- [ ] Exportação DELUMA reproduz dados de maio/2026 com precisão  
- [ ] Alerta prontuário dispara em 24h após sessão sem registro  
- [ ] Aceite de termos bloqueia workflow sem versão vigente  

---

## 13. Riscos e dependências

| Risco | Mitigação |
|-------|-----------|
| Regras de repasse mais complexas que % fixo | Motor configurável + simulador + override manual auditado |
| Asaas Wallet por PP | Criar no credenciamento; fallback manual para exceções |
| Dados sensíveis na migração | Ambiente staging; anonimização em dev |
| Evolução split → pós-ciclo | Documentar decisão; não implementar split |
| App stores saúde | Categoria "Saúde e Bem-estar"; intermediação, não telemedicina |

---

## 14. Referências

- `desafio.md` — problema e abordagem  
- `modulos.md` — escopo funcional acordado  
- `DESIGN_SYSTEM.md` — stack e tokens visuais  
- `LarsanaCarePreviews.tsx` — 14 telas de referência UX  
- `plataforma-fisio-textos-extraidos/` — dados reais, contratos e termos  
- `plataforma fisio/transcricao.md` — call comercial original  

---

## 15. Addendum — Módulo Academy (extensão pós-V1)

O **Academy** é uma extensão do ecossistema Larsana Care alinhada à vertical **Saúde e Educação** da DELUMA. Não substitui o escopo operacional do PRD v1.1; complementa a plataforma com capacitação de PP e educação do paciente.

### 15.1 Escopo

| Produto | Público | Objetivo |
|---------|---------|----------|
| **Formação PP** | Profissional Parceiro | Capacitar PP para operar na plataforma (trilha M1–M5) |
| **LarsanaPill / PHIL** | Paciente / Responsável | Orientações domiciliares, exercícios guiados, ebooks (P1–P6) |
| **CMS + Config** | Admin / Gestão | Publicar conteúdo; Super Admin configura gates operacionais |

### 15.2 Gates configuráveis

Gates controlam **captação de novos casos**, não o atendimento em andamento:

- **Default:** gate `demands` ativo exigindo M1+M2+M3
- **Nunca bloqueados:** agenda, evolução clínica, repasses
- **Configuração:** `/admin/academy/config` (somente role `admin`)
- **Grandfathering:** PP credenciado pré-Academy isento via `pp_academy_exemptions`

Documentação detalhada: `docs/ACADEMY.md` e `docs/PAGES.md` (rotas Academy).

### 15.3 Paridade web

Formação PP e LarsanaPill estão disponíveis na **web** nesta fase. Apps nativos podem consumir as mesmas APIs em versão futura.

---

## 16. Glossário

| Termo | Definição |
|-------|-----------|
| **PP** | Profissional Parceiro habilitado e credenciado |
| **Ciclo** | Pacote de 4 ou 8 sessões domiciliares |
| **LRS-PROF** | Contrato de parceria PP × Larsana |
| **DELUMA** | Contabilidade; destino das exportações financeiras |
| **Valor Social** | Preço negociado abaixo da tabela; requer aprovação |
| **Wallet ID** | Identificador Asaas para repasse ao PP |
| **Portal Web** | Área da aplicação web destinada a PP ou Paciente (fora da área admin) |
| **Paridade** | Mesma funcionalidade disponível na web e no app nativo do mesmo perfil |
| **Academy** | Módulo de educação: Formação PP (LMS) + LarsanaPill (PHIL) |
| **LarsanaPill** | Conteúdo educacional para pacientes — complemento ao tratamento presencial |
| **Gate Academy** | Regra configurável que condiciona acesso a demandas (ou outros alvos) à conclusão da trilha |
| **Terapia** | Termo de UI para atendimento domiciliar registrado (equivale a `care_session` no schema) |
| **Lista de espera** | Lead de paciente em região sem cobertura PP; gestão pode contatar quando houver capacidade |
