# LarsanaCare — Fisioterapia Domiciliar

Ecossistema de gestão de fisioterapia domiciliar (DELUMA) — ABC/SP.

## Estrutura

```
├── frontend/       # App web (React + Vite + Supabase)
├── backend/        # API futura
├── data/supabase/  # Migrations, seed, types
├── docs/           # PRD, páginas, design system
├── docker/         # Container frontend
└── scripts/        # Utilitários locais
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

### Rodar frontend

```bash
cd frontend
npm install
npm run dev
```

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
