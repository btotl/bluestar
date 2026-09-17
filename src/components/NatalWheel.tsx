import { useMemo } from 'react'
import { SIGNS } from '../astro/signs'
import type { AspectType, NatalChart, Placement, PointKey } from '../astro/types'
import './NatalWheel.css'

interface Props {
  chart: NatalChart
  size?: number | string
  /** Show aspect lines in the centre. */
  aspects?: boolean
  /** Keys of points to draw (defaults to planets + node, angles are drawn as lines). */
  onSelect?: (key: PointKey) => void
  selected?: PointKey | null
  /** Progressive reveal 0..1 used by the birth animation. */
  reveal?: number
  className?: string
}

const ELEMENT_TINT: Record<string, string> = {
  fire: 'rgba(255, 154, 60, 0.20)',
  earth: 'rgba(184, 243, 107, 0.13)',
  air: 'rgba(55, 198, 192, 0.16)',
  water: 'rgba(142, 107, 216, 0.22)',
}

const ASPECT_COLOUR: Record<AspectType, string> = {
  conjunction: 'rgba(255, 216, 77, 0.9)',
  opposition: 'rgba(255, 95, 162, 0.85)',
  square: 'rgba(255, 95, 162, 0.7)',
  trine: 'rgba(55, 198, 192, 0.85)',
  sextile: 'rgba(55, 198, 192, 0.55)',
}

const PLANET_KEYS: PointKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode']

const C = 200
const R_OUTER = 192
const R_SIGN_IN = 160
const R_HOUSE_IN = 122
const R_PLANET = 102
const R_ASPECT = 84

function polar(r: number, screenDeg: number): [number, number] {
  const a = (screenDeg * Math.PI) / 180
  return [C + r * Math.cos(a), C - r * Math.sin(a)]
}

function arcPath(r1: number, r2: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r2, a0)
  const [x1, y1] = polar(r2, a1)
  const [x2, y2] = polar(r1, a1)
  const [x3, y3] = polar(r1, a0)
  return `M ${x0} ${y0} A ${r2} ${r2} 0 0 0 ${x1} ${y1} L ${x2} ${y2} A ${r1} ${r1} 0 0 1 ${x3} ${y3} Z`
}

/** Spread glyphs so none overlap: enforce a minimum angular gap. */
function spread(points: { key: PointKey; angle: number }[], minGap: number) {
  const sorted = [...points].sort((a, b) => a.angle - b.angle)
  const out = sorted.map((p) => ({ ...p, drawAngle: p.angle }))
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < out.length; i++) {
      const gap = out[i].drawAngle - out[i - 1].drawAngle
      if (gap < minGap) {
        const push = (minGap - gap) / 2
        out[i - 1].drawAngle -= push
        out[i].drawAngle += push
      }
    }
  }
  return out
}

