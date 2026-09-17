import { motion } from 'motion/react'
import { GlyphAt } from '../../astro/glyphs'
import type { PointKey } from '../../astro/types'
import { planetDelay } from '../birthTimeline'
import { reveal, useChartAnim, type Emphasis } from '../context'
import type { PlanetPosition } from '../geometry'

/**
 * Planets arrive one at a time at their calculated positions, Sun first,
 * settling in from a few pixels along their orbit.
 */
export function PlanetLayer({ positions, emphasis, onSelect }: { positions: PlanetPosition[]; emphasis: (key: PointKey) => Emphasis; onSelect?: (key: PointKey) => void }) {
  const anim = useChartAnim()
  return (
    <g className="nc-planets">
      {positions.map((p) => {
        const delay = planetDelay(p.key)
        const base = reveal(anim, 'pop', delay, 0.7)
        const arrive =
          anim.mode === 'birth-animation' && !anim.reduced
            ? {
                initial: { opacity: 0, scale: 0.6, x: p.arrival.x, y: p.arrival.y },
                animate: { opacity: 1, scale: 1, x: [p.arrival.x, p.arrival.x * 0.35, 0], y: [p.arrival.y, -p.arrival.y * 0.2, 0] },
                transition: { delay: delay * anim.scale, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
              }
            : base
        const interactive = !!onSelect
        return (
          <motion.g
            key={p.key}
            className={`nc-planet is-${emphasis(p.key)} ${interactive ? 'is-tappable' : ''}`}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            {...arrive}
            onClick={interactive ? () => onSelect!(p.key) : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${p.placement.name}`}
            onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect!(p.key) } : undefined}
          >
            <line x1={p.lead.x1} y1={p.lead.y1} x2={p.lead.x2} y2={p.lead.y2} className="nc-planet__lead" />
            <circle cx={p.marker.x} cy={p.marker.y} r={2.2} className="nc-planet__dot" />
            <circle cx={p.glyphAt.x} cy={p.glyphAt.y} r={11.5} className="nc-planet__bg" />
            <GlyphAt name={p.key} x={p.glyphAt.x} y={p.glyphAt.y} size={13} stroke="currentColor" strokeWidth={2.2} />
            {p.placement.retrograde && (
              <text x={p.glyphAt.x + 10.5} y={p.glyphAt.y - 8} className="nc-planet__retro" textAnchor="middle" dominantBaseline="central">R</text>
            )}
          </motion.g>
        )
      })}
    </g>
  )
}
