# Larsana Care — Adequação da review de 07/10/2026

**Origem:** transcrição da review com a operação (`review-larsana-care-2026-10-07.md`)  
**Data da implementação:** 7 de outubro de 2026  
**Banco:** migrations aplicadas no Supabase ligado pela CLI no mesmo dia

Onde a conversa ficou incerta, a regra seguida foi a dos anexos já gravados no banco (Anexo comercial do profissional parceiro e Anexo II do paciente). O prazo de Prata para Ouro ficou em **12 meses**.

Web e os apps da Play e da Apple empacotam este mesmo frontend pelo Capacitor (`frontend/android` e `frontend/ios`). A avaliação inicial continua com o paciente escolhendo o horário no chat da Sara.

## Relato

**Wallet e CNPJ.** A aprovação do credenciamento deixou de criar subconta Asaas. O profissional cola o wallet ID no credenciamento e no perfil, com o aviso de que o ID só aparece na versão web do Asaas. Sem wallet, o repasse continua bloqueado. A transferência aceita wallet de conta Asaas própria. CPF e CNPJ passam a aparecer inteiros, conforme o tamanho do documento, e a importação de profissionais guarda CNPJ de 14 dígitos.

**Termos.** No passo 2 da solicitação saiu o contrato de intermediação. O consentimento passou a se chamar Termo de Consentimento Livre e Esclarecido (TCLE). O editor do admin aceita texto longo e filtra em vigor ou histórico, paciente ou fisioterapeuta. O lixo de conversão saiu dos textos vigentes. O item Templates LRS-PROF saiu do menu; o aceite no credenciamento permanece.

**Cidade.** O CEP preenche qualquer município e o cadastro conclui. Fora da área de cobertura, o bloqueio acontece só na solicitação e a pessoa entra na lista de espera com cidade e UF. No admin, a lista mostra a demanda por cidade.

**Ciclo 1.** A avaliação já feita é o primeiro atendimento. Um pacote de 8 mostra a avaliação e o progresso das terapias como 1 de 7. Do segundo ciclo em diante o pacote é cheio. O pagamento gera só as terapias que faltam, e o fechamento usa o valor cobrado mais o crédito da avaliação.

**Agenda do ciclo.** Na continuidade, o profissional grava exatamente a frequência fechada (1, 2 ou 3 horários por semana) e esses dias se repetem até o fim do ciclo. O paciente não escolhe. A Sara só confirma a grade. A avaliação inicial não mudou.

**Jornada da sessão.** O checkout saiu da sessão. Evoluir terapia só libera depois do check-in. Salvar a evolução, ou registrar a avaliação com check-in, marca a sessão como realizada e dispara o NPS.

**Remarcação e cancelamento.** O paciente só envia o pedido, com motivo e anexo opcionais. O profissional responsável recoloca o horário e vê o prazo de 14 dias. A Sara avisa que busca substituto naquele dia e horário; se ninguém assumir até o horário, o atendimento volta ao responsável. No fim do tratamento há Cancelar ciclo: financeiro cobra 20% sobre o saldo não realizado; óbito e outras justificativas devolvem o remanescente. Falta passa a consumir 50% da sessão. O texto de cancelamento do staff foi alinhado a 12 horas.

**Histórico e patente.** No admin há importação de vínculo paciente–profissional e de evoluções no número de ciclo informado, além do seletor de profissional responsável na ficha. A patente separa pontos permanentes e variáveis, exige pontos e tempo (3, 9 e 12 meses), rateia os pontos do curso nas aulas, dá 100 pontos por indicação (máximo 3, só de Alumínio para Bronze) e não rebaixa quem já conquistou a patente. O percentual de repasse na tela do profissional vem da tabela de patentes.

**Conta, CREFITO, nota e Fio.** Encerrar a conta zera a jornada e volta a patente para Alumínio. O cadastro de Lucas Ribeiro do Nascimento fica inativo nessa migration. No credenciamento dá para consultar o CREFITO-3; se a consulta falhar, a aprovação manual continua. No fechamento do ciclo fica registrada a nota só da intermediação, ainda com upload manual. O link do Fio só aparece quando `FIO_SALES_URL` estiver preenchida.

---

## 1. O que mudou

### Pagamento do profissional

- A aprovação do credenciamento não cria mais subconta Asaas. Subcontas já existentes permanecem.
- Credenciamento, perfil web e perfil do app do profissional ganharam o campo de **wallet ID**, com o link para abrir a conta Asaas e o aviso de que o ID só aparece na versão web do Asaas.
- Sem wallet, o repasse continua bloqueado. A transferência usa `POST /transfers` com o wallet de uma conta Asaas própria, não só de subconta filha.
- A importação de profissionais aceita CNPJ de 14 dígitos e a coluna `asaas_wallet_id`. CPF ou CNPJ passam a aparecer com a máscara do tamanho do documento.

