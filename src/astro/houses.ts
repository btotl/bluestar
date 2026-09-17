import { norm360 } from './signs'
import type { HouseSystem } from './types'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

/** Ecliptic longitude of the point on the ecliptic with a given right ascension. */
function raToEclipticLongitude(raDeg: number, obliquityDeg: number): number {
  const ra = raDeg * D2R
  const eps = obliquityDeg * D2R
  return norm360(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps)) * R2D)
}

export function midheaven(ramcDeg: number, obliquityDeg: number): number {
  return raToEclipticLongitude(ramcDeg, obliquityDeg)
}

export function ascendant(ramcDeg: number, obliquityDeg: number, latitudeDeg: number): number {
  const ramc = ramcDeg * D2R
  const eps = obliquityDeg * D2R
  const phi = latitudeDeg * D2R
  const y = Math.cos(ramc)
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))
  return norm360(Math.atan2(y, x) * R2D)
}

export interface HouseResult {
  system: HouseSystem
  cusps: number[]
  ascendant: number
  midheaven: number
}

/**
 * Placidus cusps by the classic semi-arc iteration. Cusps 11, 12, 2, 3 are found
 * by iterating right ascension; 1 and 10 are the ascendant and midheaven; the rest
 * are opposites. Returns null within the polar circles where Placidus is undefined.
 */
function placidusCusps(ramcDeg: number, obliquityDeg: number, latitudeDeg: number): number[] | null {
  const eps = obliquityDeg * D2R
  const phi = latitudeDeg * D2R
  const tanEpsTanPhi = Math.tan(eps) * Math.tan(phi)

  const solve = (fraction: number, offsetDeg: number, sign: 1 | -1): number | null => {
    let ra = ramcDeg + offsetDeg
    for (let i = 0; i < 30; i++) {
      const arg = sign * -Math.sin(ra * D2R) * tanEpsTanPhi
      if (arg < -1 || arg > 1) return null
      const next = ramcDeg + sign * fraction * Math.acos(arg) * R2D + (sign === -1 ? 180 : 0)
      if (Math.abs(norm360(next) - norm360(ra)) < 1e-7) {
        ra = next
        break
      }
      ra = next
    }
    return raToEclipticLongitude(norm360(ra), obliquityDeg)
  }

  const c11 = solve(1 / 3, 30, 1)
  const c12 = solve(2 / 3, 60, 1)
  const c2 = solve(2 / 3, 120, -1)
  const c3 = solve(1 / 3, 150, -1)
  if (c11 === null || c12 === null || c2 === null || c3 === null) return null

  const asc = ascendant(ramcDeg, obliquityDeg, latitudeDeg)
  const mc = midheaven(ramcDeg, obliquityDeg)
  const cusps = new Array<number>(12)
  cusps[0] = asc
  cusps[1] = c2
  cusps[2] = c3
  cusps[3] = norm360(mc + 180)
  cusps[4] = norm360(c11 + 180)
  cusps[5] = norm360(c12 + 180)
  cusps[6] = norm360(asc + 180)
  cusps[7] = norm360(c2 + 180)
  cusps[8] = norm360(c3 + 180)
  cusps[9] = mc
  cusps[10] = c11
  cusps[11] = c12
  return cusps
}

function wholeSignCusps(asc: number): number[] {
  const start = Math.floor(norm360(asc) / 30) * 30
  return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30))
}

export function computeHouses(
  ramcDeg: number,
  obliquityDeg: number,
  latitudeDeg: number,
  preferred: HouseSystem = 'placidus',
): HouseResult {
  const asc = ascendant(ramcDeg, obliquityDeg, latitudeDeg)
  const mc = midheaven(ramcDeg, obliquityDeg)
  if (preferred === 'placidus' && Math.abs(latitudeDeg) < 66) {
    const cusps = placidusCusps(ramcDeg, obliquityDeg, latitudeDeg)
    if (cusps) return { system: 'placidus', cusps, ascendant: asc, midheaven: mc }
  }
  return { system: 'wholeSign', cusps: wholeSignCusps(asc), ascendant: asc, midheaven: mc }
}

/** House number (1..12) containing a longitude, given 12 cusps in zodiacal order. */
export function houseOf(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude)
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]
    const end = cusps[(i + 1) % 12]
    const span = norm360(end - start)
    const offset = norm360(lon - start)
    if (offset < span) return i + 1
  }
  return 12
}
