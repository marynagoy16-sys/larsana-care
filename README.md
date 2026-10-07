<p align="center">
  <img src="frontend/public/brand/logo-horizontal-v1-dark.svg" alt="LarsanaCare" width="300" />
</p>

<p align="center">
  <strong>Fisioterapia Domiciliar</strong><br />
  Ecossistema de gestão de fisioterapia domiciliar (DELUMA) — ABC/SP.
</p>

---

## Roadmap

Legenda de status:

| Ícone | Significado |
|-------|-------------|
| ✅ | Concluído |
| 🔄 | Em andamento |
| ⚠️ | Parcial / precisa validação |
| ❌ | Pendente |
| 🔍 | Decisão externa ou spike |

> Referências: [PRD](docs/PRD.md) · [Mapa de páginas](docs/PAGES.md) · [Checklist Fase 0](docs/FASE0_CHECKLIST_ALINHAMENTO.md) · [Adequação 07/10/2026](docs/RELATORIO_ATUALIZACOES_2026-10-07.md)

### Fase 0 — Fundação e alinhamento

| Módulo / entrega | Web | Mobile | Status |
|------------------|:---:|:------:|:------:|
| Identidade visual (logo, paleta, design system) | ✅ | ✅ | ✅ |
| Schema Supabase + migrations + RLS | ✅ | ✅ | ✅ |
| Monorepo (web + apps nativos + shared) | ✅ | ✅ | ✅ |
| Academy LMS (admin / PP / paciente) | ✅ | ⚠️ | ✅ |
| Documentação (PRD, páginas, módulos, spikes) | ✅ | — | ✅ |

### Fase 1 — Portal web completo (Admin · Gestão · Financeiro)

| Módulo / funcionalidade | Status | Notas |
|-------------------------|:------:|-------|
| Dashboard e KPIs operacionais | ✅ | Pacientes, ciclos, alertas |
| Cadastro de pacientes (wizard multi-etapas) | ✅ | Dados, responsável, endereço, docs |
| Profissionais e credenciamento (gestão) | ✅ | Aprovação, categorias técnicas |
| Avaliações iniciais e proposta comercial | ⚠️ | Workflow ok; copy “nível confirmado” parcial |
| Ciclos de atendimento e sessões | ✅ | Abertura, grade, status |
| Demandas e matching geográfico | ✅ | Admin + mapa |
| Pausas e encerramentos | ⚠️ | Regras PDF v6 em validação |
| Cobranças e caixa (recebido vs a repassar) | ✅ | PIX/boleto Asaas em produção; webhook confirma pagamentos |
| Repasses pós-ciclo (liberação + NF) | ⚠️ | Transferência wallet Asaas ativa; validação operacional de NF/retenção |
| Lista de espera regional (admin) | ✅ | `/admin/lista-espera` |
| Regiões A/B/C e tabela de preços V1-2026 | ✅ | |
| Exportação contábil DELUMA | ❌ | Planejado pós-go-live |
| Prontuário e imutabilidade de evoluções | ⚠️ | Assinatura textual; ICP-Brasil em spike |

### Fase 2 — Portal Profissional Parceiro (PP)

| Módulo / funcionalidade | Web | Mobile | Status |
|-------------------------|:---:|:------:|:------:|
| Agenda (semanal 5h–22h, detalhe sessão) | ✅ | ✅ | ✅ |
| Demandas (aceitar / recusar, mapa) | ✅ | ✅ | ✅ |
| Minha jornada (rastreio avaliação → proposta) | ✅ | ✅ | ✅ |
| Wizard pós-aceite (disponibilidade / agendamento) | ✅ | ⚠️ | ✅ |
| Remarcar sessão (pedido do paciente; PP recoloca em 14 dias; SUB só quando o PP desmarca) | ✅ | ⚠️ | ✅ |
| Evolução / prontuário por ciclos | ✅ | ✅ | ✅ |
| Credenciamento self-service | ✅ | ✅ | ✅ |
| Categorias técnicas + habilitação cardio | ✅ | ⚠️ | ✅ |
| Repasses (lista, detalhe, upload NF) | ✅ | ⚠️ | ✅ |
| Patentes (permanente + variável, tempo 3/9/12 meses) | ✅ | ⚠️ | ✅ |
| Academy (trilhas M1–M5 + gates) | ✅ | ✅ | ✅ |
| Notificações in-app | ✅ | ⚠️ | ⚠️ |