### Termos

- No passo 2 da solicitação do paciente saiu o contrato de intermediação. O aceite de uso e privacidade do início permanece.
- O consentimento passou a se chamar **Termo de Consentimento Livre e Esclarecido (TCLE)** e abre `TCLE_FISIO`.
- O editor de termos no admin aceita texto longo. Há filtros de em vigor / histórico e paciente / fisioterapeuta.
- O lixo de conversão (`-1424394986` no TCLE e `47626251175` na política de privacidade) foi removido do texto vigente.
- Saiu o item **Templates LRS-PROF** do menu. O aceite dos termos no credenciamento permanece.

### Cidade e lista de espera

- O CEP preenche qualquer município. O cadastro conclui mesmo fora do catálogo de cidades.
- O bloqueio de cobertura acontece só na solicitação de atendimento: a mensagem de região não atendida entra na lista de espera com cidade e UF.
- O admin da lista de espera mostra totais por cidade.

### Ciclo 1

- No primeiro ciclo a avaliação já feita é o primeiro atendimento. Um pacote de 8 mostra a avaliação e o progresso das terapias como 1 de 7 (pacote de 4 vira 1 de 3).
- Do segundo ciclo em diante o pacote é cheio.
- A confirmação do pagamento gera só as terapias que faltam, sem duplicar a avaliação.
- O fechamento usa o valor cobrado mais o crédito da avaliação, para o total não virar um atendimento extra.

### Agenda do ciclo pago

- Na continuidade, o profissional escolhe exatamente N dias e horários, N sendo a frequência fechada (1, 2 ou 3 vezes por semana).
- Esses horários entram direto na agenda e se repetem até o fim do ciclo. O paciente não escolhe.
- A Sara confirma a grade fixa: início, frequência, dias e horários.
- A avaliação inicial não mudou: o profissional envia opções e o paciente escolhe.

### Check-in, evolução e NPS

- O botão de checkout saiu da sessão (web e app do profissional).
- **Evoluir terapia** fica desabilitado até o check-in. Registrar avaliação continua separado do check-in.
- A sessão vira realizada quando a evolução ou a avaliação é salva, desde que haja check-in. O NPS do paciente dispara nesse momento.

### Remarcação, substituto, falta e cancelamento do ciclo

- O paciente só solicita a remarcação. Motivo e anexo são opcionais. Ele não escolhe o novo horário e o pedido não abre substituto.
- O mesmo profissional responsável tem 14 dias para recolocar. O prazo aparece para o profissional.
- Quando o profissional desmarca, o paciente ainda pode aceitar um substituto ou pedir para remarcar com o responsável.
- A Sara avisa que está buscando substituto para aquele dia e horário. Se ninguém assumir até o horário, o atendimento volta ao profissional responsável (a checagem roda na abertura da sessão).
- **Cancelar ciclo**, no fim do tratamento, pede confirmação. Financeiro cobra 20% sobre o saldo não realizado. Óbito e outras justificativas excepcionais devolvem o remanescente, sem a multa. Há anexo opcional.
- Registrar falta consome 50% da sessão. A copy de cancelamento do staff foi alinhada de 2 horas para **12 horas**.

### Vínculo e histórico

- Na lista de pacientes do admin há modelos para importar vínculo (CPF do paciente e CPF do profissional) e evoluções (CPF do paciente, data, texto, CPF de quem registrou e número do ciclo).
- A importação cria o ciclo naquele número, grava a evolução e marca a sessão passada como realizada. O próximo ciclo segue a sequência.
- A ficha do paciente no admin tem seletor de profissional responsável.
- A carga da planilha real fica para quando o arquivo chegar. O que está pronto é o importador e os dois modelos.

### Patente

- Dois saldos: **permanente** (Academy e indicações) e **variável** (avaliação do paciente). A penalidade variável não reduz o permanente e não rebaixa patente já conquistada.
- A próxima subida exige pontos e tempo na patente atual, contado da data em que ela foi conquistada:
  - Alumínio → Bronze: 1.000 pontos e 3 meses
  - Bronze → Prata: 4.000 pontos e 9 meses
  - Prata → Ouro: 8.000 pontos e 12 meses
