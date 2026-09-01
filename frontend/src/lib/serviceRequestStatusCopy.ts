export function getActiveDemandStatusMessage(options: {
  isProfessionalAssigned: boolean
  pendingScheduling: boolean
  professionalName?: string | null
}): string {
  if (options.pendingScheduling) {
    return 'Escolha um horário para sua avaliação domiciliar.'
  }

  if (options.isProfessionalAssigned) {
    if (options.professionalName) {
      return `${options.professionalName} foi atribuído à sua solicitação. Em breve você receberá opções de horário no chat.`
    }
    return 'Profissional parceiro encontrado! Em breve você receberá opções de horário no chat.'
  }

  return 'Sua solicitação já está em andamento.'
}

export function isProfessionalAssignedToDemand(
  demand: { status?: string; assigned_professional_id?: string | null } | null | undefined,
): boolean {
  return demand?.status === 'alocada' || Boolean(demand?.assigned_professional_id)
}
