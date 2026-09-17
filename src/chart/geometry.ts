import { SIGNS, type SignInfo } from '../astro/signs'
import type { Aspect, Placement, PointKey } from '../astro/types'
import type { Natal } from '../birth/birthRecord'

/**
 * Polar geometry for the natal chart. Everything the SVG draws comes through
 * here, from the Birth record's longitudes and cusps, so the picture is a
 * true rendering of the frozen moment. Pure functions, unit-tested.
 */

export const CHART = {
  size: 400,
  c: 200,
  rOuter: 192,
  rSignIn: 164,
  rHouseIn: 126,
  rPlanet: 108,
  rAspect: 88,
} as const

export interface Point {
  x: number
  y: number
}

/** Screen angle (degrees, counter-clockwise from +x) for an ecliptic longitude. The Ascendant sits at 9 o'clock. */
export function degreeToChartAngle(longitude: number, ascendant: number): number {
  return 180 + (longitude - ascendant)
}

export function polarToCartesian(angleDeg: number, radius: number, c = CHART.c): Point {
  const a = (angleDeg * Math.PI) / 180
  return { x: c + radius * Math.cos(a), y: c - radius * Math.sin(a) }
}

/** Annular sector between two screen angles (a0 → a1 counter-clockwise). */
export function sectorPath(r1: number, r2: number, a0: number, a1: number): string {
  const p0 = polarToCartesian(a0, r2)
  const p1 = polarToCartesian(a1, r2)
  const p2 = polarToCartesian(a1, r1)
  const p3 = polarToCartesian(a0, r1)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  return `M ${p0.x} ${p0.y} A ${r2} ${r2} 0 ${large} 0 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r1} ${r1} 0 ${large} 1 ${p3.x} ${p3.y} Z`
}

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

function line(a: Point, b: Point): Line {
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
}

/* ---------- zodiac ring ---------- */

export interface SignSector {
  sign: SignInfo
  a0: number
  a1: number
  path: string
  glyphAt: Point
  ticks: Line[]
}

export function getSignSectors(ascendant: number): SignSector[] {
  return SIGNS.map((sign) => {
    const a0 = degreeToChartAngle(sign.index * 30, ascendant)
    const a1 = a0 + 30
    return {
      sign,
      a0,
      a1,
      path: sectorPath(CHART.rSignIn, CHART.rOuter, a0, a1),
      glyphAt: polarToCartesian(a0 + 15, (CHART.rOuter + CHART.rSignIn) / 2),
      ticks: [5, 10, 15, 20, 25].map((d) => line(polarToCartesian(a0 + d, CHART.rSignIn), polarToCartesian(a0 + d, CHART.rSignIn + (d === 15 ? 6 : 3.5)))),
    }
  })
}

/* ---------- houses ---------- */

export interface HouseCusp {
  index: number
  number: number
  angle: number
  angular: boolean
  /** From the zodiac circumference inward to the exclusion circle. */
  line: Line
  numberAt: Point
  /** Sector of the house ring, for hit-testing and highlighting. */
  sectorPath: string
}

export function getHouseCusps(cusps: readonly number[], ascendant: number): HouseCusp[] {
  return cusps.map((cusp, i) => {
    const angle = degreeToChartAngle(cusp, ascendant)
    const next = cusps[(i + 1) % 12]
    let span = next - cusp
    if (span < 0) span += 360
    return {
      index: i,
      number: i + 1,
      angle,
      angular: i === 0 || i === 3 || i === 6 || i === 9,
      line: line(polarToCartesian(angle, CHART.rSignIn), polarToCartesian(angle, CHART.rAspect)),
      numberAt: polarToCartesian(angle + span / 2, CHART.rHouseIn + 8),
      sectorPath: sectorPath(CHART.rAspect, CHART.rSignIn, angle, angle + span),
    }
  })
}

/* ---------- axes ---------- */

export interface Axis {
  key: 'ascendant' | 'midheaven'
  label: string
  angle: number
  /** ASC → centre side, drawn from the rim inward. */
  line: Line
  /** The opposite end (DSC / IC), drawn outward from the centre. */
  opposite: Line
  marker: Point
  labelAt: Point
}

