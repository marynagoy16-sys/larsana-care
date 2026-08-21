# Larsana Care — Infraestrutura, Segurança e Tratamento de Dados

**Destinatário:** Larsana Care (elaboração da Política de Privacidade)  
**Elaborado por:** Sagitta Digital  
**Data:** 20 de agosto de 2026  
**Versão:** 1.0  
**Classificação:** Uso interno / compartilhável com assessoria jurídica

---

## Objetivo deste documento

Este material responde, de forma objetiva e técnica, às perguntas levantadas pela Larsana Care para fundamentar a **Política de Privacidade** e o **Aviso de Privacidade** da plataforma. As respostas refletem a arquitetura atual do sistema Larsana Care (web, mobile e banco de dados) conforme implementado em agosto de 2026.

> **Nota:** Alguns detalhes contratuais do provedor de nuvem (plano Supabase, região exata do projeto e retenção efetiva de backup) devem ser confirmados no painel administrativo do Supabase pelo responsável técnico. Onde aplicável, indicamos o que confirmar e onde verificar.

---

## 1. Onde o banco de dados está hospedado? Qual provedor utilizamos?

### Resposta resumida

O banco de dados principal da Larsana Care é hospedado na **Supabase Cloud**, que utiliza infraestrutura **Amazon Web Services (AWS)**. O motor de banco é **PostgreSQL 15** (relacional; **não** utilizamos MongoDB, Azure Database nem serviços equivalentes).

Além do banco, a Supabase concentra na mesma plataforma:

| Componente | Função |
|------------|--------|
| **PostgreSQL** | Dados clínicos, operacionais, financeiros e cadastrais |
| **Supabase Auth** | Autenticação de usuários (login, sessão, recuperação de senha) |
| **Supabase Storage** | Arquivos (documentos de pacientes, contratos, notas fiscais, recibos) |
| **Supabase Edge Functions** | Processamento serverless (cobranças, webhooks de pagamento, geração de PDFs) |

### Frontend e aplicações

| Camada | Provedor / hospedagem |
|--------|------------------------|
| **Portal web** | Container Docker publicado pela **Sagitta Digital**, com proxy **Traefik** e certificado TLS **Let's Encrypt** (domínio de homologação: `larsana.sagittadigital.com.br`) |
| **Apps mobile** (Paciente, Profissional, Financeiro) | **Expo / React Native**, publicados nas lojas **Apple App Store** e **Google Play** (publicação em produção ainda pendente no roadmap) |

### Identificação técnica do projeto

- **Projeto Supabase:** `larsanav1` (ref: `kispjnlmklzfhxhtdyvm`)
- **URL da API:** `https://kispjnlmklzfhxhtdyvm.supabase.co`

---

## 2. Em qual país/região física os dados ficam armazenados?

### Resposta resumida

Os dados primários do banco, autenticação e storage ficam na **região AWS escolhida na criação do projeto Supabase**. A Supabase oferece a região **South America (São Paulo) — `sa-east-1`**, adequada para residência de dados no Brasil.

### O que confirmar

A região exata deve ser verificada em:

**Supabase Dashboard → Project Settings → General → Region**

Recomendação operacional para conformidade com a LGPD e latência para usuários no ABC/SP: manter o projeto em **`sa-east-1` (São Paulo, Brasil)**.

### Escopo da residência

Quando o projeto está em `sa-east-1`, ficam na mesma região (conforme documentação Supabase):

- Tabelas e índices do PostgreSQL
- Backups nativos do banco
- Objetos do Supabase Storage
- Serviço de autenticação vinculado ao projeto

**Exceção importante:** serviços **terceiros** listados na seção 7 processam dados conforme suas próprias políticas e localização (ex.: Asaas — Brasil).

---

## 3. Existe backup automático? Qual a periodicidade e política de retenção?

### Resposta resumida

**Sim.** A Supabase realiza **backups automáticos diários** para projetos nos planos pagos (**Pro**, **Team** e **Enterprise**).

### Periodicidade

