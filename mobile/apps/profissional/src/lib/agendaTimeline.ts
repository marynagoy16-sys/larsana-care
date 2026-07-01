import { addMinutes, parseISO } from 'date-fns'

export const DEFAULT_SESSION_DURATION_MIN = 50

export function resolveSessionTimes(
  scheduledAt: string | null,
  checkInAt: string | null,
  checkOutAt: string | null,
): { start: Date; end: Date } | null {
  const ref = scheduledAt ?? checkInAt
  if (!ref) return null

  const start = parseISO(ref)
  if (checkInAt && checkOutAt) {
    return { start: parseISO(checkInAt), end: parseISO(checkOutAt) }
  }
  if (checkOutAt) {
    return { start, end: parseISO(checkOutAt) }
  }
  return { start, end: addMinutes(start, DEFAULT_SESSION_DURATION_MIN) }
}
