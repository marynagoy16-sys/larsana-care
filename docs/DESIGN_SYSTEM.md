# 🎨 DESIGN SYSTEM — LarsanaCare Fisioterapia Domiciliar

Sistema de design técnico para o ecossistema Larsana Care — painel administrativo, portal do profissional, portal do paciente e apps nativos. Stack: React + Tailwind + shadcn/ui.

**Versão:** 6.0  
**Última atualização:** 10/08/2026  
**Plataforma:** LarsanaCare Fisioterapia Domiciliar

---

## 📋 ÍNDICE

1. [Stack Tecnológica](#1-stack-tecnológica)
2. [Paleta de Cores (HSL)](#2-paleta-de-cores-hsl)
   - [2.2 Paleta Oficial LarsanaCare](#22-paleta-oficial-larsanacare)
   - [2.5 Configuração Tailwind](#25-configuração-tailwind-cores)
   - [2.7 Tokens de Marca](#27-tokens-de-marca)
   - [2.8 Regras Visuais de Cor](#28-regras-visuais-de-cor)
   - [2.9 Diretrizes Visuais](#29-diretrizes-visuais-do--dont)
3. [Tipografia](#3-tipografia)
   - [3.5 Princípios Tipográficos](#35-princípios-tipográficos)
4. [Sistema de Espaçamento](#4-sistema-de-espaçamento)
   - [4.3 Filosofia de Densidade](#43-filosofia-de-densidade)
   - [4.4 Escala de Border Radius](#44-escala-de-border-radius)
5. [Arquitetura de Layout](#5-arquitetura-de-layout)
   - [5.3 Sistema de Grid](#53-sistema-de-grid)
6. [Responsividade](#6-responsividade)
7. [Componentes de Layout](#7-componentes-de-layout)
   - [7.1 Sidebar (Desktop)](#71-sidebar-desktop)
   - [7.2 Mobile Sidebar](#72-mobile-sidebar)
   - [7.3 Header](#73-header)
   - [7.4 Bottom Navigation](#74-bottom-navigation)
   - [7.5 Componentes Base (UI)](#75-componentes-base-ui)
8. [Tema Claro/Escuro](#8-tema-claroescuro)
9. [Efeitos Visuais](#9-efeitos-visuais)
   - [9.4 Profundidade e Elevação](#94-profundidade-e-elevação)
10. [Z-Index Scale](#10-z-index-scale)
11. [Safe Areas (iOS)](#11-safe-areas-ios)
12. [Acessibilidade](#12-acessibilidade)
13. [Animações](#13-animações)

---

## 1. Stack Tecnológica

```json
{
  "framework": {
    "react": "^18.3.1",
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  },
  "styling": {
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "latest"
  },
  "components": {
    "shadcn-ui": "Radix UI primitives",
    "lucide-react": "^0.462.0"
  },
  "routing": "react-router-dom ^6.30.1",
  "state": "@tanstack/react-query ^5.83.0",
  "theme": "next-themes ^0.3.0",
  "animations": "framer-motion ^12.23.26"
}
```

---

## 2. Paleta de Cores (HSL)

### 2.1 Filosofia Visual

Identidade **saúde domiciliar** — acolhimento, confiança clínica e serenidade. Paleta em **verdes profundos** com acentos em **ouro** e neutros em **linho/branco acolhimento**.

**Atmosfera de interface** (inspirada em padrões *content-first* de apps densos): a UI recua em superfícies neutras para que **dados clínicos, pacientes e ciclos** sejam o foco. O verde Larsana aparece de forma **funcional** — CTAs, estados ativos, FAB — nunca como decoração de fundo. Geometria **pill e circular** em botões e buscas; tipografia **compacta** (10px–24px) para varredura rápida de listas operacionais.

Características:

- **Verde Lar Profundo** (`brand-dark`) em texto, contraste e hover de CTAs — seriedade e legibilidade
- **Verde Cuidado** (`brand-care`, `primary`) em ações principais — cuidado e confiança clínica
- **Ouro** (`brand-gold`) em badges, destaques premium e acentos decorativos
- **Linho Sereno** (`brand-linen`) em superfícies secundárias, inputs e bordas suaves
- **Branco Acolhimento** (`brand-light`) como fundo principal — acolhimento e clareza
- Todas as cores em **HSL** (formato Tailwind/shadcn: `H S% L%`) para opacidade dinâmica e temas claro/escuro

### 2.2 Paleta Oficial LarsanaCare

Cinco cores de marca. Usar tokens semânticos (`primary`, `brand-dark`, `brand-care`) na UI; hex apenas em ícones nativos e gráficos.

```css
:root {
  /* ===== PALETA OFICIAL — LarsanaCare ===== */
  --brand-light: 48 45.5% 97.8%;    /* #FCFBF7 — Branco Acolhimento — fundo */
  --brand-dark: 163.5 83.3% 9.4%;   /* #042C21 — Verde Lar Profundo — texto */
  --brand-care: 163.8 81.3% 18.8%;  /* #095742 — Verde Cuidado — CTAs */
  --brand-gold: 43.9 36.6% 56.1%;   /* #B8A266 — Ouro — destaques */
  --brand-linen: 40 20% 91.2%;      /* #EDEAE4 — Linho Sereno — superfícies */
}
```

| Token | Nome | Hex | HSL | Uso típico |
|-------|------|-----|-----|------------|
| `brand-light` | Branco Acolhimento | `#FCFBF7` | `48 45.5% 97.8%` | Fundo de página, texto sobre CTAs |
| `brand-dark` | Verde Lar Profundo | `#042C21` | `163.5 83.3% 9.4%` | Texto principal, contraste, hover de botão |
| `brand-care` | Verde Cuidado | `#095742` | `163.8 81.3% 18.8%` | **Botões primários, links, ring, ícones ativos** |
| `brand-gold` | Ouro | `#B8A266` | `43.9 36.6% 56.1%` | Badges premium, destaques, acentos |
| `brand-linen` | Linho Sereno | `#EDEAE4` | `40 20% 91.2%` | Superfícies secundárias, inputs, sidebar |
| *(derivado)* | Muted | `#49796B` | `163 25% 38%` | Ícones inativos, placeholders, texto muted |

### 2.3 Light Theme (`:root`)

```css
:root {
  /* ===== CORE COLORS ===== */
  --background: var(--brand-light);       /* #FCFBF7 Branco Acolhimento */
  --foreground: var(--brand-dark);        /* #042C21 Verde Lar Profundo */

  /* ===== BRAND COLORS — LarsanaCare ===== */
  --brand-primary-dark: var(--brand-dark); /* hover = Verde Lar Profundo */

  /* ===== SEMANTIC SURFACES ===== */
  --card: 0 0% 100%;
  --card-foreground: var(--brand-dark);

  --popover: 0 0% 100%;
  --popover-foreground: var(--brand-dark);

  /* ===== PRIMARY (Ações principais — Verde Cuidado) ===== */
  --primary: var(--brand-care);
  --primary-foreground: var(--brand-light);

  /* ===== SECONDARY (Superfícies neutras — Linho Sereno) ===== */
  --secondary: var(--brand-linen);
  --secondary-foreground: var(--brand-dark);

  /* ===== MUTED (Elementos sutis) ===== */
  --muted: 40 15% 93%;
  --muted-foreground: 163 25% 38%;

  /* ===== ACCENT (Destaques — tint ouro) ===== */
  --accent: 44 30% 92%;
  --accent-foreground: var(--brand-dark);

  /* ===== DESTRUCTIVE (Erros/Exclusões) ===== */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  /* ===== INPUTS & BORDERS ===== */
  --border: 40 12% 85%;
  --input: var(--brand-linen);
  --ring: var(--brand-care);

  /* ===== NAV / SIDEBAR ===== */
  --nav-icon: var(--brand-care);
  --nav-icon-muted: 163 25% 38%;
  --nav-active-bg: 163 35% 90%;
  --nav-active-fg: var(--brand-care);
  --nav-hover-bg: 40 18% 94%;

  /* ===== BORDER RADIUS ===== */
  --radius: 0.5rem;

  /* ===== STATUS COLORS ===== */
  --success: 163.8 81.3% 18.8%;
  --warning: 38 92% 50%;
  --warning-foreground: 38 92% 25%;
  --error: 0 72% 51%;
  --info: 199 89% 48%;
}
```

### 2.4 Dark Theme (`.dark`)

```css
.dark {
  /* ===== CORE COLORS ===== */
  --background: 163.5 50% 5%;
  --foreground: var(--brand-light);

  /* ===== SEMANTIC SURFACES ===== */
  --card: 163.5 40% 8%;
  --card-foreground: var(--brand-light);

  --popover: 163.5 40% 8%;
  --popover-foreground: var(--brand-light);

  /* ===== PRIMARY ===== */
  --primary: var(--brand-care);
  --primary-foreground: var(--brand-light);

  /* ===== SECONDARY ===== */
  --secondary: 163.5 25% 13%;
  --secondary-foreground: var(--brand-light);

  /* ===== MUTED ===== */
  --muted: 163.5 25% 13%;
  --muted-foreground: 163 15% 58%;

  /* ===== ACCENT ===== */
  --accent: 163.5 25% 13%;
  --accent-foreground: var(--brand-light);

  /* ===== DESTRUCTIVE ===== */
  --destructive: 0 62% 55%;
  --destructive-foreground: 0 0% 100%;

  /* ===== INPUTS & BORDERS ===== */
  --border: 163.5 20% 16%;
  --input: 163.5 25% 13%;
  --ring: var(--brand-care);

  --brand-primary-dark: 163.8 70% 24%;

  /* ===== NAV DARK ===== */
  --nav-icon: 163 20% 72%;
  --nav-icon-muted: 163 10% 50%;
  --nav-active-bg: 163.5 30% 11%;
  --nav-active-fg: var(--brand-light);
  --nav-hover-bg: 163.5 35% 8%;

  /* ===== STATUS COLORS ===== */
  --success: 163.8 70% 30%;
  --warning: 38 92% 55%;
  --error: 0 62% 55%;
  --info: 199 89% 55%;
}
```

### 2.5 Configuração Tailwind (cores)

```ts
// tailwind.config.ts — extend colors
import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

export default {
  theme: {
    extend: {
      colors: {
        border: withOpacity("--border"),
        input: withOpacity("--input"),
        ring: withOpacity("--ring"),
        background: withOpacity("--background"),
        foreground: withOpacity("--foreground"),
        primary: {
          DEFAULT: withOpacity("--primary"),
          foreground: withOpacity("--primary-foreground"),
        },
        secondary: {
          DEFAULT: withOpacity("--secondary"),
          foreground: withOpacity("--secondary-foreground"),
        },
        accent: {
          DEFAULT: withOpacity("--accent"),
          foreground: withOpacity("--accent-foreground"),
        },
        muted: {
          DEFAULT: withOpacity("--muted"),
          foreground: withOpacity("--muted-foreground"),
        },
        destructive: {
          DEFAULT: withOpacity("--destructive"),
          foreground: withOpacity("--destructive-foreground"),
        },
        card: {
          DEFAULT: withOpacity("--card"),
          foreground: withOpacity("--card-foreground"),
        },
        sidebar: {
          DEFAULT: withOpacity("--sidebar-background"),
          foreground: withOpacity("--sidebar-foreground"),
          primary: withOpacity("--sidebar-primary"),
          "primary-foreground": withOpacity("--sidebar-primary-foreground"),
          accent: withOpacity("--sidebar-accent"),
          "accent-foreground": withOpacity("--sidebar-accent-foreground"),
          border: withOpacity("--sidebar-border"),
          ring: withOpacity("--sidebar-ring"),
        },
        brand: {
          light: withOpacity("--brand-light"),
          dark: withOpacity("--brand-dark"),
          care: withOpacity("--brand-care"),
          gold: withOpacity("--brand-gold"),
          linen: withOpacity("--brand-linen"),
          "primary-dark": withOpacity("--brand-primary-dark"),
        },
      },
      boxShadow: {
        elevated: 'var(--shadow-elevated)',
        dialog: 'var(--shadow-dialog)',
        'inset-border': 'var(--shadow-inset-border)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        pill: '9999px',
      },
    },
  },
} satisfies Config;
```

> Use `bg-primary`, `bg-brand-care`, `bg-brand-dark`, etc. na UI. Referência de hex para ícones nativos: `@larsana/shared` → `larsanaPalette`. Tipografia, `fontSize` e `letterSpacing` — ver §3.3.

### 2.6 Como Usar Cores no Tailwind

```tsx
// ✅ CORRETO - Usando tokens semânticos
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground hover:bg-brand-primary-dark">
<button className="bg-accent text-accent-foreground">   {/* CTA secundário */}
<section className="bg-brand-dark text-white">          {/* Hero / navbar Larsana */}
<p className="text-muted-foreground">
<div className="border-border">

// ❌ ERRADO - Cores hardcoded
<div className="bg-white text-black">
<button className="bg-blue-600 text-white">
<button className="bg-orange-500 text-white">
<p className="text-gray-500">
```

### 2.7 Tokens de Marca

| Token | Nome | Hex | HSL | Uso |
|-------|------|-----|-----|-----|
| `brand-light` | Branco Acolhimento | `#FCFBF7` | `48 45.5% 97.8%` | Fundo de página, texto sobre CTAs |
| `brand-dark` | Verde Lar Profundo | `#042C21` | `163.5 83.3% 9.4%` | Texto principal, contraste, hover de botão |
| `brand-care` | Verde Cuidado | `#095742` | `163.8 81.3% 18.8%` | Botões primários, links, focus ring, ícones ativos |
| `brand-gold` | Ouro | `#B8A266` | `43.9 36.6% 56.1%` | Badges premium, destaques decorativos |
| `brand-linen` | Linho Sereno | `#EDEAE4` | `40 20% 91.2%` | Superfícies secundárias, inputs, bordas |
| `brand-primary-dark` | — | `#042C21` | `163.5 83.3% 9.4%` | Hover de botão primário |
| `text-on-dark` | — | `#FCFBF7` | `48 45.5% 97.8%` | Textos sobre fundo escuro |

### 2.8 Regras Visuais de Cor

**Botão primário (ação padrão — pill verde Larsana)**

```tsx
<Button className="rounded-full px-4 py-2 text-sm font-bold uppercase tracking-widest bg-primary hover:bg-brand-primary-dark text-primary-foreground">
  Salvar evolução
</Button>
```

**CTA secundário (agendar, pagar ciclo)**

```tsx
<Button className="rounded-full px-4 py-2 text-sm font-bold uppercase tracking-widest bg-accent hover:bg-accent/90 text-accent-foreground">
  Pagar ciclo antecipado
</Button>
```

**Hero / navbar (brand-dark)**

```tsx
<header className="bg-brand-dark text-white">
  <span className="font-display font-bold">LarsanaCare</span>
  <span className="text-xs text-white/70">Fisioterapia Domiciliar</span>
</header>
```

**Botão secundário sobre fundo escuro**

```tsx
<Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
  Saiba mais
</Button>
```

**Cards operacionais (pacientes, ciclos, repasses)**

```tsx
<article className="rounded-lg bg-card shadow-elevated transition-colors hover:bg-secondary/60">
```

**Badge de status (ativo, credenciado, nível)**

```tsx
<Badge className="bg-primary/15 text-primary border-primary/30">
  Ciclo ativo
</Badge>
```

### 2.9 Diretrizes Visuais (Do / Don't)

**Do**
- Usar verde Larsana (`primary`) só em CTAs, FAB, links ativos e focus — nunca como fundo decorativo
- Aplicar `rounded-full` em botões e buscas; `rounded-full` + `aspect-square` em ícones circulares
- Manter tipografia compacta (10–24px) e hierarquia por peso (700 vs 400)
- Usar `uppercase tracking-widest` em rótulos de botão
- Preferir sombras (`shadow-elevated`, `shadow-dialog`) a bordas cinza expostas
- Empacotar listas densamente — gaps de 8–12px

**Don't**
- Não introduzir cores de marca além da paleta oficial (Verde Lar Profundo, Verde Cuidado, Ouro, Linho Sereno, Branco Acolhimento)
- Não usar botões quadrados (`rounded-md`) para ações primárias
- Não usar sombras leves demais no dark theme — elevar opacidade
- Não inflar títulos dentro do app logado (reservar hero grande para marketing)
- Não misturar `font-semibold` em nav ativo — usar `font-bold` consistente

---

## 3. Tipografia

Sistema **compacto e funcional** (faixa 10px–24px), pensado para varredura de listas — pacientes, sessões, repasses — não para leitura longa. Hierarquia por **peso** (700 vs 400) mais que por tamanho. Botões usam **uppercase + letter-spacing** para voz de “rótulo de sistema”.

### 3.1 Famílias Tipográficas

Equivalentes open-source à lógica SpotifyMixUI / CircularSp:

| Papel | Família | Uso |
|-------|---------|-----|
| **Title** | `DM Sans` | Títulos de página, seções, hero |
| **UI / Body** | `Inter` | Corpo, navegação, tabelas, formulários |

```html
<!-- index.css via @import -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@9..40,400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Fallback stack** (suporte global, espelhando Spotify):

```ts
// tailwind.config.ts
fontFamily: {
  sans: [
    'Inter',
    'DM Sans',
    'Helvetica Neue',
    'helvetica',
    'arial',
    'Hiragino Sans',
    'Hiragino Kaku Gothic ProN',
    'Meiryo',
    'MS Gothic',
    'system-ui',
    'sans-serif',
  ],
  display: [
    'DM Sans',
    'Inter',
    'Helvetica Neue',
    'helvetica',
    'arial',
    'system-ui',
    'sans-serif',
  ],
}
```

### 3.2 Hierarquia Tipográfica

| Papel | Fonte | Tamanho | Peso | Line-height | Letter-spacing | Classes Tailwind |
|-------|-------|---------|------|-------------|----------------|------------------|
| **Section Title** | `font-display` | 24px (1.5rem) | 700 | normal | normal | `text-2xl font-bold font-display` |
| **Feature Heading** | `font-sans` | 18px (1.125rem) | 600 | 1.30 | normal | `text-lg font-semibold leading-tight` |
| **Page Title** | `font-display` | 18–20px | 700 | normal | normal | `text-lg lg:text-xl font-bold font-display` |
| **Body Bold** | `font-sans` | 16px (1rem) | 700 | normal | normal | `text-base font-bold` |
| **Body** | `font-sans` | 16px (1rem) | 400 | normal | normal | `text-base` |
| **Button Uppercase** | `font-sans` | 14px (0.875rem) | 600–700 | 1.0 | 1.4px–2px | `text-sm font-bold uppercase tracking-widest` |
| **Button** | `font-sans` | 14px | 700 | normal | 0.14px | `text-sm font-bold` |
| **Nav Link Active** | `font-sans` | 14px | 700 | normal | normal | `text-sm font-bold text-foreground` |
| **Nav Link** | `font-sans` | 14px | 400 | normal | normal | `text-sm font-normal text-muted-foreground` |
| **Caption Bold** | `font-sans` | 14px | 700 | 1.50 | normal | `text-sm font-bold` |
| **Caption** | `font-sans` | 14px | 400 | normal | normal | `text-sm text-muted-foreground` |
| **Small Bold** | `font-sans` | 12px (0.75rem) | 700 | 1.50 | normal | `text-xs font-bold` |
| **Small** | `font-sans` | 12px | 400 | normal | normal | `text-xs text-muted-foreground` |
| **Section Label** | `font-sans` | 11px | 600 | normal | 1.4px | `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70` |
| **Badge** | `font-sans` | 10.5px (0.66rem) | 600 | 1.33 | normal | `text-[10.5px] font-semibold capitalize` |
| **Micro** | `font-sans` | 10px (0.625rem) | 400 | normal | normal | `text-[10px] text-muted-foreground` |

### 3.3 Configuração Tailwind (tamanhos)

```ts
// tailwind.config.ts — escala compacta
fontSize: {
  micro: ['0.625rem', { lineHeight: '1' }],       // 10px
  badge: ['0.66rem', { lineHeight: '1.33' }],     // 10.5px
  xs: ['0.75rem', { lineHeight: '1.5' }],         // 12px
  sm: ['0.875rem', { lineHeight: '1' }],          // 14px — botões, nav
  base: ['1rem', { lineHeight: '1.5' }],          // 16px — body
  lg: ['1.125rem', { lineHeight: '1.3' }],        // 18px — feature heading
  xl: ['1.25rem', { lineHeight: '1.25' }],        // 20px
  '2xl': ['1.5rem', { lineHeight: '1.2' }],       // 24px — section title
},
letterSpacing: {
  button: '0.14px',
  wide: '1.4px',
  wider: '2px',
},
```

### 3.4 Padrões de Uso

```tsx
// Título de página (compacto — app, não marketing)
<h1 className="font-display font-bold text-lg lg:text-xl truncate">
  {pageTitle}
</h1>

// Título de seção em listagens
<h2 className="font-display font-bold text-2xl">
  Pacientes ativos
</h2>

// Labels de seção (sidebar)
<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
  Operação
</span>

// Nav ativo vs inativo
<span className={active ? "text-sm font-bold text-foreground" : "text-sm font-normal text-muted-foreground"}>
  {label}
</span>

// Botão primário — voz de rótulo
<Button className="text-sm font-bold uppercase tracking-widest rounded-full">
  Registrar sessão
</Button>

// Metadado de card (paciente, ciclo)
<p className="text-sm font-bold truncate">{patientName}</p>
<p className="text-sm text-muted-foreground truncate">{subtitle}</p>

// Badge de contagem
<span className="text-[10.5px] font-semibold capitalize px-2 py-0.5 rounded-sm bg-primary/15 text-primary">
  Ciclo ativo
</span>
```

### 3.5 Princípios Tipográficos

- **Binário bold/regular**: maioria do texto em **700** (ênfase, nav ativo, títulos de card) ou **400** (corpo, nav inativo). **600** só em subtítulos e badges.
- **Botões em uppercase**: `uppercase` + `tracking-widest` (1.4px–2px) — distingue ação de conteúdo.
- **Faixa compacta**: 10px–24px. Evitar títulos hero gigantes dentro do app logado; reservar `text-3xl+` para landing/marketing.
- **Line-height apertado em UI**: botões e nav com `leading-none` ou `leading-tight`; corpo pode usar `leading-normal`.
- **Sem line-heights relaxados** em tabelas e listas densas — priorizar varredura vertical rápida.

---

## 4. Sistema de Espaçamento

### 4.1 Escala Base (Tailwind)

| Token | Pixels | Uso Principal |
|-------|--------|---------------|
| `0.5` | 2px | Micro ajustes |
| `1` | 4px | Gaps internos mínimos |
| `1.5` | 6px | Padding de badges |
| `2` | 8px | Gaps padrão pequenos |
| `2.5` | 10px | Padding de botões pequenos |
| `3` | 12px | Padding de cards/itens de nav |
| `4` | 16px | Padding de seção, gaps maiores |
| `6` | 24px | Espaçamento entre seções |
| `8` | 32px | Margens de página |

### 4.2 Padrões Recorrentes

| Contexto | Classes | Pixels |
|----------|---------|--------|
| **Page padding** | `px-4 lg:px-6` | 16px mobile, 24px desktop |
| **Section spacing** | `space-y-6` ou `mt-6` | 24px |
| **Card padding** | `p-3` | 12px |
| **Nav item padding** | `px-3 py-2` | 12px horizontal, 8px vertical |
| **Gap entre items** | `gap-2` ou `gap-3` | 8px ou 12px |
| **Sidebar width** | `w-60` | 240px |
| **Sidebar padding** | `py-4 px-3` | 16px vertical, 12px horizontal |
| **Header height** | `h-14` | 56px |
| **Bottom nav height** | ~72px | Inclui safe-area |

### 4.3 Filosofia de Densidade

- **Unidade base: 8px** — todos os espaçamentos derivam de múltiplos de 8 (com exceções finas de 4px e 6px).
- **Escala estendida**: 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 15, 16, 20px mapeados para tokens Tailwind (`0.5` → `5`).
- **Densidade operacional**: listas de pacientes, sessões e repasses são **compactas** — gaps de 8–12px entre linhas, não 24px+ entre cada item.
- **Respiro pelo fundo**: superfícies em camadas (`background` → `card`) criam separação visual sem grandes vazios brancos.
- **Conteúdo > decoração**: cada pixel serve à operação clínica; evitar padding excessivo em cards de listagem.

### 4.4 Escala de Border Radius

Geometria **pill e circular** para controles; cantos suaves para cards.

| Token | Valor | Classe Tailwind | Uso |
|-------|-------|-----------------|-----|
| **Minimal** | 2px | `rounded-sm` | Badges explícitos, tags |
| **Subtle** | 4px | `rounded` | Chips pequenos, tooltips |
| **Standard** | 6px | `rounded-md` | Thumbnails, avatares quadrados |
| **Comfortable** | 8px | `rounded-lg` | Cards, containers, dialogs |
| **Panel** | 10–16px | `rounded-xl` / `rounded-2xl` | Painéis, modais grandes |
| **Large pill** | 100px | `rounded-[100px]` | CTAs largos, hero buttons |
| **Pill** | 500px | `rounded-[500px]` | Busca, botões primários grandes |
| **Full pill** | 9999px | `rounded-full` | Nav pills, botões padrão, search |
| **Circle** | 50% | `rounded-full` + `aspect-square` | FAB, play, avatares, ícones |

```ts
// tailwind.config.ts
borderRadius: {
  lg: 'var(--radius)',           // 8px padrão cards
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
  pill: '9999px',
},
```

> Atualizar `--radius` de `1rem` (16px) para `0.5rem` (8px) se quiser cards mais próximos do padrão Spotify. Manter `rounded-full` para botões e inputs de busca.

---

## 5. Arquitetura de Layout

### 5.1 Estrutura Principal

```tsx
// AppLayout.tsx - Estrutura base
<div className="min-h-screen w-full bg-background">
  {/* Sidebar - APENAS Desktop (lg:+) */}
  <Sidebar />  {/* hidden lg:flex w-60 fixed left-0 top-0 h-screen */}
  
  {/* Mobile Sidebar - Overlay no mobile */}
  <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
  
  {/* Área de conteúdo - Offset para sidebar no desktop */}
  <div className="lg:pl-60 min-h-screen flex flex-col">
    
    {/* Header - Sticky */}
    <Header onMenuClick={() => setIsSidebarOpen(true)} />
    {/* sticky top-0 z-30 h-14 */}
    
    {/* Main Content - Padding para bottom nav no mobile */}
    <main className="flex-1 pb-24 lg:pb-8">
      {children}
    </main>
    
  </div>
  
  {/* Bottom Navigation - APENAS Mobile */}
  <BottomNav />  {/* lg:hidden fixed bottom-0 */}
  
  {/* Floating Elements */}
  <AgentChatLauncher />  {/* z-40, bottom-20 mobile, bottom-4 desktop */}
</div>
```

### 5.2 Diagrama Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                         VIEWPORT                                 │
├─────────┬───────────────────────────────────────────────────────┤
│         │                                                        │
│ SIDEBAR │              HEADER (sticky, z-30)                    │
│  w-60   ├────────────────────────────────────────────────────────┤
│ (lg:+)  │                                                        │
│ fixed   │                                                        │
│ z-40    │                  MAIN CONTENT                          │
│         │                                                        │
│         │               (pb-24 no mobile)                        │
│         │                                                        │
│         │                                                        │
│         ├────────────────────────────────────────────────────────┤
│         │            BOTTOM NAV (mobile only, z-40)              │
└─────────┴────────────────────────────────────────────────────────┘
                    ┌──────────┐
                    │ LAUNCHER │ ← Floating (z-40)
                    │   FAB    │
                    └──────────┘
```

### 5.3 Sistema de Grid

Layout **sidebar fixa + área de conteúdo fluida**, com grids responsivos para cards operacionais.

```tsx
// Grid de cards — pacientes, profissionais, ciclos
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
  {items.map(item => <PatientCard key={item.id} />)}
</div>

// Lista densa (tabela alternativa)
<div className="flex flex-col gap-1">
  {sessions.map(s => <SessionRow key={s.id} />)}
</div>

// Dashboard com métricas
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <MetricCard />
</div>
```

| Contexto | Mobile | Tablet | Desktop | Large |
|----------|--------|--------|---------|-------|
| Cards pacientes/PP | 1 col | 2 col | 3 col | 4–5 col |
| Métricas KPI | 2 col | 2 col | 4 col | 4 col |
| Formulários | 1 col | 1 col | 2 col (label+field) | 2 col |

**Colapso de navegação:**
- Sidebar: visível (`lg+`) → drawer (`<lg`)
- Bottom bar: mantida em mobile para app profissional/paciente
- Busca pill: largura fluida (`w-full` → `max-w-md` → `w-80`)

**Barra inferior persistente** (equivalente ao *now-playing*): no app profissional, o bottom nav + FAB central permanecem em todos os breakpoints mobile.

---

## 6. Responsividade

### 6.1 Breakpoints

Tailwind padrão + referência de comportamento por faixa:

| Nome | Largura | Tailwind | Mudanças principais |
|------|---------|----------|---------------------|
| Mobile Small | <425px | default | Layout compacto, 1 coluna |
| Mobile | 425–576px | default | Bottom nav, busca full-width |
| Tablet | 576–768px | `sm` | Grid 2 colunas |
| Tablet Large | 768–896px | `md` | Formulários mais largos |
| Desktop Small | 896–1024px | `md`–`lg` | Sidebar começa a aparecer |
| Desktop | 1024–1280px | `lg` | Sidebar fixa, busca no header |
| Large Desktop | >1280px | `xl` / `2xl` | Grid expandido (4–5 cols) |

| Breakpoint | Min-Width | Uso |
|------------|-----------|-----|
| **Default** | 0px | Mobile portrait |
| **sm** | 640px | Mobile landscape / Phablets |
| **md** | 768px | Tablets portrait |
| **lg** | 1024px | Sidebar visível, bottom nav oculta |
| **xl** | 1280px | Desktops |
| **2xl** | 1536px | Telas grandes / grid 5 colunas |

### 6.2 Estratégia Mobile-First

```tsx
// Padrão: Mobile → Desktop
// Sempre defina mobile primeiro, depois adapte para telas maiores

// ❌ ERRADO - Desktop first
<div className="flex flex-row md:flex-col">

// ✅ CORRETO - Mobile first
<div className="flex flex-col md:flex-row">
```

### 6.3 Padrões de Responsividade

#### Sidebar
```tsx
// Desktop: Sidebar fixa visível
// Mobile: Sidebar oculta, acessível via menu hamburger

<aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0">
  {/* Conteúdo */}
</aside>
```

#### Header
```tsx
// Mobile: Menu hamburger + Logo
// Desktop: Search bar + Ações

<header className="sticky top-0 z-30 h-14">
  {/* Menu hamburger - só mobile */}
  <button className="lg:hidden w-10 h-10">
    <Menu />
  </button>
  
  {/* Search pill - só desktop */}
  <div className="hidden lg:flex w-80">
    <input placeholder="Buscar pacientes, ciclos..." className="rounded-full" />
  </div>
</header>
```

#### Bottom Navigation
```tsx
// Mobile: Nav fixa no bottom
// Desktop: Oculta (usa sidebar)

<nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
  {/* Nav items */}
</nav>
```

#### Content Offset
```tsx
// Compensa sidebar no desktop

<div className="lg:pl-60">
  {/* Conteúdo deslocado para não ficar atrás da sidebar */}
</div>
```

#### Main Padding
```tsx
// Compensa bottom nav no mobile

<main className="pb-24 lg:pb-8">
  {/* Conteúdo com padding extra no mobile */}
</main>
```

---

## 7. Componentes de Layout

### 7.1 Sidebar (Desktop)

**Arquivo:** `src/components/layout/Sidebar.tsx`

#### Estrutura

```tsx
<aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-40 py-4 px-3 glass-sidebar">
  
  {/* LOGO */}
  <div className="flex items-center gap-3 mb-4 px-2">
    <div className="w-9 h-9 rounded-lg bg-foreground/10 flex items-center justify-center p-1.5">
      <img src={logoIcon} className="w-full h-full dark:brightness-0 dark:invert" />
    </div>
    <img src={logoText} className="h-5 dark:brightness-0 dark:invert" />
  </div>
  
  {/* TENANT SWITCHER (opcional - Super Admin) */}
  <TenantSwitcher />
  
  {/* NAVIGATION */}
  <nav className="flex-1 overflow-y-auto scrollbar-custom">
    <NavSection title="Operação">
      <NavItem to="/admin/pacientes" icon={Users} label="Pacientes" />
      <NavItem to="/admin/ciclos" icon={Calendar} label="Ciclos" />
      <NavItem to="/admin/avaliacoes" icon={ClipboardList} label="Avaliações" />
    </NavSection>
    
    <NavSection title="Financeiro">
      <NavItem to="/admin/financeiro" icon={Wallet} label="Cobranças e repasses" />
      <NavItem to="/admin/relatorios" icon={FileText} label="Relatórios DELUMA" />
    </NavSection>
  </nav>
  
  {/* BOTTOM SECTION */}
  <div className="pt-3 space-y-0.5 border-t border-sidebar-border/50">
    <NavItem to="/settings" icon={Settings} label="Configurações" />
    
    {/* User Profile Card */}
    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/40 mt-2">
      {/* Avatar com status online */}
      {/* Nome + Status */}
      {/* Botão Logout */}
    </div>
  </div>
  
</aside>
```

#### Especificações

| Propriedade | Valor | Classe |
|-------------|-------|--------|
| Largura | 240px | `w-60` |
| Posição | Fixed left | `fixed left-0 top-0` |
| Altura | 100vh | `h-screen` |
| Z-index | 40 | `z-40` |
| Padding | 16px vertical, 12px horizontal | `py-4 px-3` |
| Background | Glass effect | `glass-sidebar` |
| Visibilidade | Desktop only | `hidden lg:flex` |

#### NavItem Component

```tsx
<NavLink
  to={to}
  className={cn(
    "flex items-center gap-3 w-full px-3 py-2 rounded-full text-sm transition-colors",
    active
      ? "bg-sidebar-accent text-foreground font-bold"
      : "text-muted-foreground font-normal hover:text-foreground hover:bg-sidebar-accent/50"
  )}
>
  <Icon size={18} />
  <span className="flex-1">{label}</span>
  {badge && (
    <span className="text-xs px-1.5 py-0.5 rounded bg-foreground/10 text-foreground font-medium">
      {badge}
    </span>
  )}
</NavLink>
```

#### NavSection Component

```tsx
<div className="mt-6 first:mt-0">
  <button className="flex items-center justify-between w-full px-3 mb-2 text-[11px] font-medium uppercase text-muted-foreground/70 tracking-wider hover:text-muted-foreground transition-colors">
    <span>{title}</span>
    <ChevronDown size={14} className={isOpen ? "rotate-0" : "-rotate-90"} />
  </button>
  {isOpen && <div className="space-y-0.5">{children}</div>}
</div>
```

---

### 7.2 Mobile Sidebar

**Arquivo:** `src/components/layout/MobileSidebar.tsx`

#### Estrutura

```tsx
<>
  {/* BACKDROP */}
  <div
    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
    onClick={onClose}
  />
  
  {/* SIDEBAR */}
  <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-sidebar-background border-r border-sidebar-border animate-slide-in-left lg:hidden overflow-y-auto">
    
    {/* Header com logo + botão fechar */}
    <div className="flex items-center justify-between p-4 border-b border-sidebar-border/50">
      {/* Logo */}
      <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-secondary/50">
        <X size={20} />
      </button>
    </div>
    
    {/* Navigation - Mesma estrutura do desktop */}
    <nav className="p-3 space-y-6 flex-1">
      {/* Seções de navegação */}
    </nav>
    
    {/* Bottom Section */}
    <div className="p-3 pt-3 border-t border-sidebar-border/50">
      {/* Settings + User Profile */}
    </div>
    
  </aside>
</>
```

#### Especificações

| Propriedade | Valor | Classe |
|-------------|-------|--------|
| Largura | 288px | `w-72` |
| Posição | Fixed left, full height | `fixed left-0 top-0 bottom-0` |
| Z-index | 50 (acima de tudo) | `z-50` |
| Background | Solid | `bg-sidebar-background` |
| Animação | Slide in from left | `animate-slide-in-left` |
| Backdrop | 80% opacity + blur | `bg-background/80 backdrop-blur-sm` |
| Visibilidade | Mobile only | `lg:hidden` |

#### Comportamentos

- **Fecha com ESC:** `useEffect` escuta keydown
- **Fecha no backdrop:** Click handler no backdrop
- **Bloqueia scroll:** `document.body.style.overflow = "hidden"`

---

### 7.3 Header

**Arquivo:** `src/components/layout/Header.tsx`

#### Estrutura

```tsx
<header className="sticky top-0 z-30 px-4 lg:px-6 h-14 flex items-center justify-between glass-navbar">
  
  {/* LEFT SIDE */}
  <div className="flex items-center gap-3">
    {/* Menu Hamburger - Mobile only */}
    <button 
      onClick={onMenuClick}
      className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50"
    >
      <Menu size={24} />
    </button>
    
    {/* Page Title */}
    <h1 className="font-display font-bold text-lg lg:text-xl truncate max-w-[180px] lg:max-w-none">
      {pageTitle}
    </h1>
  </div>
  
  {/* RIGHT SIDE */}
  <div className="flex items-center gap-2">
    {/* Search - Desktop only */}
    <div className="relative hidden lg:flex items-center gap-2 pl-12 pr-4 py-3 rounded-full bg-secondary w-80 shadow-inset-border">
      <Search size={18} className="absolute left-4 text-muted-foreground" />
      <input placeholder="Buscar pacientes, ciclos..." className="flex-1 bg-transparent text-sm outline-none" />
      <kbd className="hidden xl:inline-flex h-5 px-1.5 items-center rounded border border-border text-[10px] text-muted-foreground">
        ⌘K
      </kbd>
    </div>
    
    {/* Credits Badge */}
    <CreditsBadge />
    
    {/* Theme Toggle */}
    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50">
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
    
    {/* Notifications */}
    <NotificationsDropdown />
    
    {/* User Menu */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-secondary/50">
          <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
            {initials}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Menu items */}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  
</header>
```

#### Especificações

| Propriedade | Valor | Classe |
|-------------|-------|--------|
| Altura | 56px | `h-14` |
| Posição | Sticky top | `sticky top-0` |
| Z-index | 30 | `z-30` |
| Padding | 16px mobile, 24px desktop | `px-4 lg:px-6` |
| Background | Glass effect | `glass-navbar` |
| Layout | Flex between | `flex items-center justify-between` |

#### Touch Targets

Todos os botões interativos têm mínimo 40x40px (`w-10 h-10`) para acessibilidade mobile.

---

### 7.4 Bottom Navigation

**Arquivo:** `src/components/layout/BottomNav.tsx`

#### Estrutura

```tsx
<nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-bottomnav px-2 pb-safe-bottom">
  <div className="flex items-center justify-center gap-2 py-2 max-w-md mx-auto">
    
    {/* Left side - 2 items (app profissional) */}
    <div className="flex items-center gap-1">
      <NavItem to="/profissional/agenda" icon={Calendar} />
      <NavItem to="/profissional/pacientes" icon={Users} />
    </div>
    
    {/* FAB Central — registrar evolução */}
    <button 
      onClick={() => navigate('/profissional/evolucao/nova')}
      className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg glow-brand-strong hover:scale-105 transition-transform"
      aria-label="Registrar evolução"
    >
      <ClipboardPlus size={24} strokeWidth={2.5} />
    </button>
    
    {/* Right side - 2 items */}
    <div className="flex items-center gap-1">
      <NavItem to="/profissional/repasses" icon={Wallet} />
      <NavItem to="/profissional/perfil" icon={User} />
    </div>
    
  </div>
</nav>
```

#### NavItem Component

```tsx
<NavLink
  to={to}
  className={cn(
    "flex items-center justify-center w-12 h-12 rounded-full transition-colors",
    isActive
      ? "text-foreground bg-secondary/50"
      : "text-muted-foreground hover:text-foreground"
  )}
>
  <div className="relative">
    <Icon size={22} />
    {hasNotification && (
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
    )}
  </div>
</NavLink>
```

#### Especificações

| Propriedade | Valor | Classe |
|-------------|-------|--------|
| Posição | Fixed bottom | `fixed bottom-0 left-0 right-0` |
| Z-index | 40 | `z-40` |
| Background | Glass effect | `glass-bottomnav` |
| Padding bottom | Safe area | `pb-safe-bottom` |
| Visibilidade | Mobile only | `lg:hidden` |
| Layout | 2-FAB-2 pattern | Flex centered |

#### FAB (Floating Action Button)

| Propriedade | Valor | Classe |
|-------------|-------|--------|
| Tamanho | 56x56px | `w-14 h-14` |
| Forma | Circular | `rounded-full` |
| Cor | Inversão (fg/bg) | `bg-foreground text-background` |
| Elevação | Negativa top | `-mt-6` |
| Efeito | Glow verde + scale | `glow-brand-strong hover:scale-105` |
| Cor FAB | Primária Larsana | `bg-primary text-primary-foreground` |

---

### 7.5 Componentes Base (UI)

Biblioteca de padrões reutilizáveis. **Cores sempre via tokens Larsana**; geometria e densidade inspiradas em apps *content-first*.

#### Botões

| Variante | Background | Texto | Padding | Radius | Classes |
|----------|------------|-------|---------|--------|---------|
| **Primary Pill** | `primary` | `primary-foreground` | 8px 16px | `rounded-full` | `bg-primary hover:bg-brand-primary-dark text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full` |
| **Secondary Pill** | `secondary` | `secondary-foreground` | 8px 16px | `rounded-full` | `bg-secondary hover:bg-secondary/80 text-sm font-bold px-4 py-2 rounded-full` |
| **Outlined Pill** | transparent | `foreground` | 4px 16px | `rounded-full` | `border border-border bg-transparent hover:bg-secondary/50 text-sm font-bold px-4 py-2 rounded-full` |
| **Ghost Pill** | transparent | `muted-foreground` | 8px 16px | `rounded-full` | `hover:bg-secondary/50 text-sm font-normal px-4 py-2 rounded-full` |
| **Circular Icon** | `secondary` | `foreground` | 12px | `rounded-full` | `p-3 rounded-full bg-secondary hover:bg-secondary/80` |
| **Circular FAB** | `primary` | `primary-foreground` | 12px | `rounded-full` | `p-3 rounded-full bg-primary shadow-dialog hover:scale-105` |

```tsx
// Primary — CTA funcional (verde só aqui, nunca em fundo decorativo)
<Button className="bg-primary hover:bg-brand-primary-dark text-primary-foreground text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full">
  Salvar evolução
</Button>

// Outlined — ações secundárias
<Button variant="outline" className="border-border text-foreground hover:bg-secondary/50 text-sm font-bold px-4 py-2 rounded-full">
  Cancelar
</Button>

// Circular — ícone isolado (menu, play, adicionar)
<button className="p-3 rounded-full bg-secondary hover:bg-secondary/80" aria-label="Adicionar">
  <Plus size={20} />
</button>
```

#### Cards e Containers

| Propriedade | Valor | Token/classe |
|-------------|-------|--------------|
| Background | Superfície elevada | `bg-card` |
| Radius | 8px | `rounded-lg` |
| Borda | Evitar borda crua | preferir `shadow-elevated` |
| Hover | Clarear superfície | `hover:bg-secondary/60 transition-colors` |
| Sombra (elevated) | Média | `shadow-elevated` |

```tsx
<article className="group rounded-lg bg-card p-3 shadow-elevated transition-colors hover:bg-secondary/60">
  <h3 className="text-sm font-bold truncate">{title}</h3>
  <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
</article>
```

#### Inputs

| Tipo | Background | Radius | Padding | Detalhe |
|------|------------|--------|---------|---------|
| **Search pill** | `secondary` | `rounded-full` | 12px 48px (ícone à esquerda) | `shadow-inset-border` |
| **Text field** | `background` | `rounded-lg` | 12px 16px | focus: `ring-2 ring-ring` |
| **Select** | `secondary` | `rounded-full` ou `rounded-lg` | 8px 16px | mesmo padrão de busca |

```tsx
// Busca global — pill com inset border
<div className="relative flex items-center w-full max-w-md">
  <Search className="absolute left-4 text-muted-foreground" size={18} />
  <input
    className="w-full rounded-full bg-secondary pl-12 pr-4 py-3 text-sm outline-none shadow-inset-border focus:ring-2 focus:ring-ring"
    placeholder="Buscar pacientes, profissionais..."
  />
</div>
```

#### Badges e Tags

```tsx
// Status semântico
<Badge className="text-[10.5px] font-semibold capitalize rounded-sm bg-primary/15 text-primary border-0">
  Ciclo ativo
</Badge>

// Contagem
<span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-foreground/10">
  12
</span>
```

#### Navegação

- **Ativo**: `text-sm font-bold text-foreground`
- **Inativo**: `text-sm font-normal text-muted-foreground`
- **Hover**: `hover:text-foreground hover:bg-sidebar-accent/50`
- **Ícones circulares**: `rounded-full p-2` em botões de ação rápida

---

## 8. Tema Claro/Escuro

### 8.1 Implementação

O tema é gerenciado pelo `next-themes`:

```tsx
// Configuração no App.tsx ou layout
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

### 8.2 Toggle de Tema

```tsx
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();

const toggleTheme = () => {
  setTheme(theme === 'dark' ? 'light' : 'dark');
};
```

### 8.3 Estratégia de Variáveis

- **Classe `.dark`** é adicionada ao `<html>` automaticamente
- Todas as cores são sobrescritas via CSS variables
- Componentes usam tokens semânticos que mudam automaticamente

### 8.4 Ajustes para Imagens/SVGs no Dark Mode

```tsx
// Inverter logos/ícones que são pretos em fundo branco
<img 
  src={logo} 
  className="dark:brightness-0 dark:invert" 
/>

// Ajustar opacidades
<div className="bg-foreground/10">  {/* Funciona em ambos os temas */}
```

---

## 9. Efeitos Visuais

### 9.1 Glass Effects (Glassmorphism)

```css
/* Navbar - blur moderado */
.glass-navbar {
  background: hsl(var(--background) / 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid hsl(var(--border) / 0.2);
}

/* Sidebar - sólido com borda sutil */
.glass-sidebar {
  background: hsl(var(--sidebar-background));
  border-right: 1px solid hsl(var(--sidebar-border) / 0.5);
}

/* Bottom Nav - blur forte */
.glass-bottomnav {
  background: hsl(var(--background) / 0.95);
  backdrop-filter: blur(16px);
  border-top: 1px solid hsl(var(--border) / 0.2);
}

/* Cards simples - sem blur */
.surface-card {
  background: hsl(var(--card) / 0.6);
  border: 1px solid hsl(var(--border) / 0.3);
}

/* Overlays/Modais - blur máximo */
.glass-overlay {
  background: hsl(var(--card) / 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--border) / 0.4);
}
```

### 9.2 Glow Effects

```css
/* Glow sutil - para hover states */
.glow-subtle {
  box-shadow: 0 0 12px hsl(var(--primary) / 0.1);
}

/* Glow elevado - para cards e elevação sutil */
.glow-elevated {
  box-shadow: 0 2px 8px hsl(var(--foreground) / 0.08);
}

/* Glow brand forte - para FABs */
.glow-brand-strong {
  box-shadow: 0 4px 20px hsl(var(--primary) / 0.35);
}
```

### 9.3 Hover Effects

```css
/* Card hover - leve clareamento (preferir sobre translate em listas densas) */
.card-hover {
  transition: background-color var(--transition-base), box-shadow var(--transition-base);
}

.card-hover:hover {
  background: hsl(var(--secondary) / 0.6);
}

/* Scale para FABs/botões circulares */
.hover:scale-105  /* 5% - sutil */
```

### 9.4 Profundidade e Elevação

Sombras **perceptíveis** — em fundos escuros ou verde-escuro, sombras leves somem; usar opacidade 0.15–0.35.

| Nível | Tratamento | Token / classe | Uso |
|-------|------------|----------------|-----|
| **Base (0)** | `background` | `bg-background` | Fundo de página |
| **Surface (1)** | `card` / `secondary` | `bg-card`, `bg-secondary` | Cards, sidebar, containers |
| **Elevated (2)** | Sombra média | `shadow-elevated` | Dropdowns, cards em hover |
| **Dialog (3)** | Sombra pesada | `shadow-dialog` | Modais, menus, drawers |
| **Inset** | Borda-sombra interna | `shadow-inset-border` | Inputs, busca pill |

```css
.shadow-elevated {
  box-shadow: var(--shadow-elevated);
}

.shadow-dialog {
  box-shadow: var(--shadow-dialog);
}

.shadow-inset-border {
  box-shadow: var(--shadow-inset-border);
}

/* Dark theme — sombras mais pesadas */
.dark {
  --shadow-elevated: 0 8px 8px hsl(0 0% 0% / 0.3);
  --shadow-dialog: 0 8px 24px hsl(0 0% 0% / 0.5);
  --shadow-inset-border: 0 1px 0 hsl(80 60% 6.9%), inset 0 0 0 1px hsl(80.9 58.2% 30% / 0.6);
}
```

```ts
// tailwind.config.ts
boxShadow: {
  elevated: 'var(--shadow-elevated)',
  dialog: 'var(--shadow-dialog)',
  'inset-border': 'var(--shadow-inset-border)',
},
```

**Filosofia:** preferir **sombra + variação de superfície** a bordas cinza expostas. O verde Larsana não entra em fundos decorativos — apenas em CTAs, FAB e estados ativos.

---

## 10. Z-Index Scale

| Z-Index | Componente | Uso |
|---------|------------|-----|
| `z-10` | Elementos elevados | Badges, chips, overlays menores |
| `z-20` | Cards em hover | Elevação de cards interativos |
| `z-30` | Header | Header sticky |
| `z-40` | Sidebar, Bottom Nav, Launchers | Navegação principal |
| `z-50` | Modais, Drawers, Overlays | Elementos que sobrepõem tudo |

### Conflitos Conhecidos

```tsx
// Setup Widget vs Chat Launcher
// SetupWidget: z-50 (aparece durante onboarding)
// ChatLauncher: z-40 (aparece quando setup 100%)
// Lógica: Nunca aparecem juntos
```

---

## 11. Safe Areas (iOS)

### 11.1 Variáveis de Ambiente CSS

```css
.pb-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.h-safe-bottom {
  height: env(safe-area-inset-bottom, 0);
}
```

### 11.2 Configuração Tailwind

```ts
// tailwind.config.ts
spacing: {
  'safe-bottom': 'env(safe-area-inset-bottom)',
  'safe-top': 'env(safe-area-inset-top)',
}
```

### 11.3 Uso

```tsx
// Bottom Nav com safe area
<nav className="fixed bottom-0 ... pb-safe-bottom">

// Conteúdo com padding para safe area
<main className="pb-safe-bottom">
```

---

## 12. Acessibilidade

### 12.1 Touch Targets

```
Mínimo recomendado: 44x44px
Classes: min-w-[44px] min-h-[44px]
Ou: w-10 h-10 (40px) + padding
Ou: w-11 h-11 (44px)
Ou: w-12 h-12 (48px)
```

### 12.2 Focus States

```css
/* Remove outline padrão */
*:focus {
  outline: none;
}

/* Adiciona outline visível no focus-visible */
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 12.3 Contraste de Cores

| Tipo | Ratio Mínimo |
|------|--------------|
| Texto normal | 4.5:1 |
| Texto grande (18px+) | 3:1 |
| UI components | 3:1 |

### 12.4 ARIA Labels

```tsx
// Botões de ícone
<button aria-label="Abrir menu">
  <Menu />
</button>

// Links de navegação
<NavLink aria-label="Ir para Agenda">
  <Calendar />
</NavLink>

// Badges com notificações
<span aria-label="12 notificações não lidas">
  12
</span>
```

---

## 13. Animações

### 13.1 Keyframes Definidos

```css
/* Slide In (vertical) */
@keyframes slide-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Fade In */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale In */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Slide In Left (para sidebar) */
@keyframes slide-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

/* Slide In Right (para drawers) */
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Pulse Sutil */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

/* Shimmer (loading) */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### 13.2 Classes de Animação

```ts
// tailwind.config.ts
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "fade-in": "fade-in 0.3s ease-out",
  "fade-out": "fade-out 0.3s ease-out",
  "scale-in": "scale-in 0.2s ease-out",
  "scale-out": "scale-out 0.2s ease-out",
  "slide-in-right": "slide-in-right 0.3s ease-out",
  "slide-out-right": "slide-out-right 0.3s ease-out",
  "slide-in-left": "slide-in-left 0.3s ease-out",
  "slide-out-left": "slide-out-left 0.3s ease-out",
  "enter": "fade-in 0.3s ease-out, scale-in 0.2s ease-out",
  "exit": "fade-out 0.3s ease-out, scale-out 0.2s ease-out",
  "phase-pulse": "phase-pulse 20s ease-in-out infinite",
  "shimmer": "shimmer 6s ease-in-out infinite",
}
```

### 13.3 Timing Functions

```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);  /* Micro interações */
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);  /* Padrão */
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);  /* Modais/Sidebars */
}
```

---

## Checklist de Implementação

### Layout

- [x] Sidebar `w-60` desktop only (`hidden lg:flex`)
- [x] Content offset `lg:pl-60`
- [x] Bottom nav mobile only (`lg:hidden`)
- [x] Main padding `pb-24 lg:pb-8`
- [x] Page padding `px-4 lg:px-6`
- [x] Header `h-14` sticky `z-30`
- [x] Mobile sidebar com backdrop e animação

### Tipografia

- [x] `font-display` (DM Sans) para títulos — equivalente CircularSp
- [x] `font-sans` (Inter) para UI/body
- [x] Hierarquia compacta 10px–24px; bold/regular binário
- [x] Botões: `uppercase tracking-widest` (1.4px–2px)
- [x] Nav ativo: `font-bold`; inativo: `font-normal text-muted-foreground`
- [x] Section labels: `text-[11px] uppercase tracking-wider`

### Cores

- [x] Usar tokens semânticos (nunca cores diretas)
- [x] Active states: `bg-sidebar-accent text-foreground`
- [x] Muted text: `text-muted-foreground`
- [x] Bordas sutis: `border-border/30`
- [x] Brand primary: Verde Cuidado `#095742` (HSL 163.8 81.3% 18.8%)
- [x] Brand dark: Verde Lar Profundo `#042C21` (HSL 163.5 83.3% 9.4%)
- [x] Fundo: Branco Acolhimento `#FCFBF7` via token `brand-light`
- [x] Accent premium: Ouro `#B8A266` via token `brand-gold`
- [x] Superfícies: Linho Sereno `#EDEAE4` via token `brand-linen`

### Componentes e geometria

- [x] Botões primários: `rounded-full` (pill)
- [x] Busca: pill com `shadow-inset-border`
- [x] Cards: `rounded-lg` + `shadow-elevated`, hover por superfície
- [x] FAB circular: `rounded-full` + `bg-primary`
- [x] Grid responsivo 1→5 colunas para cards operacionais

### Efeitos

- [x] Elevação: `shadow-elevated` (cards) / `shadow-dialog` (modais)
- [x] Hover scale: `scale-105` máximo (FABs)
- [x] Blur apenas em navbars/overlays
- [x] Transitions usando variáveis CSS

### Mobile

- [x] Touch targets mínimo 40x40px
- [x] Safe areas para notch (`pb-safe-bottom`)
- [x] FAB central no bottom nav
- [x] Sidebar fecha com ESC e backdrop

### Dark Mode

- [x] Todas as cores adaptadas
- [x] Logos com `dark:brightness-0 dark:invert`
- [x] Opacidades ajustadas (ex: accent 10% → 15%)

---

*Design System — LarsanaCare Fisioterapia Domiciliar · DELUMA*  
*Última atualização: 05/06/2026*
