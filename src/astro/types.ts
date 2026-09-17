import type { SignKey } from './signs'

export type BodyKey =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter'
  | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'northNode'

export type AngleKey = 'ascendant' | 'midheaven' | 'descendant' | 'imumCoeli'

export type PointKey = BodyKey | AngleKey

export interface Placement {
  key: PointKey
  name: string
  glyph: string
  /** Tropical ecliptic longitude, 0-360 */
  longitude: number
  sign: SignKey
  /** 0 <= degree < 30 */
  degree: number
  /** 1..12 */
  house: number
  retrograde: boolean
  /** Degrees per day, signed. */
  speed: number
}

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile'

export interface Aspect {
  a: PointKey
  b: PointKey
  type: AspectType
  glyph: string
  /** Exact angle for the aspect (0, 60, 90, 120, 180) */
  angle: number
  /** Deviation from exact, in degrees (always >= 0) */
  orb: number
  applying: boolean
}

export type HouseSystem = 'placidus' | 'wholeSign'

export interface NatalChart {
  /** ISO 8601 UTC instant the chart was cast for */
  timestampUtc: string
  latitude: number
  longitude: number
  houseSystem: HouseSystem
  /** 12 cusp longitudes, index 0 = 1st house cusp (ascendant) */
  cusps: number[]
  obliquity: number
  /** Local sidereal time in degrees (RAMC) */
  ramc: number
  points: Placement[]
  aspects: Aspect[]
  bigThree: { sun: SignKey; moon: SignKey; rising: SignKey }
}
