import { addDays, isAfter, parseISO, startOfDay } from 'date-fns'

function isBusinessDay(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

export function addBusinessDays(start: Date, businessDays: number): Date {
  let current = startOfDay(start)
  let added = 0
  while (added < businessDays) {
    current = addDays(current, 1)
    if (isBusinessDay(current)) added++
  }
  return current
}

export function businessDaysRemainingUntil(
  deadline: Date,
  from: Date = new Date(),
): number {
  const end = startOfDay(deadline)
  let cursor = startOfDay(from)
  if (isAfter(cursor, end)) return 0

  let remaining = 0
  while (!isAfter(cursor, end)) {
    if (isBusinessDay(cursor)) remaining++
    cursor = addDays(cursor, 1)
  }
  return remaining
}

export function resolveFamilyResponseDeadline(input: {
  responseDeadlineAt?: string | null
  proposalSentAt?: string | null
}): Date | null {
  if (input.responseDeadlineAt) {
    return startOfDay(parseISO(input.responseDeadlineAt))
  }
  if (input.proposalSentAt) {
    return addBusinessDays(parseISO(input.proposalSentAt), 5)
  }
  return null
}
