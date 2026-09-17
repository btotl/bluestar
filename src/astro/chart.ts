import { BODIES, dailySpeed, makeTime, ramcDegrees, tropicalLongitude, trueObliquity } from './ephemeris'
import { computeHouses, houseOf } from './houses'
import { findAspects } from './aspects'
import { degreeInSign, norm360, signForLongitude } from './signs'
import type { HouseSystem, NatalChart, Placement } from './types'

export interface ChartInput {
  /** The canonical birth instant, in UTC. */
  timestampUtc: Date | string
  latitude: number
  longitude: number
  houseSystem?: HouseSystem
}

export function buildNatalChart(input: ChartInput): NatalChart {
  const date = typeof input.timestampUtc === 'string' ? new Date(input.timestampUtc) : input.timestampUtc
  if (Number.isNaN(date.getTime())) throw new Error('Invalid birth timestamp')
  const time = makeTime(date)
  const obliquity = trueObliquity(time)
  const ramc = ramcDegrees(time, input.longitude)
  const houses = computeHouses(ramc, obliquity, input.latitude, input.houseSystem ?? 'placidus')

  const points: Placement[] = BODIES.map((meta) => {
    const lon = tropicalLongitude(meta.key, time)
    const speed = meta.key === 'northNode' ? -0.0529 : dailySpeed(meta.key, time)
    const sign = signForLongitude(lon)
    return {
      key: meta.key,
      name: meta.name,
      glyph: meta.glyph,
      longitude: lon,
      sign: sign.key,
      degree: degreeInSign(lon),
      house: houseOf(lon, houses.cusps),
      retrograde: meta.key === 'northNode' ? false : speed < 0,
      speed,
    }
  })

  const angle = (key: Placement['key'], name: string, glyph: string, lon: number, house: number): Placement => ({
    key,
    name,
    glyph,
    longitude: lon,
    sign: signForLongitude(lon).key,
    degree: degreeInSign(lon),
    house,
    retrograde: false,
    speed: 360.985647, // angles move with the sky, once per sidereal day
  })

  points.push(
    angle('ascendant', 'Ascendant', '↑', houses.ascendant, 1),
    angle('midheaven', 'Midheaven', 'MC', houses.midheaven, 10),
    angle('descendant', 'Descendant', '↓', norm360(houses.ascendant + 180), 7),
    angle('imumCoeli', 'Imum Coeli', 'IC', norm360(houses.midheaven + 180), 4),
  )

  const sun = points.find((p) => p.key === 'sun')!
  const moon = points.find((p) => p.key === 'moon')!
  const rising = points.find((p) => p.key === 'ascendant')!

  return {
    timestampUtc: date.toISOString(),
    latitude: input.latitude,
    longitude: input.longitude,
    houseSystem: houses.system,
    cusps: houses.cusps,
    obliquity,
    ramc,
    points,
    aspects: findAspects(points),
    bigThree: { sun: sun.sign, moon: moon.sign, rising: rising.sign },
  }
}
