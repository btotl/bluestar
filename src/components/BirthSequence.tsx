import { useEffect, useMemo, useState } from 'react'
import { SIGN_BY_KEY } from '../astro/signs'
import { formatTime } from '../lib/time'
import { formatCertificateNumber, type Furby } from '../store/furbyStore'
import { FurbyPortrait } from './FurbyPortrait'
import { NatalWheel } from './NatalWheel'
import { EmbossButton } from './primitives'
import { Starfield } from './Starfield'
import './BirthSequence.css'

const PHASES = ['freeze', 'black', 'star', 'constellation', 'wheel', 'awake', 'born', 'sun', 'moon', 'rising', 'cert'] as const
type Phase = (typeof PHASES)[number]

/** Milliseconds after start at which each phase begins. */
const TIMELINE: Record<Phase, number> = {
  freeze: 0,
  black: 1000,
  star: 1500,
  constellation: 2200,
  wheel: 3700,
  awake: 6100,
  born: 7000,
  sun: 8000,
  moon: 9000,
  rising: 9700,
  cert: 10700,
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A slightly wonky constellation unique to this Furby's certificate number. */
function makeConstellation(seed: number) {
  const rnd = mulberry32(seed || 1)
  const n = 7 + Math.floor(rnd() * 3)
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.6
    const r = 118 + rnd() * 34
    pts.push([150 + r * Math.cos(a), 150 + r * Math.sin(a) * 0.95])
  }
  const d = pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`
      const [px, py] = pts[i - 1]
      const cx = (px + x) / 2 + (rnd() - 0.5) * 14
      const cy = (py + y) / 2 + (rnd() - 0.5) * 14
      return `Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  return { pts, d }
}

interface Props {
  furby: Furby
  onDone: () => void
}

export function BirthSequence({ furby, onDone }: Props) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const scale = reduced ? 0.25 : 1
  const [phase, setPhase] = useState<Phase>('freeze')
  const idx = PHASES.indexOf(phase)
  const at = (p: Phase) => idx >= PHASES.indexOf(p)

  useEffect(() => {
    const timers = PHASES.filter((p) => p !== 'freeze').map((p) => setTimeout(() => setPhase(p), TIMELINE[p] * scale))
    return () => timers.forEach(clearTimeout)
  }, [scale])

  const constellation = useMemo(() => makeConstellation(furby.birth.certificateNumber), [furby.birth.certificateNumber])
  const tz = furby.birth.location.timeZone
  const born = new Date(furby.birth.timestampUtc)
  const { sun, moon, rising } = furby.chart.bigThree

  const wheelReveal = !at('wheel') ? 0 : at('awake') ? 1 : 0.65

  return (
    <div className={`birth birth--${phase}`} aria-live="polite">
      <Starfield density={at('wheel') ? 1.6 : 0.3} brightness={at('constellation') ? 1 : 0} />

      {/* Phase 0: the frozen instant */}
      <div className={`birth__freeze ${at('black') ? 'is-gone' : ''}`}>
        <div className="birth__freeze-label">The moment</div>
        <div className="birth__freeze-time">{formatTime(born, tz)}</div>
      </div>

      {/* Stage */}
      <div className={`birth__stage ${at('star') ? 'is-visible' : ''}`}>
        <div className={`birth__wheel ${at('wheel') ? 'is-spinning' : ''}`}>
          <NatalWheel chart={furby.chart} size="100%" aspects={at('awake')} reveal={wheelReveal} />
        </div>

        <svg className="birth__constellation" viewBox="0 0 300 300" aria-hidden="true">
          <path d={constellation.d} className={`birth__constellation-line ${at('constellation') ? 'is-drawing' : ''}`} />
          {constellation.pts.map(([x, y], i) => (
            <g key={i} className={`birth__cstar ${at('constellation') ? 'is-on' : ''}`} style={{ animationDelay: `${i * 140}ms` }}>
              <rect x={x - 1.5} y={y - 1.5} width="3" height="3" fill="#fff4cc" />
              <rect x={x - 5} y={y - 0.5} width="10" height="1" fill="#ffd84d" opacity="0.8" />
              <rect x={x - 0.5} y={y - 5} width="1" height="10" fill="#ffd84d" opacity="0.8" />
            </g>
          ))}
          {/* the very first pixel star */}
          <rect x="149" y="149" width="2" height="2" fill="#fff4cc" className={`birth__first-star ${at('star') ? 'is-on' : ''} ${at('constellation') ? 'is-dim' : ''}`} />
        </svg>

        <div className={`birth__furby ${at('constellation') ? 'is-visible' : ''}`}>
          <FurbyPortrait
            furby={furby}
            variant="birth"
            size={156}
            decorative={false}
            asleep={!at('awake')}
            lit={at('awake')}
            float={at('awake')}
            eyes={at('awake') ? 'open' : 'closed'}
            animate={at('awake')}
          />
        </div>
      </div>

      {/* Reveals */}
      <div className="birth__reveals">
        {at('born') && (
          <div className="birth__born pop-in">
            <span className="stars-title">{furby.name.toUpperCase()} HAS BEEN BORN</span>
          </div>
        )}
        {at('sun') && (
          <div className="birth__sun pop-in">
            <span className="glyph">☉</span> {SIGN_BY_KEY[sun].name.toUpperCase()}
          </div>
        )}
        <div className="birth__minor">
          {at('moon') && (
            <div className="birth__minor-line rise-in">
              <span className="glyph">☾</span> Moon in {SIGN_BY_KEY[moon].name}
            </div>
          )}
          {at('rising') && (
            <div className="birth__minor-line rise-in">
              <span className="glyph">↑</span> {SIGN_BY_KEY[rising].name} Rising
            </div>
          )}
        </div>
        {at('cert') && (
          <div className="birth__cert rise-in">
            <div className="birth__cert-no">FURBY {formatCertificateNumber(furby.birth.certificateNumber)}</div>
            <EmbossButton variant="chrome" onClick={onDone} className="delay-2 rise-in">
              See the birth certificate
            </EmbossButton>
          </div>
        )}
      </div>
    </div>
  )
}
