import { motion } from 'motion/react'
import { GlyphAt } from '../../astro/glyphs'
import { BIRTH_T, sectorDelay } from '../birthTimeline'
import { reveal, useChartAnim } from '../context'
import { CHART, type SignSector } from '../geometry'

const ELEMENT_TINT: Record<string, string> = {
  fire: 'rgba(255, 154, 60, 0.16)',
  earth: 'rgba(184, 243, 107, 0.10)',
  air: 'rgba(55, 198, 192, 0.13)',
  water: 'rgba(142, 107, 216, 0.18)',
}

/** Phase 2: a thin circle draws, then twelve sectors lock in clockwise. */
export function ZodiacRing({ sectors, litIndex }: { sectors: SignSector[]; litIndex: number | null }) {
  const anim = useChartAnim()
  return (
    <g className="nc-zodiac">
      <motion.circle cx={CHART.c} cy={CHART.c} r={CHART.rOuter + 4} className="nc-zodiac__bg" {...reveal(anim, 'fade', BIRTH_T.ring, 1)} />
      {sectors.map((s, i) => (
        <motion.path
          key={s.sign.key}
          d={s.path}
          fill={ELEMENT_TINT[s.sign.element]}
          className={`nc-zodiac__sector ${litIndex === i ? 'is-lit' : ''}`}
          {...reveal(anim, 'fade', sectorDelay(i), 0.5)}
        />
      ))}
      <motion.circle cx={CHART.c} cy={CHART.c} r={CHART.rSignIn} className="nc-zodiac__inner" {...reveal(anim, 'fade', BIRTH_T.sectors, 0.6)} />
      <motion.circle
        cx={CHART.c}
        cy={CHART.c}
        r={CHART.rOuter}
        className="nc-zodiac__outer"
        style={{ rotate: -90, transformOrigin: `${CHART.c}px ${CHART.c}px` }}
        {...reveal(anim, 'draw', BIRTH_T.ring, 1.1)}
      />
    </g>
  )
}

/** Small tick marks propagate around the ring after the sectors. */
export function ZodiacTicks({ sectors }: { sectors: SignSector[] }) {
  const anim = useChartAnim()
  return (
    <g className="nc-ticks">
      {sectors.map((s, i) =>
        s.ticks.map((t, k) => (
          <motion.line key={`${s.sign.key}-${k}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className="nc-tick" {...reveal(anim, 'fade', BIRTH_T.ticks + i * 0.04 + k * 0.008, 0.3)} />
        )),
      )}
    </g>
  )
}

/** The custom SVG zodiac glyphs around the circumference. */
export function ZodiacGlyphs({ sectors, litIndex }: { sectors: SignSector[]; litIndex: number | null }) {
  const anim = useChartAnim()
  return (
    <g className="nc-glyphs">
      {sectors.map((s, i) => (
        <motion.g key={s.sign.key} className={`nc-sign-glyph ${litIndex === i ? 'is-lit' : ''}`} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} {...reveal(anim, 'pop', BIRTH_T.glyphs + i * 0.04, 0.5)}>
          <GlyphAt name={s.sign.key} x={s.glyphAt.x} y={s.glyphAt.y} size={16} stroke="currentColor" strokeWidth={2} />
        </motion.g>
      ))}
    </g>
  )
}
