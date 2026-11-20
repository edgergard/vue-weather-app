import { describe, expect, it } from 'vitest'
import { formatClock, localHour } from './time'

// 2026-01-15T12:30:00Z
const NOON_UTC = Date.UTC(2026, 0, 15, 12, 30) / 1000

describe('time', () => {
  it('formats in the place time zone, not the browser one', () => {
    expect(formatClock(NOON_UTC, 'UTC')).toBe('12:30')
    expect(formatClock(NOON_UTC, 'Europe/Kyiv')).toBe('14:30')
    expect(formatClock(NOON_UTC, 'America/New_York')).toBe('07:30')
  })

  it('returns fractional local hour', () => {
    expect(localHour(NOON_UTC, 'UTC')).toBe(12.5)
    expect(localHour(NOON_UTC, 'Asia/Tokyo')).toBe(21.5)
  })
})
