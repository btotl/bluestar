import type { Aspect, AspectType, Placement, PointKey } from './types'

interface AspectDef {
  type: AspectType
  angle: number
  glyph: string
  orb: number
}

export const ASPECT_DEFS: readonly AspectDef[] = [
  { type: 'conjunction', angle: 0, glyph: '☌', orb: 8 },
  { type: 'opposition', angle: 180, glyph: '☍', orb: 8 },
  { type: 'trine', angle: 120, glyph: '△', orb: 7 },
  { type: 'square', angle: 90, glyph: '□', orb: 7 },
  { type: 'sextile', angle: 60, glyph: '⚹', orb: 5 },
]

const LUMINARIES: PointKey[] = ['sun', 'moon']
const ASPECTING_POINTS: PointKey[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'ascendant', 'midheaven',
]

function separation(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

export function findAspects(points: Placement[]): Aspect[] {
  const list = points.filter((p) => ASPECTING_POINTS.includes(p.key))
  const out: Aspect[] = []
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const p = list[i]
      const q = list[j]
      // Angles to angles are not meaningful aspects.
      const bothAngles = ['ascendant', 'midheaven'].includes(p.key) && ['ascendant', 'midheaven'].includes(q.key)
      if (bothAngles) continue
      const sep = separation(p.longitude, q.longitude)
      for (const def of ASPECT_DEFS) {
        const bonus = LUMINARIES.includes(p.key) || LUMINARIES.includes(q.key) ? 2 : 0
        const orb = Math.abs(sep - def.angle)
        if (orb <= def.orb + bonus) {
          // Applying when the faster body is moving toward exactness.
          const faster = Math.abs(p.speed) >= Math.abs(q.speed) ? p : q
          const slower = faster === p ? q : p
          const relative = faster.speed - slower.speed
          const future = separation(
            faster.longitude + relative * 0.1,
            slower.longitude,
          )
          const applying = Math.abs(future - def.angle) < orb
          out.push({ a: p.key, b: q.key, type: def.type, glyph: def.glyph, angle: def.angle, orb, applying })
          break
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb)
}
