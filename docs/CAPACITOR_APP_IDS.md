# Identificadores do app Capacitor LarsanaCare

**Proposto (ainda não criado nas lojas):**

| Campo | Valor |
|-------|--------|
| Nome público | LarsanaCare |
| App ID / bundle / applicationId | `br.com.larsanacare.app` |
| Custom URL scheme (deep link) | `larsanacare://` |
| Universal Links (fase posterior) | `https://larsanacare.com.br` |

## Verificação desta máquina (19/08/2026)

- `br.com.larsanacare.app` **não aparece** neste repositório (exceto `frontend/capacitor.config.ts`) nem em busca no GitHub da org `sagitta-digital` (code search em repos privados pode ser incompleta).
- **Não foi possível** consultar Apple Developer nem Google Play Console daqui. Antes de criar o App ID, confirmar nas duas consoles que o identificador está livre.

## IDs antigos (Expo — não reutilizar para o app unificado)

| App Expo | iOS bundle / Android package | Scheme |
|----------|------------------------------|--------|
| Paciente | `br.com.larsanacare.paciente` | `larsanacare-paciente://` |
| Profissional | `br.com.larsanacare.pp` | `larsanacare://` |
| Financeiro | `br.com.larsanacare.financeiro` | `larsanacare-financeiro://` |

Dependências encontradas:

- Nenhum `extra.eas.projectId` no repo (EAS não está vinculado).
- Nenhum Firebase / `google-services.json` / `GoogleService-Info.plist`.
- Nenhum `associatedDomains` / Digital Asset Links.
- Redirect de auth Supabase usa `window.location.origin` (web). Capacitor precisará cadastrar o scheme e, depois, o domínio oficial.
- O scheme `larsanacare://` já está no app Expo PP. Conflito só se esse app estiver instalado ou publicado. O app Capacitor passou a declarar o mesmo scheme nos projetos nativos gerados; validar nas lojas antes do submit.

Os projetos `frontend/android` e `frontend/ios` foram gerados com `applicationId` / `PRODUCT_BUNDLE_IDENTIFIER` = `br.com.larsanacare.app`. Deep link custom scheme: `larsanacare://` (AndroidManifest + Info.plist).

**Ainda falta:** confirmar nas consoles Apple e Google que o ID está livre e que os IDs Expo não estão publicados.

**Regra:** se `paciente` ou `pp` já estiverem publicados, o app unificado continua com `br.com.larsanacare.app` (ID novo) e os antigos entram em sunset — não reciclar o package do Paciente para um app de dois perfis.