export function NatalWheel({ chart, size = '100%', aspects = true, onSelect, selected = null, reveal = 1, className = '' }: Props) {
  const asc = chart.cusps[0]
  const toScreen = (lon: number) => 180 + (lon - asc)

  const byKey = useMemo(() => {
    const m = new Map<PointKey, Placement>()
    for (const p of chart.points) m.set(p.key, p)
    return m
  }, [chart])

  const planets = useMemo(() => {
    const pts = PLANET_KEYS.filter((k) => byKey.has(k)).map((k) => ({ key: k, angle: toScreen(byKey.get(k)!.longitude) }))
    return spread(pts, 9)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byKey, asc])

  const signOpacity = Math.min(1, reveal * 1.6)
  const houseOpacity = Math.max(0, Math.min(1, (reveal - 0.3) * 2))
  const planetOpacity = Math.max(0, Math.min(1, (reveal - 0.55) * 2.5))
  const aspectOpacity = Math.max(0, Math.min(1, (reveal - 0.8) * 5))

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} className={`wheel ${className}`} role="img" aria-label="Natal chart wheel">
      <defs>
        <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#101838" />
          <stop offset="100%" stopColor="#070b1f" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R_OUTER + 4} fill="url(#wheel-bg)" stroke="#05060f" strokeWidth="4" />

      {/* sign ring */}
      <g opacity={signOpacity}>
        {SIGNS.map((s) => {
          const a0 = toScreen(s.index * 30)
          const a1 = toScreen(s.index * 30 + 30)
          const [gx, gy] = polar((R_OUTER + R_SIGN_IN) / 2, a0 + 15)
          return (
            <g key={s.key}>
              <path d={arcPath(R_SIGN_IN, R_OUTER, a0, a1)} fill={ELEMENT_TINT[s.element]} stroke="#05060f" strokeWidth="1.5" />
              <text x={gx} y={gy} className="wheel__sign-glyph" textAnchor="middle" dominantBaseline="central">{s.glyph}</text>
              {/* 5-degree ticks */}
              {[5, 10, 15, 20, 25].map((d) => {
                const [tx0, ty0] = polar(R_SIGN_IN, a0 + d)
                const [tx1, ty1] = polar(R_SIGN_IN + (d === 15 ? 7 : 4), a0 + d)
                return <line key={d} x1={tx0} y1={ty0} x2={tx1} y2={ty1} stroke="rgba(255,244,204,0.45)" strokeWidth="1" />
              })}
            </g>
          )
        })}
        <circle cx={C} cy={C} r={R_SIGN_IN} fill="none" stroke="#05060f" strokeWidth="2.5" />
        <circle cx={C} cy={C} r={R_OUTER} fill="none" stroke="#c3ccd9" strokeWidth="1.5" />
      </g>

      {/* house cusps */}
      <g opacity={houseOpacity}>
        {chart.cusps.map((cusp, i) => {
          const a = toScreen(cusp)
          const angular = i === 0 || i === 3 || i === 6 || i === 9
          const [x0, y0] = polar(R_ASPECT, a)
          const [x1, y1] = polar(R_SIGN_IN, a)
          const next = chart.cusps[(i + 1) % 12]
          let span = next - cusp
          if (span < 0) span += 360
          const [nx, ny] = polar(R_HOUSE_IN + 9, a + span / 2)
          return (
            <g key={i}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={angular ? '#fff4cc' : 'rgba(255,244,204,0.35)'} strokeWidth={angular ? 2 : 1} strokeDasharray={angular ? undefined : '3 3'} />
              <text x={nx} y={ny} className="wheel__house-num" textAnchor="middle" dominantBaseline="central">{i + 1}</text>
            </g>
          )
        })}
        <circle cx={C} cy={C} r={R_HOUSE_IN} fill="none" stroke="rgba(255,244,204,0.35)" strokeWidth="1" />
        <circle cx={C} cy={C} r={R_ASPECT} fill="none" stroke="#05060f" strokeWidth="2" />
        {/* ASC / MC labels */}
        {(['ascendant', 'midheaven'] as const).map((k) => {
          const p = byKey.get(k)
          if (!p) return null
          const [lx, ly] = polar(R_OUTER + 2, toScreen(p.longitude))
          const [tx, ty] = polar(R_OUTER - 14, toScreen(p.longitude))
          return (
            <g key={k}>
              <circle cx={lx} cy={ly} r="4" fill="#ffd84d" stroke="#05060f" strokeWidth="1.5" />
              <text x={tx} y={ty} className="wheel__angle-label" textAnchor="middle" dominantBaseline="central">{k === 'ascendant' ? 'AC' : 'MC'}</text>
            </g>
          )
        })}
      </g>

      {/* aspects */}
      {aspects && (
        <g opacity={aspectOpacity}>
          {chart.aspects.map((a, i) => {
            const p = byKey.get(a.a)
            const q = byKey.get(a.b)
            if (!p || !q) return null
            if (!PLANET_KEYS.includes(a.a) || !PLANET_KEYS.includes(a.b)) return null
            const [x0, y0] = polar(R_ASPECT - 2, toScreen(p.longitude))
            const [x1, y1] = polar(R_ASPECT - 2, toScreen(q.longitude))
            const dim = selected && a.a !== selected && a.b !== selected
            return (
              <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={ASPECT_COLOUR[a.type]} strokeWidth={a.orb < 2 ? 1.6 : 1} opacity={dim ? 0.15 : 1 - a.orb / 12} />
            )
          })}
        </g>
      )}

      {/* planets */}
      <g opacity={planetOpacity}>
        {planets.map((pl) => {
          const p = byKey.get(pl.key)!
          const [dx, dy] = polar(R_HOUSE_IN - 3, pl.angle)
          const [px, py] = polar(R_HOUSE_IN - 2, pl.angle)
          const [gx, gy] = polar(R_PLANET, pl.drawAngle)
          const [tx, ty] = polar(R_HOUSE_IN, pl.angle)
          const isSel = selected === pl.key
          return (
            <g
              key={pl.key}
              className={`wheel__planet ${onSelect ? 'wheel__planet--tappable' : ''} ${isSel ? 'is-selected' : ''}`}
              onClick={onSelect ? () => onSelect(pl.key) : undefined}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(pl.key) } : undefined}
            >
              <line x1={tx} y1={ty} x2={gx} y2={gy} stroke="rgba(255,244,204,0.3)" strokeWidth="1" />
              <circle cx={px} cy={py} r="2.4" fill="#fff4cc" />
              <circle cx={dx} cy={dy} r="0" />
              <circle cx={gx} cy={gy} r="11" className="wheel__planet-bg" />
              <text x={gx} y={gy + 0.5} className="wheel__planet-glyph" textAnchor="middle" dominantBaseline="central">{p.glyph}</text>
              {p.retrograde && (
                <text x={gx + 10} y={gy - 8} className="wheel__retro" textAnchor="middle" dominantBaseline="central">℞</text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
