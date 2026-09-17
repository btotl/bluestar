import { motion } from 'motion/react'
import { BIRTH_T } from '../birthTimeline'
import { reveal, useChartAnim, type Emphasis } from '../context'
import type { Axis } from '../geometry'

/** Phase 4: the horizon. ASC → centre → DSC, then MC → IC, then the marker lights. */
export function AxisLines({ axes, emphasis, onSelect }: { axes: Axis[]; emphasis: (key: Axis['key']) => Emphasis; onSelect?: (key: Axis['key']) => void }) {
  const anim = useChartAnim()
  return (
    <g className="nc-axes">
      {axes.map((a) => {
        const t0 = a.key === 'ascendant' ? BIRTH_T.ascendant : BIRTH_T.midheaven
        const cls = `is-${emphasis(a.key)}`
        return (
          <g key={a.key} className={`nc-axis nc-axis--${a.key} ${cls}`}>
            <motion.line x1={a.line.x1} y1={a.line.y1} x2={a.line.x2} y2={a.line.y2} className="nc-axis__line" {...reveal(anim, 'draw', t0, 0.55)} />
            <motion.line x1={a.opposite.x1} y1={a.opposite.y1} x2={a.opposite.x2} y2={a.opposite.y2} className="nc-axis__line nc-axis__line--far" {...reveal(anim, 'draw', t0 + 0.3, 0.45)} />
            <motion.circle cx={a.marker.x} cy={a.marker.y} r={4} className="nc-axis__marker" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} {...reveal(anim, 'pop', BIRTH_T.markers + (a.key === 'midheaven' ? 0.15 : 0), 0.5)} />
            <motion.text
              x={a.labelAt.x}
              y={a.labelAt.y}
              className="nc-axis__label"
              textAnchor="middle"
              dominantBaseline="central"
              {...reveal(anim, 'fade', BIRTH_T.markers + 0.2, 0.5)}
              onClick={onSelect ? () => onSelect(a.key) : undefined}
              role={onSelect ? 'button' : undefined}
            >
              {a.label}
            </motion.text>
          </g>
        )
      })}
    </g>
  )
}
