import { useId, useMemo } from 'react'
import { GlyphAt } from '../astro/glyphs'
import { SIGNS } from '../astro/signs'
import type { AspectType, Placement, PointKey } from '../astro/types'
import type { Natal } from '../birth/birthRecord'
import './NatalWheel.css'

/**
 * Reveal stages, in the order the sky forms around the Furby during Birth.
 * 'full' is the resting state for every static screen.
 */
export type WheelStage = 'none' | 'ring' | 'houses' | 'angles' | 'planets' | 'aspects' | 'full'
const STAGE_ORDER: WheelStage[] = ['none', 'ring', 'houses', 'angles', 'planets', 'aspects', 'full']

interface Props {
  natal: Natal
  size?: number | string
  stage?: WheelStage
  aspects?: boolean
  onSelect?: (key: PointKey) => void
  selected?: PointKey | null
  /**
   * Radius (as a fraction of the inner circle) kept clear of aspect geometry
   * so a portrait in the centre stays readable. 0 draws full chords.
   */
  centerClear?: number
  className?: string
}

const ELEMENT_TINT: Record<string, string> = {
  fire: 'rgba(255, 154, 60, 0.16)',
  earth: 'rgba(184, 243, 107, 0.10)',
  air: 'rgba(55, 198, 192, 0.13)',
  water: 'rgba(142, 107, 216, 0.18)',
}

const ASPECT_COLOUR: Record<AspectType, string> = {
  conjunction: 'rgba(255, 216, 77, 0.85)',
  opposition: 'rgba(255, 95, 162, 0.8)',
  square: 'rgba(255, 95, 162, 0.62)',
  trine: 'rgba(55, 198, 192, 0.8)',
  sextile: 'rgba(55, 198, 192, 0.5)',
}

const PLANET_KEYS: PointKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode']

const C = 200
const R_OUTER = 192
const R_SIGN_IN = 164
const R_HOUSE_IN = 126
const R_PLANET = 108
const R_ASPECT = 88

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

/**
 * Every mark on this wheel is a calculated fact from the Birth record: sign
 * sectors rotate to the Ascendant, cusps are the house system's, planets sit
 * at their longitudes, aspect lines join the pairs the engine found.
 */
