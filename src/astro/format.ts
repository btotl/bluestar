import { SIGN_BY_KEY } from './signs'
import type { Placement } from './types'

/** e.g. 24°41' */
export function formatDegree(degree: number): string {
  const d = Math.floor(degree)
  const m = Math.floor((degree - d) * 60)
  return `${d}°${m.toString().padStart(2, '0')}'`
}

/** e.g. 24°41' Virgo */
export function formatPlacement(p: Placement): string {
  return `${formatDegree(p.degree)} ${SIGN_BY_KEY[p.sign].name}${p.retrograde ? ' ℞' : ''}`
}

export function ordinalHouse(house: number): string {
  const suffix = house === 1 ? 'st' : house === 2 ? 'nd' : house === 3 ? 'rd' : 'th'
  return `${house}${suffix} house`
}

export function formatCoordinates(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lon).toFixed(2)}° ${ew}`
}
