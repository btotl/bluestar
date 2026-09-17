import { describe, expect, it } from 'vitest'
import { bigThree, createBirthRecord, placement } from '../birthRecord'

const server = {
  furbyId: 'f1',
  certificateNumber: 184,
  name: 'Mimi',
  timestampUtc: '2026-09-17T13:43:27Z',
  mode: 'moment' as const,
  location: { name: 'Bellingen', region: 'New South Wales', country: 'Australia', latitude: -30.45, longitude: 152.9, timeZone: 'Australia/Sydney' },
  recordedAtUtc: '2026-09-17T13:43:27Z',
}

describe('BirthRecord', () => {
  const record = createBirthRecord(server)

  it('derives the natal data from the immutable timestamp and coordinates', () => {
    const { sun, moon, rising } = bigThree(record)
    expect(sun.sign).toBe('virgo')
    expect(moon.sign).toBe('sagittarius')
    expect(rising.sign).toBe('gemini')
    expect(record.natal.planets.map((p) => p.key)).toEqual([
      'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode',
    ])
    expect(record.natal.houses.cusps).toHaveLength(12)
    expect(placement(record, 'midheaven').sign).toBe('pisces')
  })

  it('is deeply frozen', () => {
    expect(Object.isFrozen(record)).toBe(true)
    expect(Object.isFrozen(record.natal)).toBe(true)
    expect(Object.isFrozen(record.natal.sun)).toBe(true)
    expect(Object.isFrozen(record.natal.houses.cusps)).toBe(true)
    expect(() => {
      ;(record as { timestampUtc: string }).timestampUtc = 'x'
    }).toThrow()
  })

  it('is deterministic: the same instant and place always give the same sky', () => {
    const again = createBirthRecord({ ...server, furbyId: 'f2' })
    expect(again.natal.sun.longitude).toBe(record.natal.sun.longitude)
    expect(again.natal.ascendant.longitude).toBe(record.natal.ascendant.longitude)
  })
})
