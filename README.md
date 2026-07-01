# LarsanaCare — Fisioterapia Domiciliar

Ecossistema de gestão de fisioterapia domiciliar (DELUMA) — ABC/SP.

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
