# LarsanaCare — Apps Mobile

Container dos apps nativos LarsanaCare (Expo + React Native + NativeWind).

Cada app é instalado de forma **isolada** (fora do hoisting dos workspaces da raiz) para evitar conflito entre Tailwind v4 (web) e Tailwind v3 (NativeWind).

## Apps

| App | Pasta | Role | Status |
|-----|-------|------|--------|
| LarsanaCare Profissional | `apps/profissional/` | `pp` | **ativo** |
| LarsanaCare Paciente | `apps/paciente/` | `paciente` | **ativo** |
| LarsanaCare Financeiro | `apps/financeiro/` | `financeiro` | **ativo** |
| LarsanaCare Gestão | `apps/gestao/` | `gestao` | planejado |

O papel **admin** não terá versão mobile.

## Comandos (na raiz do repositório)

| Comando | App |
|---------|-----|
| `npm run dev:mobile -- profissional` | Profissional |
| `npm run dev:mobile -- paciente` | Paciente |
| `npm run dev:mobile -- financeiro` | Financeiro |

Atalhos: `npm run dev:mobile:profissional`, `dev:mobile:paciente`, `dev:mobile:financeiro`.

Forma alternativa com flag: `npm run dev:mobile -- --profissional`.

Rodar `npm run dev:mobile` sem app lista os comandos disponíveis.

## Direto na pasta do app

```bash
cd mobile/apps/paciente
npm install
npm start
```

Configure `mobile/apps/<app>/.env` com:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Logins de teste

| App | E-mail | Senha |
|-----|--------|-------|
| Profissional | `parceiro@larsanacare.com.br` | `LarsanaCare2026!` |
| Paciente | `cliente@larsanacare.com.br` | `LarsanaCare2026!` |
| Financeiro | `financeiro@larsanacare.com.br` | `LarsanaCare2026!` |

## Pacote compartilhado

Todos os apps mobile consomem [`packages/shared`](../../packages/shared) (`@larsana/shared`) para tipos, auth e tokens de design.
