# Supabase — LarsanaCare

Schema PostgreSQL completo com RLS para o ecossistema Larsana Care.

## Estrutura

```
supabase/
├── config.toml
├── migrations/          # 18 migrations ordenadas
├── seed.sql             # Usuários dev por perfil
└── scripts/
    ├── validate_migrations.ps1
    └── validate_migrations.sh
```

## Migrations (ordem)

| Arquivo | Conteúdo |
|---------|----------|
| `20260605100000` | Extensions + enums |
| `20260605100100` | Profiles, staff, notifications, auth trigger |
| `20260605100200` | Regiões, cidades, tabela V1-2026 |
| `20260605100300` | Pacientes e responsáveis |
| `20260605100400` | Profissionais parceiros |
| `20260605100500` | Contratos LRS-PROF |
| `20260605100600` | Termos legais e aceites |
| `20260605100700` | Avaliação inicial (workflow) |
| `20260605100800` | Ciclos e sessões |
| `20260605100900` | Prontuário digital |
| `20260605101000` | Cobranças Asaas |
| `20260605101100` | Repasses pós-ciclo |
| `20260605101200` | Demandas e matching |
| `20260605101300` | NPS, alertas, auditoria |
| `20260605101400` | Views RBAC |
| `20260605101500` | Functions e triggers de negócio |
| `20260605101600` | RLS + Storage buckets |
| `20260605101700` | Seed V1-2026 (regiões, preços) |
| `20260615180000` | RPC `submit_pp_credentialing` (envio PP para aprovação) |

## Usuários de desenvolvimento (`seed.sql`)

Senha padrão: `LarsanaCare2026!`

| E-mail | Perfil |
|--------|--------|
| `admin@larsanacare.com.br` | Admin |
| `financeiro@larsanacare.com.br` | Financeiro |
| `gestao@larsanacare.com.br` | Gestão |
| `parceiro@larsanacare.com.br` | Profissional Parceiro |
| `cliente@larsanacare.com.br` | Paciente/Responsável |

## Comandos

```bash
# Com Supabase CLI instalado
supabase start
supabase db reset          # migrations + seed.sql
supabase gen types typescript --local > src/types/database.types.ts

# Validação local (Docker)
powershell -ExecutionPolicy Bypass -File supabase/scripts/validate_migrations.ps1
```

### Projeto remoto (Supabase Cloud)

Se o envio do credenciamento retornar `PGRST202` / função `submit_pp_credentialing` não encontrada, aplique a migration pendente:

1. **SQL Editor** no [dashboard Supabase](https://supabase.com/dashboard/project/kispjnlmklzfhxhtdyvm/sql/new) — cole e execute o conteúdo de `migrations/20260615180000_pp_credentialing_submit.sql`, **ou**
2. Com `access_token` e `PROJECT_ID` no `.env` (raiz do repo):

```bash
node data/supabase/scripts/apply-sql-remote.mjs data/supabase/migrations/20260615180000_pp_credentialing_submit.sql
```

## RLS

- **55 tabelas** em `public`
- Helpers: `current_user_role()`, `current_professional_id()`, `current_patient_ids()`, `is_staff()`, `can_access_patient()`
- PP não acessa `charges` nem valores integrais em `transfers` (usar view `transfers_pp`)
- Paciente **não** acessa `medical_records`

## Storage buckets

`patient-documents`, `professional-documents`, `contracts`, `invoices-nf`, `receipts`, `deluma-exports`
