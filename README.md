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

> Referências: [PRD](docs/PRD.md) · [Mapa de páginas](docs/PAGES.md) · [Checklist Fase 0](docs/FASE0_CHECKLIST_ALINHAMENTO.md)

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
| Cobranças e caixa (recebido vs a repassar) | ⚠️ | Schema ok; Asaas produção pendente |
| Repasses pós-ciclo (liberação + NF) | ⚠️ | Fluxo admin; validação financeira pendente |
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
| Remarcar sessão (12h/14d, aceite paciente, SUB) | ✅ | ❌ | ⚠️ |
| Evolução / prontuário por ciclos | ✅ | ✅ | ✅ |
| Credenciamento self-service | ✅ | ✅ | ✅ |
| Categorias técnicas + habilitação cardio | ✅ | ⚠️ | ✅ |
| Repasses (lista, detalhe, upload NF) | ✅ | ⚠️ | ✅ |
| Patentes / pontos / gamificação | ✅ | ❌ | ⚠️ |
| Academy (trilhas M1–M5 + gates) | ✅ | ✅ | ✅ |
| Notificações in-app | ✅ | ⚠️ | ⚠️ |

### Fase 3 — Portal Paciente / Responsável

| Módulo / funcionalidade | Web | Mobile | Status |
|-------------------------|:---:|:------:|:------:|
| Auth: login, cadastro dual (paciente / PP) | ✅ | ⚠️ | ⚠️ |
| Recuperar / redefinir senha | ✅ | ❌ | ⚠️ |
| Onboarding pós-cadastro (endereço + região) | ✅ | ❌ | 🔄 |
| Início / timeline do tratamento | ✅ | ✅ | ✅ |
| Solicitar atendimento (formulário + demanda + mapa) | ✅ | ✅ | ✅ |
| Remarcar sessão (mesmo PP 14d; menos de 12h: atestado + 50%) | ✅ | ❌ | ⚠️ |
| Aceite/recusa remarcação e oferta SUB | ✅ | ❌ | ⚠️ |
| Lista de espera (“Desejo iniciar tratamento”) | ✅ | ✅ | ✅ |
| Timeline solicitação (estilo Correios) | ⚠️ | ⚠️ | ⚠️ |
| Confirmação de horário (pós-agendamento PP) | ✅ | ⚠️ | ✅ |
| Resposta à proposta de avaliação (SIM/NÃO) | ✅ | ⚠️ | ✅ |
| Tratamento / detalhe do ciclo | ✅ | ✅ | ✅ |
| Pagamentos antecipados (PIX/boleto Asaas) | ⚠️ | ⚠️ | ⚠️ |
| Aceite legal (Contrato intermediação + Termo consentimento) | ✅ | ⚠️ | ⚠️ |
| LarsanaPill (conteúdo PHIL + planos) | ✅ | ✅ | ✅ |
| Documentos, conta, ajuda, NPS | ✅ | ⚠️ | ⚠️ |

### Fase 4 — Financeiro e integrações

| Módulo / funcionalidade | Status | Notas |
|-------------------------|:------:|-------|
| Asaas: cobrança PIX/boleto (produção) | ❌ | Stub / dev; webhook pendente |
| Pagamento antecipado antes da 1ª sessão do ciclo | ⚠️ | Regra de negócio definida; integração pendente |
| Split PF/PJ + retenção 1º ciclo (PDF v6) | ⚠️ | Migrations parciais; auditoria Fase 4 |
| Pausa justificada / injustificada + reembolso | ⚠️ | Lógica DB; edge cases em validação |
| Wallet Asaas PP (credenciamento) | ⚠️ | |
| App Financeiro (mobile) | ⚠️ | App ativo; escopo operacional limitado |
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

Pagamento **não** é exigido na solicitação inicial — apenas antes das sessões do ciclo, após aceite da proposta.

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

```
VITE_SUPABASE_URL=https://kispjnlmklzfhxhtdyvm.supabase.co
VITE_SUPABASE_ANON_KEY=<sua_anon_key>
```

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

Login de teste PP: `parceiro@larsanacare.com.br` / `LarsanaCare2026!`

Login de teste Financeiro: `financeiro@larsanacare.com.br` / `LarsanaCare2026!`

### Docker (local)

```bash
docker compose up --build
```

Acesse http://localhost:5173

### Docker Swarm + Traefik

Build e push da imagem:

```powershell
# .env: DOCKER_IMAGE=sagittadigital/larsana-care-frontend:latest
.\scripts\docker-build-push.ps1
```

Deploy da stack (rede `sagitta` externa):

```bash
docker stack deploy -c docker/stack.yml larsana-care
```

Edite o host em `docker/stack.yml` (padrão: `larsana.sagittadigital.com.br`) antes do deploy.

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
- [Checklist Fase 0](docs/FASE0_CHECKLIST_ALINHAMENTO.md)
- [Academy](docs/ACADEMY.md)
