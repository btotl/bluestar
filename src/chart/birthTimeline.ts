import type { PointKey } from '../astro/types'
import { PLANET_ORDER } from './geometry'

/**
 * The Birth cinematic, as one table of seconds. Every animated element in
 * the chart reads its delay from here, so the sequence is deterministic and
 * there is exactly one place to retune it.
 */
export const BIRTH_T = {
  /** Phase 1: dark sky, the Furby fades in, THE MOMENT IS SEALED. */
  moment: 0,
  /** Phase 2: a thin circle draws, sectors lock in clockwise, ticks and glyphs follow. */
  ring: 1.5,
  sectors: 2.1,
  ticks: 2.5,
  glyphs: 2.7,
  /** Phase 3: house cusps travel inward, numbers appear softly. */
  houses: 3.2,
  houseNumbers: 3.9,
  /** Phase 4: the horizon. ASC → DSC, then MC → IC, then marker lights. */
  ascendant: 4.2,
  midheaven: 4.8,
  markers: 5.3,
  /** Planets arrive at their positions, Sun first. */
  planets: 5.5,
  /** Aspect constellation. */
  aspects: 7.3,
  /** Illumination lifts, then the words. */
  illuminate: 9.0,
  remembers: 9.4,
  born: 11.0,
  /** Hand over to the Reveal. */
  exit: 13.2,
} as const

export const SECTOR_STEP = 0.045
export const HOUSE_STEP = 0.05
export const PLANET_STEP = 0.16
export const ASPECT_WINDOW = 1.5

export function sectorDelay(i: number): number {
  return BIRTH_T.sectors + i * SECTOR_STEP
}

export function houseDelay(i: number): number {
  return BIRTH_T.houses + i * HOUSE_STEP
}

export function planetDelay(key: PointKey): number {
  const i = Math.max(0, PLANET_ORDER.indexOf(key))
  return BIRTH_T.planets + i * PLANET_STEP
}

/** Aspects share a fixed window whatever their count, tightest first. */
export function aspectDelay(i: number, count: number): number {
  const step = count > 1 ? Math.min(0.12, ASPECT_WINDOW / (count - 1)) : 0
  return BIRTH_T.aspects + i * step
}

/** Reduced-motion timeline: the same beats, compressed, with no movement. */
export const REDUCED_SCALE = 0.35
