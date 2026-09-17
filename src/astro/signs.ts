export type SignKey =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'

export type Element = 'fire' | 'earth' | 'air' | 'water'
export type Modality = 'cardinal' | 'fixed' | 'mutable'

export interface SignInfo {
  key: SignKey
  name: string
  glyph: string
  element: Element
  modality: Modality
  ruler: string
  /** 0-based index, Aries = 0 */
  index: number
}

export const SIGNS: readonly SignInfo[] = [
  { key: 'aries', name: 'Aries', glyph: '♈\uFE0E', element: 'fire', modality: 'cardinal', ruler: 'Mars', index: 0 },
  { key: 'taurus', name: 'Taurus', glyph: '♉\uFE0E', element: 'earth', modality: 'fixed', ruler: 'Venus', index: 1 },
  { key: 'gemini', name: 'Gemini', glyph: '♊\uFE0E', element: 'air', modality: 'mutable', ruler: 'Mercury', index: 2 },
  { key: 'cancer', name: 'Cancer', glyph: '♋\uFE0E', element: 'water', modality: 'cardinal', ruler: 'Moon', index: 3 },
  { key: 'leo', name: 'Leo', glyph: '♌\uFE0E', element: 'fire', modality: 'fixed', ruler: 'Sun', index: 4 },
  { key: 'virgo', name: 'Virgo', glyph: '♍\uFE0E', element: 'earth', modality: 'mutable', ruler: 'Mercury', index: 5 },
  { key: 'libra', name: 'Libra', glyph: '♎\uFE0E', element: 'air', modality: 'cardinal', ruler: 'Venus', index: 6 },
  { key: 'scorpio', name: 'Scorpio', glyph: '♏\uFE0E', element: 'water', modality: 'fixed', ruler: 'Pluto', index: 7 },
  { key: 'sagittarius', name: 'Sagittarius', glyph: '♐\uFE0E', element: 'fire', modality: 'mutable', ruler: 'Jupiter', index: 8 },
  { key: 'capricorn', name: 'Capricorn', glyph: '♑\uFE0E', element: 'earth', modality: 'cardinal', ruler: 'Saturn', index: 9 },
  { key: 'aquarius', name: 'Aquarius', glyph: '♒\uFE0E', element: 'air', modality: 'fixed', ruler: 'Uranus', index: 10 },
  { key: 'pisces', name: 'Pisces', glyph: '♓\uFE0E', element: 'water', modality: 'mutable', ruler: 'Neptune', index: 11 },
] as const

export const SIGN_BY_KEY: Record<SignKey, SignInfo> = Object.fromEntries(
  SIGNS.map((s) => [s.key, s]),
) as Record<SignKey, SignInfo>

/** Normalise any angle in degrees to [0, 360). */
export function norm360(deg: number): number {
  const d = deg % 360
  return d < 0 ? d + 360 : d
}

/** Which sign a tropical ecliptic longitude falls in. */
export function signForLongitude(lon: number): SignInfo {
  const idx = Math.floor(norm360(lon) / 30)
  return SIGNS[idx]
}

/** Degrees within the sign, 0 <= x < 30. */
export function degreeInSign(lon: number): number {
  return norm360(lon) % 30
}