### Fase 3 — Portal Paciente / Responsável

| Módulo / funcionalidade | Web | Mobile | Status |
|-------------------------|:---:|:------:|:------:|
| Auth: login, cadastro dual (paciente / PP) | ✅ | ⚠️ | ⚠️ |
| Recuperar / redefinir senha | ✅ | ❌ | ⚠️ |
| Onboarding pós-cadastro (qualquer município; cobertura só na solicitação) | ✅ | ❌ | ✅ |
| Início / timeline do tratamento | ✅ | ✅ | ✅ |
| Solicitar atendimento (formulário + demanda + mapa) | ✅ | ✅ | ✅ |
| Remarcar sessão (só pedido; prazo de 14 dias fica com o PP) | ✅ | ❌ | ✅ |
| Aceite/recusa remarcação e oferta SUB | ✅ | ❌ | ⚠️ |
| Lista de espera (“Desejo iniciar tratamento”) | ✅ | ✅ | ✅ |
| Timeline solicitação (estilo Correios) | ⚠️ | ⚠️ | ⚠️ |
| Confirmação de horário (pós-agendamento PP) | ✅ | ⚠️ | ✅ |
| Resposta à proposta de avaliação (SIM/NÃO) | ✅ | ⚠️ | ✅ |
| Tratamento / detalhe do ciclo | ✅ | ✅ | ✅ |
| Pagamentos antecipados (PIX/boleto Asaas) | ✅ | ⚠️ | ✅ |
| Documentos legais (onboarding, credenciamento, aceite por ciclo, TCLE) | ✅ | ⚠️ | ✅ |
| Aceite legal na solicitação (TCLE + privacidade; sem contrato de intermediação) | ✅ | ⚠️ | ✅ |
| LarsanaPill (conteúdo PHIL + planos) | ✅ | ✅ | ✅ |
| Documentos, conta, ajuda, NPS | ✅ | ⚠️ | ⚠️ |

### Fase 4 — Financeiro e integrações

| Módulo / funcionalidade | Status | Notas |
|-------------------------|:------:|-------|
| Asaas: cobrança PIX/boleto (produção) | ✅ | `create-charge` + `payment-webhook` ativos (conta DELUMA) |
| Taxa de avaliação (`assessment_request`) | ✅ | PIX/boleto; confirmação libera demanda |
| Pagamento antecipado antes da 1ª sessão do ciclo | ✅ | Abatimento da taxa de avaliação quando aplicável |
| Repasse PP (wallet Asaas) | ✅ | Wallet colado pelo PP; aprovação não cria subconta. `transfer-wallet` |
| Split PF/PJ + retenção 1º ciclo (PDF v6) | ⚠️ | Regras no DB; auditoria operacional pendente |
| Pausa justificada / injustificada + reembolso | ⚠️ | Lógica DB; edge cases em validação |
| App Financeiro (mobile) | ⚠️ | Repasses e liberação; escopo menor que a web |
| Exportação DELUMA (NF + recibos por ciclo) | ❌ | |
| Academy vendas (checkout Asaas — track Elias) | ❌ | Não bloqueia soft launch |

### Fase 5 — Go-live e evolução

| Módulo / entrega | Status | Notas |
|------------------|:------:|-------|
| Publicação app Paciente (App Store / Play) | ❌ | `eas.json` pronto; submit pendente |
| Publicação app Profissional | 🔄 | Validação paralela com PP |
| App Gestão (mobile) | ❌ | Placeholder |
| Backend API dedicada (`backend/`) | ❌ | Supabase + RPCs hoje |
| Assinatura digital ICP (evoluções CREFITO) | 🔍 | [Spike](docs/SPIKE_ASSINATURA_DIGITAL.md) |
| Check-in GPS / cartão de visita PP | ❌ | P2 |
| Suporte (tickets pós-go-live) | ❌ | P2 |

