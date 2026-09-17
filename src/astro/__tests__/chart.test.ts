import { describe, expect, it } from 'vitest'
import { buildNatalChart } from '../chart'
import { ascendant, computeHouses, houseOf, midheaven } from '../houses'
import { degreeInSign, norm360, signForLongitude } from '../signs'

describe('signs', () => {
  it('maps longitudes to signs', () => {
    expect(signForLongitude(0).key).toBe('aries')
    expect(signForLongitude(29.999).key).toBe('aries')
    expect(signForLongitude(30).key).toBe('taurus')
    expect(signForLongitude(174.69).key).toBe('virgo')
    expect(signForLongitude(359.9).key).toBe('pisces')
    expect(signForLongitude(-10).key).toBe('pisces')
    expect(degreeInSign(174.69)).toBeCloseTo(24.69, 5)
    expect(norm360(-30)).toBe(330)
  })
})

describe('angles', () => {
  it('computes MC and ascendant for Greenwich at J2000 noon', () => {
    // RAMC at 2000-01-01 12:00 UT, Greenwich: GST 18.697h -> 280.46 deg
    const ramc = 18.697136 * 15
    const eps = 23.4393
    const mc = midheaven(ramc, eps)
    expect(mc).toBeCloseTo(279.6, 0)
    const asc = ascendant(ramc, eps, 51.4769)
    // Independently derived: ~24 deg Aries
    expect(asc).toBeGreaterThan(22)
    expect(asc).toBeLessThan(27)
  })

  it('places the ascendant 90 deg past the MC on the equator when Aries culminates', () => {
    expect(ascendant(0, 23.44, 0)).toBeCloseTo(90, 5)
    expect(midheaven(0, 23.44)).toBeCloseTo(0, 5)
  })
})

describe('houses', () => {
  it('Placidus reduces to equal RA division on the equator', () => {
    const h = computeHouses(100, 23.44, 0)
    expect(h.system).toBe('placidus')
    expect(h.cusps[9]).toBeCloseTo(h.midheaven, 6)
    expect(h.cusps[0]).toBeCloseTo(h.ascendant, 6)
    expect(norm360(h.cusps[6] - h.cusps[0])).toBeCloseTo(180, 6)
    expect(norm360(h.cusps[3] - h.cusps[9])).toBeCloseTo(180, 6)
  })

  it('Placidus cusps advance in zodiacal order at mid latitudes', () => {
    const h = computeHouses(213.7, 23.44, -30.45)
    expect(h.system).toBe('placidus')
    for (let i = 0; i < 12; i++) {
      const span = norm360(h.cusps[(i + 1) % 12] - h.cusps[i])
      expect(span).toBeGreaterThan(5)
      expect(span).toBeLessThan(80)
    }
  })

  it('falls back to whole sign inside the polar circles', () => {
    const h = computeHouses(50, 23.44, 70)
    expect(h.system).toBe('wholeSign')
    expect(h.cusps[0] % 30).toBe(0)
  })

  it('assigns houses across the 0 deg Aries boundary', () => {
    const cusps = Array.from({ length: 12 }, (_, i) => norm360(340 + i * 30))
    expect(houseOf(345, cusps)).toBe(1)
    expect(houseOf(5, cusps)).toBe(1)
    expect(houseOf(12, cusps)).toBe(2)
    expect(houseOf(339, cusps)).toBe(12)
  })
})

describe('buildNatalChart', () => {
  // The brief's example: 11:43:27 PM 17 Sep 2026 AEST in Bellingen = 13:43:27 UTC
  const chart = buildNatalChart({
    timestampUtc: '2026-09-17T13:43:27Z',
    latitude: -30.45,
    longitude: 152.9,
  })

  it('finds the Big Three from the brief (Virgo sun, Sagittarius moon, Gemini rising)', () => {
    expect(chart.bigThree.sun).toBe('virgo')
    expect(chart.bigThree.moon).toBe('sagittarius')
    expect(chart.bigThree.rising).toBe('gemini')
  })

  it('includes all planets, the node and the four angles', () => {
    const keys = chart.points.map((p) => p.key)
    expect(keys).toEqual([
      'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus',
      'neptune', 'pluto', 'northNode', 'ascendant', 'midheaven', 'descendant', 'imumCoeli',
    ])
    for (const p of chart.points) {
      expect(p.house).toBeGreaterThanOrEqual(1)
      expect(p.house).toBeLessThanOrEqual(12)
      expect(p.longitude).toBeGreaterThanOrEqual(0)
      expect(p.longitude).toBeLessThan(360)
    }
  })

  it('puts the ascendant in house 1 and the midheaven in house 10', () => {
    const asc = chart.points.find((p) => p.key === 'ascendant')!
    const mc = chart.points.find((p) => p.key === 'midheaven')!
    expect(asc.house).toBe(1)
    expect(mc.house).toBe(10)
    expect(asc.longitude).toBeCloseTo(chart.cusps[0], 6)
  })

  it('never marks the Sun or Moon retrograde', () => {
    expect(chart.points.find((p) => p.key === 'sun')!.retrograde).toBe(false)
    expect(chart.points.find((p) => p.key === 'moon')!.retrograde).toBe(false)
  })

  it('produces sorted aspects with orbs inside their limits', () => {
    expect(chart.aspects.length).toBeGreaterThan(5)
    for (let i = 1; i < chart.aspects.length; i++) {
      expect(chart.aspects[i].orb).toBeGreaterThanOrEqual(chart.aspects[i - 1].orb)
    }
    for (const a of chart.aspects) expect(a.orb).toBeLessThanOrEqual(10)
  })

  it('rejects invalid timestamps', () => {
    expect(() => buildNatalChart({ timestampUtc: 'nope', latitude: 0, longitude: 0 })).toThrow()
  })
})
