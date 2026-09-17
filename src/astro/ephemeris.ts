import * as Astronomy from 'astronomy-engine'
import type { BodyKey } from './types'
import { norm360 } from './signs'

export interface BodyMeta {
  key: BodyKey
  name: string
  glyph: string
  /** Body in the astronomy-engine sense, or null for computed points. */
  body: Astronomy.Body | null
}

export const BODIES: readonly BodyMeta[] = [
  { key: 'sun', name: 'Sun', glyph: '☉', body: Astronomy.Body.Sun },
  { key: 'moon', name: 'Moon', glyph: '☾', body: Astronomy.Body.Moon },
  { key: 'mercury', name: 'Mercury', glyph: '☿', body: Astronomy.Body.Mercury },
  { key: 'venus', name: 'Venus', glyph: '♀', body: Astronomy.Body.Venus },
  { key: 'mars', name: 'Mars', glyph: '♂', body: Astronomy.Body.Mars },
  { key: 'jupiter', name: 'Jupiter', glyph: '♃', body: Astronomy.Body.Jupiter },
  { key: 'saturn', name: 'Saturn', glyph: '♄', body: Astronomy.Body.Saturn },
  { key: 'uranus', name: 'Uranus', glyph: '♅', body: Astronomy.Body.Uranus },
  { key: 'neptune', name: 'Neptune', glyph: '♆', body: Astronomy.Body.Neptune },
  { key: 'pluto', name: 'Pluto', glyph: '♇', body: Astronomy.Body.Pluto },
  { key: 'northNode', name: 'North Node', glyph: '☊', body: null },
]

/**
 * Mean longitude of the Moon's ascending node (Meeus, Astronomical Algorithms ch. 47).
 * Good to a fraction of a degree, which is all the wheel needs.
 */
export function meanLunarNode(time: Astronomy.AstroTime): number {
  const T = time.tt / 36525
  const omega =
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000
  return norm360(omega)
}

/**
 * Apparent geocentric tropical ecliptic longitude (true equinox of date) of a body.
 * astronomy-engine's Ecliptic() converts a J2000 geocentric vector to the true
 * ecliptic of date, which is the frame astrology uses.
 */
export function tropicalLongitude(key: BodyKey, time: Astronomy.AstroTime): number {
  switch (key) {
    case 'sun':
      return norm360(Astronomy.SunPosition(time).elon)
    case 'moon':
      return norm360(Astronomy.EclipticGeoMoon(time).lon)
    case 'northNode':
      return meanLunarNode(time)
    default: {
      const meta = BODIES.find((b) => b.key === key)
      if (!meta || !meta.body) throw new Error(`Unknown body ${key}`)
      const vec = Astronomy.GeoVector(meta.body, time, true)
      return norm360(Astronomy.Ecliptic(vec).elon)
    }
  }
}

/** Signed daily motion in degrees; negative means retrograde. */
export function dailySpeed(key: BodyKey, time: Astronomy.AstroTime): number {
  const halfDay = 0.5
  const before = tropicalLongitude(key, time.AddDays(-halfDay))
  const after = tropicalLongitude(key, time.AddDays(halfDay))
  let delta = after - before
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

export function trueObliquity(time: Astronomy.AstroTime): number {
  return Astronomy.e_tilt(time).tobl
}

/** Right ascension of the meridian (local sidereal time) in degrees. */
export function ramcDegrees(time: Astronomy.AstroTime, longitudeEast: number): number {
  const gstHours = Astronomy.SiderealTime(time)
  return norm360(gstHours * 15 + longitudeEast)
}

export function makeTime(date: Date): Astronomy.AstroTime {
  return Astronomy.MakeTime(date)
}
