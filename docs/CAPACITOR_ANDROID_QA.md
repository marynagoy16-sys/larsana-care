# Capacitor Android — checklist de teste físico (RC interno)

App: **LarsanaCare** (`br.com.larsanacare.app`)  
Scheme: `larsanacare://`  
Não publicar na Play Store. Não apagar os apps Expo.

Build esperado: `frontend/` → `npm run build` → `npx cap sync android` → gerar APK/AAB no Android Studio (esta máquina pode não ter SDK).

## Antes de instalar

- [ ] Confirmar que o APK/AAB foi gerado a partir de `frontend/android` com `webDir: dist` (sem `server.url`).
- [ ] Confirmar que o ícone/splash não são os placeholders do Capacitor (símbolo Larsana verde `#095742` em fundo `#FCFBF7`).
- [ ] Confirmar permissões: apenas `INTERNET`. Sem câmera, localização, notificações ou microfone neste RC.
- [ ] `android:allowBackup="false"` no Manifest.
- [ ] Login de desenvolvimento (`VITE_ENABLE_DEV_LOGIN`) **desligado** no build de teste interno.
- [ ] Asaas real **não** aparece na UI (PIX/boleto continuam “em preparação”).

## Cold start e shell

- [ ] Abrir o app a partir do ícone (processo morto): splash `#FCFBF7` some e a tela de login aparece.
- [ ] Status bar legível (ícones escuros sobre fundo claro); conteúdo não fica sob o notch.
- [ ] Área segura inferior: bottom nav do Paciente/PP não invade a barra de navegação do sistema.
- [ ] Teclado não cobre o campo de senha no login.
- [ ] Botão voltar do Android: na stack interna volta uma tela; na raiz minimiza o app (não fecha a sessão).
- [ ] Matar o app e reabrir **já autenticado**: sessão persiste (Preferences, não só memória).

## Paciente

Usar conta `paciente` (não staff).

- [ ] Login leva a `/paciente` (home do paciente), não a `/admin`.
- [ ] Navegação inferior: início, ciclo/agenda, solicitações, perfil (rótulos atuais da UI).
- [ ] Abrir uma cobrança pendente: **não** há botão “Simular pagamento”.
- [ ] Texto de PIX/boleto indica preparação — não dispara API Asaas.
- [ ] Logout e login novamente após cold start.
- [ ] Deep link `larsanacare://paciente` (se testável) abre o app sem crash.

## Profissional Parceiro (PP)

Usar conta `pp` credenciada de teste.

- [ ] Login leva à home do profissional (`/profissional/agenda` ou equivalente), não a `/admin`.
- [ ] Agenda / pacientes atribuídos carregam (RLS: só pacientes do PP).
- [ ] Sem acesso a cobranças financeiras da operação.
- [ ] Logout funciona; sessão sobrevive a cold start.

## Bloqueio de staff

Repetir com `admin`, `financeiro` e `gestao`.

- [ ] Após login no app nativo, a tela é **“Este perfil utiliza a plataforma administrativa web.”** (`/acesso-plataforma-web`).
- [ ] Não monta UI de `/admin` (módulos, cobranças, usuários).
- [ ] Botão “Abrir plataforma web” abre o navegador em `https://larsanacare.com.br` (ou URL configurada).
- [ ] “Sair desta conta” volta ao login.
- [ ] Digitar manualmente `/admin` na WebView (se possível) continua bloqueado.

## Segurança rápida (não substitui pentest)

- [ ] Signup público no app só oferece Paciente / PP — não há opção Admin.
- [ ] Paciente autenticado **não** consegue confirmar pagamento por simulação (RPC revogada).
- [ ] Webhook Asaas: sem `ASAAS_WEBHOOK_TOKEN` no projeto, o endpoint deve responder 503 (fail-closed). Não configurar webhook real neste RC.

## Assets oficiais — o que existe e o que falta

Fontes oficiais usadas (não inventar logo):

| Uso no RC | Origem | Tamanho | Nota |
|-----------|--------|---------|------|
| Ícone do app | `mobile/apps/paciente/assets/icon.png` | 5000×5000 | Símbolo ouro em `#095742` |
| Splash | `mobile/apps/paciente/assets/splash-icon.png` | 5000×5000 | Wordmark LARSANA CARE em verde; **não há** canvas 2732×2732 no repo |
| Adaptive foreground | `mobile/apps/paciente/assets/android-icon-foreground.png` | 5000×5000 | Símbolo branco em verde |
| Favicon web | `frontend/public/favicon.png` | 5000×5000 | Mesmo símbolo |
| Mark claro | `mobile/apps/paciente/assets/brand/mark-green-on-light.png` | 5000×5000 | Símbolo `#095742` em `#FCFBF7` |

**Não usar:** `mobile/apps/paciente/assets/android-icon-background.png` (512×512) — é grade placeholder do Expo, não marca Larsana. O adaptive background do RC é a cor sólida `#095742`.

**Falta no repositório (não inventar):**

- Splash dedicado 2732×2732 (ou qualquer splash já recortado por densidade). O RC escala `splash-icon.png` 5000×5000 com letterbox `#095742`.
- Adaptive icon background oficial (o único PNG de background é placeholder).
- Feature graphic Play Store 1024×500.
- Ícones de notificação recortados nos mipmap (há `android-icon-monochrome.png` no Expo Paciente; push não está neste RC).
- Screenshot de loja / tablet.
- Universal Links / Digital Asset Links (`assetlinks.json`) para `https://larsanacare.com.br`.

## Problemas conhecidos deste RC

- Android Studio / SDK / keystore podem estar ausentes nesta máquina — `cap sync` atualiza o projeto, mas **não** gera APK sozinho.
- Expo em `mobile/apps/*` permanece; scheme `larsanacare://` também existe no app Expo PP — conflito só se os dois estiverem instalados.
- Pagamento Asaas real e páginas legais do site (`/privacidade`, `/termos`, `/excluir-conta`) são gate da v1 pública, não deste RC interno.
