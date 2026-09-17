import type { BirthMode, BirthRecord as ServerBirthRecord } from '../api/types'
import { buildNatalChart } from '../astro/chart'
import type { Aspect, HouseSystem, NatalChart, Placement, PointKey } from '../astro/types'
import type { PortraitRef } from '../portrait/types'

/**
 * The one canonical Birth object. It is created exactly once, when the
 * server confirms the Birth, and never changes. Every screen (profile,
 * reveal, certificate, chart, interpretations, future compatibility) reads
 * from it; nothing else may carry its own copy of a sign or a degree.
 */
export interface Natal {
  readonly sun: Placement
  readonly moon: Placement
  readonly ascendant: Placement
  readonly midheaven: Placement
  readonly descendant: Placement
  readonly imumCoeli: Placement
  /** Sun … Pluto and the North Node, in traditional order. */
  readonly planets: readonly Placement[]
  /** Planets plus the four angles, for lookups by key. */
  readonly points: readonly Placement[]
  readonly houses: { readonly system: HouseSystem; readonly cusps: readonly number[] }
  readonly aspects: readonly Aspect[]
  readonly obliquity: number
  readonly ramc: number
}

export interface BirthRecord {
  /** The Furby's id. */
  readonly id: string
  readonly certificateNumber: number
  /** The name given at birth. The Furby may be renamed later; this stays. */
  readonly furbyName: string
  readonly portrait?: PortraitRef
  /** ISO 8601 UTC. The canonical instant. */
  readonly timestampUtc: string
  readonly timeZone: string
  readonly latitude: number
  readonly longitude: number
  readonly location: { readonly name: string; readonly region: string; readonly country: string }
  readonly mode: BirthMode
  readonly recordedAtUtc: string
  readonly natal: Natal
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v)
  }
  return value
}

const ANGLES: PointKey[] = ['ascendant', 'midheaven', 'descendant', 'imumCoeli']

export function toNatal(chart: NatalChart): Natal {
  const get = (k: PointKey) => {
    const p = chart.points.find((x) => x.key === k)
    if (!p) throw new Error(`Natal chart is missing ${k}`)
    return p
  }
  return {
    sun: get('sun'),
    moon: get('moon'),
    ascendant: get('ascendant'),
    midheaven: get('midheaven'),
    descendant: get('descendant'),
    imumCoeli: get('imumCoeli'),
    planets: chart.points.filter((p) => !ANGLES.includes(p.key)),
    points: chart.points,
    houses: { system: chart.houseSystem, cusps: chart.cusps },
    aspects: chart.aspects,
    obliquity: chart.obliquity,
    ramc: chart.ramc,
  }
}

/** Build the immutable record from what the server confirmed. */
export function createBirthRecord(server: ServerBirthRecord, portrait?: PortraitRef): BirthRecord {
  const chart = buildNatalChart({
    timestampUtc: server.timestampUtc,
    latitude: server.location.latitude,
    longitude: server.location.longitude,
  })
  return deepFreeze({
    id: server.furbyId,
    certificateNumber: server.certificateNumber,
    furbyName: server.name,
    portrait,
    timestampUtc: new Date(server.timestampUtc).toISOString(),
    timeZone: server.location.timeZone,
    latitude: server.location.latitude,
    longitude: server.location.longitude,
    location: { name: server.location.name, region: server.location.region, country: server.location.country },
    mode: server.mode,
    recordedAtUtc: server.recordedAtUtc,
    natal: toNatal(chart),
  })
}

/** Re-freeze a record that came back from storage. */
export function freezeBirthRecord(record: BirthRecord): BirthRecord {
  return deepFreeze(record)
}

/* ---------- selectors: the only way screens should read natal data ---------- */

export function bigThree(record: BirthRecord) {
  return { sun: record.natal.sun, moon: record.natal.moon, rising: record.natal.ascendant }
}

export function placement(record: BirthRecord, key: PointKey): Placement {
  const p = record.natal.points.find((x) => x.key === key)
  if (!p) throw new Error(`No placement ${key} in birth record ${record.id}`)
  return p
}

export function bornAt(record: BirthRecord): Date {
  return new Date(record.timestampUtc)
}

export function placeLine(record: BirthRecord, sep = ', '): string {
  return [record.location.name, record.location.region, record.location.country].filter(Boolean).join(sep)
}
