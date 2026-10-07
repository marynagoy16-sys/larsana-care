export function cycleTherapyProgress(
  cycleNumber: number,
  sessionCount: number,
  completedSessions: number,
) {
  if (cycleNumber === 1) {
    const total = Math.max(sessionCount - 1, 1)
    return { done: Math.min(completedSessions, total), total }
  }
  return { done: completedSessions, total: sessionCount }
}

export function sessionDisplayLabel(
  cycleNumber: number,
  sessionNumber: number,
  isAssessment: boolean,
) {
  if (isAssessment || (cycleNumber === 1 && sessionNumber === 1)) return 'Avaliação inicial'
  if (cycleNumber === 1) return `Terapia ${Math.max(sessionNumber - 1, 1)}`
  return `Terapia ${sessionNumber}`
}
