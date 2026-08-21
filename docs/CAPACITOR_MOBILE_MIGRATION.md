# LarsanaCare — Migração Mobile Capacitor (app único)

**Status:** Auditoria Fase 1 — estratégia recomendada, sem implementação nativa ainda  
**Data:** 19/08/2026  
**Decisão de produto:** um único app público **LarsanaCare** (iOS + Android) via **Capacitor**, encapsulando o SPA React/Vite existente.  
**Referência de implementação:** `sagitta-digital/fncd-capital` (`capacitor.config.ts`, `MOBILE.md`, `src/lib/native/`).  
**Fora de escopo desta decisão:** Expo, EAS Build, React Native como arquitetura final de loja.

> Os apps em `mobile/apps/*` **não devem ser apagados** até o binário Capacitor estar validado em dispositivo físico (Android e iPhone).

---

## 1. Arquitetura atual

### 1.1 Monorepo

```
larsana-care/
├── frontend/                 # SPA React 19 + Vite 8 + Tailwind 4 + Supabase
├── mobile/apps/
│   ├── paciente/             # Expo 56 — ativo (loja planejada, EAS sem projectId)
│   ├── profissional/         # Expo 56 — ativo
│   ├── financeiro/           # Expo 56 — app interno, sem eas.json
│   └── gestao/               # placeholder (README only)
├── packages/shared/          # tipos Database, roles, tokens Tailwind
├── data/supabase/            # migrations, RLS, edge functions
├── backend/                  # API dedicada — ainda não existe
└── docker/                   # nginx SPA em larsana.sagittadigital.com.br
```

### 1.2 Fonte da verdade (hoje)

| Camada | Onde vive | Observação |
|--------|-----------|------------|
| Regras de negócio / RPCs | Postgres + edge functions | Web e Expo consomem o mesmo backend |
| UX Paciente / PP completa | **`frontend/`** | Bottom nav, onboarding, Academy, LarsanaPill, credenciamento, NF |
| UX nativa Expo | `mobile/apps/{paciente,profissional}` | Reimplementação parcial; várias telas stub |
| Auth | Supabase Auth + `profiles.primary_role` | Mesmo padrão nos três clientes |
| Design system | tokens CSS no frontend + preset no shared | Expo usa NativeWind v3 isolado |

### 1.3 Roteamento web (já existe e será o app)

