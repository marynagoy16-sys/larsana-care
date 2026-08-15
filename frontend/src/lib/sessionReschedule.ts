/** Antecedência mínima (horas) para remarcação sem atestado/taxa — espelha platform_operational_settings. */
export const RESCHEDULE_MIN_HOURS_NOTICE = 12

/** Janela máxima (dias) para reposição da sessão. */
export const RESCHEDULE_MAX_DAYS_AHEAD = 14

/** Percentual cobrado na remarcação tardia do paciente com atestado. */
export const LATE_RESCHEDULE_PARTIAL_PERCENT = 50

export function hoursUntilSession(scheduledAt: Date, reference: Date = new Date()): number {
  return (scheduledAt.getTime() - reference.getTime()) / (1000 * 60 * 60)
}

export function isLateRescheduleWindow(scheduledAt: Date, reference: Date = new Date()): boolean {
  return hoursUntilSession(scheduledAt, reference) < RESCHEDULE_MIN_HOURS_NOTICE
}

export function isWithinRescheduleDays(
  newDate: Date,
  reference: Date = new Date(),
  maxDays: number = RESCHEDULE_MAX_DAYS_AHEAD,
): boolean {
  const max = new Date(reference)
  max.setDate(max.getDate() + maxDays)
  return newDate > reference && newDate <= max
}

export function maxRescheduleDate(reference: Date = new Date(), maxDays: number = RESCHEDULE_MAX_DAYS_AHEAD): Date {
  const max = new Date(reference)
  max.setDate(max.getDate() + maxDays)
  return max
}
