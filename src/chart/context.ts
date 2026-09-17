import { createContext, useContext } from 'react'
import type { PointKey } from '../astro/types'
import { REDUCED_SCALE } from './birthTimeline'

export type ChartMode = 'static' | 'birth-animation'

export type ChartSelection =
  | { kind: 'point'; key: PointKey }
  | { kind: 'house'; number: number }
  | { kind: 'aspect'; index: number }
  | null

export type Emphasis = 'normal' | 'lit' | 'dim'

export interface ChartAnim {
  mode: ChartMode
  /** True when the user prefers reduced motion: no drawing or movement, only opacity. */
  reduced: boolean
  /** Multiplies every timeline delay (1, or REDUCED_SCALE). */
  scale: number
}

export const ChartAnimContext = createContext<ChartAnim>({ mode: 'static', reduced: false, scale: 1 })

export function useChartAnim(): ChartAnim {
  return useContext(ChartAnimContext)
}

type Kind = 'draw' | 'fade' | 'pop'

/**
 * Motion props for one element. In static mode nothing animates; in
 * birth-animation mode the element reveals at `delay` seconds from the table.
 */
export function reveal(anim: ChartAnim, kind: Kind, delay: number, duration = 0.8) {
  if (anim.mode === 'static') return { initial: false as const, animate: kind === 'draw' ? { pathLength: 1, opacity: 1 } : { opacity: 1, scale: 1 } }
  if (anim.reduced) {
    return {
      initial: { opacity: 0, ...(kind === 'draw' ? { pathLength: 1 } : { scale: 1 }) },
      animate: { opacity: 1 },
      transition: { delay: delay * REDUCED_SCALE, duration: 0.4, ease: 'easeOut' as const },
    }
  }
  const t = { delay: delay * anim.scale, duration, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] }
  if (kind === 'draw') return { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: t }
  if (kind === 'pop') return { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: 1 }, transition: { ...t, scale: { ...t, type: 'spring' as const, stiffness: 220, damping: 18 } } }
  return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: t }
}
