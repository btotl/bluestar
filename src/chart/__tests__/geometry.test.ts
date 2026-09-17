import { describe, expect, it } from 'vitest'
import { createBirthRecord } from '../../birth/birthRecord'
import { aspectDelay, planetDelay, sectorDelay, BIRTH_T } from '../birthTimeline'
import { CHART, degreeToChartAngle, getAspectLines, getAxes, getHouseCusps, getPlanetPositions, getSignSectors, polarToCartesian, spreadAngles } from '../geometry'

const record = createBirthRecord({
  furbyId: 'f1',
  certificateNumber: 1,
  name: 'Mimi',
  timestampUtc: '2026-09-17T13:43:27Z',
  mode: 'moment',
  location: { name: 'Bellingen', region: 'NSW', country: 'Australia', latitude: -30.45, longitude: 152.9, timeZone: 'Australia/Sydney' },
  recordedAtUtc: '2026-09-17T13:43:27Z',
})
const natal = record.natal
const asc = natal.houses.cusps[0]

describe('chart geometry', () => {
  it('puts the Ascendant at 9 o\'clock and increases counter-clockwise', () => {
    expect(degreeToChartAngle(asc, asc)).toBe(180)
    const p = polarToCartesian(degreeToChartAngle(asc, asc), CHART.rOuter)
    expect(p.x).toBeCloseTo(CHART.c - CHART.rOuter, 6)
    expect(p.y).toBeCloseTo(CHART.c, 6)
    // 90° further along the zodiac is straight down (IC side)
    const q = polarToCartesian(degreeToChartAngle(asc + 90, asc), CHART.rOuter)
    expect(q.y).toBeGreaterThan(CHART.c)
  })

  it('draws twelve sign sectors covering the full circle', () => {
    const sectors = getSignSectors(asc)
    expect(sectors).toHaveLength(12)
    expect(sectors[0].sign.key).toBe('aries')
    for (const s of sectors) expect(s.a1 - s.a0).toBeCloseTo(30, 9)
    expect(sectors.every((s) => s.ticks.length === 5)).toBe(true)
  })

  it('derives house cusps and axes from the record', () => {
    const houses = getHouseCusps(natal.houses.cusps, asc)
    expect(houses).toHaveLength(12)
    expect(houses[0].angle).toBeCloseTo(180, 6)
    expect(houses[0].angular && houses[9].angular).toBe(true)
    const axes = getAxes(natal)
    expect(axes.map((a) => a.key)).toEqual(['ascendant', 'midheaven'])
    expect(axes[0].angle).toBeCloseTo(180, 6)
    expect(axes[1].angle).toBeCloseTo(degreeToChartAngle(natal.midheaven.longitude, asc), 6)
  })

  it('places every planet at its own longitude and keeps glyphs apart', () => {
    const positions = getPlanetPositions(natal)
    expect(positions.map((p) => p.key)).toEqual(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode'])
    for (const p of positions) expect(p.angle).toBeCloseTo(degreeToChartAngle(p.placement.longitude, asc), 9)
    const draw = [...positions.map((p) => p.drawAngle)].sort((a, b) => a - b)
    for (let i = 1; i < draw.length; i++) expect(draw[i] - draw[i - 1]).toBeGreaterThanOrEqual(9 - 1e-6)
    expect(Math.hypot(positions[0].arrival.x, positions[0].arrival.y)).toBeLessThan(16)
  })

  it('spreads clustered angles symmetrically', () => {
    expect(spreadAngles([100, 102], 9)).toEqual([96.5, 105.5])
    expect(spreadAngles([10, 200], 9)).toEqual([10, 200])
  })

  it('joins aspect lines between the true planet positions', () => {
    const positions = getPlanetPositions(natal)
    const lines = getAspectLines(natal, positions)
    expect(lines.length).toBeGreaterThan(5)
    for (const l of lines) {
      const r1 = Math.hypot(l.line.x1 - CHART.c, l.line.y1 - CHART.c)
      const r2 = Math.hypot(l.line.x2 - CHART.c, l.line.y2 - CHART.c)
      expect(r1).toBeCloseTo(CHART.rAspect - 2, 6)
      expect(r2).toBeCloseTo(CHART.rAspect - 2, 6)
      expect(['ascendant', 'midheaven']).not.toContain(l.a)
    }
  })
})

describe('birth timeline', () => {
  it('is monotonic and keeps the planets and aspects inside their windows', () => {
    const beats = Object.values(BIRTH_T)
    for (let i = 1; i < beats.length; i++) expect(beats[i]).toBeGreaterThan(beats[i - 1])
    expect(planetDelay('sun')).toBe(BIRTH_T.planets)
    expect(planetDelay('northNode')).toBeLessThan(BIRTH_T.aspects)
    expect(aspectDelay(24, 25)).toBeLessThanOrEqual(BIRTH_T.aspects + 1.5 + 1e-9)
    expect(sectorDelay(11)).toBeLessThan(BIRTH_T.houses)
  })
})
