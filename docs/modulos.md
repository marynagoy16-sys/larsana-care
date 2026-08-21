Módulos do Projeto

> **Go-live V1.1 (app paciente):** ver [PRD.md §4.3](./PRD.md) e [FASE0_CHECKLIST_ALINHAMENTO.md](./FASE0_CHECKLIST_ALINHAMENTO.md).

Detalhamento dos Módulos
Cada módulo foi planejado para entregar valor específico ao seu projeto, com entregas claras e mensuráveis.

Painel Administrativo
Centro de comando: pacientes, profissionais, ciclos, avaliações em andamento, caixa (recebido vs a repassar) e alertas operacionais.

KPIs: pacientes ativos, ciclos abertos, pagamentos pendentes e repasses a liberar
Fila de avaliações por estado (proposta enviada, em análise, respondida)
Gráfico faturamento vs repasse vs margem (capital de giro)
Alertas: cobrança vencida, contrato pendente, prontuário incompleto 24h, avaliação sem resposta em 5d
Mapa/ranking por Região A/B/C
Exportação DELUMA: XLSX/CSV com NF do profissional e recibo do paciente vinculados por ciclo
Cadastro de Pacientes
Ficha clínica completa, classificação nível/região e workflow de avaliação inicial rastreável para gestão e profissional.

Formulário multi-etapas: dados, responsável, endereço e documentos
Avaliação clínica inicial com editor rich-text
Nível 1/2/3/Valor Social e Região A/B/C automática
Workflow rastreável (estilo Correios) visível no painel e no app do profissional
Estados: Avaliação feita → Proposta enviada → Em análise (até 5 dias) → SIM ou NÃO
SIM: libera agendamento do 1º ciclo · NÃO: gera cobrança R$ 50 (prazo 30 dias) pela avaliação
Notificação ao fisioterapeuta quando a família responder
Histórico de avaliações e trocas de profissional
Termo de Adesão, Diretrizes e Política de Privacidade: aceite digital no cadastro (sem Gov.br)
Checkbox obrigatório + versão do PDF + data/hora e IP do responsável
Bloqueio de workflow e 1º ciclo sem aceite vigente
Credenciamento de Profissionais
Credenciamento com contrato LRS-PROF sequencial, ANEXO I, fluxo de assinatura digital e documentação CREFITO/COREN.

Cadastro PF/PJ com dados bancários e conselho (CREFITO/COREN/etc.)
Upload: documentos, antecedentes e certificados
Aceite digital Termos, Diretrizes e LGPD (checkbox + versão + IP — sem Gov.br)
Geração automática LRS-PROF.{FISIO|NUTI|MED|CUID|FONO}-2026-XXXX com ANEXO I preenchido
Fluxo de assinatura: documentos → termos → contrato gerado → aceite do PDF → aprovação gestão → ativo
Preview do contrato no painel (cabeçalho, partes, cláusulas 1–3 e demais)
Armazenamento do PDF assinado vinculado ao credenciamento
Classe Bronze/Prata/Ouro e Wallet Asaas (repasse pós-ciclo)
Bloqueio de alocação sem contrato assinado e documentação completa
Motor de Ciclos de Atendimento
Ciclos de 4 ou 8 sessões com pagamento antecipado obrigatório antes de iniciar e repasse ao profissional só após encerrar o ciclo.

Ciclos de 4 ou 8 sessões com numeração contínua
Bloqueio de abertura de novo ciclo sem confirmação de pagamento
Sessões só liberadas após pagamento antecipado confirmado (PIX/boleto)
Encerramento de ciclo dispara fila de repasse ao profissional
Grade previstas vs realizadas (realizada, falta, remarcada)
Pausa de tratamento sem apagar histórico
Notificação 48h antes do fechamento do ciclo
Prontuário Digital
Prontuário único Crefito/LGPD com alerta operacional em 24h e prazo contratual de 7 dias úteis para registro completo.

Editor por sessão com templates (avaliação, evolução, alta)
Registro: profissional, CREFITO, data/hora e ciclo
Flag de prontuário incompleto se sessão realizada sem registro em 24h
Prazo contratual exibido: registro definitivo em até 7 dias úteis (Termos LRS-PROF)
Linha do tempo, anexos e exportação PDF
Controle de versão e trilha de edição
Acesso restrito por perfil
Cobrança Asaas e Repasse pós-Ciclo
Cobrança antecipada PIX/boleto; capital de giro DELUMA; repasse pós-ciclo com NF; exportação contábil com recibos e notas vinculados.

API Asaas: cliente, cobrança, webhook de confirmação
Formas de pagamento: PIX e boleto apenas (sem cartão de crédito)
Pagamento antecipado obrigatório antes de iniciar ciclo/sessões
Sem split instantâneo — valor integral recebido pela Larsana primeiro
Repasse programado ao Wallet do profissional após encerramento do ciclo
Solicitação e registro de nota fiscal do profissional (valor do repasse)
Regras Bronze/Prata/Ouro e 40% no 1º mês de paciente novo
Status: pendente, pago, ciclo em andamento, repasse liberado
Exportação contabilidade DELUMA: recebimentos, repasses, NF do profissional e recibo/comprovante do paciente por ciclo (XLSX/CSV)
Anexo de NF e recibo armazenado no lançamento financeiro do ciclo
Motor de Repasses
Cálculo Bronze 70% / Prata 75% / Ouro 80% com liberação automática da fila de repasse somente após o último atendimento do ciclo.