| Tipo | Periodicidade |
|------|---------------|
| **Backup diário (padrão)** | 1× por dia (automático) |
| **Point-in-Time Recovery (PITR)** | Add-on opcional; captura contínua de WAL com granularidade de até ~2 minutos |

### Retenção (conforme plano Supabase)

| Plano | Retenção de backups diários |
|-------|----------------------------|
| **Pro** | 7 dias |
| **Team** | 14 dias |
| **Enterprise** | até 30 dias |
| **Free** | Sem backup automático gerenciado; recomenda-se exportação manual periódica |

### O que confirmar

1. **Plano contratado** do projeto `larsanav1` (Dashboard → Billing)
2. Se **PITR** está habilitado (Dashboard → Database → Backups → Point in Time)
3. Política interna de **exportação off-site** adicional, se exigida pela Larsana Care

### Observações relevantes para a política de privacidade

- Backups do banco são **criptografados em repouso** (AES-256)
- Backups diários **não incluem** os arquivos binários do Supabase Storage (apenas metadados no banco); a restauração de documentos depende também do Storage
- Exclusão do projeto Supabase remove **permanentemente** dados e backups associados

**Referência:** [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups)

---

## 4. Os dados armazenados no banco estão criptografados em repouso?

### Resposta resumida

**Sim.** Todos os dados persistidos na Supabase são criptografados em repouso com **AES-256**, incluindo:

- Tabelas e índices do PostgreSQL
- Write-Ahead Logs (WAL)
- Backups automáticos
- Arquivos no Supabase Storage

A criptografia é **transparente e sempre ativa** — não pode ser desabilitada. As chaves são gerenciadas pela infraestrutura de nuvem (AWS), conforme práticas da Supabase.

