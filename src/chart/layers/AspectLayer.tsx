import { motion } from 'motion/react'
import type { AspectType } from '../../astro/types'
import { aspectDelay } from '../birthTimeline'
import { reveal, useChartAnim, type Emphasis } from '../context'
import { CHART, type AspectLine } from '../geometry'

const COLOUR: Record<AspectType, string> = {
  conjunction: '#ffd84d',
  opposition: '#ff5fa2',
  square: '#ff5fa2',
  trine: '#37c6c0',
  sextile: '#37c6c0',
}

/**
 * The constellation: lines between the exact positions of bodies that form
 * an aspect, drawn tightest first. A radial mask keeps them off the portrait.
 */
export function AspectLayer({ lines, maskId, emphasis, onSelect }: { lines: AspectLine[]; maskId: string; emphasis: (l: AspectLine) => Emphasis; onSelect?: (index: number) => void }) {
  const anim = useChartAnim()
  return (
    <g className="nc-aspects" mask={`url(#${maskId})`}>
      {lines.map((l, i) => {
        const strength = 1 - l.aspect.orb / 12
        const r = reveal(anim, 'draw', aspectDelay(i, lines.length), 0.7)
        const animate = anim.mode === 'static' ? { pathLength: 1, opacity: strength * 0.7 } : { ...(r.animate as object), opacity: strength * 0.7 }
        return (
          <g key={l.index} className={`nc-aspect nc-aspect--${l.aspect.type} is-${emphasis(l)}`}>
            <motion.line x1={l.line.x1} y1={l.line.y1} x2={l.line.x2} y2={l.line.y2} stroke={COLOUR[l.aspect.type]} strokeWidth={l.aspect.orb < 2 ? 1.5 : 1} className="nc-aspect__line" {...r} animate={animate} />
            {onSelect && <line x1={l.line.x1} y1={l.line.y1} x2={l.line.x2} y2={l.line.y2} className="nc-aspect__hit" onClick={() => onSelect(l.index)} />}
          </g>
        )
      })}
      <circle cx={CHART.c} cy={CHART.c} r={CHART.rAspect * 0.6} className="nc-aspects__clear" />
    </g>
  )
}
