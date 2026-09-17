import { useId, useMemo, type ReactNode } from 'react'
import { motion, motionValue, useTransform } from 'motion/react'
import type { PointKey } from '../astro/types'
import type { BirthRecord } from '../birth/birthRecord'
import { REDUCED_SCALE } from './birthTimeline'
import { ChartAnimContext, type ChartAnim, type ChartMode, type ChartSelection, type Emphasis } from './context'
import { CHART, getAspectLines, getAxes, getHouseCusps, getPlanetPositions, getSignSectors, signIndexOf, type Axis } from './geometry'
import { AspectLayer } from './layers/AspectLayer'
import { AxisLines } from './layers/AxisLines'
import { HouseCusps, HouseRing } from './layers/Houses'
import { PlanetLayer } from './layers/PlanetLayer'
import { ZodiacGlyphs, ZodiacRing, ZodiacTicks } from './layers/ZodiacRing'
import type { Parallax } from './useParallax'
import './NatalChart.css'

export type { ChartMode, ChartSelection }

/** A constant motion value for charts without parallax. */
const zero = motionValue(0)

interface Props {
  birthRecord: BirthRecord
  mode?: ChartMode
  /** Reduced-motion rendering: no drawing, opacity only. */
  reducedMotion?: boolean
  size?: number | string
  selection?: ChartSelection
  onSelect?: (selection: ChartSelection) => void
  /** The Furby, rendered above the chart in the exclusion circle. */
  portrait?: ReactNode
  /** Fraction of the inner circle kept clear of aspect geometry. */
  centerClear?: number
  /** After the sky has formed: strokes brighten a touch. */
  illuminated?: boolean
  /** Dim the technical layers so the Furby comes forward (final reveal). */
  recede?: boolean
  parallax?: Parallax
  className?: string
}

/**
 * The natal chart. One geometry, two modes: the chart the owner watches
 * assemble at Birth is literally the chart they explore afterwards.
 *
 * Layer order, back to front: background, aspect web, house geometry,
 * planet markers, central glow, Furby portrait, foreground sparkle.
 */