Rotas públicas: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`.

| Perfil | Prefixo | Guard |
|--------|---------|-------|
| Paciente | `/paciente/*` | `RequireAuth` + `RequireRole(['paciente'])` + onboarding gate |
| Profissional | `/profissional/*` | `RequireAuth` + `RequireRole(['pp'])` + Academy gate em demandas |
| Admin / Gestão / Financeiro | `/admin/*` | `RequireRole` staff — **não deve entrar no app de loja** |

`RoleRedirect` (`/`) envia cada role para sua home. Staff hoje cai em `/admin`. No Capacitor isso precisa virar tela de recusa (ver §6).

### 1.4 Modelo FNCD (a replicar, não o Expo)

O FNCD Capital empacota **o mesmo SPA** com Capacitor 8:

- `webDir: "dist"`
- `server.androidScheme` / `iosScheme: "https"` (cookies, CORS, mixed content)
- plugins: App, Browser, Filesystem, Preferences, Push, Share, Splash, StatusBar, Native Biometric
- código nativo centralizado em `src/lib/native/`
- produção **nunca** aponta `server.url` para um host de desenvolvimento
- iOS gerado no Mac; Android no Windows/Android Studio
- push: FCM + edge `register-push-token` / `send-push` (backend ainda parcial no FNCD)

Larsana deve seguir **este** modelo, com plugins só quando houver função real.

### 1.5 Identificadores atuais (não assumir o novo ID ainda)

| App | Nome | iOS / Android ID | Scheme |
|-----|------|------------------|--------|
| Expo Paciente | LarsanaCare Paciente | `br.com.larsanacare.paciente` | `larsanacare-paciente://` |
| Expo PP | LarsanaCare PP | `br.com.larsanacare.pp` | `larsanacare://` |
| Expo Financeiro | LarsanaCare Financeiro | `br.com.larsanacare.financeiro` | `larsanacare-financeiro://` |
| **Proposto (Capacitor)** | **LarsanaCare** | **`br.com.larsanacare.app`** | **`larsanacare://`** |

**Impacto de trocar IDs:**

- Nenhum `extra.eas.projectId` no repo — EAS **não** está vinculado.
- Nenhum Firebase/`google-services.json` no repo.
- Nenhum `associatedDomains` / App Links configurado.
- O scheme `larsanacare://` já está no app Expo PP. Se esse app **nunca** foi publicado, o scheme está livre. Se já existir registro Apple/Play, validar conflito.
- Redirects Supabase Auth hoje usam `window.location.origin` (web). Capacitor precisará cadastrar o scheme e, depois, `https://larsanacare.com.br`.
- Credenciais Apple/Google: **não encontradas no repositório**. Validar na conta Apple Developer / Play Console da Sagitta/DELUMA antes de criar o App ID.

**Regra:** não criar `br.com.larsanacare.app` na Apple/Google até confirmar que `paciente` / `pp` não estão publicados ou em revisão.

---

## 2. Diferenças Web × Paciente Expo

A web está **à frente**. O Expo Paciente é um recorte com stubs.

| Funcionalidade | Web (`frontend`) | Expo Paciente | Conclusão Capacitor |
|----------------|------------------|---------------|---------------------|
| Login | Sim | Sim | Reusar web |
| Cadastro | Sim | **Não** | Web cobre |
| Recuperar / redefinir senha | Sim (hash recovery) | **Não** | Web cobre; testar deep link no WebView |
| Onboarding endereço/região | Sim | **Não** | Web cobre |
| Home / jornada | Sim | Parcial | Web |
| Solicitar atendimento + waitlist | Sim | Sim (RPC) | Web |
| Timeline solicitação | Parcial web | Parcial | Mesmo gap de produto |
| Proposta SIM/NÃO | Sim | Sim | Web |
| Confirmação de horário | Sim | **Não** | Web cobre — **gap Expo, não gap web** |
| Tratamento / ciclo | Sim | Sim | Web |
| Pagamentos lista | Sim | Sim | Web |
| PIX / boleto reais | **Stub** (simular RPC) | **Stub** (mesmo RPC) | **Gap de produto, não de plataforma** |
| LarsanaPill + planos + player | Sim | Sim (`expo-av`) | Web (HTML5 video) |
| NPS | Sim | Sim | Web |
| Documentos (leitura) | Sim | Lista sem abrir arquivo | Web |
| Termos / aceite legal | Sim | **Não** | Web |
| Conta / perfil / aparência | Sim | Só logout | Web |
| Ajuda | Parcial (WhatsApp stub) | Stub | Mesmo gap |
| Notificações in-app | Query real `notifications` | Stub (zeros) | Web cobre |
| Push nativo | Não | Não | Trabalho novo (Fase 5) |
| Excluir conta | **Não** | **Não** | Bloqueador de loja |
| Maps nativos | Leaflet / iframe OSM | SVG ilustrativo | Web é suficiente para V1 |

**O que existe só no Expo Paciente e não na web:** nada funcional relevante. Tab bar “glass” e `expo-av` são cosméticos / player nativo. O player web de LarsanaPill já existe.

---

## 3. Diferenças Web × PP Expo

Mesmo padrão: a web é a implementação completa.

| Funcionalidade | Web | Expo PP | Conclusão |
|----------------|-----|---------|-----------|
| Login | Sim | Sim | Web |
| Home / jornada / pontos | Sim | Parcial | Web |
| Agenda 5h–22h + detalhe sessão | Sim | Sim | Web |
| Demandas aceitar/recusar | Sim + Academy gate | Sim **sem** Academy gate | **Web é mais segura** |
| Wizard pós-aceite / agendar | Sim | Sim | Web |
| Mapa de demandas | Leaflet | `react-native-maps` | Leaflet no WebView (testar) |
| Pacientes + prontuário | Sim | Sim | Web |
| Avaliação | Sim | Sim | Web |
| Evolução clínica | Sim | Sim | Web |
| Remarcação / SUB | Sim na web | **Não no Expo** | Web cobre |
| Credenciamento + upload docs | Sim (`<input type=file>`) | Snapshot limitado | Web + plugin Camera na Fase 5 |
| Repasses + detalhe + upload NF | Sim | Lista; **sem** `repasses/:id` | Web |
| Academy (módulos, aulas, certificados) | Sim | Sim | Web |
| Simulador | Histórico real | Stub “em breve” | Web |
| Cartão de visita | Stub “em breve” | Stub | Gap de produto |
| Notificações in-app | Sim | Stub | Web |
| Conta / perfil | Sim | Parcial | Web |
| Cadastro PP | Sim (web pública) | Não | Web |

**O que existe só no Expo PP:** mapa nativo (`react-native-maps`) e drawer. Não justifica manter RN. Leaflet + Browser.open(Google Maps) cobre o caso de campo.

---

## 4. Funcionalidades ausentes na web (e no app)

Estas **não** são gaps Expo→Web. São gaps de produto que o Capacitor herdará:

### 4.1 Bloqueadores de loja / go-live app

1. **Excluir conta in-app** — App Store 5.1.1(v) e Play User Data exigem iniciação **dentro do app**. Saúde é setor regulado: fluxo com confirmação extra é aceitável, mas precisa existir UI.
2. **Página pública** `https://larsanacare.com.br/excluir-conta` — Play exige URL externa sem login. O repo `larsana-website` hoje só tem a landing (`src/routes/index.tsx`). **Não existem** `/privacidade`, `/termos`, `/suporte`, `/excluir-conta`.
3. **PIX/boleto Asaas de produção** — UI de paciente mostra placeholder e botão “Simular pagamento confirmado” (`simulate_charge_payment`). Edge `create-charge` tem `TODO: integrar API Asaas`. Sem isso o reviewer não vê pagamento real; o PRD marca Asaas produção como pendente.
4. **Recuperação de senha no WebView** — implementada na web via hash `#access_token` / `PASSWORD_RECOVERY`. Precisa de teste físico + handler `@capacitor/app`. Não está ausente, está **não validada**.
5. **Safe area superior / `viewport-fit=cover`** — bottom nav já usa `safe-area-inset-bottom`; **não há** inset top nem status bar nativa.
6. **Gate staff no app nativo** — `RequireRole` redireciona admin para `/admin`. No Capacitor isso carregaria o console administrativo dentro da loja. Precisa de tela: *“Este perfil utiliza a plataforma administrativa web.”*

### 4.2 Incompletos aceitáveis pós-lançamento (declarar honestamente)

- WhatsApp suporte (“Canal em breve”)
- Cartão de visita PP
- Push nativo (in-app já existe na web)
- Universal Links / App Links (`https://larsanacare.com.br/...`)
- Offline robusto / service worker
- Assinatura ICP-Brasil (spike separado)
- Exportação DELUMA
- Troca de perfil `paciente + pp` no mesmo user (arquitetar, não implementar)

### 4.3 Paridade Expo que a web **já** cobre e o Capacitor ganha de graça

Cadastro, onboarding, termos, aceite, agendamento paciente, Academy gate, detalhe de repasse, NF upload, notificações reais, aparência/tema.

---

## 5. Plugins Capacitor necessários

Instalar só o que tiver justificativa. Versão-alvo: **Capacitor 8** (mesmo major do FNCD).

### 5.1 Obrigatórios no shell V1 (antes do primeiro TestFlight / internal testing)

| Plugin | Para quê | Quando pedir permissão |
|--------|----------|------------------------|
| `@capacitor/core` + `cli` + `android` + `ios` | Empacotamento | — |
| `@capacitor/app` | Back Android, cold start, deep link `larsanacare://` | — |
| `@capacitor/status-bar` | Overlay, contraste, notch | — |
| `@capacitor/splash-screen` | Splash oficial | — |
| `@capacitor/browser` | Termos, boleto PDF, Maps, certificados, WhatsApp | No tap |
| `@capacitor/preferences` | Adapter de storage do Supabase Auth (padrão FNCD) | — |
| `@capacitor/keyboard` | Resize de formulários/modais | — |

### 5.2 Necessários quando a funcionalidade for ligada (não no commit inicial)

| Plugin | Trigger funcional |
|--------|-------------------|
| `@capacitor/camera` | Credenciamento / avatar / NF / atestado — se `<input type=file>` falhar em iOS |
| `@capacitor/filesystem` + `@capacitor/share` | Salvar/compartilhar PDF (contrato, certificado, NF) |
| `@capacitor/push-notifications` | Depois de APNs + FCM + tabela `push_tokens` + edge de envio |

### 5.3 Explicitamente **não** no V1

- Biometria (FNCD usa; Larsana não tem requisito de produto agora)
- Geolocation nativa (demandas usam endereço do paciente + haversine; sem GPS de dispositivo hoje)
- Expo / EAS / `react-native-maps` / `expo-av` / `expo-notifications`

### 5.4 Permissões nativas (só as usadas)

| Permissão | Justificativa iOS (`Info.plist`) | Android |
|-----------|----------------------------------|---------|
| Câmera | Enviar documento de credenciamento / atestado / NF | `CAMERA` só com Camera plugin |
| Fotos / galeria | Escolher documento existente | `READ_MEDIA_IMAGES` (API 33+) |
| Notificações | Avisos de demanda, sessão, cobrança | `POST_NOTIFICATIONS` (API 33+) |
| Internet | App híbrido | `INTERNET` |

Não solicitar no primeiro frame. Não declarar localização se não houver GPS.

---

## 6. Estratégia de migração

### Princípio

**Uma build web. Um bundle mobile. Zero reimplementação de telas Paciente/PP.**

Localização do Capacitor: **`frontend/`** (igual FNCD). Motivos:

- `webDir: dist` é o output do Vite que o Docker já publica
- evite um segundo pacote `mobile/apps/larsana` que copiaria o SPA
- `packages/shared` continua compartilhado
- scripts `cap:sync` / `cap:android` / `cap:ios` no `frontend/package.json` (e atalhos na raiz)

`mobile/apps/*` permanece congelado como referência / fallback até Fase 7.

### Arquitetura alvo

```
Frontend React (única fonte da UX)
        ↓
AuthProvider + profiles.primary_role
        ↓
NativeAppGate (só no Capacitor)
        ↓
paciente → /paciente/*     pp → /profissional/*
staff  → tela “use a web administrativa”
        ↓
src/lib/native/*  (único ponto com Capacitor.isNativePlatform)
        ↓
Capacitor WebView (https scheme)
        ↓
iOS / Android
```

### Gate de perfil (não esconder menu)

1. Rotas já protegidas por `RequireRole` (paciente ↛ PP e vice-versa).
2. RLS / RPC / Storage já discriminam por role (auditoria §7 — há achados).
3. **Novo:** se `Capacitor.isNativePlatform()` e `isStaffRole(role)`, **não** montar `AppShell admin`. Renderizar `StaffUsesWebPage` com link `Browser.open('https://larsanacare.com.br')` (ou host de produção vigente).
4. Arquitetar `available_roles[]` no perfil para futuro `paciente + pp`, mas o V1 continua em `primary_role`.

### Ambientes

| Binário | `VITE_SUPABASE_*` | `server.url` Capacitor |
|---------|-------------------|------------------------|
| development (live reload opcional) | projeto kispjnlmklzfhxhtdyvm / branch | `http://LAN:5173` **só** em `capacitor.config.dev.ts` local, gitignored |
| preview / internal | mesmo projeto ou staging, se existir | **ausente** — bundle `dist` |
| production | produção | **ausente** — bundle `dist` |

Nunca embutir URL de staging no AAB/IPA de produção.

### Deep links

V1: custom scheme `larsanacare://`.

Mapa inicial (handler único → React Router):

| URL | Destino |
|-----|---------|
| `larsanacare://login` | `/login` |
| `larsanacare://redefinir-senha` | `/redefinir-senha` (+ hash se vier) |
| `larsanacare://tratamento/:id` | `/paciente/tratamento/ciclo/:id` |
| `larsanacare://agenda` | `/profissional/agenda` |
| `larsanacare://demanda/:id` | `/profissional/demandas/:id` |
| `larsanacare://pagamento/:id` | `/paciente/pagamentos/:id` |

Fase posterior: Universal Links / App Links em `https://larsanacare.com.br` (site institucional + `apple-app-site-association` / `assetlinks.json`).

### Sessão no WebView

Cliente atual (`frontend/src/lib/supabase.ts`) usa o default (localStorage). No Capacitor com `https://localhost` isso costuma funcionar, mas o FNCD usa **Preferences** como `auth.storage`. Replicar o adapter para cold start / iOS WKWebView.

Testar: login → kill app → reopen; background 30+ min → refresh token; logout; recovery email.

### Android back

Listener `@capacitor/app` `backButton`:

1. Se overlay/modal aberto → fechar
2. Senão se `history.length` / `navigate(-1)` possível e rota ≠ login → back
3. Senão se em home autenticada → `App.minimizeApp()` (não logout)
4. Nunca `signOut` no back

### Site institucional (repo separado)

`sagitta-digital/larsana-website` precisa (textos jurídicos **placeholder até validação legal**):

- `/privacidade`
- `/termos`
- `/suporte`
- `/excluir-conta` (formulário público, sem exigir app instalado)

Essas URLs entram no App Store Connect e Play Console.

---

## 7. Riscos

### 7.1 Segurança / LGPD (tratar antes de loja)

| ID | Achado | Gravidade | Nota |
|----|--------|-----------|------|
| S1 | `handle_new_user` lê `raw_user_meta_data.primary_role` sem restringir a `paciente`/`pp`. Signup pode criar `admin`/`financeiro`/`gestao` se o cliente enviar metadata. | **Crítica** | Role de autorização não pode vir de `user_metadata` (editável). Usar allowlist no trigger e persistir role em `app_metadata` / tabela `profiles` server-side. |
| S2 | `simulate_charge_payment` é `SECURITY DEFINER` e `GRANT EXECUTE TO authenticated`. Paciente da própria cobrança **confirma pagamento sem Asaas**. | **Alta** | Remover do binário de produção; revogar execute em prod ou exigir `is_staff()` / flag `app.settings.allow_payment_simulation`. |
| S3 | Edge `create-charge` usa `SERVICE_ROLE` e **não valida JWT/role** do caller. | **Alta** | Qualquer um que invoque a function pode inserir cobrança. Exigir staff JWT. |
| S4 | Edge `payment-webhook` não verifica assinatura Asaas. | **Alta** | Eventos forjados podem marcar pagamento (via S2). |
| S5 | `DEV_LOGIN_PASSWORD` e lista de e-mails compilados no bundle se `VITE_ENABLE_DEV_LOGIN=true`. `.env.example` liga o flag. | **Média** | Produção: flag false; não importar `devLogin.ts` no build capacitor. |
| S6 | Signup grava CPF em `user_metadata`. | **Média** | Dado sensível em campo editável pelo usuário. Mover para tabela `professionals` (já ocorre no trigger) e não persistir no JWT. |
| S7 | Views: há uso de `security_invoker = true` em parte do schema; **não** foi feita auditoria live via MCP (projeto `kispjnlmklzfhxhtdyvm` não está nos MCPs conectados nesta máquina). | **Média** | Rodar `get_advisors` no projeto Larsana antes do RC. |
| S8 | Webhook/logs: `payment-webhook` persiste `payload` bruto (pode conter PII financeira). | **Média** | Minimizar payload; retenção. |

RLS de storage (`patient-documents`, `professional-documents`, `invoices-nf`, `receipts`) está path-based (`foldername[1] = patient_id | professional_id`) + staff. Padrão correto **se** os uploads sempre usarem esse prefixo. Auditar helpers de upload na Fase 5.

**Nenhum `SERVICE_ROLE` / `ASAAS_SECRET` no frontend** — correto. Anon key no cliente é esperada.

### 7.2 Produto / loja

| Risco | Mitigação |
|-------|-----------|
| Apple 4.2 (“só um site na WebView”) | Shell nativo real: splash, status bar, back, deep links, Preferences, Browser; depois push e câmera. Não live-load produção de URL remota. |
| Health / medical records declaration | Declarar dados de saúde no App Privacy e Play Data Safety. Copy jurídico pendente. |
| Conta sem exclusão | Bloqueia review. Ver §4.1. |
| Dois apps Expo já nas lojas | Se **não** publicados, IDs novos são limpos. Se publicados, precisa sunset + migração de usuários. |
| Scheme `larsanacare://` colide com Expo PP | Só problema se o Expo PP estiver instalado no mesmo device. |
| Pagamento demo no review | Reviewer pode marcar sessão como paga. Desligar simulação em produção. |
| Fontes Google no CSS | Primeira pintura depende de rede; self-host no `dist` para o app. |

### 7.3 Técnico Capacitor

- `createBrowserRouter` é adequado com scheme `https` (não usar `file://`).
- iframe OSM / Leaflet: testar WebView Android (mixed content já evitado pelo https scheme).
- `window.open` / `target=_blank` deve passar por `Browser.open`.
- iOS **não pode ser arquivado nesta máquina Windows** — precisa Mac + Xcode + conta Apple Developer.
- Android Studio / SDK **ausentes** neste Windows (há JDK 17).

---

## 8. Plano de implementação

Não apagar Expo. Commits pequenos na branch `feat/unified-mobile-app`.

### Fase 1 — Auditoria (este documento)

- [x] Comparar web × Expo
- [x] Mapear IDs, secrets, Asaas, push, lojas
- [ ] Validar na Apple/Play se IDs `paciente`/`pp` existem (bloqueador externo)

### Fase 2 — Web pronta para “virar app”

1. Gate nativo de staff (`StaffUsesWebPage`) — ainda no-op na web.
2. `viewport-fit=cover` + safe-area top no header/shell.
3. Centralizar links externos (preparar interface `openExternalUrl`).
4. Desligar simulação de pagamento quando `PROD` / `VITE_ENABLE_PAYMENT_SIMULATION !== 'true'`.
5. Allowlist de roles no `handle_new_user` (migration).
6. Não é rewrite de telas Paciente/PP.

### Fase 3 — Capacitor no `frontend/`

```
frontend/
├── capacitor.config.ts
├── resources/                 # icon 1024, splash 2732 (marca oficial)
├── android/                   # gerado (Windows ok)
├── ios/                       # gerado no Mac
└── src/lib/native/
    ├── index.ts
    ├── platform.ts            # isNativeApp(), currentPlatform()
    ├── bootstrap.ts           # status bar, splash, back button
    ├── links.ts               # Browser + deep link → router
    ├── storage.ts             # Preferences auth adapter
    ├── files.ts               # (Fase 5)
    └── notifications.ts       # (Fase 5)
```

Scripts:

```bash
npm run build          # em frontend
npx cap sync
npx cap open android
npx cap open ios       # Mac
```

Atalhos: `cap:android`, `cap:ios`, `cap:sync`, `cap:assets`.

### Fase 4 — Shell nativo

Assets oficiais (não reusar ícones Expo sem checar 1024/adaptive).  
Splash cor `#095742` / fundo `#FCFBF7` (design system).  
Deep link scheme.  
Back Android.  
Auth storage Preferences.

### Fase 5 — Integrações nativas pontuais

Camera/files só se o file picker web falhar.  
Push: desenhar `push_tokens` (user_id, role, platform, token) + edge register/send, no estilo FNCD. **Não implementar envio até FCM/APNs existirem.**

### Fase 6 — Testes físicos

Paciente e PP nos fluxos do quality gate (instalação limpa, sessão, deep link, teclado, notch, back).  
Não apenas emulador.

### Fase 7 — Aposentar Expo

Só depois do internal testing / TestFlight aprovado internamente:

1. README: app único Capacitor; pastas Expo = legado.
2. Parar `eas.json` / scripts `dev:mobile`.
3. Remover `mobile/apps/paciente` e `profissional` em PR separado (financeiro/gestão: decidir se morrem ou viram PWA interno).
4. Não publicar nas lojas neste PR.

### Quality gates (RC)

```bash
npm install
npm run typecheck:shared
# frontend: tsc + vitest + eslint
npx cap sync
# Android Studio → AAB preview
# Xcode → IPA TestFlight-ready
```

Mais: `expo doctor` **não se aplica**. Equivalente: `npx cap doctor` (quando disponível) + build nativo limpo.

---

## 9. Estratégia de aposentadoria dos apps Expo

| Etapa | Critério |
|-------|----------|
| Agora | Manter pastas; não investir feature nova em Expo |
| Capacitor preview interno instalável | Congelar Expo |
| Paridade validada (Paciente + PP) em device | Marcar README como legado |
| TestFlight + Play internal OK | Desligar EAS |
| Produção Capacitor live **ou** confirmação de que Expo nunca foi publicado | Deletar apps em commit próprio |

Se algum Expo **já estiver** na loja: publicar Capacitor com **novo** ID `br.com.larsanacare.app` e comunicar troca; não reutilizar `br.com.larsanacare.paciente` para um app unificado (reviewer vê mudança radical de propósito).

Financeiro/Gestão: continuam **web admin**. Não vão para a loja pública.

---

## 10. Checklist de publicação (esqueleto)

Documento detalhado virá em `docs/STORE_RELEASE_CHECKLIST.md` na Fase 6. Resumo:

### Android (Capacitor → Play)

1. Android Studio, JDK 17, target SDK exigido pelo Play (verificar no Console na época do submit).
2. Keystore de upload — backup offline; preferir Play App Signing.
3. `bundleRelease` → AAB (não APK de produção).
4. Privacy policy URL + Data Safety (saúde, dados financeiros, documentos).
5. Account deletion URL pública + fluxo in-app.
6. Health apps declaration se aplicável a prontuário/evolução.
7. Contas de review: `review-paciente@…` e `review-profissional@…` (dados preenchidos, **sem** admin).
8. Internal testing → (opcional) closed → production rollout.

### iOS (Capacitor → App Store Connect)

1. Mac + Xcode + Apple Developer (US$ 99/ano).
2. App ID `br.com.larsanacare.app` (após validação).
3. Push: capability + APNs (quando houver push).
4. `Info.plist` usage strings (câmera/fotos/notificações) **só se o plugin existir**.
5. Guideline 5.1.1(v) exclusão in-app; 4.2 funcionalidade nativa mínima.
6. App Privacy (health data).
7. Export compliance (HTTPS only → usualmente isento de criptografia extra).
8. TestFlight com as mesmas contas de review.
9. Screenshots, subtitle, keywords — copy em `docs/APP_STORE_METADATA.md` (Fase 6).

### Contas de review (plano)

Não usar e-mails pessoais nem `admin@`. Criar:

- Paciente com onboarding, solicitação, ciclo e cobrança **sandbox** visível
- PP credenciado (ou fluxo de credenciamento navegável), demanda, agenda, Academy

Senha forte exclusiva de review, documentada só no App Store Connect / Play review notes.

### O que este repo **não** fará automaticamente

- Publish nas lojas
- Commit de keystore, `.p8`, `google-services.json` com secrets
- Alterar domínio `larsanacare.com.br`
- Apagar Expo neste PR

---

## Arquitetura proposta (resumo executivo)

**Sim: o frontend atual está apto a ser a base Capacitor.** Paciente e PP já são shells mobile-first (bottom nav, `h-dvh`, rotas próprias). O Expo é duplicação inferior. A migração é **empacotar + native shell + compliance**, não um terceiro app.

### Estrutura de pastas a criar

```
frontend/capacitor.config.ts
frontend/resources/{icon.png,splash.png,README.md}
frontend/src/lib/native/{index,platform,bootstrap,links,storage}.ts
frontend/src/pages/public/StaffUsesWebPage.tsx
docs/STORE_RELEASE_CHECKLIST.md          # Fase 6
docs/APP_STORE_METADATA.md               # Fase 6
docs/GOOGLE_PLAY_METADATA.md             # Fase 6
```

Gerados depois (não editar à mão sem necessidade): `frontend/android/`, `frontend/ios/`.

### Arquivos a modificar (quando a implementação começar)

| Arquivo | Mudança |
|---------|---------|
| `frontend/package.json` | deps Capacitor + scripts `cap:*` |
| `frontend/index.html` | `viewport-fit=cover` |
| `frontend/src/index.css` | safe-area top |
| `frontend/src/main.tsx` | `nativeBootstrap()` |
| `frontend/src/lib/supabase.ts` | storage adapter nativo |
| `frontend/src/routes/index.tsx` / guards | gate staff nativo |
| `frontend/vite.config.ts` | `base: './'` se necessário para assets relativos |
| `frontend/.gitignore` | `ios/App/Pods`, keystore, `capacitor.config.dev.ts` |
| `package.json` (raiz) | atalhos `cap:*` |
| `README.md` | app único; Expo legado |
| `.gitignore` raiz | `frontend/android/key.properties` etc. |
| migration nova | allowlist de role no signup |
| `larsana-website` (outro repo) | páginas legais / exclusão |

### Sequência de commits

1. `docs: audit Capacitor unified mobile architecture` ← este arquivo  
2. `fix: restrict signup roles to paciente and pp`  
3. `feat: add native platform abstraction and staff web-only gate`  
4. `feat: bootstrap Capacitor shell on frontend`  
5. `feat: persist Supabase session with Capacitor Preferences`  
6. `feat: handle Android back button and deep links`  
7. `chore: add official splash status bar and app icons`  
8. `fix: disable payment simulation in production builds`  
9. `feat: account deletion request flow` (app + contrato com website)  
10. `docs: add store release checklist`  
11. `chore: configure Android release bundle` (sem publicar)

### Bloqueadores externos (não são código)

- [ ] Android Studio + SDK nesta máquina (ou CI Windows/Linux)
- [ ] Mac + Xcode + CocoaPods para iOS
- [ ] Conta Apple Developer e Play Console (org DELUMA/Sagitta)
- [ ] Confirmar se IDs Expo já existem nas lojas
- [ ] Confirmar disponibilidade de `br.com.larsanacare.app`
- [ ] Textos jurídicos (privacidade, termos, retenção clínica CREFITO/LGPD)
- [ ] Páginas no `larsana-website`
- [ ] Decisão de negócio: Asaas produção é gate de loja ou o app lança sem pagamento real?
- [ ] Firebase/FCM + APNs para push (pode ser pós-v1)
- [ ] Contas `review-*@` no Supabase

### Próxima ação recomendada

1. Confirmar com o time: **Asaas real é bloqueante da 1.0 da loja?** (recomendação: loja pode ir a internal testing sem PIX; produção da loja sem simulação clicável).  
2. Validar IDs na Apple/Play.  
3. Commit seguinte nesta branch: allowlist de roles no trigger + abstração `src/lib/native` + gate staff.  
4. Em seguida: `cap init` no `frontend/` **sem** `server.url` de produção.

---

## Apêndice A — Inventário rápido de rotas web Paciente / PP

Ver `frontend/src/routes/paciente.tsx` e `profissional.tsx`. Inventário completo na auditoria de 19/08 (Paciente: home, onboarding, solicitar, tratamento, ciclos, pagamentos, proposta, agendamento, documentos, aceite, NPS, conta, termos, ajuda, LarsanaPill, notificações. PP: início, evolução/jornada, agenda, demandas+agendar, evoluções clínicas, pacientes, avaliações, repasses, conta, simulador, credenciamento, cartão stub, perfil, notificações, Academy).

## Apêndice B — Secrets

| Artefato | Cliente? | Ação |
|----------|----------|------|
| `VITE_SUPABASE_ANON_KEY` | Sim (esperado) | RLS obrigatória |
| `VITE_SUPABASE_URL` | Sim | — |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nunca** | Só edge |
| `ASAAS_API_KEY` | **Nunca** | Edge, hoje TODO |
| `DEV_LOGIN_PASSWORD` | Evitar | Tirar do bundle prod |
| Apple `.p8` / keystore | **Nunca no git** | — |

Projeto Supabase documentado: `kispjnlmklzfhxhtdyvm` (`https://kispjnlmklzfhxhtdyvm.supabase.co`).

## Apêndice C — Push (estado atual)

**Não existe.** Nem Expo Notifications, nem Capacitor Push, nem FCM, nem APNs, nem tabela de tokens. Há notificações **in-app** na web (tabela `notifications`).

Arquitetura futura (não implementar agora): token por dispositivo + `user_id` + `primary_role`; unregister no logout; tópicos/eventos por perfil (proposta, demanda, cobrança, sessão, NPS, Academy, repasse). Backend de envio no estilo FNCD (`pg_net` → edge `send-push`).
