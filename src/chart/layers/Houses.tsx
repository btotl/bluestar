import { motion } from 'motion/react'
import { BIRTH_T, houseDelay } from '../birthTimeline'
import { reveal, useChartAnim, type Emphasis } from '../context'
import { CHART, type HouseCusp } from '../geometry'

/** Phase 3: cusps travel from the zodiac circumference inward. */
export function HouseCusps({ houses, emphasis, onSelect }: { houses: HouseCusp[]; emphasis: (n: number) => Emphasis; onSelect?: (n: number) => void }) {
  const anim = useChartAnim()
  return (
    <g className="nc-houses">
      {houses.map((h) =>
        h.angular ? null : (
          <motion.line key={h.index} x1={h.line.x1} y1={h.line.y1} x2={h.line.x2} y2={h.line.y2} className={`nc-cusp is-${emphasis(h.number)}`} {...reveal(anim, 'draw', houseDelay(h.index), 0.7)} />
        ),
      )}
      {houses.map((h) => (
        <motion.text key={`n${h.index}`} x={h.numberAt.x} y={h.numberAt.y} className={`nc-house-num is-${emphasis(h.number)}`} textAnchor="middle" dominantBaseline="central" {...reveal(anim, 'fade', BIRTH_T.houseNumbers + h.index * 0.04, 0.6)}>
          {h.number}
        </motion.text>
      ))}
      {onSelect &&
        houses.map((h) => (
          <path key={`hit${h.index}`} d={h.sectorPath} className={`nc-house-hit is-${emphasis(h.number)}`} onClick={() => onSelect(h.number)} role="button" aria-label={`House ${h.number}`} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(h.number) }} />
        ))}
    </g>
  )
}

export function HouseRing() {
  const anim = useChartAnim()
  return (
    <g className="nc-house-ring">
      <motion.circle cx={CHART.c} cy={CHART.c} r={CHART.rHouseIn} className="nc-ring-house" {...reveal(anim, 'fade', BIRTH_T.houses, 0.8)} />
      <motion.circle cx={CHART.c} cy={CHART.c} r={CHART.rAspect} className="nc-ring-aspect" {...reveal(anim, 'fade', BIRTH_T.houses + 0.3, 0.8)} />
    </g>
  )
}