- O percentual de repasse na tela do profissional é lido da tabela de patentes (60 / 70 / 75 / 80).
- Cada curso tem pontuação própria no admin, padrão 200. Os pontos se dividem entre as aulas em inteiros que somam o total do curso. Concluir a aula credita a fração uma vez. Concluir o curso não soma de novo.
- Indicação válida: 100 pontos permanentes, no máximo 3, só enquanto a progressão é Alumínio → Bronze.
- Avaliação do paciente (0 a 10): 9–10 = +2, 7–8 = +1, 5–6 = 0, 3–4 = −1, 0–2 = −2. Sem avaliação = 0. As faixas ficam na configuração de pontos do admin.
- A barra da jornada mostra permanentes, variáveis, total, meta e tempo restante.

### Conta do profissional

- Encerrar a conta zera pontos permanentes e variáveis, volta a patente para Alumínio e inativa o cadastro. Um retorno posterior nasce de novo em Alumínio.
- O botão **Encerrar conta** está no detalhe do credenciamento.
- O mesmo efeito vale quando a exclusão agendada da conta é processada.
- Lucas Ribeiro do Nascimento foi inativado nessa carga: patente Alumínio, zero pontos, cadastro inativo.

### CREFITO, nota e Fio

- No detalhe do credenciamento há **Consultar CREFITO-3**. Se a consulta falhar, a aprovação manual continua. A função `lookup-crefito` só consulta um endereço externo quando a variável `CREFITO_LOOKUP_URL` estiver definida. Sem isso, o resultado é **indisponível**. Essa função ainda não foi publicada no Supabase; só o código está no repositório.
- No fechamento do ciclo o sistema grava a nota da intermediação (comissão), com CPF do paciente e status `pendente_upload`. A emissão automática no GISS ainda depende de login e homologação. O upload manual do comprovante permanece.
- A página de venda do Fio abre um link externo só quando `FIO_SALES_URL` em `frontend/src/constants/fio.ts` estiver preenchida. O LarsanaPill interno não foi reescrito.

---

## 2. Migrations aplicadas

| Versão | Conteúdo |
|--------|----------|
| `20261007155045` | CNPJ na importação de profissionais e wallet |
| `20261007160100` | Passo 2 do paciente (TCLE) e limpeza dos textos legais |
| `20261007160200` | Cadastro em qualquer município e lista de espera com cidade |
| `20261007160300` | Ciclo 1: avaliação como sessão 1 e fechamento sem atendimento extra |
| `20261007160400` | Grade fixa do ciclo pago |
| `20261007160500` | Sessão realizada ao salvar evolução ou avaliação |
| `20261007160600` | Remarcação por pedido, retorno do substituto, cancelar ciclo e falta de 50% |
| `20261007160700` | Importação de vínculo e de evoluções históricas |
| `20261007160800` | Motor de patente (saldos, tempo, curso e NPS) |
| `20261007160900` | Encerrar conta, inativação do cadastro rescindido e nota de intermediação |

O `db push` não foi usado: o histórico remoto tem versões antigas que não existem nesta pasta. Essas versões não foram revertidas. As dez acima foram executadas e marcadas como aplicadas.

---

## 3. Onde olhar no produto

| Ajuste | Onde |
|--------|------|
| Wallet | Credenciamento do profissional, perfil do PP e detalhe do credenciamento no admin |
| CNPJ | Lista e detalhe do credenciamento |
| TCLE | Solicitação de atendimento, passo 2 |
| Termos | Admin → configuração de termos |
| Lista por cidade | Admin → lista de espera |
| Progresso do ciclo 1 | Portal do paciente → detalhe do ciclo |
| Grade fixa | Demanda de continuidade do profissional |
| Check-in e evolução | Agenda → detalhe da sessão |
| Pedido de remarcação | Detalhe do ciclo do paciente |
| Recolocar em 14 dias | Agenda do profissional, quando há pedido |
| Cancelar ciclo | Fim da página do ciclo do paciente |
| Vínculo e evoluções | Admin → pacientes |
| Profissional responsável | Editar paciente |
| Patente | Minha jornada do profissional e Pontuação PP no admin |
| Pontos do curso | Admin → Academy → curso |
| Encerrar conta | Detalhe do credenciamento |
| CREFITO | Conselho profissional no detalhe do credenciamento |

---

## 4. O que ainda depende de fora

- URL pública do CREFITO-3 (`CREFITO_LOOKUP_URL`) e publicação da função `lookup-crefito`.
- Login e homologação do GISS de São Caetano do Sul para emitir a NFS-e da intermediação. Até lá, o comprovante segue por upload.
- Domínio da página de venda do Fio (`FIO_SALES_URL`).
- Planilha real de vínculos e evoluções históricas.
