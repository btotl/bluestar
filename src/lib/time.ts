/** Time zone helpers built on Intl so no tz database ships with the app. */

export interface LocalParts {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
}

function partsInZone(date: Date, timeZone: string): LocalParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const map: Record<string, number> = {}
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== 'literal') map[p.type] = Number(p.value)
  }
  return { year: map.year, month: map.month, day: map.day, hour: map.hour % 24, minute: map.minute, second: map.second }
}

/** Offset of `timeZone` from UTC at `date`, in minutes (east positive). */
export function tzOffsetMinutes(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - date.getTime()) / 60000)
}

/** Convert wall-clock parts in a zone to the UTC instant they name. */
export function zonedLocalToUtc(parts: LocalParts, timeZone: string): Date {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  let offset = tzOffsetMinutes(new Date(guess), timeZone)
  let result = guess - offset * 60000
  // Second pass in case the guess straddled a DST transition.
  const offset2 = tzOffsetMinutes(new Date(result), timeZone)
  if (offset2 !== offset) {
    offset = offset2
    result = guess - offset * 60000
  }
  return new Date(result)
}

export function utcToLocalParts(date: Date, timeZone: string): LocalParts {
  return partsInZone(date, timeZone)
}

export function formatTime(date: Date, timeZone: string, withSeconds = true): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone, hour: 'numeric', minute: '2-digit', second: withSeconds ? '2-digit' : undefined, hour12: true,
  }).format(date).toUpperCase().replace(/\s/g, ' ')
}

export function formatLongDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-AU', { timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

/** 17 SEP 2026 */
export function formatShortDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-AU', { timeZone, day: '2-digit', month: 'short', year: 'numeric' })
    .format(date).toUpperCase().replace(/\./g, '')
}

/** 17.09.2026 */
export function formatDotDate(date: Date, timeZone: string): string {
  const p = partsInZone(date, timeZone)
  return `${String(p.day).padStart(2, '0')}.${String(p.month).padStart(2, '0')}.${p.year}`
}

export function tzAbbreviation(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone, timeZoneName: 'short' }).formatToParts(date)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone
}

export function formatUtcOffset(date: Date, timeZone: string): string {
  const m = tzOffsetMinutes(date, timeZone)
  const sign = m >= 0 ? '+' : '−'
  const abs = Math.abs(m)
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