**Referência:** [Supabase — Data Encryption](https://supabase.com/docs/guides/security/encryption)

---

## 5. A comunicação entre aplicativo/backend/banco utiliza criptografia em trânsito (HTTPS/TLS)?

### Resposta resumida

**Sim.** Toda comunicação entre clientes (web/mobile) e a plataforma Supabase ocorre via **HTTPS/TLS**.

| Canal | Proteção |
|-------|----------|
| API REST / Realtime (Supabase) | HTTPS (TLS) |
| Autenticação (Supabase Auth) | HTTPS (TLS) |
| Upload/download de arquivos (Storage) | HTTPS (TLS) |
| Edge Functions | HTTPS (TLS) |
| Portal web (produção/homologação) | HTTPS via Traefik + Let's Encrypt |
| Integração Asaas (pagamentos) | HTTPS para `api.asaas.com` |
| Geocodificação de endereços | HTTPS para `nominatim.openstreetmap.org` |

### Boas práticas adotadas no projeto

- Chave pública (`anon` / publishable) exposta apenas no frontend
- Chave **`service_role`** e credenciais Asaas **somente** em variáveis de ambiente server-side (Edge Functions)
- Webhook de pagamento Asaas validado por token (`ASAAS_WEBHOOK_TOKEN`)

---

## 6. Temos logs de acesso e trilha de auditoria?

### Resposta resumida

**Sim, parcialmente implementado.** O sistema possui estruturas de auditoria no banco e controles de acesso (RLS), com diferentes níveis de cobertura conforme o tipo de operação.

### Mecanismos existentes

| Mecanismo | O que registra | Quem acessa |
|-----------|----------------|-------------|
| **`audit_logs`** | Ações sobre entidades (tipo, ID, ação, usuário, valores antigos/novos, IP, data) | Equipe interna (admin, financeiro, gestão) |
| **`medical_record_access_log`** | Acesso a registros de prontuário (quem acessou, quando) | Via RPC/triggers; consulta restrita |
| **`credentialing_workflow_log`** | Transições no credenciamento de profissionais | Staff autorizado |
| **`cardiorrespiratory_habilitation_log`** | Habilitação cardio-respiratória de PP | Staff autorizado |
| **Row Level Security (RLS)** | Controle de acesso por perfil em **55+ tabelas** | Aplicado em toda consulta autenticada |
| **Tela Admin → Auditoria** | Listagem de registros em `audit_logs` | Perfil admin |
| **`lgpd_requests`** | Solicitações formais do titular (acesso, exclusão, portabilidade, revogação) | Titular + admin |

### Limitações a declarar com transparência

- Nem toda alteração de dado gera automaticamente entrada em `audit_logs`; eventos críticos dependem de inserção explícita pela aplicação
- Logs de infraestrutura da Supabase (acesso ao painel, queries administrativas) ficam no **Dashboard Supabase** e nos logs da plataforma
- **Não** há, nesta versão, integração com ferramenta externa de SIEM ou analytics de comportamento

### Recomendação para a política de privacidade

Informar que o sistema mantém **registros de auditoria para operações sensíveis** (prontuário, credenciamento, solicitações LGPD) e que a Larsana Care pode complementar com **procedimentos internos** de registro de acessos administrativos.

---

## 7. Quais empresas terceiras têm acesso ou processam dados dos pacientes?

### Resposta resumida

A tabela abaixo lista os **operadores/suboperadores** e serviços terceiros identificados na arquitetura atual. A Larsana Care deve incluí-los na política de privacidade como **operadores de tratamento** ou **parceiros**, conforme assessoria jurídica.

| Empresa / serviço | Finalidade | Dados potencialmente tratados | Localização |
|-------------------|------------|-------------------------------|-------------|
| **Supabase, Inc.** | Banco PostgreSQL, autenticação, storage, edge functions | Dados cadastrais, clínicos, financeiros, documentos, logs | Região AWS do projeto (recomendado: Brasil) |
| **Amazon Web Services (AWS)** | Infraestrutura subjacente à Supabase | Mesmos dados hospedados | Conforme região do projeto |
| **Asaas Gestão Financeira** | Cobranças PIX/boleto, carteira digital de PP, split/repasse | Nome, CPF/CNPJ, e-mail, telefone, valores, IDs de cliente | Brasil |
| **Sagitta Digital** | Desenvolvimento, hospedagem do frontend web, operação técnica | Acesso administrativo conforme necessidade operacional | Brasil |
| **OpenStreetMap / Nominatim** | Geocodificação de endereços (distância entre PP e paciente) | Endereço textual (rua, bairro, CEP, cidade) | Internacional (serviço comunitário OSM) |
| **Let's Encrypt** | Certificados TLS do portal web | Metadados de domínio (não dados de pacientes) | Internacional |
| **Apple Inc.** | Distribuição app iOS (quando publicado) | Dados conforme política App Store | EUA / global |
| **Google LLC** | Distribuição app Android (quando publicado); links de navegação | Dados conforme política Play Store; links Maps abrem app/site Google | EUA / global |

### Serviços **não** integrados na versão atual (ago/2026)

| Serviço | Status |
|---------|--------|
| WhatsApp / Twilio / Meta Business | **Não integrado** |
| SendGrid / Resend / Mailgun (e-mail transacional dedicado) | **Não integrado** — e-mails de autenticação via **Supabase Auth** |
| Google Analytics / Mixpanel / PostHog / Sentry | **Não integrado** |
| Assinatura digital ICP-Brasil | **Em spike** — não em produção |

> Quando novos serviços forem contratados (ex.: WhatsApp para lembretes, e-mail marketing, analytics), a política de privacidade e este documento devem ser atualizados.

---

## 8. É possível desativar a conta de um usuário sem excluir prontuário e registros obrigatórios?

### Resposta resumida

**Sim.** O modelo de dados foi projetado para **separar a conta de acesso (login)** dos **registros clínicos e operacionais** que devem ser retidos por obrigação legal/profissional.

### Como funciona tecnicamente

| Conceito | Implementação |
|----------|---------------|
| **Conta de usuário** | Tabela `profiles`, vinculada a `auth.users` (Supabase Auth), com campo **`is_active`** (ativo/inativo) |
| **Cadastro clínico do paciente** | Tabela `patients` — independente da conta; contém prontuário, ciclos, sessões |
| **Prontuário digital** | Tabela `medical_records` com **`ON DELETE RESTRICT`** — impede exclusão acidental do paciente enquanto houver registros |
| **Status assistencial** | Campo `care_status` (ex.: ATIVO, PAUSA, PAUSA_JUSTIFICADA) — distinto do bloqueio de login |
| **Solicitações LGPD** | Tabela `lgpd_requests` para pedidos formais de acesso, exclusão, portabilidade ou revogação |

### Procedimento operacional para desativação de conta

1. **Desativar o perfil:** definir `profiles.is_active = false` (impede acesso de staff inativo via regras RLS; ver item abaixo)
2. **Revogar sessão / bloquear login:** via painel Supabase Auth ou API administrativa (recomendado para bloqueio completo de autenticação)
3. **Manter registros clínicos:** paciente, prontuário, ciclos, evoluções e documentos **permanecem** no banco
4. **Alterar status assistencial se aplicável:** ex. `care_status = 'PAUSA'` quando o tratamento for interrompido

### Controles de acesso relacionados

- Funções internas (`is_staff`, `is_staff_role`) exigem **`is_active = true`** — colaboradores desativados perdem acesso operacional mesmo com credencial Auth válida
- Pacientes **não** têm acesso direto ao prontuário completo via portal (regra de negócio + RLS)
- Exclusão definitiva de dados sensíveis deve seguir **fluxo LGPD** (`lgpd_requests`) e parecer jurídico, considerando retenção mínima exigida pelo CFM/CREFITO e demais normas aplicáveis

### Observação de maturidade do produto

O campo `is_active` existe e é respeitado nas regras de banco para perfis internos. Para **bloqueio total de login** de pacientes ou profissionais, recomenda-se combinar `is_active = false` com **revogação de sessão/banimento no Supabase Auth**. Essa operação pode ser realizada pela equipe técnica ou admin autorizado.

---

## Resumo executivo para inclusão na Política de Privacidade

| Pergunta | Resposta em uma linha |
|----------|----------------------|
| Onde está o banco? | Supabase Cloud (PostgreSQL na AWS) |
| Qual provedor? | Supabase + AWS; frontend em Sagitta Digital; pagamentos Asaas |
| Região dos dados | Região AWS do projeto Supabase (confirmar; recomendado São Paulo) |
| Backup automático? | Sim, diário (planos pagos); retenção 7–30 dias conforme plano |
| Criptografia em repouso? | Sim, AES-256 |
| Criptografia em trânsito? | Sim, HTTPS/TLS |
| Logs e auditoria? | Sim — prontuário, credenciamento, audit_logs, LGPD; RLS em todo o banco |
| Terceiros? | Supabase/AWS, Asaas, Sagitta, OSM/Nominatim, Let's Encrypt; lojas mobile quando publicadas |
| Desativar sem apagar prontuário? | Sim — conta desativável; registros clínicos retidos com restrições de exclusão |

---

## Itens pendentes de confirmação (checklist interno)

Antes de publicar a política de privacidade, a Larsana Care / Sagitta Digital deve confirmar:

- [ ] Região exata do projeto Supabase (`sa-east-1` ou outra)
- [ ] Plano Supabase contratado (Pro / Team / Enterprise)
- [ ] PITR habilitado ou não
- [ ] DPA (Data Processing Agreement) assinado com Supabase, se aplicável
- [ ] Contrato e DPA com Asaas
- [ ] Procedimento formal interno para desativação de contas e atendimento a titulares LGPD
- [ ] Atualização deste documento quando novos terceiros forem integrados (WhatsApp, e-mail, analytics, ICP-Brasil)

---

## Referências oficiais

- [Supabase — Available Regions](https://supabase.com/docs/guides/platform/regions)
- [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase — Data Encryption](https://supabase.com/docs/guides/security/encryption)
- [Supabase — Security](https://supabase.com/security)
- [Supabase — GDPR Compliance](https://supabase.com/docs/guides/security/gdpr-compliance)
- Documentação interna: `data/supabase/README.md`, `docs/PRD.md`

---

*Documento gerado com base na arquitetura e migrations do repositório Larsana Care (agosto/2026). Para dúvidas técnicas: equipe Sagitta Digital.*
