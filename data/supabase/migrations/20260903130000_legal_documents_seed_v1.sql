-- Seed v1.0 documentos jurídicos (mapa Larsana Care — Ago/2026)
-- Gerado por scripts/generate-legal-seed.py

-- Desativa versões antigas dos tipos que recebem conteúdo completo
UPDATE public.legal_terms SET is_current = false
WHERE term_type IN (
  'TERMO_ADESAO', 'DIRETRIZES', 'LGPD', 'DIRETRIZES_PP', 'LGPD_PP',
  'CONTRATO_INTERMEDIACAO', 'TERMO_CONSENTIMENTO'
) AND is_current = true;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('TERMO_USO_PP', '1.0-2026-08', 'Termos de Uso — Profissionais Parceiros', $legal_body$TERMOS DE USO DA PLATAFORMA — PROFISSIONAIS PARCEIROS FISIOTERAPEUTAS
LARSANA CAREVersão 1.0 — Agosto/2026

114300114300
Os presentes Termos de Uso regulam o acesso e a utilização da Plataforma Larsana Care pelos Profissionais Parceiros Fisioterapeutas (“PP”), estabelecendo regras relacionadas a cadastro, credenciais, funcionalidades, recebimento e aceite de demandas, agenda, registros assistenciais, comunicação, segurança, dados, avaliações, acesso ao Larsana Academy, Patentes e demais recursos disponibilizados pela Plataforma.
Ao realizar o aceite eletrônico destes Termos, o Profissional Parceiro declara que leu, compreendeu e concorda com suas disposições e com os documentos que os integram.

1. IDENTIFICAÇÃO DA LARSANA CARE
A Plataforma Larsana Care é operada por:
DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.CNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Neste documento, denominada simplesmente “Larsana Care” ou “Larsana”.

2. OBJETO DOS TERMOS
2.1. Estes Termos regulam a utilização da Plataforma Larsana Care pelos Profissionais Parceiros Fisioterapeutas.
2.2. A Plataforma fornece estrutura tecnológica e operacional destinada, entre outras funcionalidades, a:
cadastro e validação do PP;
organização de seu perfil profissional;
apresentação de novas demandas;
aceite ou recusa de demandas;
organização de agenda;
registro de atendimentos;
check-in e check-out;
registro de evoluções;
acompanhamento de ciclos;
comunicação operacional;
acesso a informações necessárias sobre os pacientes;
gestão de documentos;
acompanhamento de repasses;
acesso às Regras Comerciais;
acompanhamento de Patentes e pontuação;
acesso ao Larsana Academy;
avaliação da experiência do paciente;
e utilização de outras funcionalidades disponibilizadas pela Larsana.
2.3. Estes Termos não substituem o Contrato de Parceria firmado entre a Larsana Care e o PP.

3. NATUREZA DA RELAÇÃO COM O PP
3.1. O PP atua com autonomia profissional e técnica, nos limites da legislação e das normas aplicáveis à Fisioterapia.
3.2. A utilização da Plataforma não cria vínculo empregatício entre a Larsana Care e o Profissional Parceiro.
3.3. A Larsana Care organiza e intermedeia a operação, mas não substitui o fisioterapeuta em:
avaliação profissional;
diagnóstico fisioterapêutico;
escolha de condutas;
definição do plano assistencial;
decisão de alta;
decisão de encaminhamento;
ou demais atos próprios da profissão.
3.4. A responsabilidade técnica pelos atos fisioterapêuticos praticados pelo PP permanece com o profissional executor.

4. DEFINIÇÕES
Para fins destes Termos:
I — Plataforma: ambiente tecnológico da Larsana Care utilizado pelo PP;
II — Profissional Parceiro ou PP: fisioterapeuta credenciado para receber e executar demandas intermediadas pela Larsana;
III — Paciente: pessoa que recebe ou poderá receber atendimento intermediado pela Larsana;
IV — Responsável: pessoa cadastrada para finalidade administrativa, financeira, assistencial ou operacional, sem que isso implique automaticamente representação legal;
V — Demanda: oportunidade de atendimento disponibilizada ao PP;
VI — Avaliação Inicial: primeiro atendimento destinado à avaliação fisioterapêutica;
VII — Ciclo: conjunto de atendimentos contratado pelo paciente;
VIII — PP Responsável: profissional que assume a continuidade principal do acompanhamento;
IX — SUB: Profissional Parceiro que realiza temporariamente uma ou mais sessões durante indisponibilidade do PP Responsável;
X — Atendimento: serviço fisioterapêutico efetivamente prestado;
XI — Evolução: registro assistencial relacionado a atendimento efetivamente realizado;
XII — Patente: classificação comercial interna utilizada pela Larsana;
XIII — Larsana Academy: ambiente de conteúdos educativos e formativos disponibilizados aos PPs;
XIV — Canais Oficiais: Plataforma e demais canais expressamente reconhecidos pela Larsana, inclusive WhatsApp, telefone ou e-mail quando aplicáveis.

5. CADASTRO DO PROFISSIONAL PARCEIRO
5.1. Para utilizar as funcionalidades destinadas aos PPs, o profissional deverá realizar seu cadastro e fornecer as informações solicitadas.
5.2. Poderão ser solicitados, entre outros:
nome completo;
CPF;
documento de identificação;
telefone;
e-mail;
endereço;
fotografia;
número de registro profissional;
documentos relacionados ao CREFITO;
documentos de regularidade;
certificados;
dados bancários ou financeiros;
informações fiscais;
informações empresariais, quando PJ;
categorias técnicas;
experiência profissional;
e demais informações necessárias ao credenciamento.
5.3. O fornecimento de informação falsa, adulterada, incompleta de forma relevante ou pertencente a terceiro poderá resultar em bloqueio ou encerramento do cadastro.

6. VALIDAÇÃO CADASTRAL
6.1. O cadastro poderá passar por processo de análise e validação antes da liberação integral da conta.
6.2. A Larsana poderá solicitar documentos adicionais ou atualização de informações.
6.3. A aprovação cadastral não constitui certificação irrestrita da capacidade técnica do PP para todo e qualquer atendimento.
6.4. O profissional permanece responsável por sua regularidade profissional e por avaliar sua própria competência antes de assumir cada paciente.

7. MANUTENÇÃO DA REGULARIDADE PROFISSIONAL
7.1. O PP deverá manter válidos e atualizados os documentos necessários à sua atuação.
7.2. O profissional deverá informar à Larsana situações que afetem de maneira relevante sua possibilidade de atuação, incluindo suspensão ou irregularidade de registro profissional.
7.3. A Larsana poderá restringir o acesso a novas demandas enquanto houver pendência cadastral ou documental relevante.

8. CONTA PESSOAL E INTRANSFERÍVEL
8.1. A conta do PP é pessoal e intransferível.
8.2. É vedado compartilhar senha, código de autenticação ou credenciais.
8.3. O profissional responderá pelo uso regular de sua conta e deverá informar imediatamente eventual suspeita de acesso indevido.
8.4. Nenhum terceiro poderá realizar atendimento utilizando o perfil ou a identidade digital de outro PP.

9. PROFISSIONAL PARCEIRO PESSOA JURÍDICA
9.1. Quando a parceria for realizada por Pessoa Jurídica, a execução clínica deverá estar vinculada a profissional individual devidamente cadastrado e validado.
9.2. A Pessoa Jurídica não poderá encaminhar profissional não credenciado para realizar o atendimento em nome do executor registrado.
9.3. Cada atendimento deverá permanecer associado ao profissional que efetivamente o realizou.

10. FUNCIONALIDADES DA PLATAFORMA
10.1. As funcionalidades disponíveis poderão variar conforme:
status cadastral;
categoria técnica;
habilitação;
Patente;
modalidade de parceria;
tipo de demanda;
fase de desenvolvimento da Plataforma;
ou regras internas vigentes.
10.2. A Larsana poderá criar, alterar, substituir ou descontinuar funcionalidades, respeitados os direitos já constituídos e os atendimentos em andamento.

11. RECEBIMENTO DE NOVAS DEMANDAS
11.1. A Plataforma poderá apresentar ao PP demandas compatíveis com seu perfil.
11.2. A apresentação de uma demanda não constitui obrigação de aceite.
11.3. Antes de aceitar, o PP deverá analisar as informações disponibilizadas, nos termos das Regras Operacionais.
11.4. O PP deverá avaliar, especialmente:
localização;
distância;
disponibilidade;
frequência;
horários;
categoria;
habilitação exigida;
e sua própria competência para o caso.

12. ACEITE DA DEMANDA
12.1. O aceite realizado pela Plataforma ou por canal oficial autorizado será considerado manifestação válida de interesse e compromisso operacional.
12.2. O PP somente deverá aceitar demanda que efetivamente tenha condições de assumir.
12.3. Após o aceite, espera-se continuidade compatível com as condições previamente conhecidas pelo profissional.
12.4. Distância, localização ou incompatibilidade de agenda que já poderiam ser verificadas antes do aceite não deverão ser utilizadas como motivo habitual para devolução posterior do paciente.

13. AUTONOMIA PARA RECUSAR CONDUTA OU CONTINUIDADE
13.1. O aceite operacional da demanda não elimina a autonomia técnica do fisioterapeuta.
13.2. Após avaliar o paciente, o PP poderá entender que determinada conduta ou continuidade:
não é indicada;
apresenta contraindicação;
exige outro profissional;
exige estrutura diferente;
excede sua competência;
ou não possui condições seguras para realização.
13.3. Nessas situações, o PP deverá agir de maneira tecnicamente fundamentada e realizar os registros e comunicações pertinentes.

14. AVALIAÇÃO INICIAL
14.1. O PP deverá organizar a Avaliação Inicial conforme as Regras Operacionais vigentes.
14.2. A avaliação constitui ato fisioterapêutico sob autonomia e responsabilidade do profissional.
14.3. A indicação de continuidade após a avaliação não constitui contratação automática do tratamento pelo paciente.
14.4. As condições comerciais da Avaliação Inicial serão definidas nas Regras Comerciais vigentes.

15. CICLOS DE ATENDIMENTO
15.1. Os pacientes poderão contratar ciclos conforme os formatos disponibilizados pela Larsana Care.
15.2. As regras de composição dos ciclos, percentuais de repasse e demais condições financeiras serão disciplinadas pelas Regras Comerciais.
15.3. A quantidade de sessões contratadas não interfere na autonomia técnica do PP para avaliar indicação, contraindicação ou alta.

16. AGENDA
16.1. O PP deverá manter sua agenda operacional atualizada.
16.2. Os atendimentos agendados deverão ser registrados conforme as funcionalidades da Plataforma.
16.3. Alterações, reagendamentos e cancelamentos deverão ser realizados pelos mecanismos autorizados.
16.4. O PP deverá organizar sua agenda de maneira compatível com seus deslocamentos e demais compromissos.

17. CHECK-IN E CHECK-OUT
17.1. Quando disponibilizados, os recursos de check-in e check-out deverão ser utilizados conforme as Regras Operacionais.
17.2. Os registros deverão refletir a realidade do atendimento.
17.3. É vedado:
simular presença;
registrar atendimento sem estar no local;
manipular localização;
alterar artificialmente horário;
solicitar que outra pessoa realize o registro;
ou utilizar meios para contornar controles de presença.

18. LOCALIZAÇÃO
18.1. A Plataforma poderá utilizar dados de localização quando necessários para funcionalidades como check-in, check-out, confirmação de presença, segurança ou validação operacional.
18.2. O tratamento desses dados deverá observar a Política de Privacidade aplicável.
18.3. A utilização da localização deverá se limitar às finalidades legítimas da operação e às funcionalidades efetivamente ativadas.

19. EVOLUÇÃO ASSISTENCIAL
19.1. Todo atendimento fisioterapêutico efetivamente realizado deverá possuir registro assistencial compatível.
19.2. A evolução deverá ser inserida pelo profissional executor.
19.3. O PP deverá cumprir os prazos e requisitos previstos nas Regras Operacionais.
19.4. É vedado registrar como realizado atendimento que não ocorreu.

20. INTEGRIDADE DOS REGISTROS
20.1. Registros finalizados deverão preservar autoria, data, horário e rastreabilidade.
20.2. Correções deverão ocorrer pelos mecanismos previstos na Plataforma.
20.3. Sempre que tecnicamente possível, alterações deverão preservar o histórico anterior.
20.4. É vedada a manipulação deliberada de registros com objetivo de ocultar ou modificar indevidamente a realidade assistencial.

21. ATENDIMENTOS NÃO REALIZADOS
21.1. Cancelamentos, ausências ou sessões contratualmente consumidas não constituem atendimentos clínicos realizados.
21.2. Nessas hipóteses, deverá ser utilizado o registro operacional correspondente.
21.3. Não deverá ser produzida evolução clínica fictícia.

22. CANCELAMENTOS E REAGENDAMENTOS
22.1. As regras aplicáveis a cancelamentos, reagendamentos e ausências deverão observar os documentos vigentes da Larsana Care.
22.2. Quando o cancelamento ocorrer por iniciativa do PP, este deverá colaborar com a organização da reposição ou da continuidade.
22.3. As consequências financeiras observarão as Regras Comerciais.

23. PROFISSIONAL SUBSTITUTO — SUB
23.1. A Plataforma poderá permitir organização de atendimento temporário por SUB.
23.2. A atuação dependerá de compatibilidade técnica, disponibilidade e aceitação do paciente.
23.3. O SUB deverá utilizar sua própria conta e registrar os atendimentos que realizar.
23.4. A atuação do SUB não transfere automaticamente a continuidade definitiva do paciente.

24. PAUSAS E ENCERRAMENTOS
24.1. Situações de pausa, alta, encerramento por decisão do paciente ou impossibilidade de continuidade pelo PP deverão ser registradas conforme as Regras Operacionais.
24.2. O PP deverá colaborar com a continuidade segura das informações quando houver troca de profissional.

25. CATEGORIAS TÉCNICAS
25.1. A Plataforma poderá organizar as demandas por categorias técnicas.
25.2. As categorias atualmente utilizadas e seus critérios são definidos no Anexo de Categorias Técnicas e Habilitações.
25.3. O PP deverá selecionar apenas categorias nas quais se considere tecnicamente apto a atuar.

26. HABILITAÇÃO CARDIORRESPIRATÓRIA
26.1. A categoria Cardiorrespiratória poderá depender de validação adicional da Larsana Care.
26.2. A simples seleção dessa categoria pelo profissional não gera liberação automática.
26.3. Poderão ser solicitados certificados, formação, experiência ou documentos adicionais.
26.4. A aprovação interna não equivale a título oficial de especialista e não elimina a responsabilidade do PP por avaliar sua competência em cada caso.

27. PATENTES
27.1. A Larsana Care poderá adotar sistema interno de Patentes para organização da jornada comercial dos PPs.
27.2. As Patentes, percentuais, faixas de pontuação e requisitos de progressão serão definidos exclusivamente nas Regras Comerciais vigentes.
27.3. Os valores e parâmetros não são incorporados de forma permanente a estes Termos e poderão ser alterados conforme as regras de atualização aplicáveis.

28. PONTUAÇÃO
28.1. A Plataforma poderá manter sistema de pontuação relacionado à jornada comercial do PP.
28.2. As fontes, pesos, critérios e regras de pontuação serão definidos nas Regras Comerciais.
28.3. A pontuação não constitui título profissional, avaliação técnica oficial ou certificação perante conselho profissional.

29. AVALIAÇÃO DE EXPERIÊNCIA DO PACIENTE
29.1. O paciente poderá avaliar sua experiência com o PP.
29.2. A participação do paciente será facultativa.
29.3. A ausência de avaliação não deverá ser interpretada automaticamente como avaliação negativa.
29.4. A forma como avaliações influenciam pontuação ou progressão será definida nas Regras Comerciais.
29.5. Reclamações, incidentes ou questões de segurança poderão ser analisados separadamente do sistema de pontuação.

30. LARSANA ACADEMY
30.1. A Plataforma poderá disponibilizar conteúdos por meio do Larsana Academy.
30.2. Determinados conteúdos poderão:
ser facultativos;
estar associados a pontuação;
ser necessários para determinada funcionalidade;
ou ser definidos como obrigatórios quando relacionados à segurança, operação, habilitação ou requisito regulatório.
30.3. A eventual pontuação concedida por conteúdos elegíveis será definida nas Regras Comerciais vigentes.
30.4. A disponibilidade, quantidade e formato dos conteúdos poderão variar ao longo do tempo.

31. REPASSES E INFORMAÇÕES FINANCEIRAS
31.1. A Plataforma poderá apresentar informações sobre:
valores de atendimentos;
repasses;
percentual aplicável;
documentos pendentes;
valores liberados;
valores temporariamente retidos;
e histórico financeiro.
31.2. As condições econômicas serão reguladas pelo Contrato de Parceria e pelas Regras Comerciais.
31.3. Informações financeiras exibidas na Plataforma deverão ser interpretadas em conjunto com os registros efetivos da operação.

32. DOCUMENTAÇÃO FISCAL
32.1. O PP deverá apresentar os documentos fiscais ou comprobatórios aplicáveis à sua modalidade de atuação.
32.2. Profissionais PF e PJ deverão observar suas respectivas obrigações legais.
32.3. A Plataforma poderá disponibilizar dados destinados a facilitar o correto preenchimento dos documentos.
32.4. O PP permanece responsável pela correção e regularidade dos documentos que emitir.

33. PROCESSAMENTO DE PAGAMENTOS
33.1. A Larsana poderá utilizar prestadores de serviços financeiros para processamento de pagamentos, divisão de valores, retenção, liberação e demais operações necessárias.
33.2. A utilização desses serviços poderá estar sujeita a termos e políticas próprios do respectivo prestador.
33.3. A Larsana poderá substituir o prestador financeiro utilizado, desde que preserve a continuidade operacional e informe quando necessário.

34. ACESSO A DADOS DE PACIENTES
34.1. O PP terá acesso somente aos dados necessários à execução dos atendimentos e à operação.
34.2. É vedado acessar informações de pacientes sem finalidade legítima.
34.3. As obrigações específicas de sigilo, confidencialidade e utilização de dados assistenciais estão previstas no Anexo IV — Termo/Política de Sigilo, Confidencialidade e Dados Assistenciais.

35. FAMILIARES E RESPONSÁVEIS
35.1. A existência de familiar ou responsável cadastrado não implica automaticamente:
representação legal;
autorização irrestrita;
ou direito de acesso integral aos dados clínicos.
35.2. O PP deverá observar os limites de autorização, representação e sigilo aplicáveis.

36. PROTEÇÃO DOS DADOS DO PRÓPRIO PP
36.1. A Larsana tratará os dados pessoais do PP conforme a Política de Privacidade destinada aos Profissionais Parceiros.
36.2. A Política de Privacidade deverá informar, entre outros aspectos:
categorias de dados coletados;
finalidades;
bases legais;
compartilhamentos;
segurança;
retenção;
direitos dos titulares;
e canais de contato.

37. USO DE IMAGEM E REDES SOCIAIS
37.1. O PP não poderá utilizar imagens, vídeos, voz, dados clínicos ou depoimentos de pacientes para divulgação sem autorização adequada e observância das normas aplicáveis.
37.2. O simples atendimento do paciente por intermédio da Larsana não constitui autorização para divulgação.
37.3. As regras específicas estão detalhadas no Anexo IV.

38. USO INDEVIDO DE DADOS PARA PROSPECÇÃO
38.1. É vedado utilizar dados obtidos por intermédio da Plataforma para prospecção própria incompatível com a finalidade original.
38.2. É vedado utilizar dados do paciente para tentativa deliberada de deslocamento da relação para fora da operação Larsana com objetivo de evitar as condições comerciais regularmente aplicáveis.
38.3. Esta regra deverá ser interpretada de maneira proporcional, sem impedir a autonomia do paciente e a liberdade profissional nos limites legais e contratuais.

39. SEGURANÇA DA PLATAFORMA
39.1. É vedado ao PP:
tentar acessar áreas não autorizadas;
explorar falhas de segurança;
interferir no funcionamento da Plataforma;
manipular permissões;
contornar mecanismos de controle;
utilizar automações não autorizadas para acesso;
ou realizar qualquer ação capaz de comprometer dados ou sistemas.
39.2. A identificação de vulnerabilidade deverá ser comunicada à Larsana, e não explorada.

40. AUDITORIA E REGISTROS
40.1. A Plataforma poderá manter registros relacionados ao uso da conta.
40.2. Poderão ser registrados, quando tecnicamente disponíveis:
logins;
data e hora;
ações realizadas;
aceite de demandas;
alterações de agenda;
check-in e check-out;
evoluções;
versões de registros;
documentos;
acessos;
e outras ações relevantes.
40.3. Esses registros poderão ser utilizados para segurança, auditoria, resolução de divergências, cumprimento de obrigações e defesa de direitos.

41. COMUNICAÇÕES OFICIAIS
41.1. A Plataforma será o canal principal de comunicação operacional.
41.2. A Larsana poderá também utilizar:
WhatsApp;
e-mail;
telefone;
notificações;
ou outros canais cadastrados.
41.3. O PP deverá manter seus dados atualizados.
41.4. Comunicações relevantes poderão integrar o histórico operacional da relação.

42. INDISPONIBILIDADE DA PLATAFORMA
42.1. A Plataforma poderá sofrer indisponibilidades temporárias decorrentes de manutenção, atualização, falha técnica ou eventos externos.
42.2. Quando necessário, a Larsana poderá disponibilizar procedimentos alternativos de contingência.
42.3. A indisponibilidade não autoriza:
criação de registro fictício;
alteração da realidade do atendimento;
ou descumprimento deliberado das regras assistenciais.
42.4. Registros realizados por contingência deverão ser regularizados posteriormente quando possível.

43. SERVIÇOS DE TERCEIROS
43.1. Algumas funcionalidades poderão depender de prestadores externos.
43.2. Poderão ser utilizados terceiros para atividades como:
hospedagem;
autenticação;
pagamentos;
comunicação;
armazenamento;
análise de segurança;
ou outras funções tecnológicas.
43.3. A utilização desses serviços observará a legislação aplicável e as políticas de privacidade pertinentes.

44. PROPRIEDADE INTELECTUAL
44.1. A Plataforma, marca, identidade visual, conteúdos próprios, materiais, cursos, textos, vídeos, fluxos e demais ativos da Larsana permanecerão protegidos nos termos da legislação aplicável.
44.2. O acesso à Plataforma não transfere ao PP propriedade sobre esses conteúdos.
44.3. É vedada reprodução, distribuição ou exploração não autorizada de materiais protegidos.

45. PROIBIÇÕES GERAIS
É vedado ao PP:
I — utilizar conta de terceiro;
II — permitir uso de sua conta por terceiro;
III — fornecer informação cadastral falsa;
IV — falsificar documentos;
V — simular atendimento;
VI — produzir evolução fictícia;
VII — manipular check-in, check-out ou localização;
VIII — acessar prontuário sem necessidade;
IX — compartilhar dados de paciente de forma indevida;
X — utilizar dados para prospecção não autorizada;
XI — burlar controles de segurança;
XII — permitir atendimento por profissional não credenciado;
XIII — utilizar habilitação que não possua;
XIV — atribuir atendimento a outro profissional;
XV — praticar fraude financeira ou operacional;
XVI — utilizar a Plataforma em desacordo com a legislação ou normas profissionais.

46. DESCUMPRIMENTOS
46.1. O descumprimento destes Termos poderá resultar em análise da ocorrência.
46.2. Poderão ser consideradas:
gravidade;
risco ao paciente;
reincidência;
intenção;
impacto operacional;
impacto financeiro;
e histórico do PP.
46.3. Poderão ser adotadas medidas proporcionais, incluindo:
orientação;
solicitação de regularização;
advertência;
limitação de funcionalidades;
bloqueio temporário;
suspensão;
ou encerramento da parceria, quando aplicável.

47. MEDIDAS IMEDIATAS DE PROTEÇÃO
47.1. A Larsana poderá adotar bloqueio preventivo ou restrição imediata quando houver indício relevante de:
fraude;
risco ao paciente;
falsificação de registros;
comprometimento de conta;
vazamento de dados;
irregularidade profissional grave;
ou risco significativo à operação.
47.2. A medida preventiva poderá permanecer enquanto forem realizadas verificações necessárias.

48. SUSPENSÃO DA CONTA
48.1. A conta poderá ser temporariamente suspensa em situações que exijam regularização ou análise.
48.2. Durante a suspensão, determinadas funcionalidades poderão ficar indisponíveis, inclusive recebimento de novas demandas.
48.3. Quando houver pacientes ativos, deverão ser adotadas medidas compatíveis com a continuidade e segurança assistencial.

49. ENCERRAMENTO DO ACESSO
49.1. O acesso à Plataforma poderá ser encerrado nas hipóteses previstas no Contrato de Parceria e demais documentos aplicáveis.
49.2. O encerramento não elimina obrigações anteriores, incluindo:
dever de sigilo;
obrigações documentais;
responsabilidades por atendimentos realizados;
deveres financeiros pendentes;
e preservação dos registros quando aplicável.

50. CONTINUIDADE DOS REGISTROS
50.1. O encerramento da conta não implica exclusão automática dos registros assistenciais.
50.2. Dados e registros poderão ser mantidos pelos períodos necessários para cumprimento de obrigações legais, profissionais, regulatórias, assistenciais e de defesa de direitos.

51. ATUALIZAÇÃO DOS TERMOS
51.1. Estes Termos poderão ser atualizados em razão de:
alterações legais;
mudanças regulatórias;
evolução da Plataforma;
novos serviços;
alterações operacionais;
ou necessidade de aperfeiçoamento das regras.
51.2. As versões atualizadas deverão ser disponibilizadas pelos canais oficiais.
51.3. Alterações relevantes poderão exigir nova manifestação de aceite.
51.4. O histórico de versão poderá ser preservado para fins de rastreabilidade.

52. RELAÇÃO COM OS ANEXOS
52.1. Integram a relação de uso da Plataforma, quando aplicáveis:
ANEXO I — Regras Comerciais dos Profissionais Parceiros — Fisioterapia;
ANEXO II — Regras Operacionais dos Profissionais Parceiros — Fisioterapia;
ANEXO III — Categorias Técnicas e Habilitações — Fisioterapia;
ANEXO IV — Termo/Política de Sigilo, Confidencialidade e Dados Assistenciais.
52.2. Cada Anexo disciplina matéria específica.
52.3. As Regras Comerciais disciplinam especialmente valores, Patentes, pontuação e repasses.
52.4. As Regras Operacionais disciplinam o fluxo cotidiano de atendimento.
52.5. O Anexo de Categorias Técnicas disciplina classificação e habilitações.
52.6. O Anexo IV disciplina sigilo, confidencialidade e dados assistenciais.

53. PREVALÊNCIA ENTRE DOCUMENTOS
53.1. Os documentos deverão ser interpretados de forma complementar.
53.2. Em matéria especificamente comercial, prevalecerão as Regras Comerciais vigentes.
53.3. Em matéria operacional, serão observadas as Regras Operacionais vigentes.
53.4. Em matéria de categorias e habilitações, será observado o Anexo correspondente.
53.5. Em matéria de sigilo e utilização de dados assistenciais pelo PP, será observado o Anexo IV.
53.6. O Contrato de Parceria permanecerá como instrumento principal da relação jurídica e econômica entre a Larsana e o PP.

54. ACEITE ELETRÔNICO
54.1. O aceite destes Termos poderá ocorrer por meio eletrônico.
54.2. O registro poderá incluir, conforme disponibilidade técnica:
nome do PP;
CPF;
identificação da conta;
número do CREFITO;
versão do documento;
data;
horário;
endereço IP;
informações do dispositivo;
e outros elementos de rastreabilidade.
54.3. O aceite eletrônico terá validade nos limites admitidos pela legislação aplicável.

55. DECLARAÇÕES DO PROFISSIONAL PARCEIRO
Ao aceitar estes Termos, o PP declara:
I — que as informações fornecidas são verdadeiras;
II — que possui registro profissional compatível com sua atuação;
III — que leu e compreendeu estes Termos;
IV — que teve acesso aos Anexos aplicáveis;
V — que se compromete a utilizar a Plataforma de forma ética, segura e compatível com sua atividade profissional;
VI — que compreende que deve avaliar sua competência antes de assumir cada demanda;
VII — que compreende que a Larsana não substitui sua autonomia técnica ou responsabilidade profissional.

56. DISPOSIÇÕES GERAIS
56.1. A eventual tolerância de uma das partes em relação ao descumprimento de determinada obrigação não representará renúncia permanente ao respectivo direito.
56.2. A invalidade de uma disposição não prejudicará as demais, quando juridicamente possível.
56.3. Estes Termos deverão ser interpretados conforme a legislação brasileira e os demais documentos integrantes da relação.

57. VIGÊNCIA
57.1. Estes Termos entram em vigor na data indicada em sua versão.
57.2. Permanecerão aplicáveis enquanto o PP mantiver acesso à Plataforma, sem prejuízo das obrigações que devam permanecer após o encerramento da relação.

DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.LARSANA CARECNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Versão 1.0 — Agosto/2026$legal_body$, true, 'pp'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('LGPD_PP', '1.0-2026-08', 'Política de Privacidade — Profissionais Parceiros', $legal_body$POLÍTICA DE PRIVACIDADE — PROFISSIONAIS PARCEIROS
LARSANA CAREVersão 1.0 — Agosto/2026
114300114300

A presente Política de Privacidade descreve como a Larsana Care trata os dados pessoais dos Profissionais Parceiros (“PP”) que realizam cadastro, credenciamento, utilizam a Plataforma ou atuam em demandas intermediadas pela Larsana Care.
Esta Política foi elaborada para apresentar, de forma transparente, quais dados poderão ser tratados, para quais finalidades, em quais circunstâncias poderão ser compartilhados, por quanto tempo poderão ser mantidos e quais direitos poderão ser exercidos pelos titulares.

1. IDENTIFICAÇÃO DA LARSANA CARE
A Plataforma Larsana Care é operada por:
DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.CNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Neste documento, denominada “Larsana Care”, “Larsana” ou “nós”.

2. A QUEM ESTA POLÍTICA SE APLICA
2.1. Esta Política se aplica aos dados pessoais tratados pela Larsana em relação aos Profissionais Parceiros, incluindo:
profissionais em processo de cadastro;
profissionais em validação;
profissionais cadastrados;
profissionais ativos;
profissionais temporariamente suspensos;
profissionais que tenham encerrado sua parceria;
e, quando aplicável, representantes ou profissionais vinculados a Pessoa Jurídica parceira.
2.2. Esta Política tem como foco os dados pessoais do próprio Profissional Parceiro.
2.3. As regras específicas relativas ao acesso, utilização e proteção dos dados assistenciais dos pacientes pelo PP estão previstas no Anexo IV — Termo/Política de Sigilo, Confidencialidade e Dados Assistenciais.

3. PRINCÍPIOS DO TRATAMENTO DE DADOS
A Larsana busca tratar dados pessoais em conformidade com os princípios previstos na legislação brasileira de proteção de dados, incluindo:
finalidade;
adequação;
necessidade;
transparência;
segurança;
prevenção;
não discriminação;
qualidade dos dados;
livre acesso;
responsabilização e prestação de contas.

4. CATEGORIAS DE DADOS QUE PODERÃO SER TRATADAS
Dependendo da fase de cadastro, utilização da Plataforma e atuação do PP, a Larsana poderá tratar diferentes categorias de dados.

5. DADOS DE IDENTIFICAÇÃO
Poderão ser tratados:
nome completo;
CPF;
data de nascimento;
documento de identificação;
fotografia;
assinatura;
nacionalidade, quando necessária;
e demais informações necessárias à identificação do profissional.

6. DADOS DE CONTATO
Poderão ser tratados:
telefone;
número de WhatsApp;
e-mail;
endereço;
cidade;
região de atuação;
e demais informações fornecidas para comunicação.

7. DADOS PROFISSIONAIS
Poderão ser tratados:
profissão;
número de inscrição no conselho profissional;
CREFITO competente;
situação cadastral ou profissional quando verificável;
formação acadêmica;
cursos;
especializações;
certificados;
experiência profissional;
áreas de atuação;
categorias técnicas selecionadas;
habilitações internas;
currículo ou histórico profissional;
e demais informações relacionadas ao credenciamento.

8. DOCUMENTOS DE CREDENCIAMENTO
A Larsana poderá solicitar e tratar documentos necessários à análise e manutenção do cadastro do PP, incluindo, conforme aplicável:
documento de identificação;
comprovantes profissionais;
certidões;
documentos relacionados ao conselho profissional;
certificados;
documentos empresariais;
documentos fiscais;
documentos de regularidade;
e outros documentos necessários ao processo de credenciamento.
8.1. A quantidade e a natureza dos documentos poderão variar conforme a modalidade de atuação e as exigências operacionais ou legais vigentes.

9. DADOS DE PESSOA JURÍDICA
Quando o PP atuar por meio de Pessoa Jurídica, poderão ser tratados:
razão social;
nome empresarial;
CNPJ;
endereço da empresa;
dados de representantes;
documentos societários;
dados fiscais;
informações bancárias;
e identificação do profissional executor.
9.1. Dados relacionados exclusivamente à pessoa jurídica que não identifiquem pessoa natural não constituem dados pessoais para fins da LGPD, sem prejuízo da proteção contratual e de confidencialidade aplicável.

10. DADOS BANCÁRIOS, FINANCEIROS E DE PAGAMENTO
Para operacionalização dos repasses e demais fluxos financeiros, poderão ser tratados:
dados bancários;
chave PIX;
dados necessários à criação ou vinculação de conta em prestador financeiro;
identificação de carteira ou conta de pagamento;
valores de atendimentos;
percentuais de repasse;
valores liberados;
valores retidos;
histórico de pagamentos;
estornos;
divergências financeiras;
e demais informações relacionadas à operação.

11. DADOS FISCAIS
Poderão ser tratados dados necessários à conferência e gestão dos documentos fiscais ou comprobatórios relacionados aos serviços prestados, incluindo:
Receita Saúde, quando aplicável;
Nota Fiscal de Serviço;
dados de identificação fiscal;
valores;
datas;
identificação do prestador;
identificação do beneficiário ou pagador quando necessária;
e demais informações exigidas pela legislação aplicável.
11.1. A Larsana poderá disponibilizar ao PP determinadas informações necessárias à emissão correta dos documentos.
11.2. O PP permanece responsável pelo cumprimento de suas próprias obrigações fiscais e pela correção dos documentos emitidos.

12. DADOS DE CADASTRO NA PLATAFORMA
Poderão ser tratados:
identificação da conta;
nome de usuário, quando aplicável;
status do cadastro;
data de criação;
data de ativação;
categorias habilitadas;
situação documental;
status operacional;
e demais dados relacionados à conta do PP.

13. DADOS SOBRE DISPONIBILIDADE E ÁREA DE ATUAÇÃO
Para compatibilização das demandas, poderão ser tratados:
cidades e regiões atendidas;
raio ou área de atuação;
disponibilidade de dias;
períodos;
horários;
frequência disponível;
categorias de atendimento;
e outras informações fornecidas pelo PP para organização das oportunidades.

14. DADOS RELACIONADOS ÀS DEMANDAS
A Plataforma poderá registrar informações como:
demandas apresentadas;
demandas visualizadas;
aceites;
recusas;
data e horário do aceite;
pacientes vinculados ao PP;
início e encerramento de acompanhamentos;
substituições;
atuação como SUB;
e demais eventos necessários à organização da operação.

15. DADOS DE AGENDA
Poderão ser tratados:
datas dos atendimentos;
horários;
reagendamentos;
cancelamentos;
frequência;
histórico de alterações;
e informações relacionadas à organização da agenda do PP.

16. CHECK-IN, CHECK-OUT E LOCALIZAÇÃO
16.1. Quando essas funcionalidades estiverem disponíveis e ativadas, a Larsana poderá tratar dados relacionados ao check-in e check-out dos atendimentos.
16.2. Esses dados poderão incluir:
data;
horário;
identificação do atendimento;
confirmação de início e término;
e dados de localização associados à funcionalidade.
16.3. Dados de localização poderão ser utilizados para finalidades como:
confirmação operacional de presença;
segurança;
prevenção de fraude;
verificação de inconsistências;
e funcionamento das funcionalidades relacionadas ao atendimento domiciliar.
16.4. A Larsana não deverá utilizar localização do PP para acompanhamento contínuo e indiscriminado fora das finalidades informadas e das funcionalidades efetivamente utilizadas.

17. REGISTROS DE ATENDIMENTO
17.1. A Plataforma poderá registrar informações que identifiquem o PP como executor de determinado atendimento.
17.2. Poderão ser associados ao profissional:
paciente atendido;
data e horário;
check-in e check-out;
evolução correspondente;
categoria da demanda;
identificação do ciclo;
e demais informações necessárias à rastreabilidade.
17.3. A autoria profissional deverá ser preservada nos registros assistenciais conforme aplicável.

18. DADOS DO LARSANA ACADEMY
Quando o PP utilizar o Larsana Academy, poderão ser tratados:
conteúdos acessados;
módulos disponíveis;
aulas iniciadas;
aulas concluídas;
data de conclusão;
progresso;
certificações internas, quando existentes;
pontuação atribuída;
e histórico relacionado à utilização do ambiente.

19. DADOS DE PATENTES E PONTUAÇÃO
A Larsana poderá tratar dados necessários ao funcionamento do sistema comercial de Patentes, incluindo:
Patente atual;
histórico de progressão;
data de conquista da Patente;
pontos permanentes;
pontos variáveis;
origem dos pontos;
atividades do Academy;
indicações válidas;
avaliações dos pacientes;
metas de progressão;
tempo na Patente;
e histórico de alterações.
19.1. As regras comerciais aplicáveis ao sistema serão previstas nas Regras Comerciais vigentes.

20. AVALIAÇÕES DE EXPERIÊNCIA DO PACIENTE
20.1. A Larsana poderá tratar avaliações realizadas pelos pacientes em relação à experiência com o PP.
20.2. Poderão ser tratados:
quantidade de estrelas;
data do atendimento relacionado;
pontuação decorrente;
histórico de avaliações;
comentários, quando essa funcionalidade existir;
e informações necessárias à análise da experiência do paciente.
20.3. Reclamações ou incidentes poderão ser tratados separadamente do sistema ordinário de avaliações.

21. RECLAMAÇÕES, OCORRÊNCIAS E INCIDENTES
A Larsana poderá tratar informações relacionadas a:
reclamações de pacientes;
reclamações do próprio PP;
atrasos;
cancelamentos;
ausências;
divergências de agenda;
ocorrências assistenciais comunicadas;
denúncias;
violações operacionais;
incidentes de segurança;
investigações internas;
e providências adotadas.
21.1. O tratamento dessas informações poderá ser necessário para segurança, qualidade operacional, exercício regular de direitos e proteção dos envolvidos.

22. DADOS DE COMUNICAÇÃO
Poderão ser tratados registros de comunicações realizadas entre o PP e a Larsana pelos canais oficiais, incluindo:
mensagens;
solicitações;
chamados;
registros de atendimento;
confirmações;
notificações;
e histórico de suporte.

23. DADOS TÉCNICOS E DE SEGURANÇA
Durante o uso da Plataforma, poderão ser tratados dados técnicos, tais como:
endereço IP;
data e hora de acesso;
tipo de dispositivo;
sistema operacional;
navegador;
identificadores técnicos;
registros de autenticação;
tentativas de login;
ações realizadas na conta;
e demais logs necessários à segurança e rastreabilidade.

24. FINALIDADES DO TRATAMENTO
Os dados do PP poderão ser tratados para:
I — criar e manter sua conta;
II — identificar e autenticar o usuário;
III — realizar credenciamento e validação documental;
IV — verificar regularidade profissional;
V — organizar categorias técnicas e habilitações;
VI — apresentar demandas compatíveis;
VII — registrar aceite ou recusa;
VIII — organizar pacientes, agenda e ciclos;
IX — permitir check-in e check-out;
X — manter rastreabilidade dos atendimentos;
XI — permitir registros assistenciais;
XII — processar pagamentos e repasses;
XIII — conferir documentos fiscais;
XIV — administrar Patentes e pontuação;
XV — administrar o Larsana Academy;
XVI — administrar avaliações de experiência;
XVII — prestar suporte;
XVIII — enviar comunicações operacionais;
XIX — prevenir fraude;
XX — proteger a segurança da Plataforma;
XXI — investigar irregularidades;
XXII — cumprir obrigações legais, regulatórias ou profissionais;
XXIII — exercer ou defender direitos;
XXIV — produzir registros de auditoria;
XXV — aperfeiçoar a operação e a Plataforma dentro dos limites legais;
XXVI — e cumprir outras finalidades legítimas compatíveis com a relação estabelecida com o PP.

25. BASES LEGAIS
25.1. A Larsana não utiliza o consentimento como base legal única ou obrigatória para todo tratamento de dados do PP.
25.2. Conforme a finalidade concreta, o tratamento poderá se fundamentar, entre outras hipóteses previstas na legislação, em:
execução de contrato ou procedimentos preliminares relacionados a contrato;
cumprimento de obrigação legal ou regulatória;
exercício regular de direitos;
legítimo interesse, quando aplicável e observados os requisitos legais;
consentimento, quando essa for a base adequada;
e demais hipóteses legalmente previstas.
25.3. Quando o tratamento envolver dados pessoais sensíveis, serão observadas as hipóteses legais específicas aplicáveis a essa categoria de dados.

26. CONSENTIMENTO
26.1. Quando determinada atividade depender juridicamente de consentimento, este será solicitado de forma específica e adequada.
26.2. A retirada do consentimento produzirá efeitos nos limites da legislação aplicável e não invalidará tratamentos realizados anteriormente de forma legítima.
26.3. A retirada de consentimento não impedirá a continuidade de tratamentos sustentados por outra base legal válida.

27. COMPARTILHAMENTO DE DADOS
A Larsana poderá compartilhar dados do PP quando necessário às finalidades legítimas da operação, respeitando os princípios de necessidade e adequação.

28. COMPARTILHAMENTO COM PACIENTES E RESPONSÁVEIS
28.1. Para organização do atendimento, determinadas informações profissionais do PP poderão ser apresentadas ao paciente ou responsável.
28.2. Poderão ser compartilhados, conforme necessário:
nome;
fotografia profissional;
profissão;
número do conselho profissional;
categorias de atuação;
informações profissionais relevantes;
e dados necessários ao contato e realização do atendimento.
28.3. A Larsana deverá evitar compartilhar com o paciente dados pessoais do PP que não sejam necessários à relação assistencial ou operacional.

29. COMPARTILHAMENTO COM PRESTADORES FINANCEIROS
29.1. Dados poderão ser compartilhados com prestadores responsáveis por:
processamento de pagamentos;
contas de pagamento;
divisão de valores;
liquidação;
transferências;
verificação financeira;
prevenção de fraude;
e demais funcionalidades financeiras utilizadas pela Larsana.
29.2. Esses prestadores poderão realizar tratamentos de dados de acordo com suas próprias obrigações legais e políticas de privacidade.

30. ASAAS OU OUTRO PRESTADOR FINANCEIRO
30.1. A operação poderá utilizar o Asaas ou outro prestador de serviços financeiros para processamento de determinadas operações.
30.2. A identidade do prestador efetivamente utilizado e as condições aplicáveis poderão ser apresentadas ao PP durante o cadastro ou utilização das funcionalidades financeiras.
30.3. A Larsana poderá substituir ou incluir prestadores conforme a evolução da operação.

31. PRESTADORES DE TECNOLOGIA
Dados poderão ser tratados ou armazenados por prestadores que forneçam serviços necessários à operação, incluindo, conforme aplicável:
hospedagem;
infraestrutura em nuvem;
banco de dados;
autenticação;
segurança;
armazenamento;
comunicação;
suporte tecnológico;
análise de erros;
e demais serviços relacionados ao funcionamento da Plataforma.
31.1. A Larsana buscará contratar fornecedores compatíveis com requisitos adequados de segurança e proteção de dados.

32. COMPARTILHAMENTO COM CONTADORES, ADVOGADOS E CONSULTORES
Quando necessário, dados poderão ser compartilhados com profissionais ou empresas que prestem serviços:
contábeis;
jurídicos;
fiscais;
de auditoria;
de segurança;
ou consultoria,
observados deveres de confidencialidade e necessidade.

33. COMPARTILHAMENTO COM AUTORIDADES
A Larsana poderá fornecer informações quando necessário para:
cumprimento de obrigação legal;
cumprimento de ordem judicial;
requisição legítima de autoridade competente;
exercício regular de direitos;
ou outras hipóteses legalmente admitidas.

34. TRANSFERÊNCIAS INTERNACIONAIS
34.1. Alguns fornecedores tecnológicos eventualmente utilizados poderão processar ou armazenar dados em infraestrutura localizada fora do Brasil.
34.2. Quando houver transferência internacional de dados, a Larsana deverá observar os mecanismos e requisitos previstos na legislação aplicável.
34.3. Sempre que possível, a escolha de infraestrutura e fornecedores deverá considerar requisitos de segurança, privacidade e adequação jurídica.

35. SEGURANÇA DA INFORMAÇÃO
35.1. A Larsana buscará implementar medidas técnicas e administrativas compatíveis com os riscos da operação e a natureza dos dados tratados.
35.2. Essas medidas poderão incluir, conforme a arquitetura tecnológica efetivamente adotada:
controle de acesso;
autenticação;
segregação de permissões;
registros de auditoria;
proteção de credenciais;
comunicação segura;
backups;
monitoramento;
versionamento;
mecanismos de integridade;
e medidas de prevenção de acesso não autorizado.
35.3. Nenhum sistema eletrônico pode ser considerado absolutamente imune a incidentes.

36. RESPONSABILIDADE DO PP PELA SEGURANÇA DA CONTA
O PP deverá:
manter sua senha em sigilo;
não compartilhar credenciais;
proteger seus dispositivos;
comunicar acesso suspeito;
manter seus dados atualizados;
e utilizar a Plataforma conforme as regras de segurança vigentes.

37. INCIDENTES DE SEGURANÇA
37.1. Quando houver incidente envolvendo dados pessoais sob responsabilidade da Larsana, serão adotadas as medidas compatíveis com a natureza, extensão e riscos da ocorrência.
37.2. Quando exigido pela legislação, poderão ser realizadas comunicações aos titulares e às autoridades competentes.
37.3. O PP deverá cooperar quando o incidente estiver relacionado à sua conta, dispositivo, acesso ou atuação.

38. RETENÇÃO DOS DADOS
38.1. Os dados do PP poderão ser mantidos enquanto forem necessários para as finalidades que justificaram sua coleta e para o cumprimento de obrigações legais, regulatórias, profissionais, contratuais ou de defesa de direitos.
38.2. O encerramento da parceria ou da conta não gera exclusão automática de todos os dados.
38.3. Poderão ser mantidos, entre outros:
registros contratuais;
registros de aceite;
documentos relacionados aos atendimentos;
dados financeiros;
documentos fiscais;
registros de segurança;
registros de auditoria;
e demais informações cuja retenção seja necessária ou legítima.
38.4. Os períodos de conservação poderão variar conforme a natureza do dado e a obrigação aplicável.

39. DADOS ASSISTENCIAIS E ENCERRAMENTO DA CONTA
39.1. O encerramento da conta do PP não poderá resultar na eliminação indevida de registros assistenciais que devam ser preservados.
39.2. Evoluções, registros de autoria e demais informações relacionadas aos atendimentos poderão permanecer armazenados pelos períodos aplicáveis, mesmo após o desligamento do profissional.
39.3. O acesso do PP aos dados poderá ser restringido após o encerramento da relação, sem que isso implique necessariamente exclusão dos registros.

40. DIREITOS DOS TITULARES
Nos termos da legislação aplicável, o PP poderá solicitar, conforme cabível:
confirmação da existência de tratamento;
acesso aos dados;
correção de dados incompletos, inexatos ou desatualizados;
informações sobre compartilhamentos;
anonimização, bloqueio ou eliminação quando juridicamente cabíveis;
portabilidade, quando aplicável e regulamentada;
eliminação de dados tratados com consentimento, quando cabível;
informações sobre a possibilidade de não fornecer consentimento;
revogação do consentimento;
revisão ou explicação de decisões automatizadas, quando aplicável;
e demais direitos previstos na legislação.

41. LIMITES DOS PEDIDOS DE EXCLUSÃO
41.1. O direito de solicitar exclusão não significa que todos os dados poderão ser apagados imediatamente.
41.2. Determinados registros poderão ser mantidos quando necessários para:
cumprimento de obrigação legal;
obrigação regulatória;
obrigação profissional;
preservação de prontuário;
proteção de direitos;
prevenção de fraude;
segurança;
ou outra hipótese legalmente admitida.

42. CORREÇÃO DE DADOS CADASTRAIS
42.1. O PP deverá manter seus dados cadastrais atualizados.
42.2. Determinados dados poderão ser alterados diretamente pela Plataforma ou mediante solicitação.
42.3. Alterações em dados profissionais ou documentos poderão depender de nova validação.

43. DECISÕES AUTOMATIZADAS
43.1. A Plataforma poderá utilizar regras automatizadas para determinadas funções operacionais, como:
cálculo de pontuação;
progressão de Patentes;
compatibilização de critérios de demandas;
verificação de requisitos;
alertas;
ou controles de funcionamento.
43.2. Sempre que houver decisão baseada unicamente em tratamento automatizado que produza efeitos relevantes ao titular, serão observados os direitos e requisitos previstos na legislação aplicável.
43.3. Medidas relacionadas a risco, fraude, irregularidade profissional ou segurança poderão envolver análise humana conforme a natureza da situação.

44. PATENTES E DECISÕES AUTOMATIZADAS
44.1. Quando o sistema de Patentes utilizar cálculo automatizado, os parâmetros aplicáveis deverão observar as Regras Comerciais vigentes.
44.2. Os registros de pontuação poderão manter histórico das respectivas origens.
44.3. Eventual erro material poderá ser submetido à análise e correção.
44.4. A Patente constitui classificação comercial interna e não representa avaliação oficial da capacidade profissional.

45. COMUNICAÇÕES OPERACIONAIS
A Larsana poderá utilizar os dados de contato do PP para enviar comunicações necessárias à relação, incluindo:
novas demandas;
informações sobre pacientes ativos;
agenda;
documentos;
pagamentos;
segurança;
alterações relevantes da Plataforma;
mudanças nos documentos aplicáveis;
e outras informações relacionadas à parceria.
45.1. Comunicações estritamente necessárias à execução da relação não dependem de autorização de marketing para serem enviadas.

46. COMUNICAÇÕES PROMOCIONAIS
46.1. Comunicações publicitárias ou promocionais que não sejam necessárias à operação deverão observar a base legal adequada.
46.2. Quando aplicável, o PP poderá solicitar o descadastramento de comunicações promocionais.
46.3. O descadastramento de marketing não impede o envio de comunicações operacionais, contratuais, assistenciais, financeiras ou de segurança necessárias.

47. LARSANA ACADEMY E COMUNICAÇÕES
47.1. Informações sobre conteúdos obrigatórios, requisitos de habilitação ou atividades relacionadas diretamente à atuação do PP poderão ser enviadas como comunicações operacionais.
47.2. Conteúdos meramente promocionais deverão ser distinguidos das comunicações necessárias à parceria.

48. INDICAÇÃO DE OUTROS PROFISSIONAIS
48.1. Quando o PP participar de programa de indicação, poderão ser tratados dados necessários para vincular o profissional indicado ao indicador.
48.2. O PP não deverá fornecer à Larsana dados excessivos de terceiro sem necessidade.
48.3. Sempre que possível, o profissional indicado deverá realizar pessoalmente seu cadastro e fornecer suas próprias informações.

49. DADOS DE CRIANÇAS E ADOLESCENTES
49.1. Esta Política é destinada a Profissionais Parceiros e, em regra, o cadastro profissional é destinado a pessoas legalmente habilitadas para a atividade.
49.2. Dados de crianças e adolescentes eventualmente acessados pelo PP no contexto de atendimentos pediátricos seguem proteção específica e estão abrangidos pelas regras assistenciais, pelo Anexo IV e pela legislação aplicável.

50. DADOS SENSÍVEIS DO PRÓPRIO PP
50.1. Caso seja necessário tratar dado sensível do próprio PP, esse tratamento deverá se limitar às finalidades legítimas e bases legais aplicáveis.
50.2. A Larsana deverá evitar a coleta de dados sensíveis do PP que não sejam necessários à relação.

51. EXATIDÃO DAS INFORMAÇÕES
51.1. O PP é responsável por fornecer informações verdadeiras e atualizadas.
51.2. A Larsana poderá solicitar comprovação de determinados dados.
51.3. A identificação de informação incorreta poderá resultar em solicitação de atualização ou, em situações relevantes, restrição temporária de funcionalidades até regularização.

52. PRIVACIDADE DESDE A CONCEPÇÃO
52.1. Sempre que tecnicamente e operacionalmente possível, a Larsana buscará incorporar princípios de proteção de dados no desenvolvimento e aperfeiçoamento de suas funcionalidades.
52.2. Isso poderá incluir:
limitação de acessos;
segregação de perfis;
rastreabilidade;
minimização de dados;
controles de autenticação;
e revisão de permissões.

53. LINKS E SERVIÇOS DE TERCEIROS
53.1. A Plataforma poderá conter integrações ou direcionamentos para serviços de terceiros.
53.2. Esses terceiros poderão possuir seus próprios termos e políticas de privacidade.
53.3. O PP deverá consultar as condições aplicáveis quando utilizar serviço externo.

54. ALTERAÇÕES DESTA POLÍTICA
54.1. Esta Política poderá ser atualizada para refletir:
alterações legais;
mudanças regulatórias;
evolução tecnológica;
inclusão ou substituição de fornecedores;
novas funcionalidades;
mudança dos fluxos de dados;
ou aperfeiçoamento das práticas de privacidade.
54.2. A versão vigente deverá indicar sua data ou identificação de versão.
54.3. Alterações relevantes poderão ser comunicadas ao PP pela Plataforma ou demais canais oficiais.

55. HISTÓRICO E ACEITE
55.1. A Larsana poderá registrar a versão da Política apresentada ao PP.
55.2. Quando houver mecanismo de ciência ou aceite, poderão ser registrados:
identidade do PP;
versão;
data;
horário;
IP;
dispositivo;
e demais elementos de rastreabilidade tecnicamente disponíveis.
55.3. A existência de aceite não transforma consentimento em base legal automática para todos os tratamentos descritos nesta Política.

56. CONTATO PARA ASSUNTOS DE PRIVACIDADE
Solicitações, dúvidas ou exercício de direitos relacionados à privacidade e proteção de dados poderão ser encaminhados pelos canais oficiais disponibilizados pela Larsana Care.
Canal geral:contato@larsanacare.com.br
Caso a Larsana Care disponibilize canal específico de privacidade ou identificação formal de Encarregado pelo Tratamento de Dados Pessoais, essas informações poderão ser incorporadas à versão vigente desta Política.

57. RELAÇÃO COM OS DEMAIS DOCUMENTOS
Esta Política deverá ser interpretada em conjunto com:
Contrato de Parceria para Intermediação de Serviços de Fisioterapia;
Termos de Uso da Plataforma — Profissionais Parceiros Fisioterapeutas;
Anexo I — Regras Comerciais dos Profissionais Parceiros — Fisioterapia;
Anexo II — Regras Operacionais dos Profissionais Parceiros — Fisioterapia;
Anexo III — Categorias Técnicas e Habilitações — Fisioterapia;
Anexo IV — Termo/Política de Sigilo, Confidencialidade e Dados Assistenciais;
e demais documentos aplicáveis.

58. LEGISLAÇÃO APLICÁVEL
Esta Política será interpretada de acordo com a legislação brasileira aplicável, especialmente as normas relacionadas à proteção de dados pessoais, privacidade, segurança da informação, registros eletrônicos e exercício profissional.

59. VIGÊNCIA
59.1. Esta Política entra em vigor na data indicada em sua versão.
59.2. Permanecerá aplicável aos tratamentos realizados pela Larsana durante a relação com o PP e, quando necessário, após seu encerramento, relativamente aos dados que devam continuar armazenados ou tratados legitimamente.

DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.LARSANA CARECNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Versão 1.0 — Agosto/2026$legal_body$, true, 'pp'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('ANEXO_I_COMERCIAL_PP', '1.0-2026-08', 'Anexo I — Regras Comerciais PP', $legal_body$ANEXO I — REGRAS COMERCIAIS DOS PROFISSIONAIS PARCEIROS — FISIOTERAPIA
LARSANA CAREVersão 1.0 — Agosto/2026

123825177212

As presentes Regras Comerciais estabelecem os critérios aplicáveis aos Profissionais Parceiros Fisioterapeutas (“PP”) que atuam por intermédio da Larsana Care, incluindo regras de Patentes, pontuação, percentuais de repasse, Avaliação Inicial, ciclos de atendimento e progressão comercial.
Este documento integra, para todos os fins aplicáveis, o Contrato de Parceria e os Termos de Uso da Plataforma destinados aos Profissionais Parceiros Fisioterapeutas.
1. DISPOSIÇÕES GERAIS
1.1. As condições comerciais aplicáveis ao PP serão determinadas pelas presentes Regras Comerciais, pela Patente vigente do profissional, pelas características da demanda aceita e pelas condições apresentadas na Plataforma Larsana Care.
1.2. Antes do aceite de uma nova demanda, o PP deverá ter acesso às informações comerciais necessárias para avaliar a oportunidade, incluindo o valor do atendimento e as condições de repasse aplicáveis.
1.3. O aceite da demanda pelo PP representa concordância com as condições comerciais apresentadas para aquela demanda.
1.4. As condições comerciais regularmente aplicáveis a atendimentos já realizados não poderão ser reduzidas retroativamente.
1.5. Eventuais alterações das Regras Comerciais terão aplicação prospectiva, observadas as regras específicas deste Anexo para ciclos em andamento, progressão de Patentes e novas demandas.

2. SISTEMA DE PATENTES
2.1. Patentes comerciais
Os Profissionais Parceiros Fisioterapeutas serão classificados nas seguintes Patentes comerciais:
Patente
Faixa de Pontuação
Percentual de Repasse Ordinário
ALUMÍNIO
0 a 999 pontos
60%
BRONZE
1.000 a 3.999 pontos
70%
PRATA
4.000 a 7.999 pontos
75%
OURO
8.000 pontos ou mais
80%
2.2. A Patente constitui classificação interna e comercial da Larsana Care e não representa título profissional, especialização, certificação técnica ou reconhecimento emitido pelo Sistema COFFITO/CREFITOs.
2.3. O percentual correspondente à Patente será utilizado para cálculo dos repasses ordinários do PP, ressalvadas as regras específicas do primeiro ciclo e demais condições comerciais expressamente previstas neste Anexo.

3. PROGRESSÃO ENTRE PATENTES
3.1. A progressão entre Patentes depende do cumprimento simultâneo de:
I — pontuação mínima exigida para a Patente seguinte; e
II — tempo mínimo de permanência na Patente atual.
3.2. O cumprimento de apenas um dos requisitos não gera progressão automática.
3.3. Os tempos mínimos atualmente estabelecidos são:
Progressão
Pontuação necessária
Tempo mínimo na Patente atual
Alumínio → Bronze
1.000 pontos
3 meses como Alumínio
Bronze → Prata
4.000 pontos acumulados
9 meses como Bronze
Prata → Ouro
8.000 pontos acumulados
12 meses como Prata
3.4. Caso o PP alcance a pontuação necessária antes de completar o período mínimo, permanecerá na Patente atual até o cumprimento do requisito temporal.
3.5. Caso complete o período mínimo sem atingir a pontuação necessária, permanecerá na Patente atual até atingir a respectiva pontuação.
3.6. O período mínimo de permanência será contado a partir da data em que a Patente atual tiver sido efetivamente conquistada pelo PP.
3.7. A progressão ocorrerá somente após o cumprimento simultâneo dos dois requisitos e o respectivo registro no sistema.

4. SISTEMA DE PONTUAÇÃO
4.1. A pontuação utilizada para progressão entre Patentes será composta por três fontes:
I — Larsana Academy;
II — Ecossistema Larsana; e
III — Avaliações de Experiência dos Pacientes.
4.2. Para fins de funcionamento do sistema, os pontos serão classificados em:
a) Pontos permanentes 🔒
São aqueles conquistados por meio do:
Larsana Academy; e
Ecossistema Larsana.
Uma vez regularmente conquistados, esses pontos integram permanentemente o histórico e a pontuação do PP, não sendo reduzidos em razão de avaliações posteriores dos pacientes.
b) Pontos variáveis ↕
São aqueles provenientes das Avaliações de Experiência dos Pacientes e poderão aumentar ou reduzir o saldo variável do PP conforme as avaliações recebidas.
4.3. A pontuação total atual do PP será composta pela soma dos pontos permanentes e dos pontos variáveis.
4.4. A pontuação será acumulativa ao longo da jornada do PP e não será zerada quando houver progressão de Patente.
Assim, ao atingir 1.000 pontos e conquistar a Patente Bronze, o PP continuará acumulando pontos até atingir os 4.000 pontos necessários para a Patente Prata e, posteriormente, os 8.000 pontos necessários para a Patente Ouro.

5. PONTUAÇÃO — LARSANA ACADEMY
5.1. Cada módulo do Larsana Academy definido como elegível para pontuação terá, na versão vigente destas Regras Comerciais, valor total padrão de:
200 pontos permanentes.
5.2. Os 200 pontos correspondentes ao módulo serão distribuídos entre as aulas que o compõem.
5.3. A distribuição considerará a quantidade de aulas existentes no módulo, de modo que a soma de todas as aulas corresponda exatamente aos 200 pontos.
Exemplos:
módulo com 4 aulas: 50 pontos por aula;
módulo com 5 aulas: 40 pontos por aula;
módulo com 10 aulas: 20 pontos por aula.
5.4. Quando o valor total do módulo não puder ser dividido igualmente pelo número de aulas utilizando números inteiros, a pontuação poderá ser distribuída entre as aulas de maneira ajustada, desde que a soma final corresponda exatamente aos 200 pontos.
5.5. O PP receberá a pontuação progressivamente conforme concluir as aulas elegíveis, não sendo necessário aguardar a conclusão integral do módulo para receber os pontos das aulas já concluídas.
5.6. Cada aula poderá gerar pontuação uma única vez para o mesmo PP.
5.7. Reassistir ou concluir novamente uma aula que já tenha gerado pontuação não dará direito a novos pontos.
5.8. Os pontos regularmente conquistados por meio do Larsana Academy são permanentes.
5.9. A quantidade de módulos disponíveis no Larsana Academy poderá variar ao longo do tempo, não havendo, nesta versão das Regras Comerciais, quantidade mínima ou máxima de módulos pontuáveis.
5.10. A indisponibilidade temporária de módulos pontuáveis do Larsana Academy não será considerada descumprimento ou falha do PP.
5.11. Novos módulos poderão ser disponibilizados ao longo do tempo e, quando definidos como elegíveis para pontuação, passarão a constituir novas oportunidades de progressão.

6. PONTUAÇÃO — ECOSSISTEMA LARSANA
6.1. A participação no Ecossistema Larsana poderá gerar pontos permanentes conforme as atividades elegíveis previstas nas Regras Comerciais vigentes.
6.2. Na versão atual, a atividade elegível definida para esta categoria é a indicação de novos Profissionais Parceiros.
6.3. A pontuação por indicação será aplicável exclusivamente durante a progressão inicial do PP da Patente Alumínio para a Patente Bronze.
6.4. Cada indicação válida corresponderá a:
100 pontos permanentes.
6.5. Serão consideradas, para fins de pontuação, no máximo 3 indicações válidas, totalizando até:
300 pontos permanentes.
6.6. Para ser considerada válida, a indicação deverá estar corretamente vinculada ao PP indicador pelos mecanismos disponibilizados pela Larsana Care, e o profissional indicado deverá concluir o processo de cadastro, validação documental e efetiva aprovação/ativação pela Larsana Care.
6.7. O simples envio de convite, compartilhamento de link ou utilização de código sem posterior aprovação/ativação do profissional indicado não será suficiente para geração dos pontos.
6.8. Uma vez regularmente concedidos, os pontos de indicação serão permanentes.
6.9. Após as três indicações válidas, novas indicações não gerarão pontos adicionais para progressão de Patente, salvo se houver campanha ou Regra Comercial futura expressamente estabelecendo condição diferente.

7. AVALIAÇÃO DE EXPERIÊNCIA DO PACIENTE
7.1. Após os atendimentos, o Paciente poderá, de maneira facultativa, avaliar sua experiência com o Profissional Parceiro por meio do sistema disponibilizado pela Larsana Care.
7.2. A avaliação será realizada em escala de 1 a 5 estrelas.
7.3. Para fins de pontuação comercial, será aplicada a seguinte regra:
Avaliação
Pontuação
⭐⭐⭐⭐⭐ 5 estrelas
+2 pontos
⭐⭐⭐⭐ 4 estrelas
+1 ponto
⭐⭐⭐ 3 estrelas
0 ponto
⭐⭐ 2 estrelas
−1 ponto
⭐ 1 estrela
−2 pontos
Sem avaliação
0 ponto
7.4. A avaliação do paciente é facultativa.
7.5. A ausência de avaliação não poderá gerar perda de pontos, penalização ou avaliação negativa presumida para o PP.
7.6. Os pontos provenientes das avaliações possuem natureza variável e poderão aumentar ou reduzir o saldo de experiência do PP.
7.7. Os pontos negativos provenientes das avaliações não reduzem os pontos permanentes conquistados no Larsana Academy ou no Ecossistema Larsana.
7.8. As avaliações constituem um dos elementos da jornada comercial do PP e não substituem a análise de eventuais reclamações, incidentes, descumprimentos contratuais ou questões técnicas, éticas e de segurança, que poderão ser analisadas separadamente pela Larsana Care.

8. PROTEÇÃO DA PATENTE CONQUISTADA
8.1. A Patente regularmente conquistada pelo PP não será automaticamente reduzida em razão das oscilações normais decorrentes das Avaliações de Experiência dos Pacientes.
8.2. Eventual redução do saldo variável poderá afetar o progresso do PP em direção à Patente seguinte, mas não implicará, isoladamente, rebaixamento automático da Patente já conquistada.
8.3. Esta proteção não impede a aplicação das medidas previstas no Contrato de Parceria, Termos de Uso, Regras Operacionais ou demais documentos aplicáveis em situações de infração contratual, fraude, irregularidade documental, risco ao paciente, violação ética ou profissional, uso indevido da Plataforma ou outras ocorrências relevantes.
8.4. Suspensão, bloqueio ou descredenciamento constituem medidas distintas do sistema ordinário de pontuação e não dependem exclusivamente da pontuação do PP.

9. PROGRESSO E BARRA DE PATENTE
9.1. A Plataforma poderá apresentar ao PP uma barra de progresso indicando sua evolução em direção à Patente seguinte.
9.2. Sempre que possível, a visualização deverá distinguir:
pontos do Larsana Academy 🔒;
pontos do Ecossistema Larsana 🔒;
saldo das Avaliações de Experiência ↕;
pontuação total atual;
meta da próxima Patente; e
tempo mínimo de permanência aplicável.
9.3. O preenchimento integral da barra de pontuação não implica progressão enquanto o requisito de tempo mínimo não tiver sido cumprido.
9.4. Da mesma forma, o cumprimento do requisito temporal não implica progressão enquanto a pontuação mínima não tiver sido alcançada.

10. PERCENTUAL DE REPASSE
10.1. Ressalvada a regra específica do primeiro ciclo de cada novo paciente, os percentuais ordinários de repasse serão determinados pela Patente vigente do PP:
Alumínio: 60%;
Bronze: 70%;
Prata: 75%;
Ouro: 80%.
10.2. O percentual de repasse incidirá sobre o valor-base do atendimento contratado, observadas as condições comerciais específicas apresentadas para cada demanda.
10.3. Antes de aceitar uma demanda, o PP deverá poder consultar o valor do atendimento e as condições de repasse aplicáveis.
10.4. Condições específicas de determinada demanda, quando existentes, deverão ser apresentadas ao PP antes do aceite.

11. AVALIAÇÃO INICIAL
11.1. A Avaliação Inicial de Fisioterapia possui, na versão vigente destas Regras Comerciais, valor comercial definido em:
R$ 150,00 (cento e cinquenta reais).
11.2. A Avaliação Inicial possui regra própria de repasse ao PP e não será calculada pelo percentual ordinário da Patente.
11.3. Havendo continuidade do tratamento
Quando, após a Avaliação Inicial, houver continuidade do paciente com o PP:
I — o PP terá direito a R$ 100,00 (cem reais) pela Avaliação Inicial;
II — o respectivo repasse será realizado em até 7 (sete) dias, observadas as condições documentais e fiscais aplicáveis; e
III — a Avaliação Inicial será considerada o primeiro atendimento do primeiro ciclo do paciente.
11.4. Para fins desta regra, a continuidade será caracterizada pela efetiva confirmação/contratação do primeiro ciclo pelo paciente, e não apenas pela indicação clínica de continuidade do tratamento pelo fisioterapeuta.
11.5. Não havendo continuidade do tratamento
Quando, após a Avaliação Inicial, o paciente optar por não prosseguir com o tratamento:
I — o PP terá direito a R$ 50,00 (cinquenta reais) pela Avaliação Inicial efetivamente realizada;
II — o respectivo repasse será realizado em até 30 (trinta) dias, observadas as condições documentais e fiscais aplicáveis; e
III — não haverá formação do primeiro ciclo de tratamento.

12. CICLOS DE ATENDIMENTO
12.1. Os tratamentos poderão ser organizados em ciclos de:
4 atendimentos;
8 atendimentos; ou
12 atendimentos,
conforme frequência, planejamento assistencial e contratação realizada com o paciente.
12.2. Havendo continuidade após a Avaliação Inicial, esta será considerada o primeiro atendimento do primeiro ciclo.
Dessa forma:
ciclo de 4 atendimentos = Avaliação Inicial + 3 sessões subsequentes;
ciclo de 8 atendimentos = Avaliação Inicial + 7 sessões subsequentes;
ciclo de 12 atendimentos = Avaliação Inicial + 11 sessões subsequentes.

13. REGRA COMERCIAL DO PRIMEIRO CICLO
13.1. O primeiro ciclo de todo novo paciente terá percentual de repasse de 60% nas sessões terapêuticas subsequentes à Avaliação Inicial, independentemente da Patente atual do PP.
13.2. A Avaliação Inicial permanece sujeita à regra própria estabelecida na Seção 11 e, portanto, não será calculada pelo percentual de 60%.
13.3. A regra do primeiro ciclo é aplicável por novo paciente/demanda, e não apenas ao primeiro ciclo realizado pelo PP dentro da Larsana Care.
Assim, inclusive um PP classificado como Bronze, Prata ou Ouro receberá 60% nas sessões terapêuticas do primeiro ciclo de um novo paciente, ressalvado o valor específico da Avaliação Inicial.
13.4. A partir do segundo ciclo do mesmo paciente, será aplicado o percentual correspondente à Patente vigente do PP, observadas as regras de progressão previstas neste Anexo.
Patente
Primeiro ciclo do novo paciente
Segundo ciclo em diante
Alumínio
60%
60%
Bronze
60%
70%
Prata
60%
75%
Ouro
60%
80%

14. ALTERAÇÃO DE PATENTE DURANTE CICLO EM ANDAMENTO
14.1. A progressão de Patente não altera retroativamente o percentual de repasse do ciclo que já estiver em andamento.
14.2. O ciclo iniciado permanecerá vinculado ao percentual comercial aplicável no momento de seu início.
14.3. O novo percentual decorrente da progressão será aplicado:
I — às novas demandas aceitas pelo PP após a efetivação da nova Patente; e
II — aos pacientes que já estejam em acompanhamento pelo PP, a partir do ciclo seguinte.
14.4. Atendimentos já realizados não serão recalculados em razão de progressão posterior de Patente.

15. LIBERAÇÃO DOS REPASSES
15.1. O repasse das sessões terapêuticas efetivamente realizadas não dependerá, necessariamente, do encerramento integral do ciclo.
15.2. Quando o pagamento do paciente tiver sido recebido antecipadamente, os valores destinados ao PP poderão permanecer reservados ou temporariamente retidos na operação financeira até a realização dos respectivos atendimentos e o cumprimento das condições necessárias para liberação.
15.3. Após cada atendimento efetivamente realizado, o PP poderá apresentar o documento fiscal ou comprobatório aplicável à sua modalidade de atuação.
15.4. Para liberação do valor correspondente ao atendimento, poderão ser exigidos, conforme aplicável:
I — efetiva realização do atendimento;
II — registro correto do atendimento na Plataforma;
III — evolução ou registro assistencial correspondente, quando aplicável;
IV — apresentação do documento fiscal ou comprobatório exigido;
V — confirmação do recebimento do pagamento do paciente; e
VI — inexistência de divergência relevante que justifique conferência adicional.
15.5. Cumpridos os requisitos aplicáveis, o valor correspondente à sessão realizada poderá ser liberado ao PP individualmente, sem necessidade de aguardar o término das demais sessões do ciclo.
15.6. Sessões futuras ainda não realizadas permanecerão sem liberação até sua efetiva realização e cumprimento das respectivas condições.
15.7. Não haverá repasse por sessão futura ou atendimento que não tenha sido efetivamente realizado, ressalvadas exclusivamente as hipóteses comerciais expressamente previstas para cancelamentos ou ausências do paciente.

16. DOCUMENTAÇÃO FISCAL E COMPROBATÓRIA
16.1. O PP deverá cumprir as obrigações fiscais e documentais correspondentes à sua modalidade de atuação.
16.2. Profissional Pessoa Física (PF): deverá apresentar Receita Saúde ou outro documento fiscal/comprobatório legalmente aplicável.
16.3. Profissional Pessoa Jurídica (PJ): deverá apresentar Nota Fiscal de Serviço ou outro documento fiscal legalmente aplicável.
16.4. O documento poderá ser apresentado após cada atendimento efetivamente realizado, não sendo necessário aguardar o encerramento integral do ciclo, desde que essa forma de emissão seja compatível com as obrigações fiscais aplicáveis ao PP.
16.5. O PP é responsável pela correção das informações constantes dos documentos emitidos, inclusive identificação do prestador, beneficiário/pagador, data, valor e demais informações legalmente exigidas.
16.6. A ausência do documento exigido ou a existência de divergências poderá suspender temporariamente a liberação do valor correspondente até a regularização.

17. REGRAS AINDA REGULADAS POR DISPOSIÇÕES ESPECÍFICAS
17.1. Cancelamentos, ausências, reagendamentos, substituições, atuação como SUB, pagamentos em espécie, estornos, chargebacks, inadimplência e demais situações especiais observarão as regras específicas vigentes da Larsana Care e os demais documentos integrantes da relação com o PP.
17.2. Nenhum atendimento que não tenha sido efetivamente realizado poderá ser registrado como atendimento clínico realizado ou receber evolução assistencial fictícia, ainda que exista cobrança, consumo contratual da sessão ou consequência financeira decorrente de cancelamento ou ausência.

18. ATUALIZAÇÃO DAS REGRAS COMERCIAIS
18.1. As presentes Regras Comerciais possuem natureza dinâmica e poderão ser atualizadas pela Larsana Care em razão da evolução da operação, da Plataforma, dos serviços oferecidos, das condições comerciais ou do sistema de Patentes.
18.2. Poderão ser objeto de atualização, entre outros:
percentuais de repasse;
faixas de pontuação;
tempos mínimos de progressão;
valores de pontuação;
regras do Larsana Academy;
regras do Ecossistema Larsana;
critérios de Avaliação de Experiência;
valores e condições da Avaliação Inicial; e
demais parâmetros comerciais.
18.3. Alterações deverão ser disponibilizadas ao PP pelos meios oficiais da Larsana Care, com indicação da versão vigente e, quando aplicável, da respectiva data de início de vigência.
18.4. Alterações comerciais não deverão reduzir retroativamente valores correspondentes a atendimentos já regularmente realizados.
18.5. Quando a alteração envolver percentual de Patente ou condição aplicável aos pacientes ativos, deverá ser respeitada a regra de transição estabelecida para o ciclo em andamento.
18.6. Pontos permanentes regularmente conquistados pelo PP antes da alteração das Regras Comerciais permanecerão registrados e não serão retirados exclusivamente em razão da alteração posterior do valor atribuído àquela atividade.

19. VIGÊNCIA E INTEGRAÇÃO
19.1. Estas Regras Comerciais entram em vigor na data indicada em sua versão e permanecem aplicáveis enquanto vigentes.
19.2. Este Anexo deverá ser interpretado em conjunto com:
o Contrato de Parceria para Intermediação de Serviços de Fisioterapia;
os Termos de Uso da Plataforma — Profissionais Parceiros;
as Regras Operacionais dos Profissionais Parceiros — Fisioterapia;
as regras de Categorias Técnicas e Habilitações;
as normas de privacidade, proteção de dados e confidencialidade aplicáveis; e
demais documentos expressamente incorporados à relação entre Larsana Care e o PP.
19.3. Em matéria especificamente comercial, prevalecerá a versão vigente destas Regras Comerciais, respeitados os direitos e valores já constituídos, os atendimentos já realizados e as regras de transição aplicáveis aos ciclos em andamento.

DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.LARSANA CARECNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Versão 1.0 — Agosto/2026$legal_body$, true, 'pp'::public.legal_term_profile, 'awareness'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('ANEXO_II_OPERACIONAL_PP', '1.0-2026-08', 'Anexo II — Regras Operacionais PP', $legal_body$ANEXO II — REGRAS OPERACIONAIS DOS PROFISSIONAIS PARCEIROS — FISIOTERAPIA
LARSANA CAREVersão 1.0 — Agosto/2026

114300114300

As presentes Regras Operacionais estabelecem os procedimentos aplicáveis aos Profissionais Parceiros Fisioterapeutas (“PP”) que atuam por intermédio da Larsana Care, desde o recebimento de uma demanda até o encerramento do acompanhamento do paciente.
Este documento integra, para todos os fins aplicáveis, o Contrato de Parceria, os Termos de Uso da Plataforma e os demais documentos vinculados à atuação do PP.
1. FINALIDADE E APLICAÇÃO
1.1. As presentes Regras Operacionais têm por finalidade organizar os procedimentos de atendimento, comunicação, registro, agenda, substituição, continuidade e encerramento dos serviços de Fisioterapia intermediados pela Larsana Care.
1.2. As regras aqui previstas possuem natureza operacional e não substituem a autonomia técnica do fisioterapeuta, as normas profissionais aplicáveis ou sua responsabilidade pela avaliação e pelas condutas adotadas no atendimento.
1.3. O PP deverá cumprir estas Regras em conjunto com:
o Contrato de Parceria;
os Termos de Uso da Plataforma;
as Regras Comerciais dos Profissionais Parceiros;
as regras de Categorias Técnicas e Habilitações;
as normas de privacidade, proteção de dados e confidencialidade;
e as normas profissionais aplicáveis.

2. CANAIS OFICIAIS E USO DA PLATAFORMA
2.1. A Plataforma Larsana Care constitui o canal principal para organização e registro da operação.
2.2. Quando necessário ou quando determinada funcionalidade não estiver disponível, poderão ser utilizados os demais canais oficiais disponibilizados pela Larsana Care, incluindo WhatsApp, telefone e e-mail.
2.3. O PP é responsável por manter seus dados de contato atualizados e acompanhar as comunicações relacionadas às demandas por ele aceitas.
2.4. Quando uma ocorrência for comunicada por canal alternativo, o respectivo registro deverá ser posteriormente regularizado na Plataforma sempre que aplicável.

3. RECEBIMENTO DE NOVAS DEMANDAS
3.1. A Larsana Care poderá disponibilizar ao PP novas demandas de pacientes compatíveis com as informações disponíveis em seu cadastro e com os critérios operacionais aplicáveis.
3.2. Antes do aceite, serão apresentadas ao PP, na medida necessária e disponível, informações que permitam avaliar a viabilidade da demanda, podendo incluir:
região ou localização do atendimento;
frequência prevista;
período ou horário preferencial;
categoria técnica;
informações relevantes sobre a necessidade assistencial;
características necessárias para avaliação da compatibilidade profissional;
e condições comerciais aplicáveis.
3.3. A disponibilização de uma demanda não obriga o PP a aceitá-la.

4. ANÁLISE OBRIGATÓRIA ANTES DO ACEITE
4.1. Antes de aceitar uma demanda, o PP deverá avaliar cuidadosamente se possui condições reais de assumi-la.
4.2. Caberá ao PP verificar, especialmente:
I — localização e distância do atendimento;
II — condições de deslocamento;
III — frequência prevista;
IV — dias, horários ou períodos solicitados;
V — disponibilidade real em sua agenda;
VI — categoria técnica da demanda;
VII — existência de habilitação específica, quando exigida;
VIII — sua própria competência profissional para avaliação e eventual acompanhamento do caso; e
IX — demais condições relevantes apresentadas antes do aceite.
4.3. O PP não deverá aceitar uma demanda quando já souber que não possui disponibilidade, condições de deslocamento ou competência necessária para assumi-la.
4.4. Depois do aceite, questões de distância, localização ou incompatibilidade de agenda que já poderiam razoavelmente ter sido verificadas anteriormente não deverão ser utilizadas como motivo habitual para devolução do paciente.

5. ACEITE DA DEMANDA
5.1. O aceite deverá ocorrer pelo mecanismo disponibilizado pela Larsana Care ou por outro canal oficial expressamente autorizado.
5.2. Somente será considerado válido o aceite devidamente registrado pelos meios reconhecidos pela Larsana Care.
5.3. O aceite representa compromisso operacional do PP em:
entrar em contato com o paciente ou responsável;
organizar a Avaliação Inicial;
cumprir as etapas operacionais aplicáveis;
e, havendo contratação e indicação de continuidade, manter o acompanhamento conforme disponibilidade previamente assumida.
5.4. O aceite não obriga o fisioterapeuta a realizar tratamento que, após avaliação profissional, seja considerado inadequado, contraindicado, inseguro ou fora de sua competência.

6. CONTATO APÓS O ACEITE
6.1. Após assumir uma demanda, o PP deverá realizar o contato necessário com o paciente ou pessoa indicada para organização da Avaliação Inicial.
6.2. O contato deverá ocorrer de maneira profissional, respeitosa e compatível com os padrões de atendimento da Larsana Care.
6.3. Os dados de contato disponibilizados ao PP deverão ser utilizados exclusivamente para finalidades relacionadas à demanda, ao atendimento e à continuidade assistencial autorizada.
6.4. É vedado utilizar os dados obtidos por intermédio da Larsana Care para prospecção própria, publicidade não autorizada ou tentativa de retirada deliberada do paciente da operação intermediada pela Plataforma.

7. PRAZO PARA AVALIAÇÃO INICIAL
7.1. Após o aceite da demanda, a Avaliação Inicial deverá ser organizada para ocorrer, preferencialmente, em até 7 (sete) dias corridos.
7.2. O prazo poderá ser alterado quando houver:
indisponibilidade do próprio paciente;
internação;
condição clínica;
solicitação da família ou responsável;
circunstância excepcional;
ou outra situação justificável registrada na operação.
7.3. O PP deverá comunicar à Larsana Care quando identificar que a Avaliação Inicial não poderá ocorrer dentro do período previsto.

8. AVALIAÇÃO FISIOTERAPÊUTICA
8.1. A Avaliação Inicial constitui ato profissional e será realizada sob autonomia e responsabilidade técnica do fisioterapeuta.
8.2. Caberá ao PP avaliar, dentro de sua competência profissional:
condições funcionais do paciente;
queixa e objetivos relacionados à Fisioterapia;
riscos e limitações;
indicação ou contraindicação fisioterapêutica;
necessidade de encaminhamento ou avaliação complementar;
frequência e planejamento terapêutico quando indicados;
e demais aspectos pertinentes ao caso.
8.3. A ativação de determinada categoria pela Larsana Care não substitui a análise individual do PP acerca de sua competência para atender cada paciente.
8.4. O fisioterapeuta poderá recusar determinada conduta ou continuidade quando entender, de forma tecnicamente fundamentada, que o atendimento está fora de sua competência ou apresenta risco indevido ao paciente.

9. CONSENTIMENTO E AUTONOMIA DO PACIENTE
9.1. O PP deverá respeitar a autonomia do paciente durante todo o acompanhamento.
9.2. Sempre que pertinente, deverão ser fornecidas informações compreensíveis acerca da avaliação, proposta de cuidado, objetivos, alternativas, limitações, riscos e benefícios relevantes.
9.3. O paciente poderá recusar técnicas, procedimentos ou a continuidade do atendimento.
9.4. A recusa ou retirada do consentimento deverá ser respeitada e, quando assistencialmente relevante, adequadamente registrada.

10. CONTINUIDADE APÓS A AVALIAÇÃO
10.1. A indicação fisioterapêutica de continuidade não significa, por si só, contratação automática de novo ciclo pelo paciente.
10.2. Havendo indicação de tratamento, o PP deverá registrar as informações necessárias para organização da continuidade.
10.3. A formação do primeiro ciclo dependerá da efetiva confirmação ou contratação do tratamento pelo paciente ou responsável autorizado.
10.4. Não havendo continuidade, deverão ser realizados os registros operacionais e assistenciais correspondentes à Avaliação Inicial efetivamente realizada.

11. ORGANIZAÇÃO DOS CICLOS
11.1. Os atendimentos poderão ser organizados em ciclos de 4, 8 ou 12 atendimentos, conforme contratação realizada.
11.2. Havendo continuidade após a Avaliação Inicial, esta será considerada o primeiro atendimento do primeiro ciclo.
11.3. A frequência terapêutica deverá respeitar a avaliação e a autonomia técnica do fisioterapeuta, bem como a contratação realizada com o paciente.
11.4. Alterações relevantes de frequência deverão ser devidamente alinhadas e registradas.

12. ORGANIZAÇÃO DA AGENDA
12.1. O PP deverá manter atualizados os atendimentos sob sua responsabilidade.
12.2. Os dias e horários acordados com o paciente deverão ser registrados na Plataforma conforme os recursos disponíveis.
12.3. Mudanças de horário, reagendamentos e cancelamentos deverão ser registrados ou comunicados pelos canais oficiais aplicáveis.
12.4. O PP deverá evitar assumir agendas incompatíveis entre si ou que tornem previsíveis atrasos recorrentes.

13. PONTUALIDADE
13.1. A pontualidade integra o padrão operacional esperado dos Profissionais Parceiros Larsana Care.
13.2. O PP deverá organizar seus deslocamentos considerando as características do atendimento domiciliar e o tempo razoavelmente necessário entre pacientes.
13.3. Quando identificar que haverá atraso, deverá informar o paciente ou responsável assim que possível.
13.4. Atrasos superiores a 15 (quinze) minutos deverão ser comunicados obrigatoriamente, salvo impossibilidade excepcional.
13.5. A comunicação do atraso não transforma atrasos recorrentes em prática operacional aceitável.
13.6. Ocorrências reiteradas poderão ser analisadas pela Larsana Care de acordo com sua frequência, justificativas e impacto ao paciente.

14. CHECK-IN E CHECK-OUT
14.1. Quando disponíveis na Plataforma, os mecanismos de check-in e check-out deverão ser utilizados pelo PP para registrar o início e o encerramento do atendimento.
14.2. Os registros deverão corresponder ao atendimento efetivamente realizado.
14.3. É vedado:
registrar presença sem estar no local do atendimento;
realizar check-in ou check-out fictício;
manipular localização;
solicitar que terceiro realize o registro em nome do PP;
ou utilizar qualquer recurso destinado a simular atendimento não realizado.
14.4. Quando houver falha técnica, indisponibilidade da Plataforma ou impossibilidade legítima de registro, o PP deverá utilizar o procedimento de contingência indicado pela Larsana Care.

15. REALIZAÇÃO DO ATENDIMENTO DOMICILIAR
15.1. O PP deverá atuar de maneira compatível com as normas profissionais, éticas, técnicas e de segurança aplicáveis.
15.2. Durante o atendimento domiciliar, espera-se postura profissional, comunicação adequada, respeito ao paciente, familiares e ambiente residencial.
15.3. O PP deverá utilizar vestimenta compatível com a função exercida e manter condições adequadas de higiene e apresentação profissional.
15.4. Equipamentos ou materiais utilizados deverão ser compatíveis com a atividade realizada e mantidos em condições adequadas de utilização e higiene.
15.5. O PP não deverá realizar procedimento para o qual não possua competência, treinamento ou condição segura de execução.

16. REGISTRO E EVOLUÇÃO FISIOTERAPÊUTICA
16.1. Todo atendimento clínico efetivamente realizado deverá possuir o respectivo registro assistencial.
16.2. A evolução deverá refletir o atendimento realmente prestado e conter as informações necessárias à continuidade, rastreabilidade e segurança assistencial.
16.3. O registro deverá permanecer associado ao profissional que efetivamente realizou o atendimento.
16.4. É expressamente proibido:
registrar atendimento não realizado;
inserir evolução fictícia;
copiar evolução sem correspondência com o atendimento prestado;
atribuir atendimento a profissional diferente do executor;
ou inserir informação sabidamente falsa no prontuário.

17. PRAZO PARA REGISTRO DA EVOLUÇÃO
17.1. A evolução deverá ser registrada preferencialmente no mesmo dia em que ocorrer o atendimento.
17.2. Quando houver impossibilidade operacional justificada, o registro deverá ser concluído em até 24 (vinte e quatro) horas após o atendimento, salvo situação excepcional devidamente justificável.
17.3. O PP deverá evitar acumular evoluções de diferentes dias para preenchimento posterior.
17.4. O descumprimento reiterado dos prazos poderá gerar análise operacional, especialmente quando prejudicar continuidade assistencial, liberação financeira, auditoria ou segurança do paciente.

18. FINALIZAÇÃO E CORREÇÃO DOS REGISTROS
18.1. Após a finalização de uma evolução, alterações posteriores não deverão apagar silenciosamente o registro original.
18.2. Quando necessária correção ou complementação, deverá ser utilizada funcionalidade que preserve, sempre que tecnicamente possível:
conteúdo anterior;
identificação do profissional;
data e horário da alteração;
histórico de versões;
e motivo ou natureza da retificação.
18.3. O PP não deverá tentar contornar mecanismos de integridade ou auditoria da Plataforma.

19. CANCELAMENTO PELO PACIENTE
19.1. Quando o paciente solicitar cancelamento, o PP deverá registrar ou comunicar a ocorrência pelos canais previstos.
19.2. As consequências financeiras do cancelamento observarão as Regras Comerciais e as condições aplicáveis ao paciente.
19.3. Sessão cancelada que não tenha sido efetivamente realizada não deverá receber evolução clínica como atendimento realizado.
19.4. Ainda que uma sessão seja considerada contratualmente consumida ou tenha consequência financeira, isso não transforma o evento em atendimento fisioterapêutico realizado.

20. AUSÊNCIA OU NÃO COMPARECIMENTO DO PACIENTE
20.1. Quando o PP comparecer conforme agendamento e o atendimento não puder ocorrer por ausência do paciente ou outra situação imputável a ele, a ocorrência deverá ser registrada de acordo com as funcionalidades da Plataforma.
20.2. O registro deverá indicar ausência ou não realização, e não atendimento clínico.
20.3. Não deverá ser criada evolução fisioterapêutica de uma sessão que não ocorreu.

21. CANCELAMENTO PELO PROFISSIONAL PARCEIRO
21.1. Quando o PP não puder realizar um atendimento previamente agendado, deverá informar o paciente e a Larsana Care com a maior antecedência possível.
21.2. O PP deverá colaborar para reorganização do atendimento.
21.3. A sessão cancelada pelo PP não poderá ser registrada como realizada.
21.4. O cancelamento de sessão pelo PP não gera, por si só, direito a repasse pelo atendimento não realizado.
21.5. Cancelamentos frequentes, injustificados ou incompatíveis com a continuidade assumida poderão ser analisados operacionalmente pela Larsana Care.

22. REPOSIÇÃO PELO PP RESPONSÁVEL
22.1. Quando um atendimento não ocorrer por indisponibilidade do PP, deverá ser buscada, preferencialmente, sua reposição pelo próprio profissional responsável.
22.2. A reposição deverá ocorrer, sempre que possível, em até 14 (quatorze) dias corridos contados da data originalmente programada.
22.3. A reposição dependerá da disponibilidade do paciente e deverá respeitar a compatibilidade clínica.
22.4. Excepcionalmente, poderá ocorrer mais de uma sessão na mesma semana para fins de reposição, desde que:
seja clinicamente compatível;
não represente risco ou inadequação terapêutica;
haja concordância do paciente;
e seja respeitada a autonomia profissional.
22.5. A reposição não representa alteração permanente da frequência contratada.

23. SESSÃO NÃO REPOSTA NO PRAZO DE 14 DIAS
23.1. Caso a sessão devida pelo PP não seja realizada dentro dos 14 dias previstos, ela permanecerá devida ao paciente.
23.2. A sessão deverá ser automaticamente transferida para período posterior à última sessão originalmente programada do ciclo vigente.
23.3. Essa transferência:
não constitui renovação automática;
não cria novo ciclo;
não altera permanentemente a frequência;
e não representa atendimento adicional além daquele que já era devido.
23.4. A sessão somente será considerada realizada após sua efetiva prestação.

24. PROFISSIONAL SUBSTITUTO — SUB
24.1. Em situações de indisponibilidade temporária do PP responsável, poderá ser disponibilizado ao paciente um Profissional Parceiro substituto (“SUB”).
24.2. A utilização de SUB dependerá:
da disponibilidade de profissional compatível;
da categoria técnica necessária;
das habilitações aplicáveis;
da disponibilidade de agenda;
e da aceitação do paciente.
24.3. O paciente poderá recusar o atendimento pelo SUB, sem que isso implique penalização.
24.4. A atuação como SUB poderá compreender uma ou mais sessões específicas durante a ausência temporária do PP responsável.
24.5. A utilização de SUB não transfere automaticamente a titularidade ou continuidade do paciente para o profissional substituto.
24.6. Encerrada a necessidade de substituição, o acompanhamento deverá retornar ao PP responsável, salvo decisão operacional ou assistencial diferente devidamente organizada.
24.7. Cada sessão deverá ser registrada pelo profissional que efetivamente a realizou.
24.8. O PP responsável não poderá registrar como próprio atendimento realizado pelo SUB.

25. PAUSA TEMPORÁRIA DO TRATAMENTO
25.1. O tratamento poderá ser temporariamente pausado quando ocorrer situação que impeça ou desaconselhe sua continuidade imediata.
25.2. Entre as hipóteses possíveis estão:
internação;
intercorrência clínica;
infecção ou doença aguda;
orientação médica ou assistencial;
viagem;
impossibilidade temporária do paciente;
ou outra situação relevante.
25.3. O PP deverá registrar ou comunicar a ocorrência de acordo com os meios disponibilizados.
25.4. A pausa não deverá ser confundida com alta fisioterapêutica ou encerramento definitivo do tratamento.

26. ALTA FISIOTERAPÊUTICA
26.1. A alta fisioterapêutica constitui decisão técnica do profissional, respeitadas as normas aplicáveis e as condições do caso.
26.2. Quando houver alta, o PP deverá realizar o registro assistencial correspondente.
26.3. Sempre que pertinente, deverão ser registradas orientações relevantes para continuidade do cuidado, autocuidado ou acompanhamento por outros profissionais.

27. ENCERRAMENTO POR DECISÃO DO PACIENTE
27.1. O paciente poderá decidir interromper o tratamento.
27.2. O PP deverá respeitar a decisão e registrar adequadamente o encerramento quando aplicável.
27.3. Eventuais consequências financeiras da interrupção serão tratadas conforme os documentos comerciais e contratuais aplicáveis, sem interferir na autonomia do paciente para recusar a continuidade assistencial.

28. IMPOSSIBILIDADE DE CONTINUIDADE PELO PP
28.1. Após assumir um paciente, espera-se que o PP preserve a continuidade do acompanhamento enquanto houver indicação, contratação e condições profissionais para fazê-lo.
28.2. O PP não deverá abandonar ou devolver unilateralmente paciente por mera conveniência decorrente de condições que já conhecia ou poderia razoavelmente ter verificado antes do aceite.
28.3. Quando surgir motivo legítimo que impossibilite a continuidade, o PP deverá comunicar formalmente a Larsana Care pelos canais oficiais.
28.4. Sempre que possível, a comunicação deverá ocorrer com antecedência suficiente para organização da transição.
28.5. O PP deverá informar as circunstâncias necessárias à organização operacional, respeitando os limites de sigilo e proteção de dados.
28.6. O profissional deverá colaborar com a transição assistencial e manter os registros do paciente adequadamente atualizados.
28.7. Nenhuma disposição desta Seção obriga o PP a permanecer em relação assistencial que contrarie dever ético, norma profissional, segurança do paciente ou sua própria autonomia técnica.

29. INTERCORRÊNCIAS CLÍNICAS
29.1. O PP deverá estar atento a alterações clínicas relevantes identificadas durante o atendimento.
29.2. Quando houver necessidade de encaminhamento ou avaliação por outro profissional, deverá agir dentro de sua competência e orientar o paciente ou responsável adequadamente.
29.3. As intercorrências relevantes deverão ser registradas no prontuário conforme pertinência clínica.

30. URGÊNCIA E EMERGÊNCIA
30.1. Os atendimentos intermediados pela Larsana Care possuem natureza programada e não substituem serviços de urgência ou emergência.
30.2. Diante de situação que represente risco imediato ou necessidade de atendimento emergencial, o PP deverá priorizar a segurança do paciente e adotar as medidas compatíveis com sua formação, competência e circunstâncias concretas.
30.3. Quando necessário, deverá orientar ou acionar os serviços de urgência/emergência disponíveis.
30.4. A ocorrência deverá ser documentada de forma adequada após a adoção das medidas prioritárias de segurança.

31. CATEGORIA CARDIORRESPIRATÓRIA
31.1. A atuação em demandas classificadas como Cardiorrespiratórias poderá depender de habilitação interna adicional pela Larsana Care.
31.2. A Larsana poderá considerar certificados, formação, experiência profissional ou outros elementos para análise dessa habilitação.
31.3. A habilitação interna da Larsana Care não constitui certificação profissional irrestrita e não substitui o dever do fisioterapeuta de avaliar sua competência para cada caso concreto.
31.4. A categoria Cardiorrespiratória não transforma o atendimento domiciliar programado em serviço de urgência ou emergência.

32. COMUNICAÇÃO COM FAMILIARES E RESPONSÁVEIS
32.1. A existência de familiar ou responsável cadastrado não implica automaticamente representação legal do paciente.
32.2. Também não implica autorização irrestrita para acesso a todas as informações clínicas ou dados de saúde.
32.3. O PP deverá respeitar:
a autonomia do paciente capaz;
as autorizações registradas;
a representação legal efetivamente comprovada, quando aplicável;
o dever de sigilo;
e as normas de proteção de dados.
32.4. Informações assistenciais sensíveis deverão ser compartilhadas apenas com pessoas legitimadas a recebê-las e na medida necessária.

33. SIGILO E CONFIDENCIALIDADE
33.1. O PP deverá preservar o sigilo sobre todas as informações pessoais, familiares, clínicas e assistenciais às quais tiver acesso.
33.2. O dever de confidencialidade permanece após o encerramento do atendimento ou da parceria.
33.3. Dados obtidos por meio da Larsana Care não poderão ser utilizados para finalidade incompatível com a assistência ou com a relação legitimamente estabelecida.

34. DADOS E DOCUMENTOS DO PACIENTE
34.1. O PP deverá utilizar os ambientes e canais autorizados para registro e tratamento das informações assistenciais.
34.2. O armazenamento externo de documentos, fotografias, prontuários ou informações de saúde deverá ser evitado quando não houver necessidade profissional legítima.
34.3. É vedado compartilhar informações do paciente com terceiros não autorizados.
34.4. O PP deverá adotar cuidados razoáveis com dispositivos, senhas, acessos e documentos utilizados durante a operação.

35. IMAGENS, FOTOGRAFIAS, VÍDEOS E REDES SOCIAIS
35.1. O atendimento pela Larsana Care não autoriza automaticamente o PP a fotografar, filmar ou divulgar o paciente.
35.2. É vedada a publicação não autorizada de:
imagem do paciente;
voz;
vídeos;
informações clínicas;
prontuário;
residência identificável;
resultados terapêuticos;
imagens de antes e depois;
ou depoimentos.
35.3. Quando houver finalidade que admita utilização de imagem ou voz, deverá ser observada autorização específica e as normas profissionais e legais aplicáveis.

36. FALHA OU INDISPONIBILIDADE DA PLATAFORMA
36.1. Problemas técnicos da Plataforma não autorizam a criação de registros fictícios ou a alteração da realidade do atendimento.
36.2. Quando determinada funcionalidade estiver indisponível, o PP deverá utilizar os canais de contingência disponibilizados pela Larsana Care.
36.3. Após o restabelecimento do sistema, o PP deverá regularizar os registros necessários.
36.4. Quando tecnicamente possível, deverá ser preservada a informação de que determinado registro foi inserido posteriormente em razão de indisponibilidade operacional.

37. SEGURANÇA DA CONTA
37.1. A conta de acesso do PP é pessoal e intransferível.
37.2. Senhas, códigos de autenticação e outros elementos de segurança não deverão ser compartilhados.
37.3. No caso de PP Pessoa Jurídica, o profissional executor continuará sendo individualmente identificado e deverá utilizar credenciais compatíveis com sua identidade.
37.4. É vedado permitir que pessoa não credenciada realize atendimentos utilizando a conta, cadastro ou identidade do PP.

38. PROFISSIONAL PARCEIRO PESSOA JURÍDICA
38.1. Quando a parceria ocorrer por meio de Pessoa Jurídica, a execução clínica deverá ser realizada pelo profissional individual previamente cadastrado, validado e vinculado à operação.
38.2. A Pessoa Jurídica não poderá substituir livremente o executor por profissional não credenciado pela Larsana Care.
38.3. Eventual alteração do profissional executor dependerá de prévio cadastro e validação conforme os procedimentos vigentes.

39. CARGA HORÁRIA E ORGANIZAÇÃO DA AGENDA PROFISSIONAL
39.1. O PP é responsável por organizar sua carga de trabalho de maneira compatível com a legislação, normas profissionais, segurança assistencial e qualidade dos atendimentos.
39.2. A Plataforma poderá aplicar controles operacionais destinados a evitar incompatibilidades de agenda ou ultrapassagem dos limites aplicáveis à atuação profissional.
39.3. O PP não deverá manipular horários ou registros para contornar controles operacionais da Plataforma.

40. VERIFICAÇÃO E AUDITORIA OPERACIONAL
40.1. Para proteção da operação, do paciente e dos próprios profissionais, a Larsana Care poderá verificar a coerência entre os registros disponíveis na Plataforma.
40.2. Poderão ser analisados, quando pertinentes:
agenda;
check-in e check-out;
registros de atendimento;
evolução assistencial;
cancelamentos;
reagendamentos;
registros de SUB;
documentos necessários ao repasse;
e demais evidências operacionais relacionadas ao atendimento.
40.3. Divergências poderão gerar solicitação de esclarecimento ao PP.
40.4. A existência de divergência não deverá resultar automaticamente em penalidade sem análise adequada da ocorrência.

41. DESCUMPRIMENTOS OPERACIONAIS
41.1. O descumprimento destas Regras poderá ser analisado considerando:
natureza da ocorrência;
gravidade;
risco ao paciente;
existência de dolo ou fraude;
recorrência;
impacto operacional;
e histórico do PP.
41.2. Conforme o caso, poderão ser adotadas medidas proporcionais, incluindo:
orientação;
solicitação de correção;
advertência;
restrição temporária de determinadas funcionalidades;
bloqueio temporário;
suspensão;
ou encerramento da parceria nas hipóteses previstas nos documentos aplicáveis.
41.3. Situações envolvendo risco relevante, fraude, falsificação de registros, violação grave de dados ou infração profissional poderão justificar medidas imediatas de proteção.

42. PROIBIÇÕES OPERACIONAIS
Sem prejuízo das demais obrigações previstas nos documentos aplicáveis, é vedado ao PP:
I — simular atendimento;
II — registrar evolução de sessão não realizada;
III — falsificar check-in, check-out, localização ou horário;
IV — compartilhar conta ou credenciais;
V — permitir execução por profissional não credenciado;
VI — inserir informações falsas nos registros assistenciais;
VII — acessar dados de pacientes sem necessidade relacionada à sua atuação;
VIII — utilizar dados de pacientes para prospecção não autorizada;
IX — divulgar informações ou imagens sem autorização adequada;
X — contornar deliberadamente mecanismos de segurança ou auditoria;
XI — abandonar acompanhamento em curso sem comunicação ou justificativa compatível, ressalvadas situações que exijam interrupção imediata por razões éticas ou de segurança;
XII — representar como realizado atendimento que tenha apenas sido cancelado, consumido contratualmente ou cobrado.

43. COMUNICAÇÕES E REGISTROS OPERACIONAIS
43.1. Comunicações realizadas pelos canais oficiais poderão integrar o histórico operacional da relação.
43.2. Registros eletrônicos poderão ser utilizados para demonstrar, entre outros:
aceite de demanda;
agendamentos;
cancelamentos;
reagendamentos;
comunicações;
registros de presença;
evoluções;
alterações operacionais;
e demais ocorrências relacionadas à prestação do serviço.

44. ATUALIZAÇÃO DAS REGRAS OPERACIONAIS
44.1. As presentes Regras poderão ser atualizadas em razão da evolução da Plataforma, da operação, das exigências profissionais ou dos procedimentos internos da Larsana Care.
44.2. As versões atualizadas deverão ser disponibilizadas pelos meios oficiais adotados pela Larsana Care.
44.3. Sempre que a alteração exigir nova conduta operacional relevante do PP, a Larsana Care poderá solicitar ciência ou novo aceite eletrônico.
44.4. Os registros históricos permanecerão sujeitos às regras aplicáveis à época em que foram produzidos, sem prejuízo de obrigações legais ou profissionais posteriores.

45. VIGÊNCIA E INTEGRAÇÃO
45.1. Estas Regras Operacionais entram em vigor na data indicada na versão e permanecerão aplicáveis enquanto vigentes.
45.2. Este Anexo deverá ser interpretado em conjunto com os demais documentos da relação entre Larsana Care e o Profissional Parceiro.
45.3. Em caso de matéria especificamente operacional, estas Regras serão utilizadas como referência para os procedimentos cotidianos da prestação intermediada, sem afastar as disposições do Contrato, dos Termos de Uso, das Regras Comerciais ou das normas profissionais aplicáveis.

DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.LARSANA CARECNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Versão 1.0 — Agosto/2026$legal_body$, true, 'pp'::public.legal_term_profile, 'awareness'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('ANEXO_III_CATEGORIAS_PP', '1.0-2026-08', 'Anexo III — Categorias Técnicas e Habilitações', $legal_body$ANEXO III — CATEGORIAS TÉCNICAS E HABILITAÇÕES — FISIOTERAPIA
LARSANA CAREVersão 1.0 — Agosto/2026
114300114300

O presente Anexo estabelece as categorias técnicas utilizadas pela Larsana Care para organização e direcionamento das demandas de Fisioterapia aos Profissionais Parceiros Fisioterapeutas (“PP”), bem como os critérios gerais de habilitação aplicáveis a determinadas categorias.
As categorias utilizadas pela Plataforma possuem finalidade operacional, auxiliando na compatibilização entre as características das demandas dos pacientes e o perfil profissional informado pelo PP.
A classificação ou habilitação de um PP em determinada categoria pela Larsana Care não constitui título de especialista, certificação profissional ou autorização irrestrita para atendimento de qualquer condição clínica pertencente àquela categoria.
1. REQUISITOS GERAIS PARA ATUAÇÃO
1.1. Para receber e assumir demandas de Fisioterapia intermediadas pela Larsana Care, o PP deverá permanecer regularmente cadastrado e atender aos requisitos de credenciamento aplicáveis.
1.2. Poderão ser exigidos, conforme a modalidade de cadastro e as regras vigentes:
identificação pessoal;
registro profissional ativo perante o CREFITO competente;
documentos profissionais;
documentos fiscais ou empresariais, quando aplicáveis;
documentos exigidos para validação cadastral;
aceite dos documentos obrigatórios da Larsana Care;
e demais requisitos necessários à regularidade da operação.
1.3. A manutenção do cadastro e da regularidade profissional é responsabilidade do PP.
1.4. A Larsana Care poderá solicitar atualização ou nova apresentação de documentos quando necessário para manutenção do credenciamento.

2. CATEGORIAS TÉCNICAS DE FISIOTERAPIA
Para fins de organização operacional das demandas, a Larsana Care adota inicialmente as seguintes categorias:
I — Ortopédico;
II — Pós-operatório;
III — Neurológico;
IV — Idoso / Gerontologia;
V — Funcional / Condicionamento;
VI — Pediátrico Geral;
VII — Cardiorrespiratória.
2.1. As categorias poderão ser utilizadas no cadastro do PP, na organização de seu perfil e na distribuição ou apresentação de novas demandas.
2.2. Um mesmo PP poderá estar habilitado em mais de uma categoria, desde que possua condições profissionais para atuação nas respectivas áreas.

3. AUTODECLARAÇÃO DE COMPETÊNCIA PROFISSIONAL
3.1. No momento do cadastro ou atualização de seu perfil, o PP deverá selecionar somente as categorias nas quais se considere tecnicamente apto a atuar.
3.2. Ao selecionar uma categoria, o PP declara possuir conhecimento e competência compatíveis com os atendimentos que pretende assumir dentro daquele campo de atuação, observados seus limites profissionais.
3.3. A seleção de uma categoria não significa que o PP deverá aceitar todas as demandas classificadas naquela área.
3.4. Antes de aceitar cada paciente, permanece obrigatória a análise individual da demanda conforme as Regras Operacionais.
3.5. Caso o PP identifique que determinado paciente exige conhecimento, experiência, estrutura ou competência que não possui, deverá recusar a demanda ou, quando a identificação ocorrer após a Avaliação Inicial, adotar a conduta profissional adequada ao caso.

4. CATEGORIA ORTOPÉDICO
4.1. A categoria Ortopédico destina-se à organização de demandas relacionadas a alterações musculoesqueléticas e funcionais compatíveis com a atuação fisioterapêutica.
4.2. Poderão integrar essa categoria, conforme avaliação individual do PP, demandas relacionadas a:
dor e limitação musculoesquelética;
alterações articulares;
alterações musculares;
redução de mobilidade;
redução de força;
limitações funcionais;
recuperação funcional;
e outras condições compatíveis com a atuação fisioterapêutica ortopédica.
4.3. A classificação da demanda como Ortopédica não substitui a Avaliação Inicial realizada pelo fisioterapeuta.

5. CATEGORIA PÓS-OPERATÓRIO
5.1. A categoria Pós-operatório destina-se à organização de pacientes em recuperação após procedimentos cirúrgicos nos quais exista indicação ou necessidade de acompanhamento fisioterapêutico.
5.2. Antes de iniciar as condutas, o PP deverá considerar, quando aplicável:
procedimento realizado;
período pós-operatório;
restrições existentes;
orientações da equipe responsável;
condições clínicas;
riscos;
precauções;
e objetivos fisioterapêuticos.
5.3. O PP deverá respeitar restrições e contraindicações identificadas durante a avaliação e acompanhamento.

6. CATEGORIA NEUROLÓGICO
6.1. A categoria Neurológico destina-se à organização de demandas de pacientes com condições neurológicas que apresentem necessidades compatíveis com a atuação fisioterapêutica.
6.2. Poderão integrar esta categoria demandas envolvendo, entre outros aspectos:
alterações de mobilidade;
alterações de marcha;
alterações de equilíbrio;
alterações de coordenação;
déficits motores;
alterações funcionais;
necessidade de treinamento de transferências;
manutenção ou recuperação da funcionalidade;
e orientação relacionada à mobilidade e funcionalidade do paciente.
6.3. A complexidade dos quadros neurológicos pode variar significativamente, permanecendo obrigatória a avaliação individual da competência do PP antes e durante o acompanhamento.

7. CATEGORIA IDOSO / GERONTOLOGIA
7.1. A categoria Idoso / Gerontologia destina-se à organização de demandas de pessoas idosas que apresentem necessidades fisioterapêuticas relacionadas à mobilidade, funcionalidade, autonomia e manutenção ou recuperação da capacidade física.
7.2. A idade do paciente, isoladamente, não define sua complexidade assistencial.
7.3. O PP deverá considerar condições clínicas, funcionais, cognitivas e ambientais relevantes para a segurança do atendimento.
7.4. Quando o paciente apresentar condição predominante pertencente a outra categoria, a demanda poderá ser classificada em mais de uma categoria para fins operacionais.

8. CATEGORIA FUNCIONAL / CONDICIONAMENTO
8.1. A categoria Funcional / Condicionamento destina-se à organização de demandas fisioterapêuticas relacionadas à melhora ou manutenção da capacidade funcional e do condicionamento físico dentro do escopo profissional da Fisioterapia.
8.2. Poderão integrar esta categoria objetivos relacionados a:
força;
mobilidade;
resistência;
capacidade funcional;
independência nas atividades;
prevenção de perdas funcionais;
retorno progressivo às atividades;
e manutenção da funcionalidade.
8.3. A utilização desta categoria não autoriza atuação fora das competências legalmente atribuídas ao fisioterapeuta.

9. CATEGORIA PEDIÁTRICO GERAL
9.1. A categoria Pediátrico Geral destina-se à organização de demandas fisioterapêuticas de crianças e adolescentes compatíveis com a atuação e experiência do PP.
9.2. O PP deverá avaliar previamente se possui conhecimento, experiência e condições adequadas para assumir o caso específico.
9.3. Demandas pediátricas de maior complexidade ou que exijam conhecimento específico deverão ser aceitas apenas por profissionais que reconheçam possuir competência compatível.
9.4. Deverão ser observadas as regras aplicáveis à participação e representação dos pais ou responsáveis legais, sem prejuízo da consideração da criança ou adolescente conforme sua capacidade de compreensão e desenvolvimento.

10. CATEGORIA CARDIORRESPIRATÓRIA
10.1. A categoria Cardiorrespiratória possui regra diferenciada de habilitação dentro da Larsana Care.
10.2. A seleção dessa categoria pelo PP não gera liberação automática para recebimento de demandas Cardiorrespiratórias.
10.3. O PP interessado deverá solicitar a habilitação específica pelos meios disponibilizados pela Larsana Care.
10.4. Para análise da solicitação, a Larsana Care poderá considerar, conforme o caso:
certificados;
cursos;
formação complementar;
especialização;
experiência profissional comprovável;
histórico de atuação;
documentos adicionais;
ou outras evidências pertinentes à análise.
10.5. A Larsana Care poderá:
I — aprovar a habilitação;
II — solicitar informações ou documentos complementares; ou
III — não aprovar a habilitação naquele momento.
10.6. A habilitação Cardiorrespiratória constitui requisito operacional interno para acesso às demandas assim classificadas.
10.7. A aprovação pela Larsana Care não constitui título de especialista, certificação profissional externa, garantia irrestrita de competência ou transferência de responsabilidade técnica para a Larsana Care.
10.8. Mesmo habilitado, o PP permanece responsável por analisar individualmente sua capacidade técnica para assumir cada demanda Cardiorrespiratória.
10.9. O PP deverá recusar demanda específica quando entender que a complexidade do paciente ultrapassa sua competência, experiência ou condições seguras de atendimento.

11. SOLICITAÇÃO DE HABILITAÇÃO CARDIORRESPIRATÓRIA
No cadastro ou em atualização posterior, poderá ser apresentada ao PP a seguinte opção:
Você deseja solicitar habilitação para atendimentos Cardiorrespiratórios pela Larsana Care?
☐ Sim☐ Não
Caso responda Sim, poderão ser solicitadas informações sobre a base da solicitação, incluindo:
☐ Possuo certificado ou curso na área Cardiorrespiratória;
☐ Possuo especialização ou formação complementar relacionada;
☐ Possuo experiência profissional na área;
☐ Possuo experiência hospitalar relacionada;
☐ Outro elemento de formação ou experiência relevante.
11.1. A indicação de uma das opções não garante aprovação automática.
11.2. A Larsana Care poderá solicitar documentos comprobatórios antes da liberação da categoria.

12. RESPONSABILIDADE PELA COMPETÊNCIA INDIVIDUAL
12.1. Nenhuma classificação cadastral substitui o julgamento profissional do fisioterapeuta.
12.2. O PP deverá avaliar sua competência:
I — antes de aceitar a demanda;
II — durante a Avaliação Inicial; e
III — ao longo do acompanhamento, caso haja alteração da condição ou complexidade do paciente.
12.3. A competência necessária para determinado caso poderá variar mesmo entre pacientes pertencentes à mesma categoria.
12.4. A existência de categoria ativa no perfil do PP não obriga o profissional a realizar conduta que considere inadequada, insegura ou fora de seus limites técnicos.

13. DEMANDAS COM MAIS DE UMA CATEGORIA
13.1. Um paciente poderá apresentar características compatíveis com mais de uma categoria técnica.
13.2. Nesses casos, a Larsana Care poderá classificar a demanda em múltiplas categorias para melhorar a compatibilização com os profissionais disponíveis.
13.3. O PP deverá considerar o conjunto das necessidades apresentadas e não apenas a categoria principal indicada na demanda.
13.4. Quando uma das categorias exigir habilitação específica, a exigência correspondente deverá ser respeitada.

14. INFORMAÇÕES INICIAIS DA DEMANDA
14.1. As categorias atribuídas antes da Avaliação Inicial são utilizadas para organização operacional e se baseiam nas informações disponíveis naquele momento.
14.2. Essas informações não constituem diagnóstico fisioterapêutico definitivo.
14.3. A Avaliação Inicial realizada pelo PP poderá identificar necessidades, condições ou características diferentes das inicialmente informadas.
14.4. Quando a alteração for relevante para segurança, continuidade ou classificação da demanda, o PP deverá registrar ou comunicar a Larsana Care pelos canais aplicáveis.

15. ALTERAÇÃO DAS CATEGORIAS DO PP
15.1. O PP poderá solicitar inclusão ou retirada de categorias de seu perfil conforme os procedimentos disponibilizados pela Larsana Care.
15.2. Categorias que dependam de validação específica somente poderão ser ativadas após aprovação.
15.3. O PP deverá retirar ou solicitar a retirada de categoria quando reconhecer que deixou de possuir condições adequadas para receber novas demandas naquela área.
15.4. A retirada de uma categoria não extingue automaticamente obrigações relacionadas a pacientes já em acompanhamento, devendo eventual necessidade de transição observar as Regras Operacionais e os deveres profissionais aplicáveis.

16. REVISÃO E SUSPENSÃO DE HABILITAÇÃO
16.1. A Larsana Care poderá revisar uma habilitação quando houver motivo relevante relacionado à documentação, regularidade profissional, segurança assistencial ou informações utilizadas para sua concessão.
16.2. A habilitação poderá ser temporariamente suspensa quando houver:
vencimento ou irregularidade de documento necessário;
informação cadastral inconsistente;
necessidade de nova validação;
indício relevante de atuação incompatível com a habilitação;
ou situação de segurança que justifique medida preventiva.
16.3. Sempre que possível e compatível com a segurança do paciente, o PP deverá ser informado sobre a necessidade de regularização.
16.4. A suspensão de uma categoria não implica necessariamente suspensão integral da conta do PP, podendo permanecer disponíveis outras categorias para as quais continue regularmente habilitado.

17. CATEGORIAS E DISTRIBUIÇÃO DE DEMANDAS
17.1. A classificação do PP em determinada categoria poderá ser utilizada como um dos critérios para apresentação ou compatibilização de novas demandas.
17.2. A categoria não garante quantidade mínima de pacientes ou recebimento obrigatório de demandas.
17.3. Além da compatibilidade técnica, poderão ser considerados critérios operacionais como localização, disponibilidade, frequência, agenda, continuidade e demais características necessárias à organização do atendimento.

18. PROIBIÇÕES
É vedado ao PP:
I — selecionar deliberadamente categoria para a qual reconheça não possuir competência;
II — apresentar certificado, experiência ou informação falsa para obtenção de habilitação;
III — permitir que outro profissional utilize sua habilitação;
IV — assumir demanda que exija habilitação específica que não esteja ativa em seu cadastro;
V — utilizar habilitação interna da Larsana Care como se fosse título oficial de especialista ou certificação emitida por conselho profissional;
VI — omitir informação relevante que possa comprometer a segurança do paciente ou a regularidade da habilitação.

19. ATUALIZAÇÃO DAS CATEGORIAS E CRITÉRIOS
19.1. A Larsana Care poderá criar, reorganizar, subdividir, renomear ou descontinuar categorias técnicas conforme a evolução dos serviços oferecidos.
19.2. Poderão também ser atualizados os requisitos internos de habilitação quando necessário para segurança, adequação operacional ou conformidade profissional.
19.3. Alterações relevantes deverão ser disponibilizadas aos PPs pelos canais oficiais.
19.4. Quando nova exigência afetar habilitação já existente, deverá ser concedida oportunidade razoável de adequação, salvo quando a manutenção imediata da habilitação representar risco relevante ou incompatibilidade legal ou profissional.

20. VIGÊNCIA E INTEGRAÇÃO
20.1. Este Anexo entra em vigor na data indicada em sua versão e permanece aplicável enquanto vigente.
20.2. As presentes regras deverão ser interpretadas em conjunto com:
o Contrato de Parceria para Intermediação de Serviços de Fisioterapia;
os Termos de Uso da Plataforma — Profissionais Parceiros;
as Regras Comerciais dos Profissionais Parceiros — Fisioterapia;
as Regras Operacionais dos Profissionais Parceiros — Fisioterapia;
as normas de privacidade, proteção de dados e confidencialidade;
e as normas profissionais aplicáveis.
20.3. Em caso de dúvida sobre a possibilidade técnica de assumir determinada demanda, prevalece o dever do PP de atuar dentro de sua competência profissional e priorizar a segurança do paciente.

DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.LARSANA CARECNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Versão 1.0 — Agosto/2026$legal_body$, true, 'pp'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('ANEXO_IV_SIGILO_PP', '1.0-2026-08', 'Anexo IV — Sigilo e Dados Assistenciais', $legal_body$ANEXO IV — TERMO/POLÍTICA DE SIGILO, CONFIDENCIALIDADE E DADOS ASSISTENCIAIS
PROFISSIONAIS PARCEIROS FISIOTERAPEUTAS — LARSANA CAREVersão 1.0 — Agosto/2026

114300114300

O presente Anexo estabelece as regras de sigilo, confidencialidade, acesso, utilização, registro, compartilhamento, proteção e tratamento de dados pessoais e dados assistenciais aplicáveis aos Profissionais Parceiros Fisioterapeutas (“PP”) que atuam por intermédio da Larsana Care.
Este documento integra o Contrato de Parceria, os Termos de Uso da Plataforma e os demais documentos aplicáveis à atuação do PP.

1. FINALIDADE
1.1. O presente Anexo tem por finalidade proteger a privacidade, a confidencialidade e a segurança das informações relacionadas aos pacientes, familiares, responsáveis e demais pessoas envolvidas nos atendimentos intermediados pela Larsana Care.
1.2. As regras aqui previstas deverão ser observadas em conjunto com:
a legislação aplicável de proteção de dados pessoais;
as normas profissionais de Fisioterapia;
os deveres éticos de sigilo profissional;
as regras assistenciais;
os Termos de Uso da Plataforma;
as Regras Operacionais;
e os demais documentos aplicáveis à relação entre Larsana Care e PP.

2. DEFINIÇÕES
Para fins deste Anexo, considera-se:
I — Dados Pessoais: informações relacionadas a pessoa natural identificada ou identificável;
II — Dados Pessoais Sensíveis: dados que recebem proteção especial pela legislação, incluindo dados referentes à saúde;
III — Dados Assistenciais: informações produzidas ou utilizadas no contexto do atendimento, incluindo avaliações, evoluções, registros clínicos, informações funcionais, terapêuticas e demais elementos relacionados ao cuidado;
IV — Paciente: pessoa que recebe ou poderá receber atendimento intermediado pela Larsana Care;
V — Responsável: pessoa cadastrada para determinada finalidade operacional, administrativa ou assistencial, sem que isso implique automaticamente representação legal ou acesso irrestrito aos dados de saúde;
VI — Plataforma: ambiente tecnológico da Larsana Care utilizado para cadastro, organização, comunicação, agenda, registros, evoluções e demais funcionalidades da operação;
VII — Profissional Parceiro ou PP: fisioterapeuta credenciado que atua de forma independente por intermédio da Larsana Care.

3. DEVER DE SIGILO PROFISSIONAL
3.1. O PP deverá preservar o sigilo sobre todas as informações pessoais, familiares, clínicas, financeiras, assistenciais ou privadas às quais tiver acesso em razão de sua atuação.
3.2. O dever de sigilo abrange informações obtidas:
diretamente do paciente;
de familiares ou responsáveis;
pela Plataforma;
em documentos;
em prontuários;
durante atendimento domiciliar;
em conversas;
em imagens;
em relatórios;
ou por qualquer outro meio relacionado à assistência.
3.3. O dever de sigilo permanece aplicável mesmo após:
alta do paciente;
encerramento do tratamento;
troca de profissional;
encerramento da demanda;
suspensão da conta;
desligamento do PP;
ou término da parceria com a Larsana Care.

4. PRINCÍPIO DA NECESSIDADE DE ACESSO
4.1. O PP deverá acessar apenas os dados necessários para o exercício de suas atribuições e para o atendimento dos pacientes sob sua responsabilidade.
4.2. É vedado acessar, pesquisar, consultar ou tentar obter informações de pacientes sem relação legítima com sua atuação profissional.
4.3. O fato de determinada informação estar tecnicamente acessível na Plataforma não autoriza sua consulta para finalidade não relacionada ao atendimento ou à operação.
4.4. O acesso deverá respeitar os princípios de necessidade, finalidade, adequação e segurança.

5. DADOS DE SAÚDE
5.1. Informações relacionadas à saúde do paciente constituem dados pessoais sensíveis e deverão receber tratamento compatível com seu grau de proteção.
5.2. Poderão ser utilizados pelo PP somente na medida necessária para:
avaliação fisioterapêutica;
planejamento assistencial;
execução do tratamento;
acompanhamento da evolução;
continuidade do cuidado;
comunicação assistencial legítima;
emissão dos documentos necessários;
cumprimento de obrigação legal ou profissional;
segurança do paciente;
ou outra finalidade legítima relacionada à assistência.
5.3. O PP não poderá reutilizar os dados de saúde para finalidade própria incompatível com aquela que justificou o acesso.

6. RESPONSABILIDADES NO TRATAMENTO DE DADOS
6.1. A Larsana Care realiza tratamentos de dados relacionados à operação da Plataforma, intermediação, cadastro, segurança, organização dos atendimentos, pagamentos e demais finalidades descritas em seus documentos de privacidade.
6.2. O PP também poderá realizar tratamentos de dados no exercício de sua atividade profissional e no cumprimento de seus próprios deveres legais, éticos e assistenciais.
6.3. A definição das responsabilidades de cada parte perante a legislação de proteção de dados dependerá da finalidade e das circunstâncias concretas de cada tratamento.
6.4. Nenhuma disposição deste Anexo deverá ser interpretada como atribuição automática ao PP da condição de mero operador da Larsana Care em todo e qualquer tratamento de dados assistenciais.
6.5. Cada parte deverá responder pelos tratamentos realizados sob sua esfera de decisão, controle e responsabilidade, conforme a legislação aplicável.

7. ACESSO AOS DADOS DO PACIENTE
7.1. O acesso do PP deverá permanecer limitado aos pacientes, demandas e informações necessárias à sua atuação.
7.2. Sempre que possível, a Plataforma poderá aplicar mecanismos de controle de acesso, segregação de permissões, autenticação e rastreabilidade.
7.3. O PP não poderá utilizar credenciais de outra pessoa nem permitir que terceiro utilize suas credenciais para acessar dados de pacientes.
7.4. O acesso indevido poderá ser objeto de apuração, bloqueio, suspensão ou outras medidas compatíveis com a gravidade da ocorrência.

8. RESPONSÁVEIS, FAMILIARES E TERCEIROS
8.1. O cadastro de familiar, cuidador, contato ou responsável não significa, automaticamente:
representação legal do paciente;
autorização irrestrita para decisões clínicas;
acesso total ao prontuário;
ou autorização para receber todas as informações de saúde.
8.2. O PP deverá verificar, conforme o contexto, se a pessoa possui legitimidade, autorização ou necessidade adequada para receber determinada informação.
8.3. Em pacientes capazes, deverá ser respeitada a autonomia do próprio paciente quanto ao compartilhamento de suas informações.
8.4. Nos casos de representação legal, deverá ser observada a condição efetivamente existente e, quando necessário, a documentação comprobatória.
8.5. O compartilhamento deverá ocorrer apenas na extensão necessária para a finalidade legítima.

9. PRONTUÁRIO E REGISTROS ASSISTENCIAIS
9.1. Os registros assistenciais deverão refletir de forma fiel o atendimento efetivamente realizado.
9.2. O PP deverá realizar suas evoluções de maneira técnica, objetiva e compatível com as normas profissionais aplicáveis.
9.3. O registro deverá permanecer vinculado ao profissional que efetivamente realizou o atendimento.
9.4. É vedado:
produzir evolução fictícia;
registrar procedimento não realizado;
atribuir atendimento a terceiro;
inserir informação sabidamente falsa;
apagar deliberadamente informação necessária à rastreabilidade;
ou manipular registros para produzir falsa aparência de atendimento.

10. INTEGRIDADE DOS REGISTROS
10.1. Os registros finalizados deverão preservar sua integridade, autoria, data e horário.
10.2. Quando houver necessidade de correção, complementação ou retificação, deverá ser preservado, sempre que tecnicamente possível, o histórico da informação original.
10.3. Alterações posteriores não deverão eliminar silenciosamente registros anteriores.
10.4. O PP deverá utilizar os mecanismos disponibilizados pela Plataforma para correção ou complementação dos registros.

11. CANCELAMENTO, AUSÊNCIA E SESSÃO NÃO REALIZADA
11.1. Sessão cancelada, ausência do paciente ou qualquer outro atendimento não efetivamente realizado não deverá receber evolução clínica como se tivesse ocorrido.
11.2. A existência de cobrança, consumo contratual, multa ou consequência financeira não altera a realidade assistencial da ocorrência.
11.3. Nessas situações, deverá ser realizado apenas o registro operacional correspondente.

12. UTILIZAÇÃO DE DADOS FORA DA PLATAFORMA
12.1. O PP deverá utilizar preferencialmente os meios disponibilizados ou autorizados pela Larsana Care para o tratamento e registro das informações relacionadas à operação.
12.2. Sempre que possível, deverá ser evitada a transferência desnecessária de dados assistenciais para:
aplicativos pessoais;
dispositivos não protegidos;
notas pessoais;
contas particulares de armazenamento em nuvem;
mensagens sem necessidade assistencial;
ou outros ambientes externos.
12.3. Quando o uso de meio externo for necessário e legítimo, o PP deverá adotar medidas compatíveis de segurança e limitar o conteúdo ao mínimo necessário.

13. DISPOSITIVOS E SEGURANÇA
13.1. O PP é responsável por proteger os dispositivos utilizados para acesso à Plataforma e aos dados dos pacientes.
13.2. Deverão ser adotados cuidados razoáveis, incluindo:
utilização de senha ou biometria;
bloqueio de tela;
atualização do dispositivo;
não compartilhamento de credenciais;
cuidado com redes públicas;
proteção contra acesso de terceiros;
e exclusão adequada de arquivos temporários quando necessário.
13.3. Não deverão ser deixados documentos clínicos expostos em locais de acesso por terceiros.

14. SENHAS E CREDENCIAIS
14.1. As credenciais de acesso à Plataforma são pessoais e intransferíveis.
14.2. O PP não poderá compartilhar:
senha;
código de autenticação;
token;
acesso de dispositivo;
ou qualquer mecanismo que permita entrada em sua conta.
14.3. Havendo suspeita de comprometimento da conta, o PP deverá alterar sua senha e comunicar a Larsana Care assim que possível.

15. COMPARTILHAMENTO COM OUTROS PROFISSIONAIS
15.1. O compartilhamento de informações com outros profissionais de saúde deverá ocorrer somente quando necessário à continuidade do cuidado ou houver outra base legítima.
15.2. O conteúdo compartilhado deverá ser limitado ao necessário.
15.3. O compartilhamento deverá respeitar:
dever de sigilo;
autonomia do paciente;
legislação aplicável;
finalidade assistencial;
e regras profissionais pertinentes.

16. SUBSTITUIÇÃO DE PROFISSIONAL E SUB
16.1. Quando houver atuação de Profissional Substituto (“SUB”), este deverá acessar apenas as informações necessárias para a realização das sessões sob sua responsabilidade.
16.2. A substituição temporária não autoriza acesso irrestrito a toda a relação histórica do paciente quando isso não for necessário para o atendimento.
16.3. O SUB deverá registrar pessoalmente os atendimentos que efetivamente realizar.
16.4. O PP responsável não poderá inserir evolução em nome do SUB nem assumir autoria de atendimento que não realizou.
16.5. O mesmo dever de sigilo e proteção de dados aplicável ao PP responsável será aplicável ao SUB.

17. TROCA OU TRANSIÇÃO DE PROFISSIONAL
17.1. Quando houver troca definitiva de PP, deverão ser preservadas as informações necessárias à continuidade segura da assistência.
17.2. O profissional que encerrar sua atuação deverá manter seus registros atualizados e colaborar com a transição nos limites profissionais e legais aplicáveis.
17.3. O encerramento da atuação não autoriza exclusão indevida, retenção ou ocultação de registros assistenciais necessários.

18. DOCUMENTOS, EXAMES E RELATÓRIOS
18.1. Documentos, exames, relatórios e demais materiais recebidos do paciente deverão ser utilizados exclusivamente para as finalidades relacionadas ao atendimento.
18.2. O PP deverá evitar realizar cópias desnecessárias.
18.3. Quando for necessário armazenar temporariamente documento fora da Plataforma, deverão ser adotadas medidas compatíveis de segurança.
18.4. Cessada a necessidade de armazenamento externo, o PP deverá realizar destinação adequada, respeitados os deveres legais ou profissionais de retenção eventualmente aplicáveis.

19. FOTOGRAFIAS, VÍDEOS E ÁUDIOS CLÍNICOS
19.1. Fotografias, vídeos ou áudios contendo paciente ou informação de saúde deverão ser produzidos apenas quando houver finalidade legítima e compatível com a assistência.
19.2. O PP deverá avaliar a necessidade efetiva do registro antes de produzi-lo.
19.3. Sempre que houver necessidade de autorização ou consentimento específico, este deverá ser obtido de maneira adequada.
19.4. Material clínico não deverá ser reutilizado para publicidade, divulgação, redes sociais, portfólio, aula, palestra ou outra finalidade distinta sem observância das autorizações e requisitos legais e profissionais correspondentes.

20. USO DE IMAGEM, VOZ E DEPOIMENTO PARA DIVULGAÇÃO
20.1. O atendimento do paciente não constitui autorização automática para utilização comercial, promocional ou institucional de sua imagem, voz ou depoimento.
20.2. O PP não poderá utilizar paciente atendido por intermédio da Larsana Care em conteúdo publicitário ou promocional sem autorização específica e sem observância das regras profissionais aplicáveis.
20.3. A autorização para uma finalidade não deverá ser presumida como autorização para outras finalidades.

21. REDES SOCIAIS
21.1. É vedada a divulgação não autorizada de informações que permitam identificar direta ou indiretamente o paciente.
21.2. A vedação inclui publicações contendo, entre outros:
nome;
rosto;
voz;
endereço;
residência;
exames;
diagnóstico;
prontuário;
evolução;
condição clínica;
fotografias de atendimento;
resultados terapêuticos;
“antes e depois”;
ou elementos capazes de identificar o paciente.
21.3. A retirada do nome, isoladamente, não torna necessariamente um conteúdo anônimo quando outros elementos permitirem identificar a pessoa.

22. USO DE DADOS PARA PROSPECÇÃO
22.1. Dados pessoais obtidos por meio da Larsana Care não poderão ser utilizados pelo PP para prospecção comercial própria incompatível com a relação originalmente estabelecida.
22.2. É vedado utilizar telefone, e-mail ou outras informações de contato disponibilizadas pela Plataforma para:
publicidade própria não autorizada;
oferta de serviços não solicitados;
inclusão em listas de marketing;
campanhas pessoais;
ou tentativa deliberada de deslocar o paciente da operação intermediada pela Larsana Care.
22.3. A presente regra não impede comunicações legítimas relacionadas ao tratamento ou exercício regular da autonomia do paciente e do profissional, observados os demais documentos aplicáveis.

23. COMUNICAÇÕES POR WHATSAPP E OUTROS CANAIS
23.1. WhatsApp, telefone ou e-mail poderão ser utilizados quando necessários para organização do atendimento e nas hipóteses previstas pela operação.
23.2. O PP deverá evitar compartilhar por esses meios quantidade excessiva de dados clínicos quando o objetivo puder ser atingido com informação menos sensível.
23.3. Informações assistenciais relevantes deverão ser registradas no ambiente apropriado da Plataforma quando aplicável.
23.4. Mensagens trocadas por canais de comunicação não substituem automaticamente o prontuário ou a evolução profissional.

24. CONVERSAS EM AMBIENTE DOMICILIAR
24.1. O caráter domiciliar do atendimento não reduz o dever de sigilo.
24.2. O PP deverá observar quem está presente no ambiente antes de abordar informações clínicas sensíveis.
24.3. Sempre que possível, informações privadas deverão ser tratadas de forma compatível com a vontade do paciente e sua necessidade de privacidade.

25. INFORMAÇÕES FINANCEIRAS
25.1. Informações financeiras, valores, documentos fiscais e dados relacionados ao pagamento também deverão ser tratados de forma confidencial.
25.2. O PP não deverá divulgar a terceiros valores, condições comerciais ou informações financeiras individuais do paciente sem necessidade legítima.

26. ACESSO APÓS ENCERRAMENTO DO PACIENTE
26.1. Encerrada a atuação do PP em determinada demanda, seu acesso às informações do paciente poderá ser restringido conforme as necessidades operacionais, assistenciais, legais e profissionais.
26.2. O fato de o PP ter atendido determinado paciente anteriormente não confere direito permanente de consultar seus dados sem finalidade legítima.

27. RETENÇÃO DE DADOS
27.1. Os dados e registros assistenciais deverão ser mantidos pelos períodos necessários ao cumprimento das obrigações legais, regulatórias, profissionais, assistenciais e de defesa de direitos aplicáveis.
27.2. Não deverá ser utilizado prazo único ou genérico quando existirem obrigações específicas aplicáveis ao tipo de registro.
27.3. O encerramento da conta do PP ou do tratamento do paciente não implica necessariamente exclusão imediata dos registros cuja conservação seja necessária.

28. EXCLUSÃO E DESCARTE
28.1. Documentos ou cópias mantidas fora dos sistemas oficiais deverão ser descartados de forma segura quando deixarem de ser necessários e não houver obrigação legítima de conservação.
28.2. O descarte deverá impedir, na medida razoavelmente possível, recuperação ou acesso indevido por terceiros.

29. INCIDENTE DE SEGURANÇA
29.1. O PP deverá comunicar à Larsana Care, assim que tomar conhecimento, qualquer incidente ou suspeita relevante envolvendo dados relacionados aos pacientes ou à Plataforma.
29.2. São exemplos:
perda ou furto de dispositivo;
exposição de prontuário;
envio de informação ao destinatário errado;
invasão de conta;
comprometimento de senha;
acesso indevido;
vazamento;
compartilhamento não autorizado;
ou perda de documento contendo dados pessoais.
29.3. A comunicação deverá ocorrer mesmo quando o PP ainda não souber a extensão total do incidente.
29.4. O PP deverá colaborar com as medidas necessárias para contenção, investigação e redução dos impactos.

30. COMUNICAÇÃO DE ERRO DE ENVIO
30.1. Caso informação de paciente seja enviada equivocadamente a terceiro, o PP deverá evitar novos compartilhamentos, comunicar a Larsana Care e adotar as medidas orientadas para contenção da ocorrência.
30.2. O PP não deverá apagar ou ocultar evidências necessárias à apuração do incidente.

31. AUDITORIA E RASTREABILIDADE
31.1. A Plataforma poderá manter registros de acesso, alterações, versões, autenticações e demais eventos necessários à segurança e rastreabilidade.
31.2. Esses registros poderão ser utilizados para:
segurança;
investigação de incidentes;
verificação de integridade;
cumprimento de obrigações legais;
defesa de direitos;
e apuração de irregularidades.
31.3. O PP não deverá tentar desativar, manipular ou contornar mecanismos de auditoria.

32. REQUISIÇÕES DE CÓPIAS OU INFORMAÇÕES
32.1. Solicitações de prontuários, documentos, cópias ou informações deverão ser tratadas conforme as regras profissionais, legais e operacionais aplicáveis.
32.2. O PP não deverá encaminhar cópia integral de prontuário a pessoa não legitimada apenas porque esta se apresenta como familiar ou responsável.
32.3. Quando houver dúvida sobre a legitimidade da solicitação, o PP deverá utilizar os canais oficiais da Larsana Care para orientação operacional, sem prejuízo de suas obrigações profissionais próprias.

33. SOLICITAÇÕES DE AUTORIDADES OU TERCEIROS
33.1. Solicitações de dados provenientes de autoridades, instituições, advogados, seguradoras ou outros terceiros deverão ser avaliadas conforme a legitimidade, competência e base jurídica aplicáveis.
33.2. O PP não deverá fornecer dados sigilosos apenas em razão de solicitação informal sem verificar a legitimidade da requisição.

34. CONFIDENCIALIDADE DAS INFORMAÇÕES DA LARSANA CARE
34.1. O dever de confidencialidade também se aplica às informações não públicas da Larsana Care às quais o PP tiver acesso.
34.2. Poderão ser consideradas confidenciais, conforme o caso:
processos internos;
materiais;
manuais;
estratégias;
informações operacionais;
dados de outros profissionais;
informações comerciais não públicas;
configurações da Plataforma;
e demais conteúdos identificados ou razoavelmente compreendidos como confidenciais.
34.3. Informações públicas ou legitimamente obtidas de fonte independente não serão consideradas confidenciais apenas por também constarem dos ambientes da Larsana Care.

35. PROIBIÇÕES ESPECÍFICAS
É expressamente vedado ao PP:
I — acessar prontuário de paciente sem necessidade legítima;
II — compartilhar credenciais de acesso;
III — copiar base de dados de pacientes;
IV — criar listas próprias com dados de pacientes obtidos pela Plataforma para finalidade comercial não autorizada;
V — encaminhar prontuários ou evoluções a terceiros não autorizados;
VI — publicar dados, imagens ou casos identificáveis sem fundamento adequado;
VII — fotografar ou gravar pacientes sem finalidade legítima ou autorização quando necessária;
VIII — utilizar dados para tentativa de prospecção indevida;
IX — registrar informação clínica falsa;
X — alterar registros para ocultar ocorrência;
XI — tentar acessar áreas da Plataforma para as quais não possui permissão;
XII — utilizar dados de outro PP ou paciente para finalidade incompatível com a operação;
XIII — manter documentos sensíveis expostos de forma insegura;
XIV — fornecer informações clínicas a familiar sem avaliar sua legitimidade para recebê-las.

36. DESCUMPRIMENTO
36.1. Violações às regras de sigilo, proteção de dados ou integridade dos registros poderão ser analisadas conforme sua gravidade, extensão, risco, reincidência e circunstâncias concretas.
36.2. Poderão ser adotadas medidas proporcionais, incluindo:
orientação;
correção;
advertência;
limitação de acesso;
bloqueio temporário;
suspensão;
encerramento da parceria;
e demais providências necessárias.
36.3. Situações graves poderão justificar medidas imediatas de proteção, especialmente em hipóteses de:
vazamento intencional;
fraude;
falsificação;
acesso indevido deliberado;
compartilhamento ilícito;
comercialização de dados;
ou risco significativo à privacidade ou segurança do paciente.
36.4. A adoção de medida interna não exclui eventual responsabilidade civil, administrativa, ética, profissional ou penal quando aplicável.

37. RESPONSABILIDADE DO PP
37.1. O PP é responsável pelos atos de tratamento de dados praticados sob sua esfera de atuação e controle.
37.2. A utilização da Plataforma não afasta os deveres profissionais próprios do fisioterapeuta relativos a sigilo, registros assistenciais e proteção das informações de seus pacientes.
37.3. O PP deverá cooperar com a Larsana Care na investigação e correção de incidentes relacionados à operação quando necessário.

38. RESPONSABILIDADE DA LARSANA CARE
38.1. A Larsana Care deverá adotar medidas compatíveis com sua atuação para proteção dos dados tratados em sua Plataforma e operação.
38.2. A Larsana Care poderá implementar controles de:
autenticação;
permissões;
rastreabilidade;
registros de acesso;
segurança;
monitoramento de incidentes;
e outras medidas tecnicamente adequadas.
38.3. A existência desses mecanismos não afasta a responsabilidade individual do PP pelo uso correto de sua conta e pelos dados aos quais tenha acesso.

39. RELAÇÃO COM A POLÍTICA DE PRIVACIDADE
39.1. Este Anexo deverá ser interpretado em conjunto com a Política de Privacidade aplicável aos Profissionais Parceiros da Larsana Care.
39.2. A Política de Privacidade disciplina o tratamento dos dados pessoais do próprio PP e outros tratamentos realizados pela Larsana Care.
39.3. Este Anexo possui foco específico no dever do PP de proteger informações, dados de pacientes e registros assistenciais acessados no contexto de sua atuação.

40. ATUALIZAÇÃO DESTE ANEXO
40.1. As presentes regras poderão ser atualizadas em razão de:
alterações legais;
regulamentações profissionais;
mudanças tecnológicas;
evolução da Plataforma;
novas medidas de segurança;
ou aperfeiçoamento dos procedimentos internos.
40.2. A versão atualizada deverá ser disponibilizada ao PP pelos canais oficiais.
40.3. Quando a alteração implicar obrigação relevante nova, a Larsana Care poderá exigir ciência ou novo aceite eletrônico.

41. ACEITE ELETRÔNICO
41.1. O aceite deste Anexo poderá ocorrer eletronicamente por meio da Plataforma ou outro mecanismo autorizado pela Larsana Care.
41.2. O registro de aceite poderá conter, conforme disponibilidade técnica:
identificação do PP;
versão do documento;
data;
horário;
endereço IP;
informações do dispositivo;
e outros elementos de rastreabilidade.
41.3. O aceite eletrônico integra o conjunto de documentos aplicáveis à relação entre a Larsana Care e o PP.

42. VIGÊNCIA E INTEGRAÇÃO
42.1. Este Anexo entra em vigor na data indicada em sua versão e permanecerá aplicável enquanto vigente.
42.2. O dever de sigilo e as obrigações de confidencialidade que, por sua natureza, devam permanecer após o encerramento da relação continuarão produzindo efeitos mesmo após o término da parceria.
42.3. Este documento deverá ser interpretado em conjunto com:
o Contrato de Parceria para Intermediação de Serviços de Fisioterapia;
os Termos de Uso da Plataforma — Profissionais Parceiros;
as Regras Comerciais dos Profissionais Parceiros — Fisioterapia;
as Regras Operacionais dos Profissionais Parceiros — Fisioterapia;
o Anexo de Categorias Técnicas e Habilitações — Fisioterapia;
a Política de Privacidade — Profissionais Parceiros;
e demais documentos aplicáveis.

DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA.LARSANA CARECNPJ nº 65.974.822/0001-19Alameda Terracota, nº 185, Conjunto Comercial 1213Bairro Cerâmica — São Caetano do Sul/SP — CEP 09531-190E-mail: contato@larsanacare.com.br
Versão 1.0 — Agosto/2026$legal_body$, true, 'pp'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('TERMO_ADESAO', '1.0-2026-08', 'Termos de Uso — Paciente/Responsável', $legal_body$Termos de Uso da Plataforma Larsana Care 
Pacientes, responsáveis e usuários 
V1.08/2026

-1424285750

Estes Termos de Uso regulam o acesso e a utilização da Plataforma Larsana Care, bem como as condições gerais aplicáveis à intermediação, organização e gestão dos serviços de saúde disponibilizados por meio da Plataforma. 
Ao criar uma conta, acessar funcionalidades ou contratar serviços por meio da Plataforma, o Usuário declara que leu, compreendeu e concorda com estes Termos e com os demais documentos aplicáveis à sua relação com a Larsana Care.

1. IDENTIFICAÇÃO DA EMPRESA
1.1. A Plataforma Larsana Care é disponibilizada por DELUMA Serviços de Saúde e Educação LTDA, inscrita no CNPJ sob nº CNPJ sob nº 65.974.822/0001-19, com sede social na Alameda Terracota, no. 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul-SP, 09531-190, detentora da marca “Larsana Care”, doravante denominada “Larsana Care”, “Larsana” ou “Plataforma”.
1.2. A Larsana Care disponibiliza plataforma tecnológica destinada à organização, intermediação e gestão da contratação de serviços de saúde, especialmente serviços de atendimento domiciliar realizados por profissionais parceiros devidamente habilitados.
1.3. Estes Termos estabelecem as regras gerais de utilização da Plataforma e poderão ser complementados pela Política de Privacidade, condições específicas da contratação, termos de consentimento e outros documentos aplicáveis.
2. DEFINIÇÕES
2.1. Para fins destes Termos, aplicam-se as seguintes definições:
Plataforma: sistema digital disponibilizado pela Larsana Care para cadastro, contratação, organização, acompanhamento e gestão dos serviços.
Usuário: pessoa física que cria ou utiliza uma conta na Plataforma.
Paciente: pessoa que efetivamente receberá o serviço de saúde.
Responsável: pessoa que, quando legalmente ou devidamente autorizada, realiza cadastro, contratação, pagamento ou acompanhamento em nome do Paciente.
Profissional Parceiro ou PP: profissional de saúde independente e regularmente habilitado que integra a rede de parceiros da Larsana Care.
Profissional Parceiro Responsável: profissional que assume a continuidade principal do atendimento do Paciente durante determinado ciclo.
Profissional Parceiro Substituto ou SUB: profissional habilitado que realiza um ou mais atendimentos específicos em substituição temporária ao PP Responsável, sem assumir necessariamente a continuidade do Paciente.
Atendimento: serviço de saúde prestado pelo Profissional Parceiro.
Avaliação Inicial: primeiro atendimento destinado à avaliação profissional do Paciente no início de sua jornada de tratamento pela Larsana Care.
Ciclo: conjunto de atendimentos contratados conforme quantidade, frequência e condições apresentadas ao Usuário.
Conta: ambiente individual do Usuário na Plataforma.
Canais Oficiais: Plataforma e demais canais reconhecidos e disponibilizados pela Larsana Care, incluindo, quando aplicável, WhatsApp, telefone e e-mail.
Dados de Saúde: informações relacionadas à saúde, condições clínicas, avaliações, tratamentos, evoluções e demais informações dessa natureza.
3. ACEITAÇÃO DOS TERMOS
3.1. A utilização da Plataforma está condicionada à aceitação destes Termos.
3.2. O aceite poderá ocorrer por caixa de seleção, botão de confirmação, assinatura eletrônica ou outro mecanismo eletrônico apto a registrar a manifestação de vontade do Usuário.
3.3. Quando o Usuário realizar atos em nome de terceiro, declara possuir legitimidade ou autorização para tanto.
3.4. Caso não concorde com estes Termos, o Usuário não deverá concluir a contratação ou continuar utilizando funcionalidades condicionadas ao aceite.
4. O QUE É A LARSANA CARE
4.1. A Larsana Care disponibiliza estrutura tecnológica e operacional destinada à contratação, intermediação, organização e gestão de serviços de saúde realizados por Profissionais Parceiros.
4.2. A Larsana poderá disponibilizar recursos relacionados a cadastro, organização da demanda, disponibilização de Profissionais Parceiros, contratação, ciclos de atendimento, agenda, pagamentos, acompanhamento operacional, registros, comunicação, substituição de profissionais, documentos, suporte, continuidade e encerramento dos atendimentos.
4.3. A Larsana Care não substitui o profissional de saúde na avaliação, diagnóstico, definição de conduta ou execução dos atos técnicos próprios de sua profissão.
4.4. O Profissional Parceiro possui autonomia técnica e responsabilidade pelos atos profissionais que praticar.
4.5. A Larsana permanece responsável pelas obrigações que assumir diretamente, incluindo aquelas relacionadas à operação da Plataforma, intermediação, gestão e demais atividades efetivamente realizadas pela empresa.
4.6. A Larsana Care atua como plataforma de intermediação, organização e suporte operacional da relação entre Pacientes e Profissionais Parceiros, não executando diretamente os atos técnicos ou assistenciais próprios das profissões regulamentadas, salvo se determinado serviço vier a ser expressamente disponibilizado sob modelo jurídico distinto e devidamente informado ao Usuário.
4.6.1. Os Profissionais Parceiros atuam com autonomia técnica e profissional, sendo responsáveis pelas avaliações, diagnósticos próprios de sua profissão, prescrições, condutas, procedimentos, orientações e demais decisões assistenciais decorrentes dos atendimentos que realizarem.
5. COMO FUNCIONA A INTERMEDIAÇÃO
5.1. O Usuário utiliza a estrutura disponibilizada pela Larsana para solicitar e contratar serviços realizados por sua rede de Profissionais Parceiros.
5.2. A Larsana poderá considerar localização, disponibilidade, categoria técnica, habilitação profissional, características da demanda e critérios operacionais para disponibilização dos profissionais.
5.3. A relação envolve três esferas distintas: Larsana Care, responsável pela intermediação, organização, gestão e suporte; Profissional Parceiro, responsável pela execução técnica do serviço de saúde; e Paciente ou Responsável, responsável pela contratação, pagamento, fornecimento das informações necessárias e colaboração com o atendimento.
5.4. A disponibilização de determinado profissional não representa garantia de cura ou resultado clínico específico.
6. CADASTRO E CRIAÇÃO DA CONTA
6.1. Para utilização de determinadas funcionalidades, o Usuário deverá criar conta na Plataforma.
6.2. As informações fornecidas deverão ser verdadeiras, completas e atualizadas.
6.3. Poderão ser solicitados dados necessários à identificação, contratação, atendimento, pagamento, segurança e cumprimento das obrigações aplicáveis.
6.4. O Usuário é responsável pela segurança de suas credenciais.
6.5. A Larsana deverá ser comunicada caso seja identificado acesso não autorizado.
6.6. Poderão ser utilizados mecanismos adicionais de autenticação e validação de identidade.
7. CONTRATAÇÃO DOS SERVIÇOS
7.1. A contratação será realizada por meio da estrutura disponibilizada pela Larsana, com apresentação prévia das condições aplicáveis.
7.2. Serão disponibilizadas informações essenciais, incluindo, quando aplicável, modalidade, quantidade de atendimentos, frequência, valores, condições de pagamento, localização, regras do ciclo e demais condições relevantes.
7.3. A contratação será considerada confirmada conforme os procedimentos indicados pela Larsana.
7.4. A contratação de serviço de saúde não representa promessa de resultado clínico determinado.
7.5. Serviços adicionais ou alterações que impliquem nova cobrança dependerão de informação prévia ao Usuário.
8. PROFISSIONAIS PARCEIROS
8.1. Os serviços de saúde serão realizados por Profissionais Parceiros regularmente habilitados, quando aplicável à respectiva categoria profissional.
8.2. O Profissional Parceiro atua com autonomia técnica e profissional, sendo responsável pelos atos técnicos e assistenciais que praticar, observadas sua formação, competência, habilitações e as normas legais, regulamentares, técnicas e éticas aplicáveis à sua profissão.
8.3. A Larsana Care não deverá interferir indevidamente na autonomia técnica do Profissional Parceiro para definição das condutas assistenciais próprias de sua competência.
8.4. A Larsana Care poderá estabelecer critérios para ingresso, permanência e atuação dos Profissionais Parceiros em sua rede, bem como realizar verificações cadastrais e documentais, incluindo, quando aplicável, identidade, registro perante Conselho Profissional, regularidade cadastral, certificados, habilitações e outros documentos exigidos pela Plataforma.
8.5. A verificação cadastral e documental realizada pela Larsana Care não constitui certificação ou garantia irrestrita da capacidade técnica do Profissional Parceiro para todo e qualquer procedimento relacionado à sua profissão.
8.6. Compete ao Profissional Parceiro manter sua regularidade profissional e avaliar, antes e durante cada atendimento, se possui formação, competência, capacitação e, quando exigível, especialidade ou habilitação adequada para a realização da conduta ou procedimento pretendido.
8.7. O Profissional Parceiro deverá atuar exclusivamente dentro dos limites de sua competência legal, técnica e profissional, devendo recusar a realização de ato ou procedimento para o qual não esteja devidamente capacitado ou habilitado, ainda que solicitado pelo Paciente, Responsável, familiar ou terceiro.
8.8. Quando determinado procedimento exigir especialidade, habilitação, formação complementar, certificação ou outro requisito específico, sua realização ficará condicionada ao preenchimento dos requisitos aplicáveis pelo Profissional Parceiro.
8.9. A Larsana Care não realiza supervisão clínica individual ou em tempo real dos atos praticados pelo Profissional Parceiro, sem prejuízo dos mecanismos de qualidade, segurança, auditoria, verificação documental e acompanhamento operacional que poderão ser adotados pela Plataforma.
8.10. O escopo geral e os limites de atuação das categorias profissionais disponibilizadas por intermédio da Larsana Care estão descritos no ANEXO III — ESCOPO E LIMITES DE ATUAÇÃO DOS PROFISSIONAIS PARCEIROS, que integra estes Termos para fins de informação e transparência ao Paciente e/ou Responsável.
8.11. As disposições do Anexo III possuem caráter informativo e não substituem, restringem ou ampliam as competências estabelecidas pela legislação ou pelas normas dos respectivos Conselhos Profissionais, que prevalecerão quando aplicáveis.
8.12.CONDIÇÕES ESPECÍFICAS POR SERVIÇO OU CATEGORIA PROFISSIONAL
8.12.1. Determinados serviços ou categorias profissionais disponibilizados pela Larsana Care poderão estar sujeitos a condições específicas de contratação, atendimento, funcionamento, agendamento, ciclos, pagamentos, valores, cancelamentos, documentação, responsabilidades ou outras regras operacionais próprias, em razão das características do serviço prestado.
8.12.2. Essas condições poderão ser estabelecidas por meio de anexos, termos complementares, condições específicas do serviço ou outros documentos disponibilizados pela Larsana Care, os quais passarão a integrar a relação contratual quando aplicáveis ao serviço efetivamente contratado pelo Paciente ou Responsável.
8.12.3. A criação de condições específicas para determinada categoria profissional ou modalidade de atendimento não implicará alteração automática das condições aplicáveis aos demais serviços disponibilizados pela Larsana Care.
8.12.4 Sempre que uma condição específica produzir impacto relevante sobre preço, forma de pagamento, cancelamento, obrigação do Paciente ou outra condição essencial da contratação, a informação correspondente deverá ser apresentada ao Paciente ou Responsável antes da contratação do respectivo serviço.
8.12.5. A Larsana Care poderá criar novos anexos ou documentos complementares em razão da inclusão de novas categorias profissionais, modalidades de atendimento, serviços ou necessidades operacionais, legais ou regulatórias, observados os deveres de informação, transparência e, quando aplicável, de novo aceite pelo Paciente ou Responsável.
8.12.6. Em caso de conflito entre uma regra geral destes Termos e uma condição específica expressamente estabelecida para determinado serviço ou categoria profissional, prevalecerá a condição específica exclusivamente em relação ao serviço ao qual ela se refere, respeitada a legislação aplicável.

9. ATENDIMENTO DOMICILIAR
9.1. Os atendimentos poderão ser realizados no endereço informado pelo Usuário, dentro da área de cobertura disponibilizada pela Larsana.
9.2. O Usuário deverá fornecer endereço correto e atualizado.
9.3. O ambiente deverá apresentar condições adequadas de segurança, higiene, privacidade e espaço.
9.4. Deverão ser informadas situações ambientais que possam representar risco ao Paciente ou ao Profissional Parceiro.
9.5. O atendimento poderá não ser iniciado ou poderá ser interrompido diante de risco relevante à segurança.
9.6. Os serviços disponibilizados pela Larsana Care não constituem serviço de urgência ou emergência.
9.7. Em situações de urgência ou emergência, deverá ser procurado imediatamente o serviço apropriado.
10. AGENDA, CONFIRMAÇÃO E COMUNICAÇÕES OPERACIONAIS
10.1. A Plataforma constitui o principal ambiente para organização e acompanhamento da agenda.
10.2. Agendamentos, confirmações e alterações realizados na Plataforma constituirão registros eletrônicos da operação.
10.3. O Usuário deverá acompanhar sua agenda e as notificações disponibilizadas.
10.4. Considerando que determinados Pacientes ou Responsáveis poderão possuir dificuldade de utilização da Plataforma, WhatsApp, telefone e outros Canais Oficiais disponibilizados pela Larsana também poderão ser utilizados para confirmação, cancelamento, reagendamento e demais comunicações operacionais.
10.5. As comunicações realizadas por Canais Oficiais alternativos serão consideradas válidas desde que seja possível identificar o Paciente, o atendimento correspondente e o momento em que a comunicação ocorreu.
10.6. Quando a comunicação ocorrer por telefone ou outro meio externo à Plataforma, a Larsana poderá registrar administrativamente a ocorrência no sistema.
10.7. Os registros eletrônicos poderão ser utilizados para comprovação de agendamentos, confirmações, cancelamentos, alterações, pagamentos, aceites e demais atos realizados.
11. CICLOS DE ATENDIMENTO
11.1. Regras gerais
11.1.1. Os serviços poderão ser organizados em ciclos compostos por quantidade previamente definida de atendimentos.
11.1.2. Quantidade, frequência e demais condições serão apresentadas ao Usuário.
11.2. Primeiro ciclo
11.2.1. O primeiro ciclo corresponde ao período inicial de atendimento e será precedido pela avaliação inicial realizada pelo Profissional Parceiro.
11.2.2. Havendo continuidade após a avaliação, esta será considerada o primeiro atendimento do primeiro ciclo.
11.2.3. Consequentemente, um ciclo de 4 atendimentos compreenderá 1 avaliação e 3 atendimentos subsequentes; um ciclo de 8 atendimentos compreenderá 1 avaliação e 7 atendimentos subsequentes; e um ciclo de 12 atendimentos compreenderá 1 avaliação e 11 atendimentos subsequentes.
11.2.4. Caso não haja continuidade após a avaliação, o primeiro ciclo não será efetivado, permanecendo devido o valor da avaliação realizada.
11.2.5. Havendo continuidade, o segundo atendimento do primeiro ciclo corresponderá ao primeiro atendimento terapêutico subsequente à avaliação.
11.3. Ciclos subsequentes
11.3.1. Após a conclusão do primeiro ciclo, a continuidade poderá ocorrer mediante contratação de novo ciclo.
11.3.2. Nos ciclos subsequentes não haverá obrigatoriedade de nova avaliação inicial específica, salvo quando houver indicação técnica.
11.3.3. O acompanhamento da evolução ocorrerá continuamente por meio das avaliações inerentes à prática profissional e dos registros de evolução realizados pelo Profissional Parceiro.
11.3.4. Os registros poderão subsidiar recomendações de continuidade, alteração de frequência, revisão de conduta ou encerramento.
11.3.5. Nos ciclos subsequentes, todos os atendimentos contratados serão destinados à continuidade do tratamento, ressalvada eventual necessidade técnica de avaliação ou reavaliação.
11.4. Frequência, conclusão e continuidade
11.4.1. A frequência será estabelecida considerando as necessidades do Paciente e a avaliação do Profissional Parceiro.
11.4.2. Poderá ser revista conforme evolução clínica.
11.4.3. Alterações com repercussão financeira deverão ser previamente apresentadas ao Usuário.
11.4.4. O ciclo será considerado encerrado após a realização ou consumo contratual, quando aplicável nos termos da Cláusula 13, da quantidade de atendimentos que o compõem.
11.4.5. A Plataforma poderá apresentar a quantidade de atendimentos contratados, efetivamente realizados, consumidos por regra contratual e restantes.
11.4.6. A conclusão do ciclo não implica renovação automática.
12. PAGAMENTOS E CONDIÇÕES FINANCEIRAS
12.1. Regras gerais
12.1.1. Os valores serão apresentados previamente ao Usuário.
12.1.2. Os pagamentos poderão ser realizados por PIX, cartão, boleto ou outros meios disponibilizados.
12.1.3. O processamento poderá ser realizado por instituição de pagamento ou prestador financeiro integrado à Plataforma.
12.2. Avaliação inicial
12.2.1. O valor da avaliação será informado previamente, conforme o valor comercial vigente no momento do agendamento.
12.2.2. A avaliação deverá ser paga antes de sua realização.
12.2.3. Uma vez realizada, caso o Paciente não continue o tratamento, não haverá reembolso do valor pago, considerando que o serviço foi efetivamente prestado, ressalvadas hipóteses legalmente aplicáveis.
12.2.4. Havendo continuidade, a avaliação integrará o primeiro ciclo, sendo concedido o crédito ou abatimento comercial previsto nas condições vigentes no momento da contratação, o qual poderá não corresponder integralmente ao valor pago pela Avaliação Inicial.
12.2.5. O crédito ou abatimento decorrente da Avaliação Inicial será aplicado uma única vez no primeiro ciclo, conforme valor e condições estabelecidos na tabela comercial vigente.
12.3. Modalidades de pagamento
12.3.1. A Larsana poderá disponibilizar pagamento antecipado do saldo do ciclo, com desconto comercial, ou pagamento após a conclusão do ciclo, pelo valor integral devido.
12.4. Pagamento antecipado
12.4.1. A possibilidade de pagamento antecipado com desconto permanecerá disponível durante o período comercial informado pela Larsana, observado o limite de 7 (sete) dias corridos contados da realização do segundo atendimento do respectivo ciclo.
12.4.2. No primeiro ciclo, o segundo atendimento corresponde ao primeiro atendimento terapêutico realizado após a avaliação inicial.
12.4.3. O percentual ou valor do desconto será aquele apresentado pela Larsana, não ficando estabelecido percentual fixo nestes Termos.
12.4.4. No primeiro ciclo, o desconto incidirá sobre o saldo remanescente após o abatimento do valor já pago pela avaliação.
12.4.5. Encerrado o prazo para antecipação sem pagamento, o desconto deixará de estar disponível, permanecendo devido o valor integral correspondente.
12.4.6. O desconto constitui condição comercial específica e não gera direito adquirido para contratações futuras.
12.5. Pagamento ao término e inadimplência
12.5.1. Caso não haja antecipação, o saldo devido será cobrado após a conclusão do ciclo, conforme vencimento apresentado ao Usuário.
12.5.2. Nessa modalidade não será aplicado o desconto comercial de antecipação.
12.5.3. O não pagamento até o vencimento caracterizará inadimplência.
12.5.4. Poderão incidir sobre o débito multa moratória de 2% (dois por cento), juros de mora de 1% (um por cento) ao mês calculados proporcionalmente ao período de atraso e atualização monetária quando legalmente aplicável.
12.5.5. Persistindo a inadimplência, poderão ser adotadas medidas extrajudiciais ou judiciais de cobrança.
12.5.6. O débito vencido e não regularizado poderá ser encaminhado aos órgãos de proteção ao crédito, observados os requisitos legais e os direitos do consumidor.
12.6. Retenção, conferência e split
12.6.1. A Larsana poderá utilizar mecanismo de divisão de pagamentos (split) para destinação das parcelas correspondentes aos serviços de saúde e aos serviços próprios de intermediação, gestão e operação.
12.6.2. Quando houver pagamento antecipado, os valores destinados ao Profissional Parceiro permanecerão retidos no fluxo financeiro até a respectiva apuração.
12.6.3. O encerramento do ciclo tornará os valores correspondentes aos atendimentos e demais valores devidos ao profissional elegíveis para apuração, não significando liberação automática.
12.6.4. O Profissional Parceiro deverá apresentar o documento fiscal ou comprobatório legalmente aplicável.
12.6.5. A Larsana realizará conferência dos atendimentos, registros, valores e documentos apresentados.
12.6.6. Estando as informações regulares, será autorizado o processamento do split e o respectivo repasse.
12.6.7. Havendo divergências, o repasse poderá permanecer pendente até regularização.
12.7. Documentos fiscais e comprovação dos serviços
12.7.1. O valor total da contratação poderá compreender parcela correspondente aos serviços de saúde prestados pelo Profissional Parceiro e parcela correspondente aos serviços de intermediação, gestão e operação prestados pela Larsana Care.
12.7.2. Em razão dessa estrutura, poderão ser emitidos documentos distintos.
12.7.3. Para os serviços de saúde, o Profissional Parceiro pessoa física emitirá Receita Saúde ou outro documento fiscal ou comprobatório legalmente aplicável; e o Profissional Parceiro pessoa jurídica emitirá Nota Fiscal de Serviços ou outro documento fiscal aplicável.
12.7.4. O documento do serviço de saúde corresponderá ao valor atribuído aos serviços do respectivo Profissional Parceiro, conforme legislação aplicável.
12.7.5. A parcela dos serviços próprios da Larsana será objeto de documento fiscal emitido pela Larsana.
12.7.6. O valor individual de cada documento poderá ser inferior ao total pago, pois cada documento corresponderá à parcela atribuída ao respectivo prestador.
12.7.7. Os documentos serão disponibilizados ao Paciente ou Responsável na Plataforma após emissão, recebimento, conferência e processamento.
12.7.8. A responsabilidade pela emissão do documento do serviço de saúde será do respectivo Profissional Parceiro.
12.7.9. Alterações legais ou tributárias serão incorporadas conforme o documento fiscal ou comprobatório vigente e aplicável no momento da prestação.
12.7.10. Atendimentos realizados por SUB
12.7.10. Quando houver atendimento realizado por SUB, o serviço será atribuído, para fins financeiros e documentais, ao profissional que efetivamente o realizou.
12.7.11. O SUB deverá emitir documento fiscal ou comprobatório correspondente aos atendimentos por ele realizados, ainda que tenha realizado apenas um único atendimento durante o ciclo.
12.7.12. Havendo mais de um profissional no ciclo, o Paciente poderá receber mais de um documento referente aos serviços de saúde, além do documento da Larsana.
12.7.13. O repasse ao SUB estará sujeito aos registros profissionais, apresentação documental e conferência pela Larsana.
12.8. Pagamento em dinheiro ao Profissional Parceiro
12.8.1. Quando essa modalidade estiver disponibilizada pela Larsana Care, o Paciente ou Responsável poderá realizar o pagamento em dinheiro diretamente ao Profissional Parceiro responsável pelo atendimento.
12.8.2. O recebimento pelo Profissional Parceiro, quando realizado de acordo com os procedimentos autorizados pela Larsana Care, será reconhecido como pagamento realizado pelo Paciente ou Responsável, devendo ser devidamente registrado para fins de conciliação financeira.
12.8.3. Caberá ao Profissional Parceiro comunicar e registrar o recebimento conforme os procedimentos e prazos estabelecidos pela Larsana Care.
12.8.4. O Profissional Parceiro será responsável pelo repasse à Larsana Care da parcela correspondente aos serviços de intermediação, gestão e operação da Plataforma, conforme as condições aplicáveis à contratação e ao vínculo do profissional com a Larsana.
12.8.5. O pagamento em dinheiro não altera a responsabilidade de cada prestador pela emissão dos respectivos documentos fiscais ou comprobatórios legalmente exigidos.
12.8.6. Uma vez comprovado o pagamento integral realizado pelo Paciente ou Responsável ao Profissional Parceiro por modalidade autorizada pela Larsana Care, não poderá o mesmo valor ser novamente exigido do Paciente em razão de eventual atraso ou inadimplemento do Profissional Parceiro no repasse da parcela devida à Larsana Care.
13. CANCELAMENTOS, REAGENDAMENTOS E AUSÊNCIAS
13.1. Canais válidos
13.1.1. Confirmações, cancelamentos e reagendamentos deverão ser realizados preferencialmente pela Plataforma.
13.1.2. Quando o Paciente ou Responsável não puder utilizar a Plataforma, a comunicação poderá ocorrer por WhatsApp, ligação telefônica ou outro Canal Oficial disponibilizado pela Larsana.
13.1.3. Essas comunicações serão consideradas válidas desde que seja possível identificar o Paciente, o atendimento e o momento da solicitação.
13.1.4. Para contagem dos prazos será considerada a data e horário do recebimento ou registro da comunicação, independentemente do momento da resposta da Larsana ou do Profissional Parceiro.
13.1.5. Comunicações realizadas por telefone poderão ser registradas administrativamente na Plataforma.
13.2. Cancelamento com antecedência
13.2.1. Quando o cancelamento ou reagendamento for comunicado com antecedência igual ou superior a 12 (doze) horas, não haverá cobrança decorrente do cancelamento e o atendimento poderá ser reagendado conforme disponibilidade.
13.3. Cancelamento tardio
13.3.1. Quando comunicado com menos de 12 (doze) horas de antecedência, sem motivo excepcional devidamente justificado, o atendimento será considerado consumido para fins do ciclo, não havendo direito à reposição ou reagendamento dentro do mesmo ciclo.
13.3.2. Será devido 50% (cinquenta por cento) do valor daquele atendimento, em razão da reserva do horário e indisponibilização da agenda do Profissional Parceiro.
13.4. Ausência
13.4.1. Quando o Paciente não estiver disponível no local e horário agendados e não houver comunicação prévia, será caracterizada ausência.
13.4.2. A sessão será considerada consumida do ciclo, sem reposição, aplicando-se a cobrança de 50% prevista nesta cláusula.
13.5. Tratamento dos 50% não cobrados
13.5.1. Quando o ciclo tiver sido pago antecipadamente, os 50% restantes referentes ao atendimento não realizado permanecerão em favor do Paciente, que poderá optar por reembolso do respectivo valor ou manutenção do valor como crédito na Plataforma para utilização em ciclo posterior.
13.5.2. A escolha será disponibilizada ao Paciente ou Responsável conforme os procedimentos da Larsana.
13.5.3. O crédito não implica renovação automática.
13.5.4. Se o novo ciclo possuir valor superior ao crédito disponível, será devido o pagamento da diferença conforme as condições comerciais então vigentes.
13.5.5. Quando o ciclo não tiver sido pago antecipadamente, será cobrado somente o percentual devido pelo cancelamento tardio ou ausência, não havendo reembolso de valor não desembolsado pelo Paciente.
13.6. Reflexos no ciclo e no prontuário
13.6.1. A sessão perdida será descontada da quantidade total contratada.
13.6.2. A consideração da sessão como consumida possui natureza contratual e financeira e não significa que o atendimento tenha sido clinicamente realizado.
13.6.3. Não será registrada evolução clínica correspondente a serviço não realizado.
13.6.4. A Plataforma poderá identificar separadamente situações como “cancelamento tardio - sessão consumida” e “ausência - sessão consumida”.
13.7. Repasse do cancelamento
13.7.1. O valor de 50% efetivamente cobrado será distribuído conforme a estrutura financeira aplicável à contratação, contemplando a parcela destinada ao Profissional Parceiro pela reserva do horário e a parcela correspondente aos serviços da Larsana.
13.7.2. O repasse ao Profissional Parceiro permanecerá sujeito aos procedimentos de documentação, conferência e repasse previstos na Cláusula 12.
13.7.3. Cancelamentos tardios ou ausências sucessivas não aumentarão automaticamente o percentual de cobrança.
13.8. Exceções e cancelamento pelo profissional
13.8.1. Situações excepcionais devidamente justificadas, incluindo internação, urgência, emergência médica ou acontecimentos imprevisíveis relevantes, poderão ser analisadas pela Larsana, podendo ser afastadas a cobrança e a perda da sessão.
13.8.2. Quando o cancelamento decorrer de indisponibilidade do Profissional Parceiro, a Larsana buscará reagendamento ou SUB, sem cobrança ou perda da sessão pelo Paciente.
14. PAUSA E ENCERRAMENTO ANTECIPADO DO TRATAMENTO
14.1. Pausa justificada
14.1.1. O Paciente ou Responsável poderá solicitar a pausa temporária do tratamento quando houver circunstância que impeça temporariamente sua continuidade, incluindo internação, intercorrência clínica, procedimento médico ou outra situação relevante devidamente comunicada à Larsana Care.
14.1.2. A solicitação deverá ser realizada preferencialmente pela Plataforma ou, quando necessário, por outro Canal Oficial disponibilizado pela Larsana.
14.1.3. A pausa devidamente justificada não será considerada cancelamento do tratamento e, por si só, não estará sujeita à multa de encerramento prevista nesta cláusula.
14.1.4. Durante a pausa, os atendimentos ainda não realizados permanecerão vinculados ao ciclo, observadas as condições de retomada, disponibilidade dos profissionais e eventual necessidade de atualização técnica decorrente do período de interrupção.
14.1.5. Caso a condição clínica ou outra circunstância torne inviável a retomada do tratamento, a Larsana realizará a apuração dos atendimentos efetivamente realizados, das sessões eventualmente consumidas nos termos da Cláusula 13 e dos valores remanescentes.
14.2. Encerramento por decisão do Paciente
14.2.1. O Paciente ou Responsável poderá solicitar o encerramento do tratamento antes da conclusão do ciclo contratado.
14.2.2. Quando o encerramento decorrer exclusivamente da decisão do Paciente ou Responsável, sem falha atribuível à Larsana Care ou ao Profissional Parceiro e sem situação excepcional devidamente justificada, poderão ser devidos os valores correspondentes aos atendimentos efetivamente realizados, os valores decorrentes de cancelamentos tardios ou ausências já constituídos nos termos da Cláusula 13 e multa de encerramento antecipado equivalente a 20% (vinte por cento) sobre o valor correspondente aos atendimentos ainda não realizados e não consumidos do ciclo.
14.2.3. A multa incidirá exclusivamente sobre o saldo remanescente não executado do ciclo, não sendo aplicada sobre atendimentos já realizados, avaliação já prestada, sessões já consumidas por cancelamento tardio ou ausência ou valores anteriormente cobrados por fatos já ocorridos.
14.2.4. A multa de encerramento antecipado não será cumulada com outra penalidade de mesma natureza sobre o mesmo fato.
14.3. Distinção entre cancelamento de sessão e cancelamento do tratamento
14.3.1. O cancelamento, reagendamento tardio ou ausência em atendimento individual será regido exclusivamente pela Cláusula 13, inclusive quanto à cobrança de 50% e ao consumo da respectiva sessão.
14.3.2. A multa prevista nesta Cláusula 14 será aplicável somente quando houver encerramento antecipado do tratamento e do ciclo por decisão do Paciente ou Responsável.
14.3.3. A simples ocorrência de um cancelamento tardio ou ausência não será, por si só, considerada cancelamento do tratamento.
14.3.4. Os valores já apurados em razão de cancelamentos tardios ou ausências não integrarão a base de cálculo da multa de encerramento antecipado.
14.4. Apuração financeira do encerramento
14.4.1. No encerramento antecipado, a Larsana Care realizará apuração do ciclo considerando atendimentos efetivamente realizados, atendimentos consumidos nos termos da Cláusula 13, valores já pagos, valores ainda devidos, saldo correspondente aos atendimentos não executados, multa de encerramento quando aplicável e créditos ou reembolsos existentes.
14.4.2. A multa de 20% será calculada somente após a identificação do saldo referente aos atendimentos ainda não realizados e não consumidos.
14.4.3. Caso o ciclo tenha sido pago antecipadamente e, após a apuração, exista saldo em favor do Paciente, o valor remanescente poderá, a critério do Paciente ou Responsável, ser restituído por meio de reembolso ou permanecer como crédito na Plataforma Larsana Care para utilização em eventual ciclo posterior.
14.4.4. A manutenção de valor como crédito não implica renovação automática do tratamento.
14.4.5. Quando o ciclo ainda não tiver sido integralmente pago, a apuração considerará apenas os valores efetivamente devidos pelo Paciente, não havendo reembolso de quantia que não tenha sido desembolsada.
14.5. Hipóteses de não aplicação da multa
14.5.1. A multa de encerramento antecipado não será aplicada quando o encerramento decorrer de alta ou determinação técnica de encerramento pelo Profissional Parceiro; contraindicação clínica à continuidade; internação, agravamento da condição de saúde ou outra circunstância relevante que torne a continuidade inviável; falha atribuível à Larsana Care que inviabilize a continuidade adequada; indisponibilidade prolongada de profissional compatível sem possibilidade razoável de substituição; exercício de direito assegurado pela legislação aplicável; ou outra situação excepcional analisada e reconhecida pela Larsana Care.
14.6. Transparência no encerramento
14.6.1. Sempre que tecnicamente possível, antes da confirmação do encerramento antecipado, a Plataforma apresentará ao Paciente ou Responsável a apuração estimada, incluindo quantidade de atendimentos realizados, consumidos e restantes, saldo não executado, multa quando aplicável, eventual valor a pagar, eventual valor a reembolsar e eventual crédito disponível.
14.6.2. A confirmação do encerramento e sua respectiva apuração financeira ficarão registradas na Plataforma ou nos sistemas administrativos da Larsana Care.
15. SUBSTITUIÇÃO DO PROFISSIONAL
15.1. A Larsana poderá disponibilizar substituição temporária quando o PP Responsável estiver indisponível para determinado atendimento.
15.2. O SUB realizará o atendimento para o qual tenha sido disponibilizado, não assumindo automaticamente a continuidade do Paciente.
15.3. Encerrada a necessidade de substituição, o atendimento retornará ao PP Responsável quando este estiver novamente disponível.
15.4. A Larsana buscará disponibilizar profissional com categoria técnica e habilitação compatíveis.
15.5. O atendimento efetivamente realizado pelo SUB integrará normalmente a contagem do ciclo.
15.6. A substituição, por si só, não implicará cobrança adicional ao Paciente.
16. CONTINUIDADE DO TRATAMENTO
16.1. A continuidade será acompanhada conforme evolução e necessidade do Paciente.
16.2. Novo ciclo dependerá de nova contratação ou confirmação pelo Usuário.
16.3. Não haverá renovação automática, salvo se futuramente for disponibilizada modalidade específica e expressamente aceita pelo Usuário.
16.4. O Profissional Parceiro poderá recomendar continuidade, alteração de frequência ou encerramento conforme sua avaliação técnica.
17. ALTA E ENCERRAMENTO
17.1. O atendimento poderá ser encerrado por conclusão do ciclo, alta profissional, solicitação do Paciente ou Responsável, impossibilidade de continuidade ou demais hipóteses previstas nestes Termos.
17.2. A alta relacionada ao tratamento será definida pelo profissional responsável conforme critérios técnicos.
17.3. O encerramento administrativo não substitui eventual alta técnica quando aplicável.
18. RESPONSABILIDADES DA LARSANA
18.1. Compete à Larsana, dentro de sua esfera de atuação, disponibilizar e administrar a Plataforma; organizar a intermediação; apresentar condições comerciais; administrar procedimentos operacionais; disponibilizar suporte; administrar os fluxos financeiros sob sua responsabilidade; gerir operacionalmente a jornada; tratar dados pessoais conforme legislação aplicável; e estabelecer requisitos para os Profissionais Parceiros.
18.2. A Larsana não garante disponibilidade ininterrupta da Plataforma.
18.3. A Larsana não garante resultado clínico específico.
18.4. No âmbito de sua atuação como intermediadora, caberá à Larsana Care cumprir as obrigações relacionadas à operação da Plataforma, intermediação dos serviços, organização dos processos sob sua responsabilidade, segurança dos recursos tecnológicos sob seu controle, tratamento de dados pessoais conforme aplicável e demais obrigações legais e contratuais que tenha expressamente assumido.
18.4.1. A Larsana Care poderá adotar critérios próprios de seleção, cadastro, habilitação interna, permanência, qualidade e segurança para os integrantes de sua rede, inclusive critérios adicionais aos requisitos mínimos legalmente exigidos para o exercício profissional.
18.5.2. A existência desses critérios e mecanismos não transfere à Larsana Care a autoria ou responsabilidade técnica pelos atos assistenciais praticados pelo Profissional Parceiro, nem caracteriza supervisão clínica direta de cada atendimento.
19. RESPONSABILIDADES DO PROFISSIONAL PARCEIRO
19.1. O Profissional Parceiro é responsável pelos atos técnicos próprios de sua atividade.
19.2. Compete ao profissional realizar avaliações quando aplicáveis, definir conduta dentro de sua competência, executar procedimentos, registrar avaliações e evoluções, manter sigilo, observar normas profissionais, comunicar intercorrências, atuar dentro de sua habilitação e cumprir obrigações documentais e fiscais.
19.3. O Profissional Parceiro é responsável tecnicamente pelos atos profissionais que praticar, pelas informações e registros assistenciais que produzir e pelas decisões técnicas adotadas no exercício de sua profissão.
19.3.1. Compete ao Profissional Parceiro manter válidos e regulares os registros, inscrições, habilitações, certificações e demais requisitos necessários ao exercício das atividades que se propuser a realizar pela Larsana Care.
19.3.2. O Profissional Parceiro deverá informar à Larsana Care qualquer suspensão, restrição, impedimento, perda de habilitação ou outra circunstância que possa afetar sua regularidade ou capacidade para executar os serviços disponibilizados por intermédio da Plataforma.
19.3.3. O Profissional Parceiro não poderá aceitar ou executar atendimento, técnica ou procedimento que ultrapasse sua competência, formação, habilitação ou condições de segurança.

20. RESPONSABILIDADES DO PACIENTE E DO USUÁRIO
20.1. Compete ao Paciente ou Usuário fornecer informações verdadeiras, manter dados atualizados, informar alterações relevantes, respeitar horários, utilizar adequadamente a Plataforma e os Canais Oficiais, realizar os pagamentos, comunicar cancelamentos, disponibilizar ambiente seguro, tratar profissionais e colaboradores com respeito e não utilizar a Plataforma para finalidade ilícita.
21. USO DA PLATAFORMA
21.1. A Plataforma deverá ser utilizada exclusivamente para suas finalidades legítimas.
21.2. É proibido compartilhar indevidamente contas, acessar dados de terceiros, interferir no funcionamento do sistema, inserir códigos maliciosos ou comprometer sua segurança.
21.3. A Larsana poderá realizar atualizações, alterações e melhorias.
22. COMUNICAÇÕES
22.1. A Plataforma constitui o principal ambiente operacional de comunicação.
22.2. A existência da Plataforma não impede a utilização dos demais Canais Oficiais, especialmente quando o Paciente ou Responsável possuir dificuldade de utilização do ambiente digital.
22.3. O Usuário deverá manter seus dados de contato atualizados.
22.4. A Larsana poderá enviar comunicações relacionadas à agenda, pagamentos, documentos, segurança, suporte e funcionamento dos serviços.
22.5. Comunicações operacionais poderão ocorrer independentemente de autorização para publicidade.
23. DADOS PESSOAIS, INFORMAÇÕES DE SAÚDE E PRONTUÁRIO ELETRÔNICO
23.1. Tratamento de dados
23.1.1. A Larsana realizará o tratamento de dados pessoais conforme a legislação aplicável, especialmente a Lei nº 13.709/2018 - Lei Geral de Proteção de Dados Pessoais (LGPD) - e sua Política de Privacidade.
23.1.2. Poderão ser tratados dados necessários para identificação, autenticação, cadastro, contratação, agenda, pagamentos, acompanhamento, registros assistenciais, segurança, suporte, cumprimento de obrigações legais e exercício regular de direitos.
23.1.3. Dados referentes à saúde possuem natureza de dados pessoais sensíveis e receberão tratamento compatível com sua natureza.
23.2. Acesso e compartilhamento
23.2.1. O acesso às informações será limitado aos agentes que necessitem delas para execução de suas atribuições, observados os níveis de acesso estabelecidos.
23.2.2. Poderá haver compartilhamento com Profissionais Parceiros e fornecedores necessários à operação, observadas as bases legais e medidas de segurança aplicáveis.
23.3. Prontuário e registros assistenciais eletrônicos
23.3.1. Avaliações, evoluções e demais registros assistenciais poderão ser produzidos e armazenados eletronicamente na Plataforma.
23.3.2. Cada Profissional Parceiro utilizará credenciais individuais e mecanismos próprios de autenticação, sendo vedado o compartilhamento de credenciais para realização de registros profissionais.
23.3.3. Cada registro assistencial permanecerá individualmente vinculado ao profissional responsável por sua elaboração.
23.3.4. Os registros poderão conter identificação do Paciente; identificação do profissional; nome; CPF, quando aplicável; número de inscrição no Conselho Profissional; data e horário; atendimento relacionado; conteúdo assistencial; identificação da conta responsável; e demais registros técnicos necessários à rastreabilidade.
23.4. Integridade, versionamento e auditoria
23.4.1. A Plataforma adotará mecanismos destinados a preservar autenticidade, integridade, confidencialidade, disponibilidade e rastreabilidade dos registros assistenciais.
23.4.2. A finalização do registro preservará a identificação do profissional responsável, data e horário correspondentes.
23.4.3. A Plataforma manterá, conforme aplicável, trilha de auditoria e histórico de eventos relacionados aos registros.
23.4.4. Alterações posteriores em registros finalizados, quando admitidas, não deverão ocorrer de maneira silenciosa ou eliminar a rastreabilidade do conteúdo anterior.
23.4.5. Correções, complementações ou retificações poderão preservar o registro anterior e identificar autor, data, horário e demais elementos necessários à auditoria.
23.5. Responsabilidade pelos registros
23.5.1. Cada Profissional Parceiro é responsável pelo conteúdo técnico dos registros que produzir.
23.5.2. É vedada a utilização das credenciais de outro profissional ou o compartilhamento das próprias credenciais para produção de registros em seu nome.
23.5.3. A Larsana é responsável pelos mecanismos tecnológicos e operacionais sob seu controle destinados à identificação, armazenamento, segurança e rastreabilidade, sem assumir autoria do conteúdo clínico produzido pelo profissional.
23.6. Assinaturas e documentos específicos
23.6.1. A forma de identificação, autenticação ou assinatura utilizada observará a natureza do documento e os requisitos legais e regulamentares aplicáveis.
23.6.2. Quando determinado documento exigir assinatura eletrônica específica, assinatura qualificada, certificado digital ICP-Brasil ou outro mecanismo legalmente estabelecido, será observada a exigência correspondente.
23.6.3. A existência de requisitos específicos para determinados documentos não altera os mecanismos de identificação individual, autenticação, integridade e rastreabilidade adotados para os registros assistenciais internos, observada a legislação aplicável.
23.7. Guarda e segurança
23.7.1. Dados e registros serão conservados pelos períodos necessários ao cumprimento de suas finalidades e dos prazos legais, regulatórios e profissionais aplicáveis.
23.7.2. A Larsana adotará medidas técnicas e administrativas destinadas à proteção dos dados contra acesso não autorizado, perda, destruição, alteração, comunicação ou tratamento inadequado.
23.7.3. Bases legais, direitos dos titulares, retenção, compartilhamentos e demais condições serão detalhados na Política de Privacidade da Larsana Care.
24. PROPRIEDADE INTELECTUAL
24.1. A Plataforma, marca, identidade visual, interfaces, sistemas, conteúdos e demais elementos protegidos pertencem à Larsana ou aos respectivos titulares.
24.2. O acesso à Plataforma não concede direitos de propriedade sobre esses elementos.
25. CONDUTAS PROIBIDAS
25.1. É proibido fornecer informações falsas, utilizar identidade de terceiros, fraudar pagamentos, acessar indevidamente informações, ameaçar ou assediar profissionais, manipular registros ou utilizar a Plataforma para finalidade ilícita.
25.2. Violações poderão resultar em suspensão ou encerramento da conta, sem prejuízo das medidas legalmente cabíveis.
26. SUSPENSÃO E ENCERRAMENTO DA CONTA
26.1. A conta poderá ser suspensa ou encerrada em caso de fraude, violação destes Termos, risco à segurança, inadimplência, informações falsas, comportamento abusivo ou determinação legal.
26.2. Sempre que possível e adequado, será oportunizada regularização.
26.3. O encerramento não elimina obrigações anteriormente constituídas.
27. DELIMITAÇÃO DE RESPONSABILIDADES
27.1. A Larsana responderá pelas obrigações que efetivamente assumir e pelas responsabilidades que lhe sejam legalmente atribuídas.
27.2. A Larsana não garante resultado clínico específico.
27.3. A Larsana não substitui a avaliação e decisão técnica do Profissional Parceiro.
27.4. Decisões exclusivamente técnicas tomadas pelo profissional dentro de sua autonomia permanecem em sua esfera de responsabilidade, sem prejuízo das responsabilidades decorrentes dos atos próprios da Larsana.
27.5. Nenhuma disposição destes Termos será interpretada como exclusão de responsabilidade que não possa ser legalmente afastada.
27.6. A atuação da Larsana Care como intermediadora não implica assunção da responsabilidade técnica pelos atos profissionais praticados de forma autônoma pelos Profissionais Parceiros.
27.6.1. Cada Profissional Parceiro será responsável pelos atos técnicos e assistenciais que efetivamente realizar, incluindo avaliações, diagnósticos próprios de sua profissão, prescrições, procedimentos, orientações, decisões clínicas e respectivos registros, dentro dos limites estabelecidos pela legislação e pelas normas de sua categoria profissional.
27.6.2. A Larsana Care não garante resultado clínico específico e não substitui a avaliação técnica individual realizada pelo profissional responsável pelo atendimento.
27.6.3. A delimitação prevista nesta Cláusula não exclui nem restringe responsabilidades que sejam legalmente atribuíveis à Larsana Care em razão de atos ou omissões próprios, falhas relacionadas às obrigações que tenha assumido, funcionamento da Plataforma ou outras hipóteses em que a responsabilidade não possa ser afastada por disposição contratual.

28. ALTERAÇÕES DOS TERMOS
28.1. Estes Termos poderão ser atualizados em razão de alterações legais, regulatórias, tecnológicas, operacionais ou comerciais.
28.2. Alterações relevantes poderão ser comunicadas pelos Canais Oficiais.
28.3. Quando necessário, poderá ser solicitado novo aceite.
29. VIGÊNCIA
29.1. Estes Termos entram em vigor na data do aceite eletrônico.
29.2. Permanecerão aplicáveis enquanto houver utilização da Plataforma ou obrigações decorrentes da relação estabelecida.
30. LEGISLAÇÃO APLICÁVEL E FORO
30.1. Estes Termos serão regidos pelas leis da República Federativa do Brasil.
30.2. As partes buscarão solução consensual para eventuais conflitos.
30.3. Não sendo possível a solução consensual, será observado o foro legalmente competente, especialmente as regras aplicáveis às relações de consumo.
31. ACEITE ELETRÔNICO
31.1. O Usuário declara ter tido acesso a estes Termos antes de concluir seu aceite.
31.2. O aceite realizado eletronicamente constitui manifestação de concordância com o conteúdo apresentado.
31.3. O registro do aceite poderá conter identificação da conta, data, horário, versão aceita e demais registros técnicos necessários à comprovação da operação.
31.4. Determinados serviços poderão depender da aceitação de documentos adicionais, incluindo Política de Privacidade, condições específicas do ciclo e termos de consentimento.
31.5. O aceite destes Termos não substitui eventual consentimento informado exigível para procedimento ou ato profissional específico.

DISPOSIÇÕES FINAIS
Ao utilizar a Plataforma Larsana Care, o Usuário declara compreender que a Larsana atua na intermediação, organização e gestão da jornada de contratação dos serviços, enquanto os atos técnicos próprios das profissões de saúde são realizados pelos respectivos Profissionais Parceiros, dentro de suas competências e responsabilidades profissionais.

Razão social: DELUMA Serviços de Saúde e Educação LTDA
CNPJ: 65.974.822/0001-19, com sede social na Alameda Terracota, no. 185,
Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul-SP, 09531-190
Canal de atendimento: contato@larsanacare.com.br
Versão V1.08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('LGPD', '1.0-2026-08', 'Política de Privacidade — Pacientes', $legal_body$POLÍTICA DE PRIVACIDADE
PACIENTES, FAMILIARES E RESPONSÁVEIS — LARSANA CARE

47626251175

A presente Política de Privacidade explica como a DELUMA Serviços de Saúde e Educação LTDA, responsável pela marca Larsana Care, realiza o tratamento de dados pessoais de Pacientes, Familiares, Responsáveis, Representantes Legais, Pagadores e demais pessoas relacionadas à contratação, organização e acompanhamento dos serviços disponibilizados por meio da Plataforma.
A proteção das informações pessoais, especialmente dos dados relacionados à saúde, constitui parte essencial do funcionamento da Larsana Care.
Esta Política deve ser lida em conjunto com os Termos de Uso da Plataforma Larsana Care, o Aviso Específico de Tratamento de Dados Pessoais e Dados de Saúde, os Termos de Consentimento aplicáveis, os termos relacionados a Familiares e Responsáveis e os demais documentos aplicáveis ao serviço efetivamente contratado.
1. QUEM É A LARSANA CARE
1.1. A Larsana Care é uma plataforma disponibilizada pela DELUMA Serviços de Saúde e Educação LTDA, destinada à intermediação, organização e gestão da contratação de serviços de saúde, especialmente atendimentos domiciliares realizados por Profissionais Parceiros.
1.2. Por meio de sua estrutura tecnológica e operacional, a Larsana Care poderá disponibilizar funcionalidades relacionadas, entre outras atividades, a:
a) cadastro de Pacientes e usuários;
b) organização de solicitações de atendimento;
c) disponibilização e vinculação de Profissionais Parceiros;
d) agenda e confirmação de atendimentos;
e) ciclos de atendimento;
f) pagamentos e documentos financeiros;
g) registros assistenciais;
h) comunicação operacional;
i) substituição temporária de profissionais;
j) suporte e acompanhamento da operação; e
k) armazenamento de documentos relacionados aos serviços.
1.3. A Larsana Care não substitui a atuação técnica dos profissionais de saúde e não assume a autoria dos atos clínicos ou assistenciais realizados pelos Profissionais Parceiros.

2. A QUEM ESTA POLÍTICA SE APLICA
2.1. Esta Política aplica-se aos dados pessoais tratados pela Larsana Care relacionados a:
a) Pacientes que solicitem, recebam ou pretendam receber serviços intermediados pela Plataforma;
b) Familiares ou Responsáveis que solicitem, contratem, organizem ou acompanhem atendimento destinado a outra pessoa;
c) Representantes ou Assistentes Legais de Pacientes;
d) pessoas responsáveis pelo pagamento dos serviços; e
e) outras pessoas cujos dados sejam legitimamente fornecidos no contexto da organização ou prestação dos serviços.
2.2. Os tratamentos de dados relacionados exclusivamente aos Profissionais Parceiros, seus representantes ou demais usuários profissionais serão disciplinados em Política ou instrumentos específicos destinados a esses perfis.

3. CONCEITOS IMPORTANTES
Para facilitar a compreensão desta Política:
Dado pessoal: informação relacionada a pessoa natural identificada ou identificável.
Dado pessoal sensível: dado que recebe proteção especial pela legislação, incluindo informações referentes à saúde e, quando vinculados a uma pessoa natural, dados genéticos e biométricos.
Dado de saúde: informação relacionada à condição de saúde, histórico, avaliação, tratamento, evolução, funcionalidade ou demais aspectos assistenciais do Paciente.
Titular: pessoa natural a quem os dados pessoais se referem.
Tratamento: qualquer operação realizada com dados pessoais, como coleta, acesso, utilização, armazenamento, compartilhamento, alteração, conservação, anonimização ou eliminação.
Controlador: agente responsável pelas decisões referentes a determinada operação de tratamento de dados pessoais.
Operador: agente que realiza tratamento de dados pessoais em nome de um Controlador.
Paciente: pessoa que efetivamente recebe ou pretende receber o serviço de saúde.
Familiar/Responsável: pessoa cadastrada que solicita, contrata, organiza ou acompanha serviços destinados ao Paciente, sem que essa condição implique automaticamente representação legal.
Responsável Legal: pessoa legitimada, conforme a legislação aplicável, para representar ou assistir o Paciente em determinados atos.
Profissional Parceiro: profissional independente vinculado à rede Larsana Care que realiza o atendimento de saúde.

4. PAPÉIS DA LARSANA CARE E DOS PROFISSIONAIS PARCEIROS
4.1. A Larsana Care toma decisões próprias relacionadas ao funcionamento de sua Plataforma e às operações necessárias à intermediação, organização e gestão dos serviços.
4.2. Nessas atividades, a Larsana poderá atuar como Controladora dos dados pessoais utilizados, entre outras finalidades, para:
a) cadastro e autenticação;
b) contratação;
c) organização da demanda;
d) agenda;
e) pagamentos;
f) segurança;
g) suporte;
h) prevenção de fraudes;
i) cumprimento de obrigações legais e regulatórias; e
j) exercício regular de direitos.
4.3. Os Profissionais Parceiros possuem responsabilidades próprias relacionadas à assistência prestada e às informações e registros produzidos no exercício de sua profissão.
4.4. A posição da Larsana Care ou do Profissional Parceiro em determinada operação de tratamento dependerá da atividade efetivamente realizada e das decisões tomadas em relação aos dados, não apenas da denominação utilizada nos contratos.
4.5. A responsabilidade técnica pelo conteúdo das avaliações, evoluções, condutas, orientações e demais registros profissionais caberá ao Profissional Parceiro que os produzir, sem prejuízo das responsabilidades próprias da Larsana Care relativas à Plataforma, segurança, armazenamento, controle de acesso e demais atividades sob seu controle.

5. QUAIS DADOS DO PACIENTE PODERÃO SER TRATADOS
5.1. Conforme o serviço utilizado e a etapa do atendimento, a Larsana Care poderá tratar dados necessários à identificação, contratação, organização e prestação dos serviços.
5.2. Entre os dados cadastrais poderão estar incluídos, conforme aplicável:
a) nome completo;
b) CPF;
c) data de nascimento;
d) sexo, quando necessário à assistência ou ao cadastro;
e) telefone;
f) e-mail;
g) endereço residencial ou de atendimento;
h) cidade e região de atendimento;
i) dados relacionados à criação e autenticação da conta; e
j) demais informações necessárias à identificação e utilização das funcionalidades da Plataforma.

6. DADOS RELACIONADOS AO ATENDIMENTO
6.1. A Larsana Care poderá tratar informações necessárias à organização e acompanhamento dos serviços, incluindo:
a) endereço do atendimento;
b) serviço solicitado;
c) categoria profissional;
d) Profissional Parceiro vinculado;
e) datas e horários;
f) frequência dos atendimentos;
g) ciclos contratados;
h) atendimentos realizados;
i) cancelamentos;
j) reagendamentos;
k) ausências;
l) pausas;
m) substituições temporárias de profissionais;
n) comunicações e ocorrências operacionais; e
o) informações necessárias à continuidade e encerramento do serviço.
6.2. Comunicações realizadas por WhatsApp, telefone ou outros Canais Oficiais poderão ser registradas administrativamente quando necessárias à organização, comprovação e histórico da operação.

7. DADOS DE SAÚDE
7.1. Durante a avaliação e acompanhamento, poderão ser tratados dados pessoais sensíveis relacionados à saúde do Paciente quando necessários à assistência.
7.2. Entre essas informações poderão estar incluídos:
a) condições de saúde;
b) histórico clínico e funcional;
c) diagnósticos previamente informados;
d) sintomas e queixas;
e) doenças preexistentes;
f) cirurgias;
g) internações;
h) quedas ou intercorrências;
i) medicamentos em uso;
j) exames;
k) laudos;
l) relatórios;
m) prescrições;
n) documentos fornecidos pelo Paciente ou Responsável;
o) informações obtidas durante avaliações profissionais;
p) limitações e capacidades funcionais;
q) resposta aos atendimentos;
r) evolução do Paciente;
s) condutas e orientações assistenciais; e
t) demais informações necessárias à segurança e continuidade do cuidado.
7.3. A coleta de dados deverá observar critérios de necessidade e pertinência, evitando-se a utilização de informações excessivas ou sem relação legítima com o atendimento, a operação ou obrigação legal correspondente.

8. PRONTUÁRIO E REGISTROS ASSISTENCIAIS ELETRÔNICOS
8.1. Avaliações, evoluções e demais registros relacionados à assistência poderão ser produzidos e armazenados eletronicamente por meio da Plataforma Larsana Care.
8.2. Cada registro deverá permanecer vinculado ao Paciente e ao Profissional Parceiro responsável por sua elaboração.
8.3. Os registros poderão conter, conforme aplicável:
a) identificação do Paciente;
b) identificação do profissional;
c) número de inscrição perante o Conselho Profissional;
d) data e horário;
e) atendimento correspondente;
f) conteúdo assistencial;
g) identificação da conta responsável pelo registro; e
h) demais elementos técnicos necessários à rastreabilidade.
8.4. A Plataforma poderá utilizar mecanismos destinados à preservação da autenticidade, integridade, confidencialidade, disponibilidade e rastreabilidade dos registros assistenciais.
8.5. Poderão ser mantidos registros de auditoria e histórico de eventos relacionados aos documentos assistenciais.
8.6. Correções, complementações ou retificações de registros finalizados, quando admitidas, deverão preservar a rastreabilidade do conteúdo anterior e identificar, conforme aplicável, autor, data e horário da alteração.
8.7. Cada Profissional Parceiro é responsável pelo conteúdo técnico dos registros que produzir.

9. DADOS DE FAMILIARES E RESPONSÁVEIS
9.1. Quando o atendimento for solicitado, organizado, acompanhado ou pago por terceiro, poderão ser tratados dados dessa pessoa.
9.2. Entre os dados poderão estar incluídos:
a) nome completo;
b) CPF;
c) telefone;
d) e-mail;
e) vínculo ou relação informada com o Paciente;
f) informações necessárias à administração do atendimento;
g) dados relacionados ao pagamento, quando aplicável; e
h) registros de comunicações e manifestações realizadas perante a Larsana Care.
9.3. O cadastro como Familiar/Responsável não significa, por si só, que o Paciente seja juridicamente incapaz.
9.4. A condição de Familiar/Responsável também não confere automaticamente poderes irrestritos de representação ou acesso integral às informações clínicas do Paciente.

10. REPRESENTANTES LEGAIS
10.1. Quando o Paciente for menor de idade ou estiver sujeito, para determinado ato, a representação ou assistência legal, poderão ser tratados dados necessários à identificação e validação do respectivo Responsável Legal.
10.2. A Larsana Care poderá solicitar documentos ou informações adicionais quando necessários para confirmar:
a) a identidade do representante;
b) seu vínculo com o Paciente;
c) a existência de poder familiar, tutela, curatela ou outra condição jurídica aplicável; e
d) os limites da representação ou assistência.
10.3. A existência de doença, deficiência, idade avançada, limitação física, condição neurológica, dificuldade de comunicação ou necessidade de auxílio de terceiros não será considerada, isoladamente, comprovação de incapacidade jurídica.

11. DADOS DE CRIANÇAS E ADOLESCENTES
11.1. A Larsana Care poderá intermediar serviços destinados a crianças e adolescentes.
11.2. Nessas situações, o tratamento de dados deverá observar especialmente:
a) o melhor interesse da criança ou adolescente;
b) a necessidade das informações;
c) segurança;
d) transparência;
e) participação compatível com idade e grau de compreensão; e
f) atuação ou autorização dos pais ou responsáveis quando juridicamente exigida.
11.3. A Larsana Care não pretende utilizar dados de crianças e adolescentes para publicidade comportamental ou finalidade incompatível com a assistência.

12. COMO OS DADOS PODERÃO SER OBTIDOS
12.1. Os dados tratados pela Larsana Care poderão ser obtidos:
a) diretamente do Paciente;
b) por meio do cadastro realizado na Plataforma;
c) de Familiar/Responsável legitimamente relacionado ao atendimento;
d) de Responsável Legal;
e) do Profissional Parceiro durante avaliação, atendimento ou acompanhamento;
f) por meio de documentos enviados pelo Paciente ou Responsável;
g) por comunicações realizadas pelos Canais Oficiais;
h) automaticamente durante a utilização da Plataforma;
i) por prestadores responsáveis por pagamentos ou outras integrações necessárias; e
j) por outros meios legítimos e compatíveis com as finalidades desta Política.

13. PARA QUE UTILIZAMOS OS DADOS
13.1. Os dados pessoais poderão ser tratados para:
a) criar, autenticar e administrar contas;
b) identificar Pacientes, Familiares e Responsáveis;
c) receber e organizar solicitações de atendimento;
d) classificar e organizar demandas;
e) disponibilizar Profissionais Parceiros compatíveis com o serviço;
f) organizar avaliações, atendimentos, ciclos e agendas;
g) realizar confirmações, reagendamentos, cancelamentos e substituições;
h) apoiar a realização e continuidade dos atendimentos;
i) manter registros assistenciais;
j) permitir comunicação entre as partes envolvidas;
k) processar pagamentos;
l) realizar conciliação financeira;
m) emitir, receber ou conferir documentos fiscais e financeiros;
n) disponibilizar documentos relacionados aos serviços;
o) prestar suporte;
p) manter e aprimorar o funcionamento e a segurança da Plataforma;
q) prevenir fraudes e acessos indevidos;
r) investigar falhas ou incidentes;
s) manter registros de auditoria e rastreabilidade;
t) cumprir obrigações legais, regulatórias, fiscais, profissionais ou judiciais;
u) exercer ou defender direitos; e
v) atender outras finalidades legítimas e compatíveis devidamente informadas ao titular.

14. BASES LEGAIS
14.1. A Larsana Care não utiliza o consentimento como fundamento genérico para todas as operações envolvendo dados pessoais.
14.2. A base legal aplicável dependerá da finalidade do tratamento, da natureza do dado e da relação existente com o titular.
14.3. Para dados pessoais que não sejam sensíveis, poderão ser utilizadas, conforme aplicável, as hipóteses previstas na legislação, incluindo:
a) execução de contrato ou procedimentos preliminares relacionados ao contrato;
b) cumprimento de obrigação legal ou regulatória;
c) exercício regular de direitos;
d) proteção da vida ou da incolumidade física;
e) legítimo interesse, dentro dos limites legalmente permitidos;
f) consentimento, quando adequado; e
g) demais hipóteses legalmente previstas.
14.4. Para dados pessoais sensíveis, especialmente informações relacionadas à saúde, serão utilizadas as hipóteses específicas previstas na legislação aplicável, conforme a finalidade concreta.
14.5. Entre essas hipóteses poderão estar:
a) cumprimento de obrigação legal ou regulatória;
b) exercício regular de direitos;
c) proteção da vida ou da incolumidade física;
d) tutela da saúde, quando juridicamente aplicável;
e) prevenção à fraude e segurança do titular em processos de identificação e autenticação; e
f) consentimento específico e destacado, quando juridicamente necessário.
14.6. O legítimo interesse não será utilizado como fundamento autônomo para tratamento de dados pessoais sensíveis quando a legislação não o autorizar.

15. CONSENTIMENTO QUANDO ESPECIFICAMENTE NECESSÁRIO
15.1. Quando determinado tratamento depender juridicamente do consentimento do titular, a finalidade correspondente deverá ser apresentada de maneira clara e destacada.
15.2. O consentimento não será presumido simplesmente em razão da contratação dos serviços ou do aceite desta Política.
15.3. Quando aplicável, a Larsana Care poderá registrar eletronicamente:
a) a identidade da pessoa que realizou a manifestação;
b) a finalidade apresentada;
c) a versão do documento;
d) data e horário; e
e) demais elementos técnicos necessários à comprovação e rastreabilidade.
15.4. O consentimento poderá ser revogado nas hipóteses e condições previstas na legislação, sem prejuízo dos tratamentos realizados anteriormente de forma legítima e das demais bases legais que eventualmente permaneçam aplicáveis.

16. COMPARTILHAMENTO COM PROFISSIONAIS PARCEIROS
16.1. A Larsana Care poderá disponibilizar aos Profissionais Parceiros informações necessárias à análise da demanda, organização e realização do atendimento.
16.2. Antes da vinculação definitiva, o acesso deverá ser limitado às informações necessárias à análise legítima da oportunidade de atendimento.
16.3. Após a vinculação do Profissional Parceiro ao Paciente, poderão ser disponibilizadas informações adicionais necessárias à avaliação, execução e continuidade da assistência.
16.4. O Profissional Parceiro deverá acessar somente informações relacionadas aos Pacientes e demandas legitimamente vinculados à sua atuação.
16.5. A participação do profissional no atendimento não o autoriza a utilizar os dados do Paciente para:
a) prospecção particular não autorizada;
b) publicidade própria incompatível com a relação estabelecida;
c) formação de banco de dados para finalidade comercial estranha ao atendimento;
d) venda de informações;
e) compartilhamento indevido; ou
f) qualquer finalidade incompatível com a assistência, sigilo profissional ou legislação aplicável.
16.6. As obrigações de confidencialidade permanecem aplicáveis mesmo após o encerramento do atendimento ou da relação do profissional com a Larsana Care.

17. COMPARTILHAMENTO COM FAMILIARES E RESPONSÁVEIS
17.1. Determinadas informações poderão ser disponibilizadas ao Familiar ou Responsável quando necessárias à organização e acompanhamento do serviço.
17.2. Informações de saúde e registros assistenciais não serão disponibilizados irrestritamente apenas em razão de vínculo familiar, financeiro ou administrativo com o Paciente.
17.3. O compartilhamento de informações assistenciais deverá considerar, conforme aplicável:
a) a autonomia do Paciente;
b) a autorização concedida;
c) a finalidade do compartilhamento;
d) eventual representação legal;
e) os limites da autorização;
f) as normas de sigilo profissional; e
g) a legislação aplicável.
17.4. A Larsana Care poderá solicitar confirmação de identidade, autorização ou documentação comprobatória antes de fornecer informações protegidas.

18. ACESSO INTERNO ÀS INFORMAÇÕES
18.1. Pessoas autorizadas pela Larsana Care poderão acessar dados pessoais quando necessário às atividades sob sua responsabilidade.
18.2. Esses acessos poderão ocorrer, conforme a necessidade, para:
a) atendimento e suporte;
b) gestão operacional;
c) segurança;
d) auditoria;
e) análise de ocorrências;
f) cumprimento de obrigações legais;
g) exercício regular de direitos; e
h) outras atividades legitimamente relacionadas à operação.
18.3. O acesso deverá ser limitado às atribuições e necessidades correspondentes.

19. DADOS FINANCEIROS E DE PAGAMENTO
19.1. A Larsana Care poderá tratar dados necessários ao processamento e controle dos pagamentos relacionados aos serviços.
19.2. Esses dados poderão ser utilizados para:
a) cobrança;
b) identificação das transações;
c) conciliação;
d) divisão e destinação dos valores;
e) estornos e devoluções;
f) contestação de pagamentos;
g) prevenção de fraudes;
h) emissão e conferência de documentos fiscais;
i) cumprimento de obrigações contábeis e fiscais; e
j) exercício regular de direitos.
19.3. A Larsana Care buscará evitar o armazenamento direto de informações completas de instrumentos de pagamento quando o processamento puder ser realizado diretamente por prestador especializado.

20. PROCESSAMENTO DE PAGAMENTOS — ASAAS
20.1. Conforme a estrutura atualmente utilizada pela Plataforma, a Larsana Care poderá utilizar os serviços do Asaaspara processamento financeiro e funcionalidades relacionadas a cobranças, PIX, boletos, conciliação, divisão de pagamentos e outras operações financeiras.
20.2. Para essas finalidades, poderão ser compartilhados dados como:
a) nome;
b) CPF;
c) telefone;
d) e-mail;
e) valores;
f) identificadores relacionados à transação; e
g) demais informações necessárias ao processamento financeiro.
20.3. O prestador financeiro poderá realizar tratamentos próprios necessários ao cumprimento de suas obrigações legais, regulatórias, financeiras, de identificação e prevenção a fraudes.

21. DOCUMENTOS FISCAIS E COMPROVAÇÃO DOS SERVIÇOS
21.1. Poderão ser tratados dados necessários à emissão, recebimento, conferência e disponibilização de documentos fiscais e comprobatórios relacionados aos serviços.
21.2. Conforme a natureza do prestador e do serviço, poderão ser utilizados dados para emissão de Receita Saúde, Nota Fiscal de Serviços ou outro documento legalmente aplicável.
21.3. Quando necessário, poderão ser tratados dados do Paciente, do pagador, do Profissional Parceiro, valores, datas e informações relacionadas ao atendimento e ao pagamento.

22. DADOS DE USO, LOGS E SEGURANÇA
22.1. Durante a utilização da Plataforma, poderão ser gerados registros técnicos, incluindo, conforme aplicável:
a) data e horário de acesso;
b) endereço IP;
c) dispositivo utilizado;
d) sistema operacional;
e) versão do aplicativo;
f) identificadores de sessão;
g) eventos de autenticação;
h) ações realizadas;
i) histórico de alterações;
j) falhas e erros; e
k) outros elementos necessários à segurança e auditoria.
22.2. Esses registros poderão ser utilizados para autenticação, segurança, rastreabilidade, suporte, prevenção e investigação de fraudes, auditoria, manutenção da Plataforma, investigação de incidentes e exercício regular de direitos.

23. LOCALIZAÇÃO E ENDEREÇO
23.1. A Larsana Care poderá tratar informações geográficas quando necessárias à operação dos atendimentos domiciliares.
23.2. Essas informações poderão ser utilizadas para:
a) identificação da região de atendimento;
b) localização da demanda;
c) cálculo de distância entre Paciente e Profissional Parceiro;
d) organização logística; e
e) outras funcionalidades operacionais efetivamente implementadas.
23.3. Poderão ser utilizados serviços de geocodificação para conversão de endereços em informações geográficas.
23.4. Para essa finalidade, deverá ser limitado o compartilhamento às informações necessárias à localização, não devendo ser intencionalmente enviados prontuários, diagnósticos ou outros dados clínicos quando não necessários à funcionalidade.
23.5. Caso a Plataforma utilize localização do dispositivo, seu acesso observará as permissões concedidas pelo usuário e as funcionalidades efetivamente implementadas.
23.6. A Larsana Care não pretende utilizar a localização do dispositivo para monitoramento permanente da rotina pessoal do usuário quando essa finalidade não for necessária ao serviço disponibilizado.

24. FORNECEDORES E PRESTADORES DE SERVIÇOS
24.1. Para funcionamento da Plataforma, a Larsana Care poderá contratar terceiros responsáveis por atividades como:
a) infraestrutura tecnológica;
b) hospedagem;
c) banco de dados;
d) armazenamento;
e) autenticação;
f) processamento de pagamentos;
g) comunicação;
h) geocodificação;
i) segurança;
j) suporte; e
k) distribuição do aplicativo.
24.2. O compartilhamento deverá ser limitado aos dados necessários à finalidade desempenhada pelo fornecedor.
24.3. Sempre que aplicável, os fornecedores deverão estar sujeitos a obrigações relacionadas à confidencialidade, segurança e proteção de dados.
24.4. A contratação de fornecedor não significa autorização para utilização das informações para finalidades próprias incompatíveis com os serviços contratados pela Larsana Care.

25. INFRAESTRUTURA TECNOLÓGICA E ARMAZENAMENTO
25.1. Conforme a arquitetura tecnológica atualmente adotada, a Larsana Care utiliza infraestrutura de computação em nuvem para funcionamento da Plataforma.
25.2. A infraestrutura poderá ser utilizada para armazenamento e processamento de:
a) dados cadastrais;
b) dados clínicos;
c) registros assistenciais;
d) documentos;
e) informações operacionais;
f) dados financeiros;
g) evidências de aceite; e
h) logs e registros de segurança.
25.3. Os arquivos poderão possuir controles de acesso definidos conforme perfil, vínculo com o Paciente, função exercida, autorização e finalidade da informação.
25.4. Alterações relevantes nos fornecedores ou na arquitetura tecnológica poderão resultar em atualização desta Política.

26. SEGURANÇA DA INFORMAÇÃO
26.1. A Larsana Care adotará medidas técnicas e administrativas compatíveis com a natureza das informações tratadas e com os riscos associados à sua atividade.
26.2. Entre as medidas que poderão ser adotadas estão:
a) autenticação individual;
b) gerenciamento de sessões;
c) controles de acesso por perfil;
d) segregação de permissões;
e) criptografia aplicável à infraestrutura;
f) conexões protegidas;
g) registros de auditoria;
h) trilhas de alteração;
i) mecanismos de backup e recuperação; e
j) medidas destinadas à prevenção de acessos não autorizados.
26.3. A existência de cadastro na Plataforma não significa acesso irrestrito a todas as informações existentes no sistema.
26.4. As medidas de segurança poderão ser aprimoradas conforme a evolução tecnológica, os riscos identificados e as necessidades da Plataforma.
26.5. Nenhum sistema tecnológico é completamente imune a riscos, razão pela qual a Larsana Care manterá processos destinados à prevenção, identificação e resposta a incidentes.

27. TRANSFERÊNCIA INTERNACIONAL DE DADOS
27.1. Ainda que determinadas informações sejam mantidas em infraestrutura principal localizada no Brasil, algumas operações poderão envolver fornecedores, subprocessadores ou serviços tecnológicos localizados em outros países.
27.2. Isso poderá ocorrer, por exemplo, em razão de:
a) serviços tecnológicos globais;
b) geocodificação;
c) segurança;
d) suporte;
e) infraestrutura complementar; ou
f) distribuição de aplicativos.
27.3. Quando houver transferência internacional de dados pessoais, deverão ser observados os mecanismos previstos na legislação brasileira e na regulamentação aplicável.

28. IMAGENS, VÍDEOS, ÁUDIOS E DEPOIMENTOS
28.1. A contratação ou utilização dos serviços da Larsana Care não constitui autorização automática para utilização da imagem, voz, fotografia, vídeo ou depoimento do Paciente ou do Familiar/Responsável para fins publicitários, promocionais ou institucionais.
28.2. Quando a Larsana Care pretender utilizar esses materiais para tais finalidades, deverá ser obtida autorização específica e independente, conforme aplicável.
28.3. A recusa em conceder autorização para utilização de imagem, voz ou depoimento não deverá prejudicar a prestação dos serviços de saúde.
28.4. Materiais eventualmente produzidos para finalidade estritamente assistencial estarão sujeitos às regras de proteção de dados, confidencialidade e sigilo correspondentes.

29. COMUNICAÇÕES OPERACIONAIS E COMERCIAIS
29.1. A Larsana Care poderá enviar comunicações necessárias à contratação, funcionamento e organização dos serviços.
29.2. Entre elas poderão estar:
a) confirmações de atendimento;
b) alterações de agenda;
c) informações de pagamento;
d) documentos;
e) notificações da Plataforma;
f) alertas de segurança;
g) suporte;
h) avisos contratuais; e
i) comunicações legais ou regulatórias.
29.3. Comunicações necessárias à execução e organização dos serviços não possuem natureza promocional e poderão ser realizadas independentemente de autorização para publicidade.
29.4. Comunicações promocionais ou comerciais deverão observar a legislação aplicável e os mecanismos de escolha ou descadastramento pertinentes.

30. COOKIES E TECNOLOGIAS SEMELHANTES
30.1. Os ambientes digitais da Larsana Care poderão utilizar cookies ou tecnologias semelhantes conforme as funcionalidades efetivamente implementadas.
30.2. Essas tecnologias poderão ser utilizadas, entre outras finalidades legítimas, para funcionamento da sessão, autenticação, segurança e recursos técnicos da Plataforma.
30.3. A utilização de cookies não essenciais, quando implementados, deverá observar as escolhas do usuário e os requisitos legais aplicáveis.
30.4. Informações detalhadas sobre as tecnologias efetivamente utilizadas deverão ser apresentadas na Política de Cookies da Larsana Care.

31. INCIDENTES DE SEGURANÇA
31.1. Caso seja identificado incidente envolvendo dados pessoais, a Larsana Care realizará a avaliação do evento e adotará as medidas técnicas, administrativas e jurídicas cabíveis.
31.2. Quando o incidente estiver sujeito à obrigação de comunicação em razão de risco ou dano relevante aos titulares, serão adotadas as providências aplicáveis perante a Autoridade Nacional de Proteção de Dados e os titulares afetados, conforme a legislação e regulamentação vigentes.
31.3. A Larsana Care poderá manter registros relacionados aos incidentes e às providências adotadas.

32. CONSERVAÇÃO DOS DADOS
32.1. Os dados pessoais serão conservados pelo período necessário ao cumprimento das finalidades que justificaram seu tratamento.
32.2. Determinadas informações poderão permanecer armazenadas por período adicional quando necessário para:
a) cumprimento de obrigação legal ou regulatória;
b) preservação de registros assistenciais;
c) cumprimento de normas profissionais;
d) cumprimento de obrigações fiscais ou contratuais;
e) exercício regular de direitos;
f) prevenção e investigação de fraudes;
g) segurança e auditoria; ou
h) outra hipótese legalmente permitida.
32.3. Dados que deixarem de possuir fundamento legítimo para sua conservação deverão ser eliminados ou anonimizados quando aplicável.

33. GUARDA DOS REGISTROS ASSISTENCIAIS
33.1. Avaliações, evoluções, prontuários e demais registros assistenciais serão conservados durante os prazos estabelecidos pela legislação, regulamentação e normas profissionais aplicáveis à respectiva categoria e ao tipo de documento.
33.2. A exclusão ou desativação da conta do usuário não implica automaticamente eliminação dos registros assistenciais cuja conservação permaneça legal, regulatória ou profissionalmente necessária.
33.3. Durante o período de guarda, os registros deverão permanecer sujeitos às medidas de proteção aplicáveis à sua natureza.

34. CONTA DE ACESSO E REGISTROS QUE DEVEM SER CONSERVADOS
34.1. A conta utilizada para acesso à Plataforma não se confunde com os registros que devam permanecer armazenados.
34.2. Assim, uma conta poderá ser desativada ou encerrada sem que isso determine automaticamente a destruição de:
a) prontuários;
b) evoluções;
c) documentos fiscais;
d) registros financeiros;
e) contratos;
f) evidências de aceite;
g) registros de auditoria;
h) informações necessárias ao exercício regular de direitos; ou
i) outros registros cuja conservação possua fundamento legítimo.
34.3. A manutenção desses registros não autoriza sua utilização para novas finalidades incompatíveis com a razão que justificou sua conservação.

35. DIREITOS DOS TITULARES
35.1. Os titulares poderão exercer os direitos assegurados pela legislação de proteção de dados pessoais, observadas as condições e limitações aplicáveis a cada solicitação.
35.2. Entre os direitos legalmente aplicáveis poderão estar:
a) confirmação da existência de tratamento;
b) acesso aos dados;
c) correção de dados incompletos, inexatos ou desatualizados;
d) anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;
e) portabilidade, observada a regulamentação aplicável;
f) informação sobre compartilhamentos;
g) informação sobre a possibilidade de negar consentimento e suas consequências, quando aplicável;
h) revogação do consentimento;
i) eliminação de dados tratados com consentimento, observadas as exceções legais;
j) oposição ao tratamento nas hipóteses legalmente admitidas; e
k) revisão ou informações relacionadas a decisões automatizadas, quando aplicável.
35.3. A existência de obrigação legal, regulatória, fiscal ou profissional poderá impedir a eliminação imediata de determinadas informações.
35.4. A Larsana Care poderá solicitar informações adicionais para confirmar a identidade e legitimidade da pessoa que apresenta determinada solicitação.

36. ACESSO ÀS INFORMAÇÕES DE SAÚDE E AO PRONTUÁRIO
36.1. O Paciente poderá solicitar acesso às informações clínicas e assistenciais que lhe digam respeito, observadas as regras legais e profissionais aplicáveis.
36.2. Quando a solicitação for apresentada por Representante Legal, a Larsana Care poderá exigir comprovação da legitimidade correspondente.
36.3. Solicitações realizadas por Familiar ou Responsável que não possua representação legal serão avaliadas conforme a autorização concedida pelo Paciente, a finalidade do acesso e as regras de confidencialidade aplicáveis.
36.4. A Larsana Care e os Profissionais Parceiros deverão observar suas respectivas responsabilidades relacionadas à integridade, disponibilidade, acesso e confidencialidade desses registros.

37. RESPONSABILIDADES DOS USUÁRIOS
37.1. Pacientes, Familiares e Responsáveis deverão colaborar com a proteção das informações e da Plataforma.
37.2. Entre suas responsabilidades estão:
a) fornecer informações verdadeiras;
b) manter os dados cadastrais atualizados;
c) proteger credenciais e senhas;
d) não compartilhar indevidamente contas;
e) não acessar dados de terceiros sem autorização;
f) não divulgar indevidamente informações obtidas por meio da Plataforma;
g) utilizar a Plataforma somente para finalidades legítimas; e
h) comunicar suspeita de acesso indevido ou comprometimento da conta.

38. EXERCÍCIO DOS DIREITOS E CONTATO
38.1. Solicitações relacionadas à proteção de dados pessoais poderão ser encaminhadas pelos canais oficiais disponibilizados pela Larsana Care.
38.2. Antes de fornecer informações, alterar cadastros ou atender solicitações relacionadas a dados pessoais ou dados de saúde, a Larsana Care poderá realizar procedimentos destinados à confirmação da identidade e legitimidade do solicitante.
38.3. Essa confirmação é necessária especialmente para impedir que informações pessoais ou de saúde sejam fornecidas indevidamente a terceiros.
Canal de atendimento: contato@larsanacare.com.br

39. ENCARREGADO OU CANAL DE PRIVACIDADE
39.1. Quando juridicamente aplicável, a Larsana Care manterá pessoa responsável por atuar como canal de comunicação relacionado à proteção de dados pessoais.
39.2. Caso a organização esteja legalmente dispensada da indicação formal de Encarregado pelo Tratamento de Dados Pessoais, deverá manter canal apropriado para atendimento dos titulares e das obrigações aplicáveis.
39.3. Os dados específicos do Encarregado, quando houver indicação formal, poderão ser disponibilizados nos ambientes oficiais da Larsana Care.

40. RELAÇÃO COM O AVISO ESPECÍFICO DE TRATAMENTO DE DADOS
40.1. Em determinadas etapas da utilização dos serviços, a Larsana Care poderá apresentar Avisos Específicos para fornecer informação adicional e destacada sobre determinada operação envolvendo dados pessoais ou dados de saúde.
40.2. Esses Avisos complementam esta Política e não a substituem.
40.3. Quando uma funcionalidade exigir consentimento ou manifestação específica, essa decisão poderá ser solicitada separadamente do aceite geral desta Política.

41. ALTERAÇÕES DESTA POLÍTICA
41.1. Esta Política poderá ser atualizada em razão de:
a) alterações legais ou regulatórias;
b) alterações nas normas profissionais aplicáveis;
c) inclusão ou alteração de serviços;
d) mudança de fornecedores;
e) novas funcionalidades;
f) evolução tecnológica;
g) mudanças na operação da Plataforma; ou
h) identificação de novas necessidades relacionadas à proteção de dados.
41.2. A versão vigente deverá permanecer disponível aos usuários.
41.3. Alterações relevantes poderão ser comunicadas por meio da Plataforma ou de outro Canal Oficial.
41.4. Quando determinada alteração depender juridicamente de nova manifestação do usuário, será utilizado mecanismo apropriado para registro desse novo aceite ou consentimento.

42. ACEITE E REGISTRO ELETRÔNICO
42.1. A ciência desta Política poderá ser registrada eletronicamente por meio da Plataforma Larsana Care.
42.2. O registro poderá permanecer vinculado ao cadastro da pessoa que realizou a manifestação.
42.3. Para fins de comprovação, segurança e rastreabilidade, a Plataforma poderá registrar:
a) identificação do usuário;
b) versão da Política apresentada;
c) data;
d) horário; e
e) demais elementos técnicos disponíveis e pertinentes.
42.4. Quando a manifestação for realizada por Familiar, Responsável ou Representante Legal em relação a dados de outra pessoa, deverão ser observadas as regras de legitimidade, autorização e representação aplicáveis.
42.5. A ciência desta Política não deverá ser interpretada como consentimento genérico para todas as operações de tratamento de dados descritas, uma vez que cada tratamento será realizado conforme a base legal correspondente.

43. IDENTIFICAÇÃO DO CONTROLADOR
A Plataforma Larsana Care é disponibilizada por:
DELUMA SERVIÇOS DE SAÚDE E EDUCAÇÃO LTDA CNPJ: 65.974.822/0001-19 Marca: Larsana Care Endereço: Alameda Terracota, nº 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul/SP, CEP 09531-190 Contato: contato@larsanacare.com.br
44. DISPOSIÇÕES FINAIS
44.1. Esta Política deverá ser interpretada em conformidade com a legislação brasileira aplicável à proteção de dados pessoais, especialmente a Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais — LGPD, sem prejuízo das demais normas legais, regulatórias e profissionais relacionadas às atividades desenvolvidas pela Larsana Care e pelos Profissionais Parceiros.
44.2. Esta Política deverá ser interpretada em conjunto com os Termos de Uso, Aviso Específico de Tratamento de Dados Pessoais e Dados de Saúde, Termos de Consentimento e demais documentos aplicáveis à relação específica do Paciente ou Responsável.
44.3. Caso qualquer disposição desta Política se torne incompatível com alteração legislativa ou regulatória posterior, prevalecerá a norma vigente, devendo o documento ser atualizado quando necessário.

POLÍTICA DE PRIVACIDADE — PACIENTES, FAMILIARES E RESPONSONSÁVEIS
LARSANA CARE
Versão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('AVISO_DADOS_SAUDE', '1.0-2026-08', 'Aviso Específico — Dados de Saúde', $legal_body$AVISO ESPECÍFICO DE TRATAMENTO DE DADOS PESSOAIS E DADOS DE SAÚDE LARSANA CARE

104776230363

Este Aviso apresenta informações específicas sobre a utilização de dados pessoais e dados relacionados à saúde no contexto dos serviços intermediados pela Larsana Care.
Seu objetivo é garantir que Pacientes, Familiares/Responsáveis e demais titulares compreendam de forma clara quais informações poderão ser utilizadas, para quais finalidades, com quem poderão ser compartilhadas e quais medidas são adotadas para proteção desses dados.
1. FINALIDADE DESTE AVISO
1.1. O presente Aviso Específico de Tratamento de Dados Pessoais e Dados de Saúde complementa a Política de Privacidade da Larsana Care e deverá ser interpretado em conjunto com ela.
1.2. Este Aviso tem por finalidade fornecer informações adicionais e destacadas sobre o tratamento de dados pessoais realizado no contexto da contratação, organização, realização e acompanhamento de serviços de saúde intermediados pela Larsana Care.
1.3. As informações relacionadas à saúde constituem dados pessoais sensíveis e recebem proteção especial nos termos da legislação aplicável.
1.4. O tratamento de dados realizado pela Larsana Care será limitado às finalidades legítimas relacionadas à sua atuação, observados os princípios de necessidade, adequação, finalidade, segurança e transparência.

2. DADOS QUE PODERÃO SER TRATADOS
2.1. Conforme a relação mantida com a Larsana Care e o serviço utilizado, poderão ser tratados dados pessoais necessários à identificação, contratação, organização e prestação dos serviços.
2.2. Entre os dados cadastrais e de identificação poderão estar incluídos, conforme aplicável:
a) nome completo;
b) CPF;
c) data de nascimento;
d) dados de contato;
e) informações de endereço;
f) dados relacionados ao cadastro e autenticação na Plataforma; e
g) informações necessárias à vinculação entre Paciente e Familiar/Responsável.
2.3. No contexto assistencial, poderão ser tratados dados relacionados à saúde do Paciente, incluindo, quando necessários ao atendimento:
a) informações sobre condições de saúde;
b) histórico clínico e funcional;
c) diagnósticos previamente informados;
d) sintomas e queixas;
e) histórico de cirurgias, internações, quedas ou outras intercorrências;
f) medicamentos em uso;
g) exames, laudos, relatórios, prescrições e outros documentos de saúde fornecidos pelo Paciente ou Responsável;
h) informações obtidas durante avaliações profissionais;
i) registros de evolução assistencial;
j) informações relacionadas às condutas e orientações realizadas durante o atendimento;
k) limitações, capacidades e evolução funcional; e
l) demais informações relevantes e necessárias à segurança e continuidade da assistência.
2.4. A Larsana Care e os Profissionais Parceiros deverão evitar a coleta de informações excessivas ou sem relação legítima com a finalidade assistencial, operacional ou legal correspondente.

3. COMO OS DADOS PODERÃO SER OBTIDOS
3.1. Os dados poderão ser obtidos diretamente do próprio Paciente por meio do cadastro, da Plataforma, dos atendimentos e das comunicações realizadas com a Larsana Care ou com os Profissionais Parceiros.
3.2. Quando o atendimento for solicitado ou acompanhado por Familiar/Responsável, determinadas informações poderão ser fornecidas por essa pessoa.
3.3. O Familiar/Responsável que fornecer dados relacionados ao Paciente deverá fazê-lo apenas quando possuir legitimidade para tanto e para finalidades relacionadas à contratação, organização, segurança ou continuidade do atendimento.
3.4. Informações assistenciais também poderão ser produzidas pelo Profissional Parceiro durante a avaliação, atendimento e acompanhamento do Paciente.
3.5. Documentos ou informações enviados voluntariamente pelo Paciente ou Responsável poderão ser incorporados ou considerados no contexto do atendimento quando relevantes à assistência.

4. PARA QUE OS DADOS PODERÃO SER UTILIZADOS
4.1. Os dados pessoais poderão ser tratados para finalidades relacionadas à operação da Plataforma e à prestação dos serviços intermediados pela Larsana Care.
4.2. Entre essas finalidades poderão estar:
a) criar e manter o cadastro do usuário;
b) identificar e autenticar o usuário na Plataforma;
c) organizar solicitações de atendimento;
d) vincular Pacientes aos respectivos Familiares/Responsáveis, quando aplicável;
e) localizar e disponibilizar Profissionais Parceiros compatíveis com a demanda;
f) organizar agenda, atendimentos, ciclos, reagendamentos e substituições;
g) possibilitar a realização e continuidade do atendimento de saúde;
h) registrar avaliações, evoluções e demais informações assistenciais;
i) promover comunicação entre a Larsana Care, Pacientes, Familiares/Responsáveis e Profissionais Parceiros;
j) processar informações administrativas e financeiras relacionadas aos serviços;
k) cumprir obrigações legais, regulatórias, fiscais, profissionais ou judiciais;
l) preservar registros necessários ao exercício regular de direitos;
m) prevenir fraudes, acessos indevidos e outras situações de segurança;
n) permitir auditoria, rastreabilidade e segurança dos registros realizados na Plataforma; e
o) atender outras finalidades legítimas e compatíveis devidamente informadas ao titular.

5. TRATAMENTO DOS DADOS DE SAÚDE
5.1. Os dados relacionados à saúde serão tratados somente quando necessários às finalidades assistenciais, operacionais, legais ou de segurança relacionadas aos serviços.
5.2. O acesso a esses dados deverá ser limitado às pessoas que necessitem das informações para o exercício de suas funções ou para a prestação da assistência correspondente.
5.3. O Profissional Parceiro responsável pelo atendimento poderá acessar e registrar informações necessárias à avaliação, planejamento, execução e acompanhamento da assistência.
5.4. A utilização de dados de saúde deverá respeitar, além da legislação de proteção de dados, os deveres de sigilo, confidencialidade e ética profissional aplicáveis.
5.5. Informações de saúde não serão disponibilizadas livremente a outros usuários da Plataforma apenas em razão de vínculo familiar ou financeiro com o Paciente.

6. COMPARTILHAMENTO COM PROFISSIONAIS PARCEIROS
6.1. A Larsana Care poderá disponibilizar ao Profissional Parceiro responsável pela demanda as informações necessárias à avaliação da possibilidade de atendimento, organização da assistência e execução do serviço.
6.2. Após a vinculação do Profissional Parceiro ao Paciente, poderão ser disponibilizadas informações adicionais necessárias à adequada prestação e continuidade do cuidado.
6.3. O acesso do Profissional Parceiro deverá ser limitado às informações compatíveis com sua participação no atendimento.
6.4. Os Profissionais Parceiros estão sujeitos às obrigações de confidencialidade, proteção de dados, sigilo profissional e às normas éticas aplicáveis às respectivas profissões.
6.5. A participação de determinado Profissional Parceiro no atendimento não o autoriza a utilizar os dados do Paciente para finalidades estranhas à prestação do serviço ou incompatíveis com a relação estabelecida.

7. FAMILIARES E RESPONSÁVEIS
7.1. Quando houver Familiar/Responsável cadastrado, determinados dados poderão ser utilizados para permitir a organização e acompanhamento do atendimento.
7.2. O cadastro como Familiar/Responsável não confere automaticamente acesso irrestrito a todas as informações de saúde e registros assistenciais do Paciente.
7.3. O compartilhamento de informações assistenciais com Familiar/Responsável deverá observar a autonomia do Paciente, sua autorização quando necessária, eventual condição de representação legal, a finalidade do acesso e as limitações previstas na legislação e nas normas profissionais aplicáveis.
7.4. Quando o Paciente possuir capacidade para compreender e manifestar sua vontade, sua privacidade e suas escolhas relacionadas ao compartilhamento de informações deverão ser respeitadas.

8. REGISTROS ASSISTENCIAIS
8.1. Avaliações, evoluções e demais registros relacionados à assistência poderão ser armazenados por meio da Plataforma Larsana Care.
8.2. Os registros deverão permanecer vinculados ao Paciente e ao Profissional responsável por sua elaboração.
8.3. A Plataforma poderá registrar informações destinadas à integridade e rastreabilidade dos documentos assistenciais, incluindo identificação do profissional, data, horário, histórico de registros e outros elementos técnicos aplicáveis.
8.4. A correção ou complementação de registros assistenciais deverá preservar, quando exigível, a integridade, a autoria e a rastreabilidade das informações originalmente registradas.
8.5. Os registros assistenciais serão conservados durante os períodos necessários ao cumprimento das obrigações legais, regulatórias, profissionais e ao exercício regular de direitos.

9. COMPARTILHAMENTO COM PRESTADORES DE SERVIÇOS
9.1. Para funcionamento da Plataforma e execução de suas atividades, a Larsana Care poderá utilizar prestadores de serviços e fornecedores responsáveis por atividades como infraestrutura tecnológica, armazenamento, processamento de pagamentos, comunicação, segurança, suporte e outras funções necessárias à operação.
9.2. O compartilhamento deverá ser limitado aos dados necessários à execução da atividade correspondente.
9.3. Sempre que aplicável, esses terceiros deverão estar sujeitos a obrigações relacionadas à confidencialidade, segurança e proteção dos dados tratados.
9.4. A utilização de fornecedores ou infraestrutura tecnológica não autoriza o uso dos dados para finalidades próprias incompatíveis com os serviços contratados pela Larsana Care.

10. DADOS FINANCEIROS E DE PAGAMENTO
10.1. Informações relacionadas à contratação e aos pagamentos poderão ser tratadas para processamento financeiro, identificação de transações, conciliação, prevenção de fraudes, emissão de documentos e cumprimento de obrigações fiscais ou legais.
10.2. Determinadas operações de pagamento poderão ser realizadas por instituições ou plataformas financeiras contratadas para essa finalidade, que poderão tratar os dados necessários à execução da transação conforme suas próprias obrigações legais e regulatórias.
10.3. A Larsana Care deverá evitar o armazenamento de dados financeiros além daqueles necessários à execução de suas atividades.

11. SEGURANÇA E CONTROLE DE ACESSO
11.1. A Larsana Care adotará medidas técnicas e administrativas compatíveis com a natureza dos dados tratados e com os riscos envolvidos em sua atividade.
11.2. Entre as medidas aplicáveis poderão estar controles de acesso, autenticação individual, registros de acesso e operações, mecanismos de segurança da infraestrutura, rotinas de backup e outras medidas destinadas à preservação da confidencialidade, integridade e disponibilidade das informações.
11.3. Nenhum sistema tecnológico é completamente imune a riscos, razão pela qual as medidas de segurança serão continuamente avaliadas e atualizadas conforme a evolução da Plataforma e os riscos identificados.

12. CONSERVAÇÃO DOS DADOS
12.1. Os dados serão conservados pelo período necessário ao cumprimento das finalidades para as quais foram tratados.
12.2. Mesmo após o encerramento do atendimento ou desativação da conta, determinados dados poderão permanecer armazenados quando sua conservação for necessária para:
a) cumprimento de obrigação legal ou regulatória;
b) preservação de registros assistenciais;
c) exercício regular de direitos;
d) cumprimento de obrigações fiscais ou contratuais;
e) segurança, auditoria e prevenção de fraudes; ou
f) outras hipóteses legalmente permitidas.
12.3. O encerramento ou desativação da conta de acesso não implica necessariamente exclusão imediata dos registros assistenciais e demais dados cuja manutenção seja obrigatória ou legitimamente necessária.

13. DIREITOS DO TITULAR
13.1. O titular poderá exercer os direitos assegurados pela legislação aplicável, observadas as limitações e particularidades de cada solicitação.
13.2. Entre os direitos aplicáveis poderão estar a confirmação da existência de tratamento, acesso aos dados, correção de informações incompletas ou inexatas e demais direitos previstos na legislação.
13.3. Determinadas solicitações de exclusão, anonimização ou eliminação poderão não resultar na exclusão de informações cuja conservação seja necessária ou obrigatória nos termos da legislação aplicável.
13.4. A Larsana Care poderá solicitar informações destinadas à confirmação da identidade do solicitante antes de atender pedido relacionado a dados pessoais ou informações de saúde.

14. CONSENTIMENTO QUANDO ESPECIFICAMENTE NECESSÁRIO
14.1. Nem todo tratamento de dados realizado pela Larsana Care depende do consentimento do titular.
14.2. Quando determinada operação puder ser realizada com fundamento em hipótese legal diferente do consentimento, a Larsana Care poderá realizar o tratamento correspondente nos limites autorizados pela legislação.
14.3. Quando uma finalidade específica depender juridicamente de consentimento, o titular deverá receber informação clara e destacada sobre essa finalidade antes de manifestar sua decisão.
14.4. O consentimento específico, quando necessário, não deverá ser presumido em razão da simples contratação dos serviços ou do aceite geral deste Aviso.
14.5. Quando aplicável, a Plataforma deverá registrar a manifestação específica do titular e permitir sua posterior revogação, observadas as consequências e limitações previstas na legislação.

15. FINALIDADES QUE DEPENDEM DE AUTORIZAÇÃO PRÓPRIA
15.1. O aceite deste Aviso não constitui autorização para utilização da imagem, voz, fotografia, vídeo ou depoimento do Paciente ou Familiar/Responsável para fins publicitários, promocionais, comerciais ou institucionais.
15.2. Essas utilizações deverão ser objeto de autorização específica e independente quando pretendidas pela Larsana Care.
15.3. Da mesma forma, eventual utilização de dados para finalidade substancialmente diferente daquela necessária à prestação dos serviços deverá ser previamente avaliada e, quando necessário, submetida ao mecanismo jurídico adequado.

16. RELAÇÃO COM A POLÍTICA DE PRIVACIDADE
16.1. Este Aviso possui caráter complementar e não substitui a Política de Privacidade da Larsana Care.
16.2. A Política de Privacidade contém informações adicionais relacionadas ao tratamento de dados pessoais realizado pela Plataforma e deverá permanecer disponível aos usuários.
16.3. Quando este Aviso for apresentado em razão de determinada funcionalidade ou operação específica, suas disposições deverão ser interpretadas de forma complementar à Política de Privacidade.

17. DECLARAÇÃO DE CIÊNCIA
Ao realizar o aceite eletrônico deste Aviso, o usuário declara que:
a) teve acesso às informações apresentadas neste documento;
b) compreendeu que dados relacionados à saúde possuem natureza sensível e poderão ser tratados quando necessários à prestação e organização dos serviços;
c) compreendeu que determinadas informações poderão ser compartilhadas com os Profissionais Parceiros envolvidos no atendimento;
d) compreendeu que o acesso de Familiares/Responsáveis às informações de saúde não é automaticamente irrestrito;
e) compreendeu que determinados dados poderão permanecer armazenados após o encerramento do atendimento quando houver fundamento legal ou necessidade legítima para sua conservação;
f) compreendeu que nem todo tratamento de dados depende de consentimento;
g) compreendeu que eventual finalidade que exija consentimento específico deverá ser apresentada separadamente quando aplicável; e
h) declara ciência das condições de tratamento de dados descritas neste Aviso.

18. ACEITE ELETRÔNICO
18.1. O presente Aviso poderá ser apresentado e aceito eletronicamente por meio da Plataforma Larsana Care.
18.2. O aceite ficará vinculado ao cadastro da pessoa que realizou a manifestação.
18.3. A Plataforma poderá registrar, para fins de comprovação e rastreabilidade, a identificação do usuário, a versão do documento apresentada, data e horário da manifestação e demais elementos técnicos aplicáveis.
18.4. Quando o Aviso se referir ao tratamento de dados de Paciente cujo cadastro ou atendimento seja administrado por Familiar/Responsável, deverão ser observadas as regras relativas à legitimidade dessa pessoa para fornecer informações ou exercer direitos em nome do Paciente.

Razão social: DELUMA Serviços de Saúde e Educação LTDACNPJ: 65.974.822/0001-19Endereço: Alameda Terracota, nº 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul/SP, CEP 09531-190Canal de atendimento: contato@larsanacare.com.br
AVISO ESPECÍFICO DE TRATAMENTO DE DADOS PESSOAIS E DADOS DE SAÚDE
Versão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'awareness'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('ANEXO_I_COMERCIAL_PACIENTE', '1.0-2026-08', 'Anexo I — Condições Comerciais', $legal_body$ANEXO I — CONDIÇÕES COMERCIAIS E TABELA DE VALORES LARSANA CARE

114300114300

Este Anexo integra os Termos de Uso da Plataforma Larsana Care e tem por finalidade apresentar, de forma clara e transparente, as condições comerciais de referência aplicáveis aos serviços intermediados pela Plataforma.
1. CONDIÇÕES GERAIS
1.1. Os valores dos serviços disponibilizados por meio da Larsana Care poderão variar de acordo com a região de atendimento, classificação da demanda, características do serviço, frequência, condições operacionais e demais critérios comerciais aplicáveis.
1.2. Os valores constantes neste Anexo correspondem à tabela comercial de referência vigente em sua respectiva versão e poderão ser alterados pela Larsana Care para novas contratações.
1.3. Eventuais alterações posteriores da tabela não modificarão retroativamente os valores de serviços ou ciclos já contratados e confirmados pelo Paciente ou Responsável.
1.4. Antes da contratação, o Paciente ou Responsável será informado do valor efetivamente aplicável ao serviço solicitado.
1.5. Campanhas promocionais, descontos, benefícios, condições especiais ou outras ações comerciais poderão resultar em valores diferentes dos constantes da tabela de referência, pelo período e nas condições em que forem oferecidos.
1.6. A existência de determinada condição comercial não gera direito à sua manutenção em ciclos ou contratações futuras.

2. AVALIAÇÃO INICIAL
2.1. O primeiro atendimento do Paciente será destinado à Avaliação Inicial realizada pelo Profissional Parceiro, necessária para identificação das condições do Paciente, definição inicial da conduta e organização da continuidade do atendimento.
2.2. O valor mínimo da Avaliação Inicial é de R$ 150,00 (cento e cinquenta reais).
2.3. Quando o valor unitário aplicável aos atendimentos do Paciente for superior a R$ 150,00, em razão da Região, Nível ou demais critérios de classificação previstos neste Anexo, a Avaliação Inicial será cobrada pelo mesmo valor unitário aplicável ao atendimento.
02971563
Valor unitário aplicável ao atendimento
Valor da Avaliação Inicial
Crédito/abatimento no 1º ciclo
R$ 100,00
R$ 150,00
R$ 150,00
R$ 130,00
R$ 150,00
R$ 150,00
R$ 150,00
R$ 150,00
R$ 150,00
R$ 170,00
R$ 170,00
R$ 150,00
R$ 180,00
R$ 180,00
R$ 150,00
R$ 200,00
R$ 200,00
R$ 150,00
03238263Dessa forma, exemplificativamente:2.4. A Avaliação Inicial deverá ser paga previamente à sua realização, pelo valor informado ao Paciente ou Responsável antes da confirmação do agendamento.
2.5. Caso, após a realização da Avaliação Inicial, o Paciente não dê continuidade ao tratamento, o valor pago pela avaliação permanecerá devido e não será reembolsado, uma vez que o serviço foi efetivamente prestado, ressalvadas as hipóteses legalmente aplicáveis.
2.6. Havendo continuidade do tratamento e contratação do primeiro ciclo, será concedido crédito comercial fixo de R$ 150,00 (cento e cinquenta reais) para abatimento do valor total do primeiro ciclo.
2.7. O crédito previsto no item anterior será limitado a R$ 150,00, independentemente de o valor efetivamente pago pela Avaliação Inicial ter sido superior.
2.8. Assim, quando a Avaliação Inicial tiver valor de R$ 170,00, R$ 180,00, R$ 200,00 ou qualquer outro valor superior a R$ 150,00, o abatimento no primeiro ciclo permanecerá limitado a R$ 150,00, não correspondendo necessariamente ao valor integral pago pela avaliação.
2.9. O crédito de R$ 150,00 será concedido uma única vez, exclusivamente em razão da continuidade após a Avaliação Inicial, não sendo convertido em dinheiro, transferido para terceiros ou acumulado com ciclos posteriores.
2.10. O valor mínimo da Avaliação Inicial e o valor do crédito comercial poderão ser alterados pela Larsana Care para novas contratações, mediante atualização das condições comerciais e informação prévia ao Paciente ou Responsável, sem alteração retroativa das condições já contratadas
3. TABELA DE REFERÊNCIA DOS ATENDIMENTOS
Os valores dos atendimentos são definidos de acordo com a Região de Atendimento e o Nível da demanda do Paciente, conforme classificação operacional adotada pela Larsana -14242246705Care.
Região
Nível 1
Nível 2
Nível 3
Região A
R$ 100,00
R$ 130,00
R$ 150,00
Região B
R$ 130,00
R$ 150,00
R$ 170,00
Região C
R$ 150,00
R$ 180,00
R$ 200,00
3.1. Os valores acima representam os valores unitários de referência por atendimento, observadas as condições comerciais vigentes.
3.2. A Região e o Nível aplicáveis à demanda serão determinados conforme os critérios operacionais e assistenciais adotados pela Larsana Care.
3.2.1. Para fins desta tabela, a Região de Atendimento corresponde à classificação territorial e operacional do local em que o serviço será realizado, enquanto o Nível da demanda corresponde à classificação atribuída considerando as características e a complexidade do atendimento solicitado.
3.3. O Paciente ou Responsável será informado da classificação e do respectivo valor antes da contratação.
3.4. Alterações na condição do Paciente que impliquem mudança relevante na complexidade ou características do atendimento poderão ensejar reavaliação da classificação para ciclos futuros, mediante comunicação prévia ao Paciente ou Responsável.
3.5. Nenhuma alteração de classificação produzirá cobrança retroativa sobre atendimentos já realizados sob condição comercial anteriormente confirmada.

4. CÁLCULO DO VALOR DO CICLO
4.1. O valor do ciclo será calculado considerando o valor unitário aplicável ao Paciente e a quantidade de atendimentos contratados.
4.2. Os ciclos poderão compreender, conforme disponibilizado pela Larsana Care:
4 atendimentos;
8 atendimentos; ou
12 atendimentos.
4.3. No primeiro ciclo, a Avaliação Inicial integra a quantidade total contratada.
Assim, havendo continuidade:
ciclo de 4 atendimentos: 1 avaliação + 3 atendimentos subsequentes;
ciclo de 8 atendimentos: 1 avaliação + 7 atendimentos subsequentes;
ciclo de 12 atendimentos: 1 avaliação + 11 atendimentos subsequentes.
4.4. Havendo continuidade do tratamento, será concedido crédito comercial de R$ 150,00 (cento e cinquenta reais) para abatimento do valor total do primeiro ciclo, independentemente de o valor efetivamente pago pela Avaliação Inicial ter sido superior, conforme estabelecido na Seção 2 deste Anexo.

5. CONDIÇÃO DE PAGAMENTO ANTECIPADO
-142421979875.1. A Larsana Care poderá, a seu exclusivo critério comercial, oferecer condição de pagamento antecipado do saldo do ciclo com desconto.
5.2. A oferta de desconto por pagamento antecipado não é obrigatória e poderá ou não estar disponível em determinada contratação ou período.
5.3. Quando oferecido, o percentual ou valor do desconto será informado ao Paciente ou Responsável no momento da oferta comercial.
5.4. A condição de pagamento antecipado com desconto poderá estar sujeita a prazo específico, informado previamente pela Larsana Care e observado o limite estabelecido nos Termos de Uso, quando aplicável.
5.5. Caso a condição de pagamento antecipado com desconto não seja oferecida, ou não seja utilizada dentro do prazo correspondente, será devido o valor integral aplicável ao ciclo.
5.6. A concessão de desconto em uma contratação não gera direito adquirido, expectativa de manutenção ou obrigação de concessão do mesmo benefício em ciclos futuros.

6. ATUALIZAÇÃO DA TABELA COMERCIAL
6.1. A Larsana Care poderá atualizar os valores da Avaliação Inicial, dos atendimentos e demais condições comerciais em razão de alterações de custos, expansão territorial, condições de mercado, revisão da estrutura operacional ou estratégia comercial.
6.2. A atualização será aplicável às novas contratações e aos novos ciclos contratados após sua entrada em vigor, respeitadas as condições já confirmadas para ciclos em andamento.
6.3. A versão vigente deste Anexo será disponibilizada pela Plataforma ou por outro Canal Oficial da Larsana Care.
6.4. Antes da confirmação de um novo ciclo, o Paciente ou Responsável deverá ter acesso ao valor aplicável à nova contratação.
7. Pagamento em dinheiro
7.5. A Larsana Care poderá disponibilizar o pagamento em dinheiro como modalidade de pagamento.
7.6. Quando autorizado, o pagamento poderá ser realizado diretamente ao Profissional Parceiro, que ficará responsável pelo registro do recebimento e pelo repasse à Larsana Care dos valores que lhe forem devidos, conforme as regras estabelecidas entre a Larsana e o profissional.
7.7. O Paciente ou Responsável deverá solicitar e conservar o respectivo comprovante de pagamento.
7.8. A disponibilidade do pagamento em dinheiro poderá variar conforme as condições -14242197987operacionais da contratação.
7.9. Uma vez comprovado o pagamento realizado pelo Paciente ou Responsável diretamente ao Profissional Parceiro, quando essa modalidade tiver sido autorizada pela Larsana Care, eventual ausência ou atraso no repasse dos valores devidos pelo Profissional Parceiro à Larsana Care não implicará nova cobrança do mesmo valor ao Paciente ou Responsável.
8. PREVALÊNCIA DO VALOR INFORMADO NA CONTRATAÇÃO
8.1. A tabela deste Anexo possui natureza comercial de referência.
8.2. Quando houver promoção, desconto, condição especial ou outra condição comercial expressamente apresentada pela Larsana Care, prevalecerá para aquela contratação o valor final informado ao Paciente ou Responsável antes de sua confirmação.
8.3. Nenhum valor diferente daquele previamente informado poderá ser cobrado do Paciente de forma retroativa.

Razão social: DELUMA Serviços de Saúde e Educação LTDA
CNPJ: 65.974.822/0001-19, com sede social na Alameda Terracota, no. 185,
Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul-SP, 09531-190
Canal de atendimento: contato@larsanacare.com.br
Versão V1.08/2026

ANEXO I — CONDIÇÕES COMERCIAIS E TABELA DE VALORES LARSANA CAREVersão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('ANEXO_II_CANCELAMENTO_PACIENTE', '1.0-2026-08', 'Anexo II — Cancelamento e Reagendamento', $legal_body$ANEXO II — REGRAS DE CANCELAMENTO, REAGENDAMENTO, AUSÊNCIA, PAUSA E ENCERRAMENTO DO TRATAMENTO LARSANA CARE

114300114300

Este Anexo integra os Termos de Uso da Plataforma Larsana Care e estabelece as regras aplicáveis aos cancelamentos, reagendamentos, ausências, pausas e encerramento antecipado dos serviços intermediados pela Plataforma.
1. REGRAS GERAIS DE COMUNICAÇÃO
1.1. Cancelamentos, pedidos de reagendamento, comunicação de ausência, solicitação de pausa ou encerramento do tratamento deverão ser realizados preferencialmente pela Plataforma Larsana Care.
1.2. Quando o Paciente ou Responsável não puder utilizar a Plataforma, serão consideradas válidas as comunicações realizadas pelos demais Canais Oficiais disponibilizados pela Larsana Care, inclusive WhatsApp ou atendimento telefônico.
6667519551641.3. Para verificação do cumprimento dos prazos previstos neste Anexo, será considerada a data e o horário em que a comunicação tiver sido recebida ou registrada em Canal Oficial, independentemente do momento em que houver resposta da Larsana Care ou do Profissional Parceiro.
1.4. Comunicações realizadas por telefone poderão ser registradas administrativamente pela Larsana Care para fins de organização, comprovação e histórico operacional.
2. CANCELAMENTO OU REAGENDAMENTO COM ANTECEDÊNCIA MÍNIMA DE 12 HORAS
2.1. O Paciente ou Responsável poderá solicitar o cancelamento ou reagendamento de uma sessão sem cobrança, desde que comunique a Larsana Care com antecedência mínima de 12 (doze) horas em relação ao horário agendado.
2.2. Nessas situações, a sessão não será considerada consumida do ciclo.
2.3. O reagendamento estará sujeito à disponibilidade do Profissional Parceiro e às condições de continuidade do ciclo contratado.
2.4. O cancelamento realizado dentro do prazo não garante a manutenção do mesmo dia, horário ou profissional para o reagendamento.
3. CANCELAMENTO COM MENOS DE 12 HORAS
3.1. Quando o cancelamento ocorrer com antecedência inferior a 12 (doze) horas, sem motivo excepcional devidamente justificado, a sessão será considerada consumida do ciclo contratado, em razão da reserva prévia do horário do Profissional Parceiro.
3.2. Nessa hipótese, será devido o equivalente a 50% (cinquenta por cento) do valor unitário da sessão.
3.3. A sessão consumida em razão de cancelamento tardio será contabilizada dentro da quantidade de atendimentos do ciclo e não gerará direito a reposição ou reagendamento da mesma sessão.
3.4. A classificação da sessão como consumida possui natureza exclusivamente contratual, operacional e financeira, não significando que o atendimento de saúde tenha sido efetivamente realizado.
-14248794273.5. Não será registrada evolução clínica como atendimento realizado quando a sessão não tiver efetivamente ocorrido.
4. AUSÊNCIA DO PACIENTE
4.1. Será considerada ausência quando o Paciente não estiver disponível para o atendimento no local, data e horário previamente confirmados, sem comunicação realizada dentro do prazo previsto neste Anexo.
4.2. A ausência será considerada sessão consumida do ciclo, sendo devido 50% do valor unitário da sessão, observadas as mesmas condições aplicáveis ao cancelamento tardio.
4.3. A sessão não poderá ser reposta no mesmo ciclo.
4.4. A ausência não será registrada como atendimento clínico realizado.
5. CICLOS PAGOS ANTECIPADAMENTE
5.1. Quando o ciclo tiver sido pago antecipadamente e ocorrer cancelamento tardio ou ausência sujeito à cobrança de 50%, somente essa parcela será considerada devida em relação à sessão não realizada.
5.2. Os 50% restantes, correspondentes à parcela não cobrada da sessão, permanecerão em favor do Paciente ou Responsável.
5.3. O Paciente ou Responsável poderá optar, conforme os procedimentos disponibilizados pela Larsana Care, entre:
a) restituição do valor correspondente; oub) manutenção do valor como crédito para utilização em ciclo futuro.
5.4. A existência de crédito não implica renovação automática do tratamento ou contratação automática de novo ciclo.
5.5. Caso o valor do atendimento aplicável ao novo ciclo seja superior ao crédito existente, o Paciente ou Responsável deverá pagar a respectiva diferença.
6. CICLOS AINDA NÃO PAGOS
6.1. Quando o ciclo ainda não tiver sido pago, o cancelamento tardio ou ausência acarretará cobrança exclusivamente dos 50% do valor unitário da sessão previstos neste Anexo.
6.2. Não haverá geração de crédito ou direito a reembolso correspondente aos outros 50%, uma vez que esse valor não chegou a ser pago pelo Paciente ou Responsável.
7. SITUAÇÕES EXCEPCIONAIS E JUSTIFICADAS
7.1. Situações excepcionais que impossibilitem o comparecimento ou a realização do atendimento poderão ser analisadas pela Larsana Care, incluindo, exemplificativamente, internação hospitalar, atendimento de urgência ou emergência, intercorrência clínica -14242057112relevante ou outro evento imprevisível devidamente justificável.
7.2. Após análise das circunstâncias, a Larsana Care poderá afastar a cobrança e o consumo da sessão quando considerar caracterizada situação excepcional justificável.
7.3. A análise será realizada individualmente, considerando as circunstâncias apresentadas e os registros disponíveis.
8. CANCELAMENTO OU IMPOSSIBILIDADE DE ATENDIMENTO PELO PROFISSIONAL PARCEIRO
8.1. Quando uma sessão previamente agendada não puder ser realizada por indisponibilidade ou cancelamento do Profissional Parceiro responsável (PP), o Paciente não sofrerá cobrança adicional nem perda da sessão.
8.2. Nessa situação, o Paciente ou Responsável poderá optar, conforme disponibilidade operacional, entre:
a) aceitar a realização daquela sessão por um Profissional Parceiro Substituto (SUB) disponibilizado pela Larsana Care; ou
b) permanecer com o Profissional Parceiro responsável e realizar o reagendamento da sessão não realizada.
8.3. Para fins deste Anexo, considera-se SUB o Profissional Parceiro disponibilizado temporariamente pela Larsana Care para realizar uma ou mais sessões específicas durante a indisponibilidade do profissional responsável, sem transferência automática da continuidade do tratamento.
8.4. A utilização de SUB dependerá da existência de profissional disponível e tecnicamente compatível com a demanda do Paciente, não havendo garantia de disponibilidade para determinada data ou horário.
8.5. O Paciente ou Responsável poderá recusar a realização da sessão com o SUB, sem qualquer penalidade, permanecendo o atendimento sob responsabilidade do PP originalmente vinculado ao tratamento.
REAGENDAMENTO PELO PP RESPONSÁVEL
8.6. Caso o Paciente ou Responsável opte por não utilizar um SUB, ou caso não exista SUB disponível, a sessão cancelada pelo PP deverá ser preferencialmente reagendada e realizada pelo profissional responsável em até 14 (quatorze) dias corridos, contados da data originalmente prevista para o atendimento.
8.7. Para viabilizar a reposição dentro desse prazo, poderá ocorrer, excepcionalmente, mais de um atendimento na mesma semana, ainda que isso represente frequência semanal superior à originalmente programada.
8.8. A realização de atendimento adicional na mesma semana para fins de reposição será pontual e não implicará alteração permanente da frequência contratada para o tratamento, devendo ser compatível com a condição clínica do Paciente e com a autonomia técnica do Profissional Parceiro.
8.9. A data e o horário da reposição serão definidos de acordo com a disponibilidade do Paciente e do Profissional Parceiro, buscando-se sua realização dentro do prazo previsto nesta Seção.
8.10. O prazo de 14 (quatorze) dias pressupõe a colaboração do Paciente ou Responsável na definição de nova data para realização da sessão.
8.11. Caso a sessão cancelada pelo Profissional Parceiro não seja realizada dentro do prazo de 14 (quatorze) dias corridos, a sessão permanecerá devida ao Paciente e será automaticamente transferida para o final do ciclo vigente, passando a ser realizada após a última sessão originalmente prevista para aquele ciclo.
8.12. A transferência da sessão para o final do ciclo não será considerada contratação de atendimento adicional, renovação do ciclo ou alteração permanente da frequência semanal, correspondendo exclusivamente à reposição de sessão anteriormente não realizada.
8.13. A sessão cancelada pelo PP somente será contabilizada como realizada após a efetiva prestação do atendimento pelo próprio PP ou pelo SUB.
8.14. A sessão não realizada não poderá ser registrada como atendimento clínico realizado nem gerar evolução clínica antes da efetiva prestação do serviço.

9. PAUSA TEMPORÁRIA DO TRATAMENTO
9.1. O tratamento poderá ser temporariamente pausado diante de circunstância clínica ou pessoal relevante que justifique a interrupção temporária, incluindo hospitalização, procedimento médico, intercorrência clínica ou outra situação devidamente analisada.
9.2. A pausa justificada não será considerada, por si só, encerramento antecipado do tratamento e não acarretará aplicação da multa prevista na Seção 10.
-142427514549.3. As sessões ainda não realizadas nem consumidas permanecerão vinculadas ao ciclo, observadas as condições para retomada do tratamento.
9.4. A retomada estará sujeita à disponibilidade do Profissional Parceiro responsável, podendo a Larsana Care organizar substituição quando necessária e possível.
9.5. Dependendo do período da pausa ou de eventual alteração da condição clínica do Paciente, poderá ser necessária atualização ou reavaliação antes da continuidade dos atendimentos, conforme decisão técnica do profissional responsável.
10. ENCERRAMENTO ANTECIPADO POR DECISÃO DO PACIENTE
10.1. O Paciente ou Responsável poderá solicitar o encerramento do tratamento antes da conclusão do ciclo contratado.
10.2. Quando o encerramento ocorrer exclusivamente por decisão do Paciente ou Responsável, sem falha atribuível à Larsana Care ou ao Profissional Parceiro e sem situação excepcional justificável, serão considerados para apuração financeira:
a) os atendimentos efetivamente realizados;b) as sessões anteriormente consumidas nos termos deste Anexo; ec) multa de 20% (vinte por cento) incidente exclusivamente sobre o valor correspondente às sessões restantes ainda não realizadas e não consumidas.

10.3. A multa de 20% não incidirá sobre o valor integral originalmente contratado, nem sobre a Avaliação Inicial, atendimentos já realizados ou sessões já consumidas.
10.4. Não haverá aplicação cumulativa de penalidades sobre o mesmo fato.
10.5. O cancelamento tardio ou ausência referente a uma sessão isolada não será, por si só, considerado encerramento antecipado do tratamento.
11. HIPÓTESES SEM MULTA DE ENCERRAMENTO
11.1. A multa prevista na Seção 10 não será aplicada quando o encerramento decorrer, conforme análise do caso, de:
a) alta ou contraindicação clínica para continuidade;b) hospitalização ou alteração relevante do estado de saúde que inviabilize a continuidade;c) descumprimento imputável à Larsana Care;d) impossibilidade prolongada de disponibilização de Profissional Parceiro compatível, sem alternativa razoável de substituição;e) exercício de direito assegurado pela legislação aplicável; ouf) outra circunstância excepcional reconhecida pela Larsana Care.
-1424205711212. APURAÇÃO DO SALDO NO ENCERRAMENTO
12.1. No encerramento antecipado, será realizada a apuração dos valores considerando atendimentos realizados, sessões consumidas, valores eventualmente devidos, multa aplicável e saldo remanescente.
12.2. Quando houver pagamento antecipado e, após a apuração, existir saldo em favor do Paciente ou Responsável, este poderá ser objeto de restituição ou, mediante escolha do titular, convertido em crédito para contratação futura.
12.3. Quando não houver pagamento antecipado, não haverá restituição ou geração de crédito sobre valores que não tenham sido efetivamente pagos.
12.4. Sempre que tecnicamente disponível, a Larsana Care poderá apresentar ao Paciente ou Responsável demonstrativo ou estimativa dos valores envolvidos no encerramento.

Razão social: DELUMA Serviços de Saúde e Educação LTDA
CNPJ: 65.974.822/0001-19, com sede social na Alameda Terracota, no. 185,
Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul-SP, 09531-190
Canal de atendimento: contato@larsanacare.com.br
Versão V1.08/2026

ANEXO II — REGRAS DE CANCELAMENTO, REAGENDAMENTO, AUSÊNCIA, PAUSA E ENCERRAMENTO DO TRATAMENTO LARSANA CAREVersão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'awareness'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('ANEXO_III_ESCOPO_PACIENTE', '1.0-2026-08', 'Anexo III — Escopo dos Profissionais Parceiros', $legal_body$ANEXO III — ESCOPO E LIMITES DE ATUAÇÃO DOS PROFISSIONAIS PARCEIROS LARSANA CARE

274800450629

Este Anexo integra os Termos de Uso da Plataforma Larsana Care e tem por finalidade informar ao Paciente e/ou Responsável sobre o escopo geral e os limites de atuação das categorias profissionais que poderão prestar serviços intermediados pela Larsana Care.
As atribuições descritas neste documento possuem caráter informativo e deverão ser interpretadas em conjunto com a legislação vigente, as normas dos respectivos Conselhos Profissionais, a formação, o registro, as especialidades, as habilitações e as competências individuais de cada Profissional Parceiro.
1. REGRAS GERAIS DE ATUAÇÃO
1.1. Os serviços de saúde intermediados pela Larsana Care serão realizados por Profissionais Parceiros regularmente habilitados para o exercício de suas respectivas profissões, quando se tratar de profissão regulamentada.
1.2. Cada Profissional Parceiro deverá atuar exclusivamente dentro dos limites de sua formação, competência profissional, registro e das normas legais, técnicas e éticas aplicáveis à sua categoria.
1.3. A vinculação do profissional a determinada categoria não significa que esteja automaticamente habilitado para realizar todos os procedimentos, técnicas ou intervenções relacionados àquela profissão.
1.4. Quando determinado ato exigir formação complementar, especialidade, habilitação, capacitação ou outro requisito específico, o Profissional Parceiro somente poderá realizá-lo quando preencher os requisitos aplicáveis.
1.5. Nenhum Profissional Parceiro poderá realizar, em nome da Larsana Care, ato para o qual não possua competência legal, técnica ou profissional, ainda que solicitado pelo Paciente, Responsável, familiar ou terceiro.
1.6. Sempre que identificar necessidade que ultrapasse sua competência profissional, o Profissional Parceiro deverá orientar o Paciente ou Responsável quanto à necessidade de avaliação ou acompanhamento por profissional ou serviço adequado.
1.7. A atuação multiprofissional deverá respeitar a autonomia e as competências próprias de cada categoria, buscando a segurança, continuidade e integralidade do cuidado.
1.8. A Larsana Care atua como plataforma de intermediação e organização da relação entre Pacientes e Profissionais Parceiros, não assumindo a execução direta dos atos técnicos próprios das profissões regulamentadas.
1.9. A Larsana Care poderá realizar procedimentos de cadastro, verificação documental e validação de requisitos para ingresso e permanência dos Profissionais Parceiros em sua rede, incluindo, quando aplicável, a verificação de registro profissional e de documentos ou habilitações exigidos pela Plataforma.
1.10. Essas verificações não correspondem à supervisão clínica individual dos atendimentos nem substituem a responsabilidade do Profissional Parceiro pela manutenção de sua regularidade profissional, competência, capacitação, habilitações e aptidão para a realização de cada ato ou procedimento.
1.11. Compete ao Profissional Parceiro avaliar, antes e durante o atendimento, se possui competência técnica e profissional e, quando aplicável, habilitação específica para realizar a conduta proposta, bem como reconhecer os limites de sua atuação e recusar procedimentos que ultrapassem sua competência ou que não possam ser realizados com segurança.
1.12. A responsabilidade técnica pelos atos profissionais, avaliações, diagnósticos próprios de cada profissão, prescrições, condutas, procedimentos e decisões assistenciais caberá ao Profissional Parceiro que os realizar, observadas as responsabilidades próprias da Larsana Care decorrentes da atividade de intermediação, da operação da Plataforma e das demais obrigações que legal ou contratualmente lhe sejam atribuídas.
2. FISIOTERAPEUTA
2.1. Identificação profissional
O Fisioterapeuta deverá possuir formação em Fisioterapia e registro profissional regular perante o Conselho Regional de Fisioterapia e Terapia Ocupacional — CREFITO competente.
2.2. Escopo geral de atuação
Dentro de sua competência profissional e das normas aplicáveis, o Fisioterapeuta poderá realizar avaliação físico-funcional do Paciente, identificar alterações relacionadas ao movimento e à funcionalidade, estabelecer objetivos fisioterapêuticos, planejar e executar intervenções próprias da Fisioterapia, acompanhar a evolução funcional, realizar reavaliações e definir a continuidade ou alta fisioterapêutica.
Poderá utilizar técnicas, exercícios, recursos terapêuticos e demais procedimentos reconhecidos no âmbito da Fisioterapia, desde que possua competência e, quando exigível, habilitação específica para sua utilização.
2.3. Autonomia profissional
A avaliação e a definição da conduta fisioterapêutica serão realizadas pelo próprio Fisioterapeuta, no exercício de sua autonomia técnica, respeitados os limites legais e profissionais de sua atuação.
A existência de diagnóstico, relatório ou encaminhamento de outro profissional poderá contribuir para o atendimento, mas não substitui a avaliação físico-funcional realizada pelo Fisioterapeuta.
2.4. Limites de atuação
O Fisioterapeuta não deverá praticar atos legalmente reservados a outra profissão ou para os quais não possua formação, competência ou habilitação adequada.
Quando identificar sinais, sintomas ou condições que demandem investigação ou intervenção de outro profissional de saúde, deverá orientar o Paciente ou Responsável quanto à necessidade de avaliação apropriada.
3. PROFISSIONAL DE EDUCAÇÃO FÍSICA
3.1. Identificação profissional
O Profissional de Educação Física deverá possuir formação compatível com sua atuação e registro profissional regular perante o Conselho Regional de Educação Física — CREF competente.
3.2. Escopo geral de atuação
Dentro de sua competência profissional, poderá planejar, prescrever, orientar, acompanhar e avaliar atividades e exercícios físicos, considerando as condições gerais de saúde, objetivos e características individuais do paciente.
Sua atuação poderá estar relacionada, entre outras finalidades compatíveis com sua profissão, à promoção da saúde, condicionamento físico, manutenção ou desenvolvimento das capacidades físicas, autonomia, qualidade de vida e adoção de estilo de vida fisicamente ativo.
3.3. Segurança e individualização
O programa de exercícios deverá considerar as condições do Paciente, seus objetivos e eventuais informações, limitações ou restrições relevantes conhecidas pelo profissional.
Quando identificar condição que possa comprometer a segurança da prática ou que necessite de avaliação por outro profissional, deverá orientar o Paciente ou Responsável adequadamente.
3.4. Limites de atuação
No âmbito dos serviços intermediados pela Larsana Care, o Profissional de Educação Física não será responsável pela realização de tratamento fisioterapêutico nem deverá substituir atos próprios de outras profissões regulamentadas.
A existência de doença, lesão ou condição de saúde não autoriza, por si só, a realização de procedimentos pertencentes a outra categoria profissional.
4. MÉDICO
4.1. Identificação profissional
O Médico deverá possuir formação em Medicina e inscrição profissional regular perante o Conselho Regional de Medicina — CRM competente.
4.2. Escopo geral de atuação
O Médico poderá realizar consultas e avaliações médicas, formular hipóteses diagnósticas e diagnósticos, estabelecer prognóstico, indicar medidas preventivas e terapêuticas, solicitar e avaliar exames, prescrever medicamentos e tratamentos e praticar os demais atos compatíveis com sua competência profissional.
4.3. Informação e decisão do Paciente
O Médico deverá fornecer ao Paciente ou ao seu representante as informações pertinentes à assistência prestada, incluindo, quando aplicável, diagnóstico, prognóstico, objetivos, benefícios e riscos relevantes das condutas propostas, respeitando os direitos e a autonomia do Paciente.
4.4. Limites de atuação
O Médico deverá atuar dentro de sua competência e qualificação profissional, reconhecendo os limites de sua atuação e encaminhando ou solicitando avaliação de outro profissional quando necessário.
A condição de Médico não significa habilitação automática para toda especialidade, técnica ou procedimento existente na Medicina, devendo ser observados os requisitos específicos aplicáveis.
5. NUTRICIONISTA
5.1. Identificação profissional
O Nutricionista deverá possuir formação em Nutrição e registro profissional regular perante o Conselho Regional de Nutrição — CRN competente.
5.2. Escopo geral de atuação
O Nutricionista poderá realizar avaliação relacionada à alimentação e ao estado nutricional, prestar assistência e educação nutricional, estabelecer objetivos nutricionais, elaborar orientações e planos alimentares e realizar acompanhamento nutricional.
Quando aplicável à condição do Paciente e dentro de sua competência, poderá prestar assistência dietoterápica, incluindo prescrição, planejamento, análise, supervisão e avaliação de dietas.
5.3. Acompanhamento
O plano nutricional poderá ser revisto de acordo com a evolução do Paciente, alterações da condição de saúde, objetivos estabelecidos e demais informações relevantes ao acompanhamento.
5.4. Limites de atuação
O Nutricionista não deverá realizar atos reservados a outras profissões nem substituir avaliação ou tratamento médico quando estes forem necessários.
A identificação de sinais, sintomas ou condições que demandem investigação ou tratamento por outro profissional deverá resultar na orientação adequada ao Paciente ou Responsável.
6. CIRURGIÃO-DENTISTA
6.1. Identificação profissional
O Cirurgião-Dentista deverá possuir formação em Odontologia e inscrição profissional regular perante o Conselho Regional de Odontologia — CRO competente.
6.2. Escopo geral de atuação
Dentro dos limites de sua formação e habilitação, o Cirurgião-Dentista poderá realizar avaliação odontológica e praticar os atos pertinentes à Odontologia.
Poderá estabelecer condutas odontológicas, executar procedimentos compatíveis com sua atuação, prescrever e aplicar medicamentos indicados em Odontologia, utilizar anestesia quando legalmente permitida e praticar os demais atos autorizados pela legislação profissional.
6.3. Atendimento e planejamento
O Cirurgião-Dentista será responsável pela avaliação e indicação dos procedimentos odontológicos apropriados ao Paciente, observadas suas condições clínicas, necessidades e os limites de sua atuação profissional.
6.4. Atendimento domiciliar e limites de atuação
Determinados procedimentos poderão exigir formação, especialidade, habilitação, estrutura, equipamentos ou condições assistenciais específicas.
A disponibilização de atendimento odontológico pela Larsana Care não significa que qualquer procedimento odontológico possa ser realizado em ambiente domiciliar.
O profissional deverá avaliar previamente se o procedimento pretendido pode ser realizado com segurança no ambiente disponível e, quando necessário, orientar o Paciente a procurar estabelecimento ou serviço adequado.
7. FONOAUDIÓLOGO
7.1. Identificação profissional
O Fonoaudiólogo deverá possuir formação em Fonoaudiologia e registro profissional regular perante o Conselho Regional de Fonoaudiologia — CREFONO competente.
7.2. Escopo geral de atuação
Dentro de sua competência profissional e observadas sua formação, habilitações e as normas aplicáveis, o Fonoaudiólogo poderá realizar avaliação, diagnóstico fonoaudiológico, planejamento, orientação, acompanhamento e intervenção relacionados às áreas próprias da Fonoaudiologia.
Sua atuação poderá abranger, conforme as necessidades do Paciente e a competência do profissional, aspectos relacionados à comunicação, linguagem oral e escrita, fala, voz, audição, funções orofaciais, mastigação e deglutição, entre outras áreas reconhecidas da atuação fonoaudiológica.
7.3. Planejamento e acompanhamento
O Fonoaudiólogo será responsável pela avaliação fonoaudiológica e pela definição das condutas próprias de sua área de atuação, podendo estabelecer objetivos terapêuticos, realizar intervenções, acompanhar a evolução do Paciente, realizar reavaliações e modificar o plano de atendimento quando tecnicamente necessário.
Quando identificar sinais, sintomas ou condições que demandem avaliação, diagnóstico ou intervenção pertencentes a outra área profissional, deverá orientar o Paciente ou Responsável quanto à necessidade de acompanhamento apropriado.
7.4. Limites de atuação
O Fonoaudiólogo não deverá praticar atos reservados a outras profissões nem realizar técnicas ou procedimentos para os quais não possua competência, formação ou habilitação adequada.
A realização de procedimentos específicos deverá respeitar as condições clínicas do Paciente, a competência individual do profissional e as exigências legais, técnicas e profissionais aplicáveis.
8. PSICÓLOGO
8.1. Identificação profissional
O Psicólogo deverá possuir formação em Psicologia e inscrição profissional regular perante o Conselho Regional de Psicologia — CRP competente.
8.2. Escopo geral de atuação
Dentro de sua competência profissional e observadas as normas aplicáveis, o Psicólogo poderá realizar avaliação psicológica, acompanhamento psicológico, intervenções psicológicas, orientação e demais atividades reconhecidas no âmbito da Psicologia.
Quando compatível com o serviço contratado e com sua qualificação profissional, sua atuação poderá abranger aspectos relacionados à saúde mental, comportamento, emoções, enfrentamento de condições de saúde, processos de adoecimento e reabilitação, envelhecimento, perdas, mudanças de funcionalidade, relações familiares e demais situações pertinentes à atuação psicológica.
8.3. Avaliação e acompanhamento
A definição das técnicas, métodos, instrumentos e estratégias de intervenção psicológica será de responsabilidade do Psicólogo, de acordo com sua avaliação profissional, formação e necessidades identificadas durante o acompanhamento.
Quando houver necessidade de avaliação ou tratamento pertencente a outra área profissional, o Psicólogo deverá orientar o Paciente ou Responsável quanto à busca do atendimento adequado.
8.4. Sigilo profissional
As informações obtidas durante o atendimento psicológico estarão sujeitas aos deveres éticos e profissionais de sigilo e confidencialidade aplicáveis à Psicologia, ressalvadas as hipóteses em que o compartilhamento, comunicação ou quebra de sigilo sejam permitidos ou exigidos pela legislação e pelas normas profissionais aplicáveis.
8.5. Limites de atuação
O Psicólogo não deverá praticar atos reservados a outras profissões ou para os quais não possua competência profissional.
A atuação psicológica não autoriza a prescrição de medicamentos nem a realização de atos médicos ou de outros procedimentos pertencentes a profissões distintas.
9. ENFERMEIRO
9.1. Identificação profissional
O Enfermeiro deverá possuir formação em Enfermagem e inscrição profissional regular perante o Conselho Regional de Enfermagem — COREN competente.
9.2. Escopo geral de atuação
O Enfermeiro poderá realizar assistência de Enfermagem de acordo com sua competência legal e profissional, incluindo avaliação das necessidades de Enfermagem, planejamento, organização, execução e avaliação dos cuidados prestados ao Paciente.
Dentro dos limites legais e profissionais aplicáveis, poderá realizar consulta de Enfermagem, prescrição da assistência de Enfermagem, cuidados de maior complexidade técnica e demais atividades e procedimentos próprios de sua profissão.
9.3. Assistência domiciliar
No atendimento domiciliar, o Enfermeiro poderá avaliar as necessidades de cuidado, elaborar e acompanhar o planejamento da assistência de Enfermagem, executar procedimentos compatíveis com sua competência profissional, orientar o Paciente, familiares e cuidadores e acompanhar a evolução relacionada aos cuidados de Enfermagem.
Quando Técnicos ou Auxiliares de Enfermagem integrarem a assistência, caberá ao Enfermeiro exercer a orientação e supervisão exigidas pela legislação e pelas normas profissionais aplicáveis.
9.4. Segurança e condições para realização dos procedimentos
A realização de procedimentos no ambiente domiciliar dependerá da avaliação das condições clínicas do Paciente, da competência e capacitação do profissional, da existência de prescrição ou indicação quando legalmente necessária, dos materiais e recursos disponíveis e das condições adequadas de segurança para sua execução.
Quando o ambiente domiciliar ou a condição do Paciente não oferecer segurança adequada para determinado procedimento, o Enfermeiro poderá deixar de realizá-lo e orientar o Paciente ou Responsável quanto à procura de serviço apropriado.
9.5. Limites de atuação
O Enfermeiro deverá atuar dentro de sua competência profissional e não deverá realizar atos legalmente reservados a outras profissões ou procedimentos para os quais não possua capacitação ou condições adequadas de segurança.
10. TÉCNICO DE ENFERMAGEM E AUXILIAR DE ENFERMAGEM
10.1. Identificação profissional
O Técnico de Enfermagem e o Auxiliar de Enfermagem deverão possuir formação correspondente às respectivas categorias e inscrição profissional regular perante o Conselho Regional de Enfermagem — COREN competente.
10.2. Natureza da atuação
O Técnico de Enfermagem e o Auxiliar de Enfermagem integram a equipe de Enfermagem, porém possuem atribuições próprias e distintas das atribuições do Enfermeiro.
A atuação de cada categoria deverá respeitar sua formação, competência legal e profissional e ocorrer sob orientação e supervisão do Enfermeiro nos termos exigidos pela legislação e pelas normas profissionais aplicáveis.
10.3. Técnico de Enfermagem
Dentro de sua competência profissional, o Técnico de Enfermagem poderá participar da assistência de Enfermagem e executar cuidados, ações e procedimentos compatíveis com sua formação e com as atribuições legalmente estabelecidas para sua categoria.
O Técnico de Enfermagem não poderá assumir atividades legalmente privativas do Enfermeiro.
10.4. Auxiliar de Enfermagem
O Auxiliar de Enfermagem poderá executar atividades de Enfermagem compatíveis com sua formação e com as atribuições legalmente estabelecidas para sua categoria, observados os limites próprios de sua atuação.
O Auxiliar de Enfermagem não poderá assumir atribuições legalmente reservadas ao Enfermeiro ou atividades que ultrapassem as competências estabelecidas para sua categoria.
10.5. Atendimento domiciliar
A realização de cuidados e procedimentos de Enfermagem no domicílio dependerá das necessidades do Paciente, da competência da categoria profissional responsável pela execução, da orientação e supervisão aplicáveis e da existência de condições adequadas de segurança.
O fato de determinado procedimento poder ser realizado por profissional de Enfermagem não significa que possa ser executado indistintamente por Enfermeiro, Técnico de Enfermagem ou Auxiliar de Enfermagem, devendo ser respeitadas as atribuições específicas de cada categoria.
10.6. Limites de atuação
O Técnico e o Auxiliar de Enfermagem não possuem as mesmas atribuições profissionais do Enfermeiro e não poderão assumir atos que sejam legalmente privativos deste profissional.
Também não poderão executar atos pertencentes a outras profissões ou procedimentos para os quais não possuam competência, capacitação, supervisão exigível ou condições adequadas de segurança.
11. CUIDADOR
11.1. Natureza da atividade
Para fins dos serviços intermediados pela Larsana Care, o Cuidador atua no auxílio às atividades cotidianas, conforto, segurança, autonomia e bem-estar da pessoa cuidada.
A atuação do Cuidador não substitui a assistência prestada por profissionais de saúde legalmente habilitados e não lhe confere competência para executar atos profissionais reservados a categorias regulamentadas.
A contratação de serviço de Cuidador não corresponde à contratação de assistência de Enfermagem. O Cuidador não se equipara ao Enfermeiro, Técnico de Enfermagem ou Auxiliar de Enfermagem e não poderá assumir procedimentos ou responsabilidades profissionais atribuídos a essas categorias, ainda que possua experiência prévia no cuidado de pessoas ou que sua realização seja solicitada pelo Paciente, Responsável ou familiar.
11.2. Atividades de cuidado cotidiano
Observadas as necessidades da pessoa cuidada e as condições estabelecidas para o serviço, o Cuidador poderá auxiliar, entre outras atividades compatíveis com sua função:
a) higiene pessoal e cuidados cotidianos;
b) banho, troca de roupas, troca de fraldas e auxílio nas necessidades de higiene;
c) alimentação e hidratação, observadas as orientações previamente estabelecidas;
d) organização da rotina diária da pessoa cuidada;
e) mobilidade, locomoção e transferências compatíveis com sua capacitação e com as orientações recebidas;
f) mudanças de posição e medidas de conforto que não constituam procedimento técnico privativo de profissional de saúde;
g) companhia, escuta, acolhimento e estímulo à autonomia;
h) atividades de lazer e ocupacionais compatíveis com as condições da pessoa cuidada;
i) medidas cotidianas de prevenção de quedas e organização segura do ambiente;
j) observação de alterações no estado geral da pessoa cuidada;
k) comunicação de alterações relevantes à família, Responsável e/ou equipe de saúde;
l) acompanhamento em atividades e compromissos previamente definidos, quando fizerem parte do serviço contratado; e
m) auxílio no cumprimento de orientações previamente estabelecidas por profissionais de saúde habilitados, desde que a atividade não constitua procedimento privativo de outra profissão.
11.3. Medicamentos
O Cuidador poderá auxiliar na rotina de medicamentos previamente prescritos e organizados, observadas as orientações fornecidas pelo profissional de saúde responsável e as regras operacionais estabelecidas para o serviço.
O Cuidador não poderá, por iniciativa própria:
a) prescrever medicamentos;
b) indicar novos medicamentos;
c) modificar doses;
d) alterar horários;
e) substituir medicamentos;
f) suspender medicamentos;
g) decidir pela utilização de medicamento de uso condicionado ou “se necessário” sem que existam orientação e critérios previamente estabelecidos pelo profissional responsável; ou
h) realizar administração por via ou técnica que demande atuação de profissional de saúde legalmente habilitado.
Dúvidas, recusas, efeitos adversos, alterações do estado de saúde ou dificuldades relacionadas à medicação deverão ser comunicados ao Responsável e/ou ao profissional de saúde competente.
11.4. Exercícios, mobilidade e orientações terapêuticas
O Cuidador poderá auxiliar a pessoa cuidada na realização de atividades ou rotinas de mobilidade previamente orientadas por profissional habilitado, quando isso puder ser feito com segurança e estiver dentro de sua capacitação.
O Cuidador não poderá elaborar, prescrever ou modificar, por iniciativa própria, programa de exercícios terapêuticos, tratamento fisioterapêutico ou programa profissional de exercício físico.
Sua atuação, quando houver orientação de Fisioterapeuta, Profissional de Educação Física ou outro profissional competente, limitar-se-á ao auxílio compatível com sua função, sem substituir a atuação do profissional responsável.
11.5. Alimentação
O Cuidador poderá preparar, organizar, oferecer ou auxiliar na alimentação e hidratação da pessoa cuidada de acordo com a rotina estabelecida.
Quando houver dieta, consistência alimentar, restrição ou orientação nutricional específica, o Cuidador deverá seguir as orientações previamente estabelecidas pelos profissionais responsáveis.
O Cuidador não poderá prescrever dietas, modificar por iniciativa própria dietas terapêuticas ou substituir a avaliação e o acompanhamento do Nutricionista ou de outro profissional competente.
11.6. Atividades não autorizadas ao Cuidador no âmbito da Larsana Care
Independentemente de solicitação do Paciente, Responsável ou familiar, o Cuidador não deverá:
a) realizar diagnóstico de doença ou condição de saúde;
b) prescrever ou definir tratamentos;
c) prescrever, alterar, suspender ou substituir medicamentos;
d) prescrever dieta ou tratamento nutricional;
e) prescrever ou modificar tratamento fisioterapêutico ou programa profissional de exercícios;
f) realizar procedimentos invasivos;
g) realizar curativos ou outros procedimentos técnicos de Enfermagem;
h) administrar medicamentos por vias ou técnicas que demandem profissional legalmente habilitado;
i) instalar, modificar ou manejar terapias e dispositivos que exijam conhecimento técnico-profissional específico, ressalvados atos cotidianos de auxílio expressamente autorizados e compatíveis com sua função;
j) realizar procedimentos que exijam avaliação, julgamento ou conhecimento técnico-científico próprio de profissão de saúde regulamentada; ou
k) apresentar-se ou atuar como substituto de Médico, Enfermeiro, Técnico ou Auxiliar de Enfermagem, Fisioterapeuta, Nutricionista, Fonoaudiólogo, Psicólogo, Profissional de Educação Física, Cirurgião-Dentista ou outro profissional de saúde.
11.7. Alterações no estado de saúde
O Cuidador deverá comunicar ao Responsável e/ou à equipe de saúde alterações relevantes observadas na condição da pessoa cuidada.
O Cuidador não deverá estabelecer diagnóstico ou decidir tratamento a partir das alterações observadas.
Em situações que indiquem possível urgência ou emergência, deverá ser acionado o serviço de emergência competente ou adotada outra medida adequada às circunstâncias, não devendo o Cuidador assumir avaliação, decisão clínica ou procedimento que ultrapasse os limites de sua atuação.
12. HABILITAÇÕES, ESPECIALIDADES E PROCEDIMENTOS ESPECÍFICOS
12.1. Alguns serviços, técnicas e procedimentos poderão exigir especialidade, habilitação, formação complementar, certificação, experiência, estrutura, equipamentos ou outro requisito específico.
12.2. A Larsana Care poderá estabelecer critérios adicionais de habilitação para determinadas categorias de atendimento dentro de sua rede de Profissionais Parceiros, sem prejuízo dos requisitos estabelecidos pela legislação e pelos respectivos Conselhos Profissionais.
12.3. O cadastro ou aprovação do Profissional Parceiro na Plataforma não representa autorização irrestrita para execução de qualquer procedimento relacionado à sua profissão.
12.4. O Profissional Parceiro deverá recusar a realização de procedimento para o qual não possua competência, habilitação ou condições adequadas de segurança.
12.5. A Larsana Care poderá restringir internamente a disponibilização de determinadas técnicas, procedimentos ou modalidades de atendimento em sua rede, inclusive quando a categoria profissional possuir competência legal para realizá-los, sempre que a Plataforma estabelecer requisitos adicionais de segurança, qualificação ou organização assistencial.
13. ATUAÇÃO MULTIPROFISSIONAL
13.1. O Paciente poderá ser acompanhado por profissionais de diferentes áreas quando suas necessidades demandarem atuação multiprofissional.
13.2. A atuação conjunta não transfere competências entre as categorias profissionais.
13.3. A orientação emitida por determinado profissional não autoriza outro profissional ou Cuidador a executar ato que esteja fora de sua própria competência.
13.4. Sempre que necessário, poderá ser recomendada avaliação ou acompanhamento por outro profissional ou serviço de saúde.
13.5. Cada Profissional Parceiro permanecerá responsável pelos atos técnicos e registros assistenciais referentes aos atendimentos que efetivamente realizar.
14. AUTONOMIA E SEGURANÇA DO PACIENTE
14.1. O Paciente ou Responsável poderá solicitar informações sobre a categoria profissional, registro, função e finalidade do atendimento que será realizado.
14.2. O Paciente poderá solicitar esclarecimentos sobre a técnica, conduta ou procedimento proposto antes de sua realização.
14.3. O Paciente poderá recusar procedimento ou conduta, observadas as consequências assistenciais que deverão ser esclarecidas pelo profissional responsável, quando aplicável.
14.4. Nenhuma disposição deste Anexo deverá ser interpretada como autorização para realização de ato contrário à legislação, às normas éticas ou às regras profissionais aplicáveis.
14.5. A contratação de determinado serviço por intermédio da Larsana Care não autoriza o Paciente, Responsável ou familiar a exigir do Profissional Parceiro a realização de procedimento que este considere tecnicamente inadequado, inseguro ou incompatível com sua competência profissional.
15. PREVALÊNCIA DAS NORMAS PROFISSIONAIS
15.1. As descrições constantes deste Anexo apresentam, de forma geral e acessível ao Paciente ou Responsável, os escopos e limites das categorias profissionais disponibilizadas pela Larsana Care.
15.2. As disposições deste Anexo não substituem, modificam ou ampliam as atribuições estabelecidas pela legislação, pelos Conselhos Profissionais ou pelas demais normas aplicáveis a cada categoria.
15.3. Em caso de alteração legislativa, regulamentar ou normativa relacionada às atribuições de determinada categoria, prevalecerão as disposições legais e profissionais vigentes.
15.4. Em caso de conflito entre este Anexo e norma legal, regulamentar, técnica ou ética aplicável à profissão, prevalecerá a norma aplicável.
15.5. A Larsana Care poderá atualizar este Anexo para refletir alterações legislativas, regulamentares, profissionais, assistenciais ou operacionais, observados os deveres de informação e, quando aplicável, de novo aceite.

Razão social: DELUMA Serviços de Saúde e Educação LTDACNPJ: 65.974.822/0001-19Endereço: Alameda Terracota, nº 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul/SP, CEP 09531-190Canal de atendimento: contato@larsanacare.com.br

ANEXO III — ESCOPO E LIMITES DE ATUAÇÃO DOS PROFISSIONAIS PARCEIROS LARSANA CAREVersão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'awareness'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('TCLE_FISIO', '1.0-2026-08', 'TCLE — Fisioterapia Domiciliar', $legal_body$TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA ATENDIMENTO FISIOTERAPÊUTICO DOMICILIAR — TCLE LARSANA CARE

-1424394986

Este Termo apresenta, de forma clara e acessível, as principais informações sobre o atendimento fisioterapêutico domiciliar intermediado pela Larsana Care, incluindo seus objetivos, possíveis benefícios, riscos, limites e direitos do Paciente.
Nosso compromisso é contribuir para uma relação de cuidado mais segura, transparente e consciente, respeitando a autonomia do Paciente e a responsabilidade técnica do profissional que realiza o atendimento.

1. FINALIDADE DO TERMO
1.1. O presente Termo de Consentimento Livre e Esclarecido — TCLE tem por finalidade registrar o consentimento do Paciente e/ou de seu representante legal para a realização de atendimento fisioterapêutico domiciliar intermediado pela Larsana Care, após o fornecimento das informações gerais necessárias à compreensão da natureza do atendimento, seus objetivos, possíveis benefícios, riscos, limitações e direitos do Paciente.
1.2. Este Termo deverá ser interpretado em conjunto com os Termos de Uso da Plataforma Larsana Care, a Política de Privacidade, o ANEXO III — ESCOPO E LIMITES DE ATUAÇÃO DOS PROFISSIONAIS PARCEIROS e os demais documentos aplicáveis ao serviço contratado.
1.3. O consentimento registrado neste Termo não substitui o dever do Fisioterapeuta de fornecer, durante o acompanhamento, informações e esclarecimentos relacionados à avaliação, às condutas propostas e às particularidades clínicas e funcionais do Paciente.
1.4. O aceite deste Termo não representa autorização irrestrita ou antecipada para a realização de qualquer técnica ou procedimento, permanecendo o Fisioterapeuta responsável por avaliar sua indicação, segurança e adequação ao Paciente.
2. NATUREZA DO ATENDIMENTO FISIOTERAPÊUTICO
2.1. O atendimento será realizado por Fisioterapeuta regularmente habilitado para o exercício profissional e com registro ativo perante o Conselho Regional de Fisioterapia e Terapia Ocupacional — CREFITO competente.
2.2. O Fisioterapeuta realizará avaliação físico-funcional do Paciente e, de acordo com os achados identificados, poderá estabelecer objetivos fisioterapêuticos e definir plano de atendimento compatível com suas necessidades, condições e evolução.
2.3. O acompanhamento poderá envolver, conforme avaliação e indicação do Fisioterapeuta, exercícios terapêuticos, treinamento funcional, orientações, técnicas manuais, recursos fisioterapêuticos, treino de mobilidade, equilíbrio, marcha, transferências, posicionamento, prevenção de complicações e outras intervenções reconhecidas no âmbito da Fisioterapia e compatíveis com a formação, competência e, quando aplicável, habilitação do profissional.
2.4. As técnicas, recursos e intervenções utilizados poderão ser modificados ao longo do acompanhamento de acordo com a resposta do Paciente, sua evolução, condições clínicas e funcionais, objetivos terapêuticos e avaliação profissional.
2.5. A definição das condutas fisioterapêuticas compete ao Fisioterapeuta responsável pelo atendimento, no exercício de sua autonomia técnica e dentro dos limites legais, regulamentares e éticos de sua profissão.
3. AVALIAÇÃO FISIOTERAPÊUTICA
3.1. O primeiro atendimento compreenderá avaliação fisioterapêutica destinada à identificação das condições físico-funcionais do Paciente, suas necessidades, limitações, capacidades, objetivos e demais elementos relevantes para definição da conduta fisioterapêutica inicial.
3.2. Durante a avaliação, o Fisioterapeuta poderá solicitar informações relacionadas ao histórico de saúde do Paciente, sintomas, doenças preexistentes, cirurgias, internações, quedas, medicamentos em uso, exames, tratamentos anteriores, dispositivos utilizados e outras informações relevantes para o planejamento e a segurança do atendimento.
3.3. O Paciente e/ou Responsável compromete-se a fornecer, de forma verdadeira e tão completa quanto possível, as informações relevantes de que tenha conhecimento, bem como comunicar alterações importantes da condição de saúde durante o acompanhamento.
3.4. Sempre que disponíveis e pertinentes, exames, relatórios, prescrições, encaminhamentos e demais documentos relacionados à condição de saúde do Paciente poderão contribuir para a avaliação e planejamento fisioterapêutico.
3.5. O plano fisioterapêutico poderá ser revisto, adaptado, suspenso ou interrompido pelo Fisioterapeuta quando houver alteração da condição do Paciente, resposta diferente da esperada, identificação de risco, contraindicação, ausência de condições seguras para continuidade ou necessidade de avaliação por outro profissional ou serviço de saúde.
4. POSSÍVEIS BENEFÍCIOS DO ATENDIMENTO
4.1. Dependendo da condição individual do Paciente e dos objetivos estabelecidos, o acompanhamento fisioterapêutico poderá contribuir para melhora, recuperação ou manutenção da mobilidade, força muscular, equilíbrio, coordenação, capacidade funcional, independência, condicionamento físico e participação nas atividades cotidianas.
4.2. O atendimento também poderá ter como objetivos, conforme o caso, controle de sintomas, prevenção ou redução de complicações, manutenção de capacidades existentes, orientação do Paciente e de seus familiares e promoção de maior segurança e autonomia funcional.
4.3. Os possíveis benefícios dependem de diversos fatores individuais, incluindo condição clínica e funcional, diagnóstico, idade, doenças associadas, adesão às orientações, frequência do acompanhamento, evolução da condição de saúde e resposta individual às intervenções.
4.4. Não existe garantia de cura, recuperação completa, resultado clínico ou funcional específico ou prazo determinado para obtenção de melhora.
5. RISCOS, DESCONFORTOS E POSSÍVEIS INTERCORRÊNCIAS
5.1. O Paciente e/ou Responsável declara estar ciente de que intervenções fisioterapêuticas, ainda que adequadamente indicadas e executadas, poderão ocasionar desconfortos ou respostas adversas relacionadas à própria condição do Paciente ou às atividades realizadas.
5.2. Conforme a condição do Paciente e as técnicas utilizadas, poderão ocorrer, entre outras manifestações compatíveis com a natureza do atendimento:
a) cansaço ou fadiga;
b) dor ou desconforto muscular transitório;
c) aumento temporário de sintomas;
d) tontura ou sensação de fraqueza;
e) alterações momentâneas de equilíbrio;
f) alterações de pressão arterial ou frequência cardíaca;
g) desconforto relacionado à mobilização, exercícios, posicionamento ou transferências; e
h) risco de quedas durante atividades que envolvam mobilidade, marcha, equilíbrio ou transferências.
5.3. A ocorrência e intensidade desses eventos poderão variar conforme as condições clínicas e funcionais do Paciente, doenças preexistentes, medicamentos em uso, características individuais e natureza das intervenções realizadas.
5.4. O Fisioterapeuta deverá adotar medidas compatíveis com sua atuação profissional para reduzir riscos previsíveis e poderá adaptar, interromper ou deixar de realizar determinada intervenção quando identificar condição que possa comprometer a segurança do Paciente.
5.5. O Paciente e/ou Responsável deverá informar imediatamente ao Fisioterapeuta a ocorrência de dor intensa, falta de ar, tontura importante, mal-estar, alteração súbita do estado geral ou qualquer outro sintoma relevante ocorrido antes, durante ou após o atendimento.
6. LIMITES DO ATENDIMENTO DOMICILIAR E SITUAÇÕES DE URGÊNCIA OU EMERGÊNCIA
6.1. Os atendimentos intermediados pela Larsana Care possuem caráter programado e não se destinam à prestação de assistência de urgência, emergência ou ao atendimento de situações que apresentem risco imediato à vida.
6.2. A Larsana Care não constitui serviço de pronto atendimento, emergência médica, atendimento pré-hospitalar ou resgate, e a presença de Profissional Parceiro no domicílio não substitui a utilização dos serviços apropriados quando houver situação de urgência ou emergência.
6.3. Caso, antes do atendimento programado, o Paciente apresente sinais ou sintomas que indiquem possível situação de urgência, emergência ou risco imediato à vida, o Paciente, Responsável ou familiar deverá procurar ou acionar diretamente o serviço de emergência competente, conforme as circunstâncias, não devendo aguardar a realização do atendimento fisioterapêutico.
6.4. Caso sinais de possível urgência ou emergência sejam identificados durante o atendimento, o Fisioterapeuta poderá interromper imediatamente a intervenção e orientar ou adotar, dentro dos limites de sua competência e conforme as circunstâncias, as medidas cabíveis para encaminhamento ou acionamento do serviço apropriado.
6.5. O atendimento fisioterapêutico domiciliar somente será realizado quando existirem condições consideradas adequadas e seguras para sua execução.
6.6. O Fisioterapeuta poderá deixar de realizar ou interromper determinada técnica, exercício, procedimento ou atendimento quando considerar que as condições clínicas do Paciente, as condições do ambiente domiciliar, os equipamentos ou recursos disponíveis ou qualquer outra circunstância representem risco incompatível com a assistência proposta.
6.7. Quando identificar sinais, sintomas ou condições que demandem investigação, diagnóstico, tratamento ou intervenção de outro profissional ou estabelecimento de saúde, o Fisioterapeuta deverá orientar o Paciente e/ou Responsável quanto à necessidade de avaliação apropriada.
7. ATENDIMENTOS FISIOTERAPÊUTICOS CARDIORRESPIRATÓRIOS
7.1. Em razão das características específicas dos atendimentos fisioterapêuticos na área cardiorrespiratória, a Larsana Care adota critérios adicionais para habilitação interna dos Profissionais Parceiros que pretendam receber demandas classificadas nessa categoria.
7.2. Além da verificação dos requisitos gerais de cadastro e regularidade profissional, o Fisioterapeuta que solicitar habilitação para atendimentos classificados pela Larsana Care como cardiorrespiratórios deverá passar por validação adicional de cadastro, mediante apresentação de documentação que demonstre formação, capacitação, especialização e/ou experiência profissional compatível com essa modalidade de atendimento, de acordo com os critérios vigentes da Plataforma.
7.3. A habilitação interna para a categoria cardiorrespiratória não representa garantia irrestrita da capacidade técnica do profissional para qualquer situação, técnica ou procedimento, permanecendo sob responsabilidade do próprio Fisioterapeuta avaliar sua competência, a indicação da intervenção e as condições de segurança de cada atendimento.
7.4. A validação adicional realizada pela Larsana Care não corresponde à supervisão clínica individual dos atendimentos nem transfere à Plataforma a responsabilidade técnica pelos atos praticados pelo Fisioterapeuta.
7.5. A disponibilização de atendimento fisioterapêutico cardiorrespiratório não altera a natureza programada dos serviços intermediados pela Larsana Care e não transforma a Plataforma ou o Profissional Parceiro em serviço de urgência ou emergência.
7.6. Caso o Paciente apresente condição de instabilidade, sinais de possível urgência ou emergência ou situação incompatível com a segurança do atendimento fisioterapêutico domiciliar programado, deverá ser orientada a procura ou o acionamento do serviço de saúde adequado.
8. AUTONOMIA E DIREITOS DO PACIENTE
8.1. O Paciente tem direito de receber informações compreensíveis relacionadas ao atendimento fisioterapêutico, incluindo sua condição físico-funcional, objetivos do acompanhamento, condutas propostas e riscos e benefícios relevantes.
8.2. O Paciente e/ou Responsável poderá realizar perguntas e solicitar esclarecimentos antes e durante o acompanhamento.
8.3. O Paciente poderá participar das decisões relacionadas ao seu acompanhamento fisioterapêutico e poderá aceitar ou recusar determinada técnica, procedimento ou conduta proposta.
8.4. O consentimento para o atendimento fisioterapêutico é voluntário e poderá ser retirado a qualquer momento, sem represália, devendo ser esclarecidas, quando aplicável, as possíveis consequências assistenciais decorrentes da recusa ou interrupção.
8.5. A recusa do Paciente a determinada técnica ou procedimento deverá ser respeitada, sem prejuízo de o Fisioterapeuta esclarecer quando a recusa impossibilitar, limitar ou modificar o plano fisioterapêutico proposto.
8.6. Quando determinado procedimento, técnica ou circunstância exigir esclarecimento ou consentimento específico em razão de suas características, riscos ou normas aplicáveis, o Fisioterapeuta deverá fornecer as informações necessárias e obter o consentimento correspondente antes de sua realização.
9. AUTONOMIA E RESPONSABILIDADE DO FISIOTERAPEUTA
9.1. O Fisioterapeuta possui autonomia técnica para avaliar o Paciente e definir as condutas fisioterapêuticas compatíveis com sua competência profissional, respeitados os limites legais, regulamentares, técnicos e éticos aplicáveis.
9.2. O Fisioterapeuta é responsável pelos atos técnicos e assistenciais que efetivamente praticar, pelas decisões profissionais adotadas durante o atendimento e pelos respectivos registros assistenciais.
9.3. Compete ao Fisioterapeuta avaliar, antes e durante o atendimento, se possui formação, competência, capacitação e, quando exigível, habilitação adequada para a realização da técnica ou procedimento pretendido.
9.4. O Fisioterapeuta poderá e deverá recusar ou interromper técnica ou procedimento que considere contraindicado, inseguro ou incompatível com sua formação, competência ou habilitação, ainda que solicitado pelo Paciente, Responsável, familiar ou terceiro.
9.5. Quando as necessidades do Paciente ultrapassarem os limites de sua atuação, o Fisioterapeuta deverá orientar quanto à necessidade de avaliação ou acompanhamento por outro profissional ou serviço apropriado.
10. PAPEL DA LARSANA CARE
10.1. A Larsana Care atua como plataforma de intermediação e organização da relação entre Pacientes e Profissionais Parceiros, não assumindo a execução direta dos atos técnicos próprios da Fisioterapia.
10.2. A Larsana Care poderá estabelecer critérios para ingresso e permanência dos Fisioterapeutas em sua rede, bem como realizar verificações cadastrais e documentais, incluindo, quando aplicável, identidade, registro profissional, regularidade cadastral, certificados, habilitações e demais documentos exigidos pela Plataforma.
10.3. A verificação cadastral e documental realizada pela Larsana Care não constitui certificação ou garantia irrestrita da capacidade técnica do Fisioterapeuta para todo e qualquer procedimento relacionado à sua profissão.
10.4. A Larsana Care não realiza supervisão clínica individual ou em tempo real dos atos praticados pelo Fisioterapeuta e não interfere indevidamente em sua autonomia técnica para definição das condutas assistenciais próprias de sua competência.
10.5. O disposto nesta Seção não impede que a Larsana Care adote mecanismos de qualidade, segurança, auditoria, verificação documental, acompanhamento operacional e critérios internos para permanência dos Profissionais Parceiros em sua rede.
10.6. Permanecem sob responsabilidade da Larsana Care as obrigações que lhe sejam legal ou contratualmente atribuídas em razão de sua própria atuação como intermediadora e operadora da Plataforma.
11. REGISTROS ASSISTENCIAIS E INFORMAÇÕES DE SAÚDE
11.1. As informações relacionadas à avaliação, evolução e demais registros assistenciais poderão ser registradas na Plataforma Larsana Care para finalidades relacionadas à prestação, continuidade, segurança e documentação da assistência.
11.2. Os registros assistenciais deverão ser realizados pelo profissional responsável pelo atendimento, de acordo com as normas legais, éticas e profissionais aplicáveis.
11.3. As informações relacionadas à saúde do Paciente constituem dados pessoais sensíveis e serão tratadas de acordo com a legislação aplicável e com a Política de Privacidade da Larsana Care.
11.4. O Paciente e/ou seu representante poderá exercer os direitos relacionados aos seus dados pessoais e registros assistenciais nos termos da legislação aplicável.
11.5. O presente TCLE não constitui autorização para utilização da imagem, voz, fotografia, vídeo ou depoimento do Paciente para fins publicitários, promocionais, comerciais ou institucionais, os quais dependerão de autorização específica e independente, quando aplicável.
12. PARTICIPAÇÃO DO PACIENTE E/OU RESPONSÁVEL
12.1. Para contribuir com a segurança e adequada condução do acompanhamento, o Paciente e/ou Responsável deverá fornecer informações verdadeiras e relevantes sobre a condição de saúde do Paciente.
12.2. Deverá comunicar ao Fisioterapeuta alterações relevantes ocorridas entre os atendimentos, incluindo internações, quedas, novos sintomas, alterações de medicamentos, novos diagnósticos, procedimentos médicos, cirurgias ou outras intercorrências que possam interferir na segurança do atendimento.
12.3. O Paciente e/ou Responsável deverá informar ao profissional qualquer desconforto, dor, mal-estar ou dificuldade percebida durante a realização das atividades propostas.
12.4. Orientações para realização de exercícios ou atividades fora da presença do Fisioterapeuta deverão ser seguidas conforme as instruções recebidas, respeitando os limites e cuidados indicados pelo profissional.
13. AUSÊNCIA DE GARANTIA DE RESULTADO
13.1. O Paciente e/ou Responsável compreende que a Fisioterapia constitui assistência profissional cuja resposta pode variar de acordo com características individuais e com a evolução da condição de saúde.
13.2. A indicação e realização do acompanhamento fisioterapêutico não representam promessa ou garantia de cura, recuperação completa, ausência de complicações ou obtenção de resultado específico.
13.3. A evolução poderá ocorrer de forma diferente entre Pacientes submetidos a intervenções semelhantes, podendo existir situações de melhora, manutenção funcional, evolução parcial, ausência de resposta esperada ou necessidade de modificação da estratégia terapêutica.
14. CONSENTIMENTO E POSSIBILIDADE DE REVOGAÇÃO
14.1. O consentimento concedido por meio deste Termo permanecerá válido durante o acompanhamento fisioterapêutico, sem prejuízo do direito do Paciente de solicitar esclarecimentos adicionais ou rever sua decisão a qualquer momento.
14.2. O Paciente e/ou seu representante legal poderá retirar o consentimento para continuidade do acompanhamento fisioterapêutico, observadas as consequências assistenciais e as regras contratuais aplicáveis ao encerramento do serviço.
14.3. A retirada do consentimento não prejudicará a validade dos atendimentos, registros e tratamentos de dados legitimamente realizados anteriormente à manifestação de revogação, observada a legislação aplicável.
15. DECLARAÇÃO DE CONSENTIMENTO
Ao realizar o aceite deste Termo, o Paciente e/ou seu representante legal declara que:
a) teve acesso às informações apresentadas neste TCLE;
b) compreendeu a natureza e a finalidade geral do atendimento fisioterapêutico domiciliar;
c) teve ou terá oportunidade de solicitar ao Fisioterapeuta esclarecimentos sobre sua avaliação, plano de atendimento e condutas propostas;
d) compreende que o tratamento fisioterapêutico poderá envolver benefícios, riscos, desconfortos e limitações;
e) compreende que não existe garantia de resultado clínico ou funcional específico;
f) compreende que os atendimentos intermediados pela Larsana Care são programados e não constituem serviço de urgência ou emergência;
g) compreende que poderá recusar determinada conduta ou retirar seu consentimento para continuidade do acompanhamento, observadas as consequências assistenciais que lhe forem esclarecidas;
h) compromete-se a fornecer informações relevantes para a segurança do atendimento e comunicar alterações importantes de sua condição de saúde;
i) compreende que o Fisioterapeuta possui autonomia técnica e poderá recusar ou interromper intervenção que considere inadequada ou insegura;
j) compreende o papel da Larsana Care como intermediadora e que a responsabilidade técnica pelos atos fisioterapêuticos realizados cabe ao Profissional Parceiro que os praticar, sem prejuízo das responsabilidades próprias da Larsana Care; e
k) manifesta, de forma livre e esclarecida, seu consentimento para a realização do acompanhamento fisioterapêutico, dentro dos limites descritos neste Termo e das condutas individualmente esclarecidas pelo profissional responsável.
16. ACEITE ELETRÔNICO
16.1. O presente TCLE poderá ser aceito eletronicamente por meio da Plataforma Larsana Care, ficando o aceite vinculado ao Paciente e/ou representante legal correspondente.
16.2. A Plataforma poderá registrar elementos destinados à comprovação da manifestação de vontade, incluindo identificação do usuário, versão do documento, data, horário e demais elementos técnicos aplicáveis.
16.3. Quando o Paciente não possuir capacidade para manifestar validamente seu consentimento, o aceite deverá observar as regras aplicáveis à representação ou assistência.
16.4. Sempre que possível e compatível com sua capacidade de compreensão e manifestação, o próprio Paciente deverá participar das informações e decisões relacionadas ao seu atendimento, ainda que o consentimento formal seja prestado por representante legal.
16.5. O registro eletrônico do aceite integrará a documentação relacionada ao atendimento do Paciente.
Razão social: DELUMA Serviços de Saúde e Educação LTDACNPJ: 65.974.822/0001-19Endereço: Alameda Terracota, nº 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul/SP, CEP 09531-190Canal de atendimento: contato@larsanacare.com.br
TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA ATENDIMENTO FISIOTERAPÊUTICO DOMICILIAR — TCLE
Versão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('AUTORIZACAO_FAMILIAR', '1.0-2026-08', 'Autorização Familiar', $legal_body$TERMO DE RESPONSABILIDADE E AUTORIZAÇÃO DO FAMILIAR/RESPONSÁVEL LARSANA CARE

85726176284

Este Termo estabelece as condições aplicáveis ao Familiar ou Responsável que realiza o cadastro, solicita, contrata, organiza ou acompanha serviços da Larsana Care em benefício de outra pessoa.
O aceite eletrônico deste documento será vinculado aos dados informados no cadastro do Familiar/Responsável, especialmente nome completo e CPF, bem como aos registros eletrônicos correspondentes ao aceite.
1. FINALIDADE DO TERMO
1.1. O presente Termo tem por finalidade estabelecer as condições aplicáveis à atuação do Familiar ou Responsável perante a Larsana Care quando este solicitar, contratar, organizar ou acompanhar serviços destinados ao Paciente.
1.2. Para fins deste Termo, considera-se Familiar/Responsável a pessoa cadastrada na Plataforma que atua como contato perante a Larsana Care em relação ao atendimento de determinado Paciente.
1.3. A condição de Familiar/Responsável perante a Plataforma não significa, por si só, que o Paciente seja civilmente incapaz, nem atribui automaticamente ao Familiar/Responsável poderes de representação legal para todos os atos relacionados à saúde ou à vida civil do Paciente.
1.4. Quando determinado ato depender legalmente de representação, assistência, tutela, curatela, procuração ou outra condição jurídica específica, a Larsana Care poderá solicitar documentação adicional que comprove os poderes necessários.

2. VINCULAÇÃO AO PACIENTE
2.1. Ao realizar o aceite eletrônico deste Termo, o Familiar/Responsável declara possuir vínculo legítimo com o Paciente cadastrado e estar autorizado, dentro dos limites aplicáveis, a realizar as atividades relacionadas à organização do atendimento.
2.2. O Familiar/Responsável compromete-se a fornecer informações verdadeiras, corretas e atualizadas sobre sua identidade, seu vínculo com o Paciente e as informações necessárias à contratação e organização dos serviços.
2.3. A Larsana Care poderá solicitar informações ou documentos adicionais quando houver necessidade de confirmar a identidade do Familiar/Responsável, seu vínculo com o Paciente ou a legitimidade de determinada solicitação.

3. ORGANIZAÇÃO DO ATENDIMENTO
3.1. O Familiar/Responsável poderá atuar como contato perante a Larsana Care para assuntos relacionados à organização do serviço destinado ao Paciente.
3.2. Dentro dos limites aplicáveis, essa atuação poderá compreender:
a) solicitação inicial do atendimento;
b) recebimento de comunicações relacionadas ao serviço;
c) confirmação de datas e horários;
d) solicitação ou comunicação de reagendamentos e cancelamentos;
e) acompanhamento da agenda;
f) comunicação sobre indisponibilidades do Paciente;
g) recebimento de informações operacionais sobre substituição de Profissional Parceiro;
h) comunicação com a Larsana Care sobre questões administrativas relacionadas ao atendimento;
i) acompanhamento de questões financeiras relacionadas ao serviço contratado, quando aplicável; e
j) outras providências operacionais necessárias à organização e continuidade do atendimento.
3.3. As solicitações realizadas pelo Familiar/Responsável por meio de sua conta na Plataforma ou pelos canais oficiais disponibilizados pela Larsana Care poderão ser consideradas manifestações válidas para fins operacionais, observados os limites deste Termo.

4. AUTONOMIA DO PACIENTE
4.1. A existência de Familiar/Responsável cadastrado não retira ou reduz a autonomia do Paciente que possua capacidade para compreender e manifestar sua vontade.
4.2. Sempre que o Paciente puder manifestar validamente sua vontade, suas decisões relacionadas ao próprio atendimento e cuidado deverão ser consideradas e respeitadas.
4.3. O Familiar/Responsável não poderá utilizar sua condição perante a Plataforma para impor ao Paciente capaz tratamento, procedimento ou conduta contra sua vontade.
4.4. A organização administrativa ou financeira do atendimento pelo Familiar/Responsável não significa transferência automática para este do poder de consentir ou decidir sobre todos os atos assistenciais em nome do Paciente.
4.5. Quando o Paciente não puder manifestar validamente sua vontade e determinado ato exigir representação ou assistência legal, deverão ser observadas as regras legais aplicáveis e, quando necessário, apresentada documentação comprobatória.

5. PARTICIPAÇÃO NO ACOMPANHAMENTO
5.1. O Familiar/Responsável poderá participar das orientações e comunicações relacionadas ao atendimento quando sua participação for autorizada, legalmente permitida ou necessária à adequada organização e continuidade do cuidado.
5.2. O Profissional Parceiro poderá fornecer ao Familiar/Responsável orientações necessárias à segurança e continuidade do cuidado domiciliar, especialmente quando houver participação do Familiar/Responsável na rotina assistencial do Paciente.
5.3. A participação do Familiar/Responsável não autoriza interferência indevida na autonomia técnica do Profissional Parceiro.
5.4. O Familiar/Responsável não poderá exigir a realização de técnica, procedimento ou conduta que o Profissional Parceiro considere inadequada, contraindicada, insegura ou incompatível com sua competência profissional.

6. INFORMAÇÕES DE SAÚDE E CONFIDENCIALIDADE
6.1. Informações relacionadas à saúde do Paciente constituem dados pessoais sensíveis e estarão sujeitas às regras de confidencialidade, proteção de dados e sigilo profissional aplicáveis.
6.2. O cadastro como Familiar/Responsável não confere, por si só, acesso irrestrito a todas as informações, documentos ou registros assistenciais do Paciente.
6.3. O acesso ou compartilhamento de informações assistenciais com o Familiar/Responsável deverá observar a autorização do Paciente, quando necessária, a finalidade do compartilhamento, a legislação aplicável e as normas profissionais pertinentes.
6.4. Quando o Familiar/Responsável receber legitimamente informações relacionadas à saúde do Paciente, compromete-se a utilizá-las exclusivamente para finalidades relacionadas ao cuidado, acompanhamento ou organização do atendimento, preservando sua confidencialidade e privacidade.

7. INFORMAÇÕES FORNECIDAS PELO FAMILIAR/RESPONSÁVEL
7.1. Quando atuar na contratação ou acompanhamento do serviço, o Familiar/Responsável compromete-se a fornecer, de forma verdadeira e tão completa quanto possível, as informações de que tenha conhecimento e que sejam relevantes para a organização e segurança do atendimento.
7.2. O Familiar/Responsável deverá comunicar, quando tiver conhecimento, alterações relevantes que possam interferir no atendimento, incluindo internações, intercorrências, alterações importantes da condição de saúde, impossibilidade de realização da sessão ou outras circunstâncias pertinentes.
7.3. O Familiar/Responsável não deverá omitir intencionalmente informações relevantes que possam comprometer a segurança do Paciente ou do Profissional Parceiro durante o atendimento domiciliar.

8. SITUAÇÕES DE URGÊNCIA E EMERGÊNCIA
8.1. Os serviços intermediados pela Larsana Care possuem caráter programado e não constituem serviço de urgência, emergência, pronto atendimento ou atendimento pré-hospitalar.
8.2. Caso o Familiar/Responsável identifique situação que indique possível urgência, emergência ou risco imediato à vida do Paciente, deverá procurar ou acionar diretamente o serviço de emergência competente, conforme as circunstâncias, não devendo aguardar o atendimento programado pela Larsana Care.
8.3. A comunicação com a Larsana Care ou com o Profissional Parceiro não substitui o acionamento do serviço adequado em situações de urgência ou emergência.

9. RESPONSABILIDADE DO FAMILIAR/RESPONSÁVEL
9.1. O Familiar/Responsável é responsável pela veracidade das informações que fornecer diretamente à Larsana Care ou aos Profissionais Parceiros.
9.2. O Familiar/Responsável deverá utilizar sua conta e seus meios de acesso à Plataforma de forma pessoal e segura, não devendo permitir utilização indevida por terceiros.
9.3. O Familiar/Responsável deverá comunicar à Larsana Care alterações relevantes relacionadas ao seu vínculo com o Paciente ou à sua condição de contato responsável pelo atendimento.
9.4. Caso deixe de possuir autorização ou legitimidade para atuar em relação ao Paciente, deverá comunicar essa circunstância à Larsana Care.

10. TRATAMENTO DOS DADOS DO FAMILIAR/RESPONSÁVEL
10.1. Para identificação do Familiar/Responsável e vinculação deste Termo ao respectivo cadastro, a Larsana Care utilizará os dados fornecidos no processo de cadastramento, incluindo nome completo e CPF.
10.2. Esses dados poderão ser utilizados para identificação, autenticação, vinculação ao Paciente, organização do atendimento, registro das manifestações realizadas na Plataforma, cumprimento de obrigações legais ou contratuais, prevenção de fraudes e exercício regular de direitos.
10.3. O tratamento dos dados pessoais do Familiar/Responsável observará a legislação aplicável e a Política de Privacidade da Larsana Care.
10.4. O aceite deste Termo não representa autorização genérica para utilização dos dados pessoais para finalidades incompatíveis com aquelas informadas ao titular ou previstas na legislação aplicável.

11. ALTERAÇÃO OU ENCERRAMENTO DA CONDIÇÃO DE FAMILIAR/RESPONSÁVEL
11.1. A condição de Familiar/Responsável poderá ser alterada ou encerrada quando houver solicitação legítima do Paciente, do próprio Familiar/Responsável ou de representante legal, conforme aplicável.
11.2. A Larsana Care poderá solicitar comprovação adicional antes de realizar alteração que envolva acesso a informações, gestão do atendimento ou substituição da pessoa cadastrada como Familiar/Responsável.
11.3. A alteração ou encerramento da condição de Familiar/Responsável não prejudicará a validade dos atos legitimamente realizados durante o período em que a vinculação esteve ativa.

12. DECLARAÇÃO DO FAMILIAR/RESPONSÁVEL
Ao realizar o aceite eletrônico deste Termo, o Familiar/Responsável declara que:
a) os dados informados em seu cadastro são verdadeiros e correspondem à sua identidade;
b) possui vínculo legítimo com o Paciente ao qual seu cadastro está associado;
c) compreende que sua condição de Familiar/Responsável perante a Plataforma não significa automaticamente representação legal do Paciente para todos os atos;
d) compromete-se a respeitar a autonomia e a vontade do Paciente sempre que este puder manifestá-las validamente;
e) compromete-se a utilizar adequadamente as informações às quais tiver acesso em razão do acompanhamento;
f) compreende que informações de saúde do Paciente estão sujeitas a confidencialidade e proteção específica;
g) compromete-se a fornecer informações verdadeiras e relevantes para a organização e segurança do atendimento;
h) compreende que não poderá interferir indevidamente na autonomia técnica dos Profissionais Parceiros;
i) compreende que os serviços intermediados pela Larsana Care são programados e não constituem serviço de urgência ou emergência;
j) declara ter lido e compreendido este Termo; e
k) manifesta sua concordância com as condições aqui estabelecidas.

13. ACEITE ELETRÔNICO E IDENTIFICAÇÃO
13.1. Este Termo será formalizado por meio de aceite eletrônico realizado na Plataforma Larsana Care.
13.2. Para identificação da pessoa que realiza o aceite, serão considerados os dados vinculados ao cadastro do Familiar/Responsável, especialmente seu nome completo e CPF.
13.3. O aceite ficará vinculado ao cadastro do Familiar/Responsável e ao Paciente correspondente.
13.4. A Plataforma poderá registrar, para fins de comprovação da manifestação de vontade e segurança jurídica, a versão do Termo aceita, data e horário do aceite e demais elementos técnicos disponíveis e aplicáveis.
13.5. O aceite eletrônico produzirá os efeitos correspondentes à manifestação de concordância do Familiar/Responsável com este Termo, observada a legislação aplicável.

Razão social: DELUMA Serviços de Saúde e Educação LTDACNPJ: 65.974.822/0001-19Endereço: Alameda Terracota, nº 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul/SP, CEP 09531-190Canal de atendimento: contato@larsanacare.com.br
TERMO DE RESPONSABILIDADE E AUTORIZAÇÃO DO FAMILIAR/RESPONSÁVEL
Versão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
VALUES ('REPRESENTACAO_LEGAL', '1.0-2026-08', 'Representação Legal', $legal_body$TERMO DE REPRESENTAÇÃO OU ASSISTÊNCIA LEGAL DO PACIENTE
PACIENTE MENOR DE IDADE OU SUJEITO À REPRESENTAÇÃO/ASSISTÊNCIA LEGAL
114300215900

Este Termo estabelece as condições aplicáveis quando o cadastro, a contratação, o consentimento ou o acompanhamento dos serviços da Larsana Care envolver Paciente menor de idade ou pessoa que, para determinado ato, deva ser representada ou assistida na forma da legislação aplicável.
O aceite eletrônico será vinculado aos dados cadastrados do responsável, especialmente nome completo e CPF, ao Paciente correspondente e aos registros eletrônicos da manifestação realizada na Plataforma.
1. FINALIDADE DO TERMO
1.1. O presente Termo tem por finalidade registrar a declaração da pessoa cadastrada como Responsável Legal acerca de sua legitimidade para representar ou assistir o Paciente nos atos relacionados aos serviços intermediados pela Larsana Care, dentro dos limites estabelecidos pela legislação aplicável.
1.2. Este Termo será aplicável quando o Paciente:
a) for menor de idade e estiver sujeito à representação ou assistência de seus pais, tutor ou outro representante legalmente habilitado; ou
b) estiver sujeito, em relação ao ato correspondente, à representação ou assistência por curador ou outra pessoa legalmente legitimada.
1.3. A existência de doença, deficiência, idade avançada, limitação física, condição neurológica, dificuldade de comunicação ou necessidade de auxílio de terceiros não será considerada, isoladamente, prova de incapacidade jurídica do Paciente.
1.4. A representação ou assistência deverá observar os limites efetivamente aplicáveis ao Paciente e ao ato que estiver sendo praticado.

2. IDENTIFICAÇÃO ELETRÔNICA DO RESPONSÁVEL
2.1. Para identificação da pessoa que realiza o aceite deste Termo, serão utilizados os dados vinculados ao cadastro do Responsável Legal na Plataforma Larsana Care, especialmente nome completo e CPF.
2.2. O aceite eletrônico ficará vinculado ao cadastro do Responsável Legal e ao cadastro do Paciente correspondente.
2.3. O Responsável Legal declara que os dados fornecidos à Plataforma são verdadeiros, completos e correspondem à sua identidade.
2.4. A Larsana Care poderá solicitar documentos ou informações adicionais para confirmar a identidade, o vínculo ou os poderes de representação ou assistência declarados pelo Responsável Legal.

3. DECLARAÇÃO DE REPRESENTAÇÃO OU ASSISTÊNCIA
3.1. Ao realizar o aceite eletrônico deste Termo, o Responsável Legal declara possuir legitimidade para representar ou assistir o Paciente, conforme aplicável, nos atos relacionados à contratação, organização e acompanhamento dos serviços intermediados pela Larsana Care.
3.2. O Responsável Legal declara que sua atuação decorre de condição juridicamente válida, como poder familiar, tutela, curatela ou outra forma de representação ou assistência admitida pela legislação aplicável.
3.3. A declaração realizada por meio deste Termo não substitui documento legal específico quando este for necessário para comprovação da representação ou assistência.
3.4. A Larsana Care poderá, a qualquer momento, solicitar documento comprobatório correspondente, especialmente quando necessário para realização de determinado ato, acesso a informações, exercício de direitos do Paciente ou proteção de seus interesses.
3.5. Caso existam limitações aos poderes de representação ou assistência do Responsável Legal, estas deverão ser respeitadas.

4. RESPONSABILIDADE PELAS INFORMAÇÕES DECLARADAS
4.1. O Responsável Legal é responsável pela veracidade das informações fornecidas à Larsana Care acerca de sua condição e de seu vínculo com o Paciente.
4.2. O Responsável Legal compromete-se a não se apresentar como representante ou assistente do Paciente quando não possuir legitimidade para tanto.
4.3. Qualquer alteração, suspensão ou encerramento da condição que legitime sua atuação deverá ser comunicada à Larsana Care assim que o Responsável Legal tomar conhecimento da mudança.
4.4. A Larsana Care poderá suspender determinadas funcionalidades, solicitações ou acessos relacionados ao Paciente quando houver dúvida razoável acerca da legitimidade da representação ou assistência, até que sejam apresentados os esclarecimentos ou documentos necessários.

5. CONTRATAÇÃO E ORGANIZAÇÃO DOS SERVIÇOS
5.1. Dentro dos limites de sua representação ou assistência, o Responsável Legal poderá realizar atos necessários à contratação e organização dos serviços destinados ao Paciente.
5.2. Esses atos poderão compreender, conforme aplicável:
a) solicitar atendimento;
b) realizar ou acompanhar o cadastro do Paciente;
c) receber comunicações relacionadas ao serviço;
d) acompanhar agenda e atendimentos;
e) solicitar ou comunicar reagendamentos e cancelamentos;
f) tratar de questões administrativas e financeiras;
g) receber orientações necessárias à continuidade e segurança do cuidado;
h) apresentar documentos e informações pertinentes ao atendimento; e
i) praticar outros atos compatíveis com sua condição de representante ou assistente legal.
5.3. As manifestações realizadas pelo Responsável Legal por meio de seu acesso à Plataforma ou pelos canais oficiais da Larsana Care poderão ser consideradas válidas dentro dos limites de sua legitimidade.

6. CONSENTIMENTO PARA O ATENDIMENTO DE SAÚDE
6.1. Quando o consentimento para determinado atendimento ou ato assistencial depender da manifestação do Responsável Legal, este poderá realizá-la nos limites de sua representação ou assistência e da legislação aplicável.
6.2. O aceite deste Termo não constitui, por si só, consentimento genérico e irrestrito para realização de qualquer procedimento de saúde.
6.3. Os consentimentos assistenciais aplicáveis deverão ser obtidos por meio do respectivo Termo de Consentimento Livre e Esclarecido — TCLE ou por outro mecanismo adequado à natureza do atendimento ou procedimento.
6.4. Quando determinada técnica, procedimento ou situação exigir consentimento específico, deverão ser fornecidas as informações necessárias antes da manifestação correspondente.
6.5. A existência de consentimento do Responsável Legal não obriga o Profissional Parceiro a realizar técnica ou procedimento que considere contraindicado, inadequado, inseguro ou incompatível com sua competência profissional.

7. PARTICIPAÇÃO E AUTONOMIA DO PACIENTE
7.1. A existência de representação ou assistência legal não exclui a participação do próprio Paciente nas decisões relacionadas ao seu cuidado.
7.2. O Paciente deverá receber informações de forma adequada à sua idade, maturidade, capacidade de compreensão, condição e possibilidades de comunicação, sempre que aplicável.
7.3. Sua vontade, preferências, dúvidas, desconfortos e manifestações deverão ser consideradas na medida de sua capacidade de compreensão e participação.
7.4. Nos atendimentos de crianças e adolescentes, deverá ser promovida sua participação progressiva nas informações e decisões relacionadas ao cuidado, de forma compatível com sua idade e grau de compreensão.
7.5. A atuação do Responsável Legal deverá buscar a proteção da saúde, segurança, dignidade e melhores interesses do Paciente, respeitados os direitos que lhe sejam assegurados pela legislação aplicável.

8. DADOS PESSOAIS E INFORMAÇÕES DE SAÚDE
8.1. Para viabilizar o cadastro, a contratação, a organização e a realização dos atendimentos, poderão ser tratados dados pessoais do Paciente e do Responsável Legal.
8.2. Informações relacionadas à saúde do Paciente constituem dados pessoais sensíveis e estarão sujeitas às medidas e regras específicas de proteção previstas na legislação aplicável e na Política de Privacidade da Larsana Care.
8.3. O Responsável Legal deverá fornecer apenas informações verdadeiras e pertinentes ao atendimento, evitando o compartilhamento desnecessário de dados sem relação com as finalidades do serviço.
8.4. O tratamento de dados de crianças e adolescentes deverá observar seu melhor interesse e as demais exigências previstas na legislação aplicável.
8.5. O acesso do Responsável Legal às informações e registros do Paciente deverá observar a natureza de sua representação ou assistência, os direitos do próprio Paciente e eventuais limitações legais, judiciais, éticas ou profissionais aplicáveis.

9. ALTERAÇÃO DO RESPONSÁVEL LEGAL
9.1. Caso haja alteração da pessoa responsável pela representação ou assistência do Paciente, a Larsana Care deverá ser informada para que os registros e acessos correspondentes possam ser avaliados e atualizados.
9.2. A Larsana Care poderá solicitar documentação comprobatória antes de realizar a substituição do Responsável Legal vinculado ao Paciente.
9.3. A alteração do Responsável Legal não prejudicará a validade dos atos legitimamente praticados anteriormente por pessoa que possuía poderes para realizá-los.

10. ATINGIMENTO DA MAIORIDADE
10.1. Quando o Paciente menor de idade atingir a maioridade civil e possuir capacidade para praticar os atos correspondentes, a continuidade da gestão de sua conta, dos consentimentos e das autorizações deverá observar sua nova condição jurídica.
10.2. A partir desse momento, o antigo Responsável Legal não deverá permanecer automaticamente autorizado a praticar atos em nome do Paciente apenas em razão da relação anteriormente existente.
10.3. Caso o Paciente maior de idade deseje manter familiar ou terceiro como pessoa autorizada para organização ou acompanhamento dos serviços, deverá ser utilizado o mecanismo de autorização disponibilizado pela Larsana Care para essa finalidade.

11. SITUAÇÕES DE URGÊNCIA E EMERGÊNCIA
11.1. Os serviços intermediados pela Larsana Care possuem caráter programado e não constituem serviço de urgência, emergência, pronto atendimento ou atendimento pré-hospitalar.
11.2. Caso o Responsável Legal identifique situação que indique possível urgência, emergência ou risco imediato à vida do Paciente, deverá procurar ou acionar diretamente o serviço de emergência competente, conforme as circunstâncias.
11.3. O contato com a Larsana Care ou com o Profissional Parceiro não substitui o acionamento do serviço adequado em situações de urgência ou emergência.

12. DECLARAÇÃO DO RESPONSÁVEL LEGAL
Ao realizar o aceite eletrônico deste Termo, o Responsável Legal declara que:
a) os dados vinculados ao seu cadastro correspondem à sua identidade;
b) possui legitimidade para representar ou assistir o Paciente nos limites declarados e legalmente aplicáveis;
c) as informações fornecidas sobre sua condição de Responsável Legal são verdadeiras;
d) compromete-se a apresentar documentação comprobatória quando legalmente necessária ou legitimamente solicitada pela Larsana Care;
e) comunicará qualquer alteração que modifique, suspenda ou encerre seus poderes de representação ou assistência;
f) compreende que este Termo não constitui autorização irrestrita para realização de procedimentos de saúde;
g) compreende que os consentimentos assistenciais aplicáveis serão tratados por meio do respectivo TCLE ou outro instrumento adequado;
h) compromete-se a respeitar e promover a participação do Paciente nas decisões relacionadas ao seu cuidado, na medida de sua capacidade de compreensão e manifestação;
i) declara estar ciente de que os dados pessoais e informações de saúde do Paciente estão sujeitos à proteção específica;
j) compreende que os serviços intermediados pela Larsana Care são programados e não constituem serviço de urgência ou emergência; e
k) declara ter lido, compreendido e concordado com as condições estabelecidas neste Termo.

13. ACEITE ELETRÔNICO
13.1. O presente Termo será formalizado por meio de aceite eletrônico realizado na Plataforma Larsana Care.
13.2. Para identificação da pessoa que realiza o aceite, serão considerados os dados vinculados ao cadastro do Responsável Legal, especialmente nome completo e CPF.
13.3. O aceite deverá permanecer vinculado ao cadastro do Responsável Legal e ao Paciente correspondente.
13.4. A Plataforma poderá registrar, para fins de comprovação, segurança e rastreabilidade, a versão do Termo aceita, data e horário do aceite e demais elementos técnicos disponíveis e aplicáveis.
13.5. Caso seja identificada necessidade de comprovação adicional da representação ou assistência, o aceite eletrônico deste Termo não impedirá a Larsana Care de solicitar os documentos correspondentes.

Razão social: DELUMA Serviços de Saúde e Educação LTDACNPJ: 65.974.822/0001-19Endereço: Alameda Terracota, nº 185, Conjunto Comercial 1213, Bairro Cerâmica, São Caetano do Sul/SP, CEP 09531-190Canal de atendimento: contato@larsanacare.com.br
TERMO DE REPRESENTAÇÃO OU ASSISTÊNCIA LEGAL DO PACIENTEVersão: 1.0Atualização: 29/08/2026$legal_body$, true, 'paciente'::public.legal_term_profile, 'express'::public.legal_acceptance_mode, 'vigente'::public.legal_term_status, '2026-08-01'::timestamptz)
ON CONFLICT (term_type, version) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;

-- Alias legado DIRETRIZES_PP → mesmo conteúdo TERMO_USO_PP
UPDATE public.legal_terms SET is_current = false WHERE term_type = 'DIRETRIZES_PP' AND is_current = true;
INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
SELECT 'DIRETRIZES_PP', version, 'Diretrizes — Profissionais (legado)', content, true, profile, acceptance_mode, status, effective_at
FROM public.legal_terms WHERE term_type = 'TERMO_USO_PP' AND version = '1.0-2026-08'
ON CONFLICT (term_type, version) DO UPDATE SET content = EXCLUDED.content, is_current = EXCLUDED.is_current;

-- TCLE alias legado TERMO_CONSENTIMENTO
UPDATE public.legal_terms SET is_current = false WHERE term_type = 'TERMO_CONSENTIMENTO' AND is_current = true;
INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)
SELECT 'TERMO_CONSENTIMENTO', version, 'Termo de Consentimento (legado)', content, true, profile, acceptance_mode, status, effective_at
FROM public.legal_terms WHERE term_type = 'TCLE_FISIO' AND version = '1.0-2026-08'
ON CONFLICT (term_type, version) DO UPDATE SET content = EXCLUDED.content, is_current = EXCLUDED.is_current;

-- Política de Cookies (placeholder até peça jurídica)
INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at, requires_reaccept)
VALUES (
  'POLITICA_COOKIES', '1.0-2026-08', 'Política de Cookies',
  'Utilizamos cookies essenciais para autenticação e preferências. Cookies analíticos são opcionais e podem ser gerenciados nas preferências do site.',
  true, 'publico'::public.legal_term_profile, 'awareness'::public.legal_acceptance_mode,
  'vigente'::public.legal_term_status, '2026-08-01'::timestamptz, false
)
ON CONFLICT (term_type, version) DO UPDATE SET content = EXCLUDED.content, is_current = EXCLUDED.is_current;