export function NatalWheel({ natal, size = '100%', stage = 'full', aspects = true, onSelect, selected = null, centerClear = 0.55, className = '' }: Props) {
  const uid = useId().replace(/:/g, '')
  const level = STAGE_ORDER.indexOf(stage)
  const on = (s: WheelStage) => level >= STAGE_ORDER.indexOf(s)
  const asc = natal.houses.cusps[0]
  const toScreen = (lon: number) => 180 + (lon - asc)

  const byKey = useMemo(() => {
    const m = new Map<PointKey, Placement>()
    for (const p of natal.points) m.set(p.key, p)
    return m
  }, [natal])

  const planets = useMemo(
    () => spread(PLANET_KEYS.filter((k) => byKey.has(k)).map((k) => ({ key: k, angle: toScreen(byKey.get(k)!.longitude) })), 9),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byKey, asc],
  )

  const clearR = R_ASPECT * centerClear

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} className={`wheel wheel--${stage} ${className}`} role="img" aria-label="Natal chart wheel">
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f1737" />
          <stop offset="100%" stopColor="#070b1f" />
        </radialGradient>
        {/* Aspect lines fade out before they reach the portrait */}
        <radialGradient id={`clear-${uid}`} gradientUnits="userSpaceOnUse" cx={C} cy={C} r={R_ASPECT}>
          <stop offset={Math.max(0, centerClear - 0.12)} stopColor="#000" />
          <stop offset={Math.min(1, centerClear + 0.1)} stopColor="#fff" />
        </radialGradient>
        <mask id={`mask-${uid}`}>
          <rect x="0" y="0" width="400" height="400" fill={`url(#clear-${uid})`} />
        </mask>
      </defs>

      <circle cx={C} cy={C} r={R_OUTER + 4} fill={`url(#bg-${uid})`} className={`wheel__bg ${on('ring') ? 'is-on' : ''}`} />

      {/* 1. zodiac ring */}
      <g className={`wheel__layer wheel__signs ${on('ring') ? 'is-on' : ''}`}>
        {SIGNS.map((s) => {
          const a0 = toScreen(s.index * 30)
          const a1 = toScreen(s.index * 30 + 30)
          const [gx, gy] = polar((R_OUTER + R_SIGN_IN) / 2, a0 + 15)
          return (
            <g key={s.key}>
              <path d={arcPath(R_SIGN_IN, R_OUTER, a0, a1)} fill={ELEMENT_TINT[s.element]} stroke="rgba(5,6,15,0.7)" strokeWidth="1" />
              <GlyphAt name={s.key} x={gx} y={gy} size={16} stroke="#fff4cc" strokeWidth={2} />
              {[5, 10, 15, 20, 25].map((d) => {
                const [tx0, ty0] = polar(R_SIGN_IN, a0 + d)
                const [tx1, ty1] = polar(R_SIGN_IN + (d === 15 ? 6 : 3.5), a0 + d)
                return <line key={d} x1={tx0} y1={ty0} x2={tx1} y2={ty1} className="wheel__tick" />
              })}
            </g>
          )
        })}
        <circle cx={C} cy={C} r={R_SIGN_IN} className="wheel__ring-inner" />
        <circle cx={C} cy={C} r={R_OUTER} className="wheel__ring-outer" pathLength={1} />
      </g>

      {/* 2. houses */}
      <g className={`wheel__layer wheel__houses ${on('houses') ? 'is-on' : ''}`}>
        {natal.houses.cusps.map((cusp, i) => {
          const a = toScreen(cusp)
          const angular = i === 0 || i === 3 || i === 6 || i === 9
          if (angular) return null
          const [x0, y0] = polar(R_ASPECT, a)
          const [x1, y1] = polar(R_SIGN_IN, a)
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} className="wheel__cusp" />
        })}
        {natal.houses.cusps.map((cusp, i) => {
          const next = natal.houses.cusps[(i + 1) % 12]
          let span = next - cusp
          if (span < 0) span += 360
          const [nx, ny] = polar(R_HOUSE_IN + 8, toScreen(cusp) + span / 2)
          return (
            <text key={`n${i}`} x={nx} y={ny} className="wheel__house-num" textAnchor="middle" dominantBaseline="central">{i + 1}</text>
          )
        })}
        <circle cx={C} cy={C} r={R_HOUSE_IN} className="wheel__ring-house" />
        <circle cx={C} cy={C} r={R_ASPECT} className="wheel__ring-aspect" />
      </g>

      {/* 3. angles: Ascendant and Midheaven axes */}
      <g className={`wheel__layer wheel__angles ${on('angles') ? 'is-on' : ''}`}>
        {(['ascendant', 'midheaven'] as const).map((k) => {
          const p = byKey.get(k)
          if (!p) return null
          const a = toScreen(p.longitude)
          const [x0, y0] = polar(R_ASPECT, a)
          const [x1, y1] = polar(R_OUTER, a)
          const [ox0, oy0] = polar(R_ASPECT, a + 180)
          const [ox1, oy1] = polar(R_SIGN_IN, a + 180)
          const [lx, ly] = polar(R_OUTER + 1, a)
          const [tx, ty] = polar(R_OUTER - 13, a)
          return (
            <g key={k}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} className="wheel__axis" pathLength={1} />
              <line x1={ox0} y1={oy0} x2={ox1} y2={oy1} className="wheel__axis wheel__axis--opposite" pathLength={1} />
              <circle cx={lx} cy={ly} r="4" className="wheel__axis-dot" />
              <text x={tx} y={ty} className="wheel__angle-label" textAnchor="middle" dominantBaseline="central">{k === 'ascendant' ? 'AC' : 'MC'}</text>
            </g>
          )
        })}
      </g>

      {/* 4. aspects, kept away from the centre */}
      {aspects && (
        <g className={`wheel__layer wheel__aspects ${on('aspects') ? 'is-on' : ''}`} mask={centerClear > 0 ? `url(#mask-${uid})` : undefined}>
          {natal.aspects.map((a, i) => {
            const p = byKey.get(a.a)
            const q = byKey.get(a.b)
            if (!p || !q) return null
            if (!PLANET_KEYS.includes(a.a) || !PLANET_KEYS.includes(a.b)) return null
            const [x0, y0] = polar(R_ASPECT - 2, toScreen(p.longitude))
            const [x1, y1] = polar(R_ASPECT - 2, toScreen(q.longitude))
            const dim = selected && a.a !== selected && a.b !== selected
            return (
              <line
                key={i}
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke={ASPECT_COLOUR[a.type]}
                strokeWidth={a.orb < 2 ? 1.5 : 1}
                opacity={dim ? 0.12 : 1 - a.orb / 12}
                pathLength={1}
                className="wheel__aspect"
                style={{ transitionDelay: `${i * 60}ms` }}
              />
            )
          })}
          {clearR > 0 && <circle cx={C} cy={C} r={clearR} className="wheel__clear" />}
        </g>
      )}

      {/* 5. planets */}
      <g className={`wheel__layer wheel__planets ${on('planets') ? 'is-on' : ''}`}>
        {planets.map((pl, i) => {
          const p = byKey.get(pl.key)!
          const [px, py] = polar(R_HOUSE_IN - 2, pl.angle)
          const [gx, gy] = polar(R_PLANET, pl.drawAngle)
          const [tx, ty] = polar(R_HOUSE_IN - 1, pl.angle)
          const isSel = selected === pl.key
          return (
            <g
              key={pl.key}
              className={`wheel__planet ${onSelect ? 'wheel__planet--tappable' : ''} ${isSel ? 'is-selected' : ''}`}
              style={{ transitionDelay: `${i * 90}ms`, transformOrigin: `${gx}px ${gy}px` }}
              onClick={onSelect ? () => onSelect(pl.key) : undefined}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(pl.key) } : undefined}
            >
              <line x1={tx} y1={ty} x2={gx} y2={gy} className="wheel__planet-lead" />
              <circle cx={px} cy={py} r="2.2" className="wheel__planet-dot" />
              <circle cx={gx} cy={gy} r="11.5" className="wheel__planet-bg" />
              <GlyphAt name={p.key} x={gx} y={gy} size={13} stroke="currentColor" strokeWidth={2.2} className="wheel__planet-glyph" />
              {p.retrograde && (
                <text x={gx + 10.5} y={gy - 8} className="wheel__retro" textAnchor="middle" dominantBaseline="central">R</text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