Simulador: valor integral do ciclo (sessões × tabela V1-2026) → repasse Bronze/Prata/Ouro % → margem Larsana
Fila de repasses pendentes (ciclos encerrados, NF recebida)
Liberação de transferência Asaas após validação gestão/financeiro
Histórico por profissional e paciente
1º ciclo vs subsequentes (comissão diferenciada)
Exportação DELUMA: cada repasse com NF anexada + recibo do paciente do mesmo ciclo
Distinção: valor cobrado do paciente (tabela Região × Nível) vs repasse ao PP (comissionamento)
Repasse avulso PPSUB: substituto recebe por sessão realizada (liberado após check-out, sem NF); PP titular recebe repasse de ciclo apenas pelas sessões que ele realizou
App do Profissional Parceiro
Motor Bronze 70% / Prata 75% / Ouro 80% sobre o valor do ciclo pago pelo paciente (tabela V1-2026), com taxa 40% no 1º mês de paciente novo.

Agenda do dia com endereço domiciliar
Mapa/lista de demandas com aceitar/recusar
Acompanhamento do workflow de avaliação (status estilo rastreio)
Push quando família responder SIM/NÃO à proposta
Evolução clínica e check-in domiciliar
Limite 30h/semana Crefito
Push quando repasse for liberado ao fim do ciclo (não no pagamento do paciente)
Upload comparecimento assinado
Matching e Regiões
Tabelas de Valores Integrais V1-2026: Região × Nível define o valor/sessão cobrado do paciente; motor calcula o ciclo automaticamente.

Tabela 1 — Região A: Mauá, Ribeirão Pires, Rio Grande da Serra, Diadema — N1 R$100 · N2 R$130 · N3 R$150
Tabela 2 — Região B: Santo André, São Bernardo — N1 R$130 · N2 R$150 · N3 R$170
Tabela 3 — Região C: São Caetano, São Paulo Capital — N1 R$150 · N2 R$180 · N3 R$200
Versão configurável V1-2026 (publicação e histórico de versões)
Valor do ciclo = quantidade de sessões (4 ou 8) × valor/sessão da matriz vigente
Exceção Valor Social com valor negociado e aprovação da gestão
Cadastro de cidades/bairros vinculados à região automaticamente
Simulador paciente paga (integral) vs repasse profissional (%)
Painel de cobertura geográfica e sugestão por especialidade/raio
RBAC, LGPD e Auditoria
Perfis segregados, aceite digital de Termo de Adesão/Diretrizes/LGPD (sem Gov.br) e trilha de acesso a dados de saúde.

Admin, Financeiro, Gestão, Profissional, Paciente/Responsável
Aceite digital: Termo de Adesão + Diretrizes + Política de Privacidade (versão, checkbox, IP, timestamp)
Sem assinatura Gov.br no aceite — fluxo simples para responsáveis e profissionais
Reaceite obrigatório quando houver nova versão dos termos
Log de acessos e edições em prontuário
Consentimento LGPD e portabilidade
Termos versionados com histórico de aceites por titular
Relatórios e BI Operacional
Faturamento, repasses pós-ciclo, exportação contabilidade DELUMA com NF e recibos vinculados, horas Crefito e conversão avaliação→ciclo.

Pacote contabilidade DELUMA: recebido, repassado, margem, NF e recibo por ciclo (XLSX/CSV + PDF)
Relatório mensal recebido vs repassado vs margem
Aging de repasses pendentes (ciclo fechado, aguardando NF)
Horas por profissional vs 30h
Taxa de conversão avaliação → 1º ciclo
Exportação PDF/XLSX de demais relatórios operacionais
App do Paciente e Responsável
Acompanhamento do tratamento e pagamento antecipado do ciclo via PIX ou boleto — sem cartão de crédito.

Login do responsável vinculado ao paciente
Timeline: profissional, ciclo e próximas sessões
Pagamento antecipado do ciclo via PIX ou boleto (Asaas) — sem cartão
Comprovante digital após confirmação
Bloqueio visual se pagamento do ciclo pendente
NPS ao final do ciclo
Aceite digital Termo de Adesão + Diretrizes + LGPD no 1º acesso (sem Gov.br); reaceite se versão mudar
NPS e Qualidade do Cuidado
Avaliação mútua ao fim de cada ciclo com histórico e alertas.

NPS automático 24h após última sessão
Score por profissional no painel
Alerta nota ≤ 6 em dois ciclos
Priorização de demandas para profissionais bem avaliados
Workflow de Avaliação Inicial
Rastreio completo da avaliação até resposta da família — visível para o fisioterapeuta como status de entrega.

Linha do tempo: Avaliação feita → Proposta enviada → Em análise (5 dias) → Resposta
Timer de 5 dias úteis para resposta da família (aguardando)
Branch SIM: agenda 1º ciclo (avaliação = 1º atendimento registrado)
Branch NÃO: cobrança automática R$ 50 pela avaliação (vencimento 30 dias)
Painel gestão: fila de propostas pendentes e vencidas
App profissional: card de status por paciente avaliado
Notificações push/e-mail em cada mudança de estado
Histórico auditável para conformidade comercial