export function NatalChart({
  birthRecord,
  mode = 'static',
  reducedMotion = false,
  size = '100%',
  selection = null,
  onSelect,
  portrait,
  centerClear = 0.6,
  illuminated = mode === 'static',
  recede = false,
  parallax,
  className = '',
}: Props) {
  const uid = useId().replace(/:/g, '')
  const natal = birthRecord.natal
  const asc = natal.houses.cusps[0]

  const geometry = useMemo(() => {
    const positions = getPlanetPositions(natal)
    return {
      sectors: getSignSectors(asc),
      houses: getHouseCusps(natal.houses.cusps, asc),
      axes: getAxes(natal),
      positions,
      aspects: getAspectLines(natal, positions),
    }
  }, [natal, asc])

  const anim = useMemo<ChartAnim>(() => ({ mode, reduced: reducedMotion, scale: reducedMotion ? REDUCED_SCALE : 1 }), [mode, reducedMotion])

  /* ---------- selection → emphasis ---------- */
  const litSign = useMemo(() => {
    if (!selection) return null
    if (selection.kind === 'point') {
      const p = natal.points.find((x) => x.key === selection.key)
      return p ? signIndexOf(p) : null
    }
    return null
  }, [selection, natal])

  const pointEmphasis = (key: PointKey): Emphasis => {
    if (!selection) return 'normal'
    if (selection.kind === 'point') return selection.key === key ? 'lit' : 'dim'
    if (selection.kind === 'aspect') {
      const a = natal.aspects[selection.index]
      return a && (a.a === key || a.b === key) ? 'lit' : 'dim'
    }
    if (selection.kind === 'house') {
      const p = natal.points.find((x) => x.key === key)
      return p && p.house === selection.number ? 'lit' : 'dim'
    }
    return 'normal'
  }
  const aspectEmphasis = (l: { a: PointKey; b: PointKey; index: number }): Emphasis => {
    if (!selection) return 'normal'
    if (selection.kind === 'point') return l.a === selection.key || l.b === selection.key ? 'lit' : 'dim'
    if (selection.kind === 'aspect') return l.index === selection.index ? 'lit' : 'dim'
    return 'dim'
  }
  const houseEmphasis = (n: number): Emphasis => {
    if (!selection) return 'normal'
    if (selection.kind === 'house') return n === selection.number ? 'lit' : 'dim'
    if (selection.kind === 'point') {
      const p = natal.points.find((x) => x.key === selection.key)
      return p && p.house === n ? 'lit' : 'normal'
    }
    return 'normal'
  }
  const axisEmphasis = (key: Axis['key']): Emphasis => {
    if (!selection) return 'normal'
    if (selection.kind === 'point') return selection.key === key ? 'lit' : 'dim'
    return 'dim'
  }

  /* ---------- parallax: far ring 2px, planets 3px ---------- */
  const ringX = useTransform(parallax?.x ?? zero, (v) => v * 2)
  const ringY = useTransform(parallax?.y ?? zero, (v) => v * 2)
  const planetX = useTransform(parallax?.x ?? zero, (v) => v * 3)
  const planetY = useTransform(parallax?.y ?? zero, (v) => v * 3)

  const maskId = `nc-mask-${uid}`
  const gradId = `nc-clear-${uid}`
  const cls = ['natal-chart', `natal-chart--${mode}`, illuminated ? 'is-illuminated' : '', recede ? 'is-receded' : '', selection ? 'has-selection' : '', className].filter(Boolean).join(' ')

  return (
    <ChartAnimContext.Provider value={anim}>
      <div className={cls} style={{ width: size }}>
        <svg viewBox={`0 0 ${CHART.size} ${CHART.size}`} className="natal-chart__svg" role="img" aria-label={`${birthRecord.furbyName}'s natal chart`}>
          <defs>
            <radialGradient id={gradId} gradientUnits="userSpaceOnUse" cx={CHART.c} cy={CHART.c} r={CHART.rAspect}>
              <stop offset={Math.max(0, centerClear - 0.12)} stopColor="#000" />
              <stop offset={Math.min(1, centerClear + 0.1)} stopColor="#fff" />
            </radialGradient>
            <mask id={maskId}>
              <rect x="0" y="0" width={CHART.size} height={CHART.size} fill={`url(#${gradId})`} />
            </mask>
          </defs>

          <motion.g style={{ x: ringX, y: ringY }}>
            <ZodiacRing sectors={geometry.sectors} litIndex={litSign} />
            <ZodiacTicks sectors={geometry.sectors} />
            <ZodiacGlyphs sectors={geometry.sectors} litIndex={litSign} />
          </motion.g>

          <AspectLayer lines={geometry.aspects} maskId={maskId} emphasis={aspectEmphasis} onSelect={onSelect ? (index) => onSelect({ kind: 'aspect', index }) : undefined} />
          <HouseRing />
          <HouseCusps houses={geometry.houses} emphasis={houseEmphasis} onSelect={onSelect ? (number) => onSelect({ kind: 'house', number }) : undefined} />
          <AxisLines axes={geometry.axes} emphasis={axisEmphasis} onSelect={onSelect ? (key) => onSelect({ kind: 'point', key }) : undefined} />

          <motion.g style={{ x: planetX, y: planetY }}>
            <PlanetLayer positions={geometry.positions} emphasis={pointEmphasis} onSelect={onSelect ? (key) => onSelect({ kind: 'point', key }) : undefined} />
          </motion.g>
        </svg>

        <div className="natal-chart__glow" aria-hidden="true" />
        {portrait && <div className="natal-chart__portrait">{portrait}</div>}
        <div className="natal-chart__sparkle" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </ChartAnimContext.Provider>
  )
}
