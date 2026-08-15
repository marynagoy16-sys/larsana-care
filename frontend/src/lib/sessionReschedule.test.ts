import { describe, expect, it } from 'vitest'
import {
  hoursUntilSession,
  isLateRescheduleWindow,
  isWithinRescheduleDays,
  maxRescheduleDate,
  RESCHEDULE_MAX_DAYS_AHEAD,
  RESCHEDULE_MIN_HOURS_NOTICE,
} from './sessionReschedule'

describe('sessionReschedule', () => {
  const reference = new Date('2026-08-15T10:00:00')

  it('calculates hours until session', () => {
    const scheduled = new Date('2026-08-15T22:00:00')
    expect(hoursUntilSession(scheduled, reference)).toBe(12)
  })

  it('detects late window below 12h', () => {
    const scheduled = new Date('2026-08-15T20:00:00')
    expect(isLateRescheduleWindow(scheduled, reference)).toBe(true)
  })

  it('detects on-time window at or above 12h', () => {
    const scheduled = new Date('2026-08-15T22:00:00')
    expect(isLateRescheduleWindow(scheduled, reference)).toBe(false)
  })

  it('validates reschedule within 14 days', () => {
    const valid = new Date('2026-08-20T10:00:00')
    const invalid = new Date('2026-09-01T10:00:00')
    expect(isWithinRescheduleDays(valid, reference)).toBe(true)
    expect(isWithinRescheduleDays(invalid, reference)).toBe(false)
  })

  it('computes max reschedule date', () => {
    const max = maxRescheduleDate(reference)
    const expected = new Date(reference)
    expected.setDate(expected.getDate() + RESCHEDULE_MAX_DAYS_AHEAD)
    expect(max.toDateString()).toBe(expected.toDateString())
  })

  it('exports configured thresholds', () => {
    expect(RESCHEDULE_MIN_HOURS_NOTICE).toBe(12)
    expect(RESCHEDULE_MAX_DAYS_AHEAD).toBe(14)
  })
})