### Fluxo comercial (referência)

```
Cadastro → Solicitar atendimento (sem pagamento)
    → Demanda → PP aceita → Avaliação → Proposta
    → Família responde SIM → Gestão abre ciclo → Pagamento antecipado
    → Sessões liberadas → Repasse pós-ciclo (com NF do PP)
```

Pagamento **não** é exigido na solicitação inicial — apenas antes das sessões do ciclo, após aceite da proposta. A **taxa de avaliação** é cobrada via Asaas quando o paciente avança no fluxo de solicitação (antes da demanda ir ao matching).

### Financeiro — Asaas em produção

Integração ativa com a conta **DELUMA SSE LTDA** no Asaas:

| Fluxo | Edge function / RPC | Efeito após confirmação |
|-------|---------------------|-------------------------|
| Taxa de avaliação | `create-charge` → webhook | Demanda aberta / matching |
| Ciclo de tratamento (antecipado) | `create-charge` → webhook | Ciclo ativo + sessões previstas |
| Repasse ao PP | `transfer-wallet` | Crédito na wallet Asaas do profissional |
| Subconta PP | `create-asaas-subaccount` | `asaas_wallet_id` no credenciamento |

- **Webhook:** `payment-webhook` (eventos `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, etc.)
- **Simulação:** botão *Simular pagamento* só em dev/staging — oculto no build de produção (ver variáveis acima)
- **Operação e troubleshooting:** [docs/ASAAS_PRODUCAO.md](docs/ASAAS_PRODUCAO.md) (chave Pix recebedora, secrets Supabase, teste E2E)

### Remarcação e SUB (regras V1)

| Regra | Comportamento |
|-------|---------------|
| Antecedência mínima | **12h** (antes era 2h) |
| Janela paciente (mesmo PP) | Até **14 dias** à frente |
| PP ≥12h | Proposta de novo horário → paciente **aceita ou recusa** antes de confirmar |
| Paciente (menos de 12h) | Exige **atestado**; repõe sessão e cobra **50%** (taxa tardia) |
| PP (menos de 12h) | Oferta de **SUB** (substituto); se recusado, PP titular remarca em 14d |

Migrations aplicadas no remoto: `20260815180000`, `20260815180100`, `20260815190000`.

---

## Estrutura

```
├── frontend/         # App web (React + Vite + Supabase)
├── mobile/           # Apps nativos (container)
│   └── apps/
│       ├── profissional/  # LarsanaCare Profissional (PP) — ativo
│       ├── paciente/      # LarsanaCare Paciente — ativo
│       ├── financeiro/    # LarsanaCare Financeiro — ativo
│       └── gestao/        # placeholder
├── packages/shared/  # Tipos, regras e tokens compartilhados
├── backend/          # API futura
├── data/supabase/    # Migrations, seed, types
├── docs/             # PRD, páginas, design system
├── docker/           # Container frontend
└── scripts/          # Utilitários locais
```

## Desenvolvimento

### Pré-requisitos

- Node.js 20+
- Conta Supabase (projeto `kispjnlmklzfhxhtdyvm`)

### Setup

```powershell
.\scripts\setup-dev.ps1
```

Copie `.env.example` para `.env` na raiz e preencha:

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave anon/public do Supabase |
| `VITE_ENABLE_DEV_LOGIN` | — | Botões de login rápido na tela de auth (`true` em dev/Docker local; omitir ou `false` em produção) |
| `VITE_ENABLE_PAYMENT_SIMULATION` | — | Botão **Simular pagamento** (avaliação e ciclo). **Desligado em produção por padrão**; ligado em `npm run dev`. Use `true` só em staging/homologação |
| `DOCKER_IMAGE` | — | Tag da imagem Docker (padrão: `sagittadigital/larsana-care-frontend:latest`) |

Mobile (paciente): `EXPO_PUBLIC_ENABLE_PAYMENT_SIMULATION` segue a mesma regra (`__DEV__` liga; produção desliga).

### Comandos de desenvolvimento (raiz do repositório)

| Comando | Ambiente |
|---------|----------|
| `npm run dev:web` | Frontend web (Vite) |
| `npm run dev:mobile -- profissional` | Mobile — Profissional (PP) |
| `npm run dev:mobile -- paciente` | Mobile — Paciente |
| `npm run dev:mobile -- financeiro` | Mobile — Financeiro |

Atalhos equivalentes:

```bash
npm run dev:mobile:profissional
npm run dev:mobile:paciente
npm run dev:mobile:financeiro
```

Também aceita o prefixo `--` no app: `npm run dev:mobile -- --paciente`.

### Setup mobile (1ª vez)

Os apps em `mobile/apps/` são instalados de forma **isolada** (fora do hoisting dos workspaces) para evitar conflito entre o Tailwind v4 da web e o Tailwind v3 exigido pelo NativeWind.

```bash
cd mobile/apps/profissional && npm install
cd mobile/apps/paciente && npm install
cd mobile/apps/financeiro && npm install
```

Configure `mobile/apps/<app>/.env` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mesmos valores da web). O script `dev:mobile` copia automaticamente de `profissional/.env` quando o arquivo não existir.

Veja também [mobile/README.md](mobile/README.md) para o mapa completo dos apps mobile.

### Supabase (migrations remotas)

O histórico local de migrations foi consolidado; o `db push` pode falhar por versões antigas no remoto. Para aplicar uma migration nova:

```powershell
cd data
npx supabase db query --linked -f supabase/migrations/<arquivo>.sql
npx supabase migration repair --status applied <versao>
```

Scripts operacionais em `data/supabase/scripts/`:

| Script | Uso |
|--------|-----|
| `cleanup-all-test-patients.sql` | Remove pacientes de teste (seed, carga, contas QA) |
| `cleanup-all-test-professionals.sql` | Remove profissionais de teste (seed, `@larsanacare.com.br`, contas QA) |

Usuários seed (dev local após `supabase db reset`; senha `LarsanaCare2026!`):

| E-mail | Perfil |
|--------|--------|
| parceiro@larsanacare.com.br | Profissional (PP demo) |
| financeiro@larsanacare.com.br | Financeiro |

### Docker (local)

```bash
docker compose up --build
```

Acesse http://localhost:5173

### Docker Swarm + Traefik

Build e push da imagem (usa `VITE_SUPABASE_*` e `VITE_ENABLE_DEV_LOGIN` do `.env`; **não** embute simulação de pagamento — produção fica sem o botão):

```powershell
# .env: DOCKER_IMAGE=sagittadigital/larsana-care-frontend:latest
.\scripts\docker-build-push.ps1
```

Deploy da stack (rede `sagitta` externa):

```bash
docker stack deploy -c docker/stack.yml larsana-care
```

Atualizar serviço já publicado com nova imagem:

```bash
docker service update --image sagittadigital/larsana-care-frontend:latest larsana-care_larsana_care_frontend
```

Produção: `app.larsanacare.com.br` (ver hosts em `docker/stack.yml`). Atualize Supabase Auth (Site URL + Redirect URLs) após mudar o domínio.

### Usuários dev (senha: `LarsanaCare2026!`)

| E-mail | Perfil |
|--------|--------|
| admin@larsanacare.com.br | Admin |
| financeiro@larsanacare.com.br | Financeiro |
| gestao@larsanacare.com.br | Gestão |
| parceiro@larsanacare.com.br | Profissional (PP) |
| cliente@larsanacare.com.br | Paciente |

## Documentação

- [PRD](docs/PRD.md)
- [Mapa de páginas](docs/PAGES.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Módulos](docs/modulos.md)
- [Documentos legais no app](docs/DOCUMENTOS_LEGAIS_INTEGRACAO.md)
- [Checklist go-live](docs/GO_LIVE_CHECKLIST.md)
- [Asaas produção](docs/ASAAS_PRODUCAO.md)
- [Checklist Fase 0](docs/FASE0_CHECKLIST_ALINHAMENTO.md)
- [Academy](docs/ACADEMY.md)
