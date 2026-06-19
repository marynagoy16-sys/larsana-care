export const careStatusLabels: Record<string, string> = {
  ATIVO: 'Ativo',
  PAUSA: 'Em pausa',
}

export const patientLevelLabels: Record<string, string> = {
  N1: 'Nível 1',
  N2: 'Nível 2',
  N3: 'Nível 3',
  VALOR_SOCIAL: 'Valor social',
}

export const weeklyFrequencyLabels: Record<number, string> = {
  1: '1x por semana',
  2: '2x por semana',
  3: '3x por semana',
}

export const proposedSessionCountLabels: Record<number, string> = {
  4: '4 sessões',
  8: '8 sessões',
  12: '12 sessões',
}

export const patientSexLabels: Record<string, string> = {
  M: 'M',
  F: 'F',
  OUTRO: 'Outro',
}

export const ppClassLabels: Record<string, string> = {
  BRONZE: 'Bronze',
  PRATA: 'Prata',
  OURO: 'Ouro',
}

export const credentialingStatusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  documentos_pendentes: 'Documentos pendentes',
  termos_pendentes: 'Termos pendentes',
  contrato_pendente: 'Contrato pendente',
  aguardando_aprovacao: 'Aguardando aprovação',
  ativo: 'Ativo',
  inativo: 'Inativo',
  descredenciado: 'Descredenciado',
}

export const cycleStatusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  aguardando_pagamento: 'Aguardando pagamento',
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
}

export const paymentStatusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
}

export const patientDocumentTypeLabels: Record<string, string> = {
  RG: 'RG',
  LAUDO: 'Laudo',
  EXAME: 'Exame',
  OUTRO: 'Outro',
}

export const assessmentStatusLabels: Record<string, string> = {
  avaliacao_feita: 'Avaliação feita',
  proposta_enviada: 'Proposta enviada',
  em_analise: 'Em análise',
  respondida_sim: 'Respondida SIM',
  respondida_nao: 'Respondida NÃO',
  vencida: 'Vencida',
}

export const demandTypeLabels: Record<string, string> = {
  avaliacao: 'Avaliação',
  continuidade: 'Continuidade',
}

export const demandTypeDescriptions: Record<string, string> = {
  avaliacao: 'Primeiro contato com o paciente',
  continuidade: 'Paciente já em tratamento que precisa de troca de profissional ou continuação do atendimento',
}

export const demandStatusLabels: Record<string, string> = {
  aberta: 'Aberta',
  alocada: 'Alocada',
  cancelada: 'Cancelada',
}

export const professionTypeLabels: Record<string, string> = {
  FISIO: 'Fisioterapia',
  NUTI: 'Nutrição',
  MED: 'Medicina',
  CUID: 'Cuidador',
  FONO: 'Fonoaudiologia',
}

export const personTypeLabels: Record<string, string> = {
  PF: 'Pessoa física',
  PJ: 'Pessoa jurídica',
}

export const councilTypeLabels: Record<string, string> = {
  CREFITO: 'CREFITO',
  COREN: 'COREN',
}

export const professionalDocumentTypeLabels: Record<string, string> = {
  RG_CNH: 'RG ou CNH',
  COUNCIL_CARD: 'Carteirinha do conselho',
  CRIMINAL_BACKGROUND: 'Antecedentes criminais',
  CERTIFICATE: 'Certificado / especialização',
  SIGNED_CONTRACT_PDF: 'Contrato assinado',
  VISIT_CARD_PHOTO: 'Foto cartão de visita',
}

export const attendancePeriodLabels: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
}