export function getAxes(natal: Natal): Axis[] {
  const asc = natal.houses.cusps[0]
  return (['ascendant', 'midheaven'] as const).map((key) => {
    const p = key === 'ascendant' ? natal.ascendant : natal.midheaven
    const angle = degreeToChartAngle(p.longitude, asc)
    return {
      key,
      label: key === 'ascendant' ? 'AC' : 'MC',
      angle,
      line: line(polarToCartesian(angle, CHART.rOuter), polarToCartesian(angle, CHART.rAspect)),
      opposite: line(polarToCartesian(angle + 180, CHART.rAspect), polarToCartesian(angle + 180, CHART.rSignIn)),
      marker: polarToCartesian(angle, CHART.rOuter + 1),
      labelAt: polarToCartesian(angle, CHART.rOuter - 13),
    }
  })
}

/* ---------- planets ---------- */

export const PLANET_ORDER: PointKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode']

export interface PlanetPosition {
  key: PointKey
  placement: Placement
  /** True angle of the body. */
  angle: number
  /** Angle after spreading so glyphs do not overlap. */
  drawAngle: number
  /** Small dot at the true position on the house ring. */
  marker: Point
  /** Where the glyph disc sits. */
  glyphAt: Point
  /** Lead line from the marker to the glyph. */
  lead: Line
  /** Tiny arrival offset: the planet settles in from a few px along its orbit. */
  arrival: Point
}

/** Spread angles so no two glyphs sit closer than `minGap` degrees. */
export function spreadAngles(angles: number[], minGap: number): number[] {
  const order = angles.map((a, i) => ({ a, i })).sort((p, q) => p.a - q.a)
  const out = order.map((o) => o.a)
  for (let pass = 0; pass < 6; pass++) {
    for (let k = 1; k < out.length; k++) {
      const gap = out[k] - out[k - 1]
      if (gap < minGap) {
        const push = (minGap - gap) / 2
        out[k - 1] -= push
        out[k] += push
      }
    }
  }
  const result = new Array<number>(angles.length)
  order.forEach((o, k) => {
    result[o.i] = out[k]
  })
  return result
}

export function getPlanetPositions(natal: Natal): PlanetPosition[] {
  const asc = natal.houses.cusps[0]
  const planets = PLANET_ORDER.map((k) => natal.planets.find((p) => p.key === k)).filter((p): p is Placement => !!p)
  const angles = planets.map((p) => degreeToChartAngle(p.longitude, asc))
  const drawAngles = spreadAngles(angles, 9)
  return planets.map((p, i) => {
    const angle = angles[i]
    const drawAngle = drawAngles[i]
    const glyphAt = polarToCartesian(drawAngle, CHART.rPlanet)
    const marker = polarToCartesian(angle, CHART.rHouseIn - 2)
    const from = polarToCartesian(drawAngle + 5, CHART.rPlanet + 7)
    return {
      key: p.key,
      placement: p,
      angle,
      drawAngle,
      marker,
      glyphAt,
      lead: line(polarToCartesian(angle, CHART.rHouseIn - 1), glyphAt),
      arrival: { x: from.x - glyphAt.x, y: from.y - glyphAt.y },
    }
  })
}

/* ---------- aspects ---------- */

export interface AspectLine {
  index: number
  aspect: Aspect
  a: PointKey
  b: PointKey
  line: Line
}

/** Lines between the true positions on the inner circle. Angle-to-planet aspects are not drawn. */
export function getAspectLines(natal: Natal, positions: PlanetPosition[]): AspectLine[] {
  const asc = natal.houses.cusps[0]
  const byKey = new Map(positions.map((p) => [p.key, p]))
  const out: AspectLine[] = []
  natal.aspects.forEach((aspect, index) => {
    const p = byKey.get(aspect.a)
    const q = byKey.get(aspect.b)
    if (!p || !q) return
    const a = polarToCartesian(degreeToChartAngle(p.placement.longitude, asc), CHART.rAspect - 2)
    const b = polarToCartesian(degreeToChartAngle(q.placement.longitude, asc), CHART.rAspect - 2)
    out.push({ index, aspect, a: aspect.a, b: aspect.b, line: line(a, b) })
  })
  return out
}

/** Sign sector index a placement falls in, for "light the sign" highlighting. */
export function signIndexOf(p: Placement): number {
  return Math.floor(((p.longitude % 360) + 360) % 360 / 30)
}
