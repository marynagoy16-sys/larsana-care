# Academy Larsana Care

Extensão educacional da plataforma Larsana Care (DELUMA — Saúde e Educação).

## Produtos

| Produto | Público | Rota |
|---------|---------|------|
| **Formação PP** | Profissional Parceiro | `/profissional/academy/*` |
| **LarsanaPill / PHIL** | Paciente / Responsável | `/paciente/larsanapill/*` |
| **CMS + Config** | Admin / Gestão / Super Admin | `/admin/academy/*` |

## Trilhas de conteúdo

### Formação PP (M1–M5)

Status implementação (14/08/2026): rotas, player, certificados e gates operacionais. **Conteúdo editorial** (vídeos/aulas completas por módulo) em curadoria — estrutura técnica pronta em `/profissional/academy/*`.

- **M1** Boas práticas de atendimento
- **M2** Método LARSANA
- **M3** Plano de carreira
- **M4** Rotina de trabalho
- **M5** Plano ativacional

### LarsanaPill (P1–P6)

- **P1** Tutoriais da plataforma
- **P2** Automassagem
- **P3** Exercícios específicos
- **P4** Ebooks ilustrados
- **P5** Exercícios guiados (timer + passos)
- **P6** Treinos em casa (planos T1–T5)

## Gates configuráveis (Super Admin)

Configuração em `/admin/academy/config` (somente role `admin`).

### Camadas

1. **Master switch** — `gates_master_enabled` desliga todos os bloqueios
2. **Regras por alvo** — `academy_gate_rules` (demands, credenciamento_ativo, paciente_p1, paciente_pagamento)
3. **Exceções** — `pp_academy_exemptions` por profissional

### Presets

| ID | Nome | Efeito |
|----|------|--------|
| `optional` | Academy opcional | Gates off |
| `soft_m1m3` | Formação básica | Demandas exigem M1+M2+M3 (default) |
| `full_m1m5` | Trilha completa | Demandas exigem M1–M5 |
| `demands_m5_only` | Só M5 | Demandas exigem apenas M5 |
| `credenciamento_m5` | M5 + credenciamento | Demandas M1–M5 + credenciamento M5 |
| `phil_onboarding` | PHIL onboarding | Paciente P1 obrigatório |

### Regra operacional

- **Demandas** pode ser bloqueado pela Academy
- **Agenda, evolução e repasses** nunca são bloqueados

## RBAC

| Ação | Admin | Gestão | PP | Paciente |
|------|:-----:|:------:|:--:|:--------:|
| Config gates | sim | — | — | — |
| CRUD conteúdo | sim | sim | — | — |
| Consumir Formação PP | — | — | sim | — |
| Consumir LarsanaPill | — | — | — | sim |

## Frontend

Seguir [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md): `AppShell`, shadcn/ui, tokens Larsana (`--primary`, `--card`).
