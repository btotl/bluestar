import { describe, expect, it } from 'vitest'
import { formatDotDate, formatTime, tzOffsetMinutes, zonedLocalToUtc } from './time'

describe('time zone helpers', () => {
  it('converts Bellingen wall-clock time to UTC (AEST, no DST in September)', () => {
    const d = zonedLocalToUtc({ year: 2026, month: 9, day: 17, hour: 23, minute: 43, second: 27 }, 'Australia/Sydney')
    expect(d.toISOString()).toBe('2026-09-17T13:43:27.000Z')
  })
  it('handles daylight saving (AEDT in January)', () => {
    const d = zonedLocalToUtc({ year: 2026, month: 1, day: 10, hour: 12, minute: 0, second: 0 }, 'Australia/Sydney')
    expect(d.toISOString()).toBe('2026-01-10T01:00:00.000Z')
    expect(tzOffsetMinutes(d, 'Australia/Sydney')).toBe(660)
  })
  it('formats in the birth zone', () => {
    const d = new Date('2026-09-17T13:43:27Z')
    expect(formatTime(d, 'Australia/Sydney')).toBe('11:43:27 PM')
    expect(formatDotDate(d, 'Australia/Sydney')).toBe('17.09.2026')
  })
})
