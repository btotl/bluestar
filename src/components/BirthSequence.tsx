import { useEffect, useState } from 'react'
import { SIGN_BY_KEY } from '../astro/signs'
import { formatTime } from '../lib/time'
import type { Furby } from '../store/furbyStore'
import { FurbyPortrait } from './FurbyPortrait'
import { NatalWheel, type WheelStage } from './NatalWheel'
import { Starfield } from './Starfield'
import './BirthSequence.css'

const PHASES = ['sealed', 'ring', 'houses', 'angles', 'planets', 'aspects', 'stars', 'remembers', 'born', 'done'] as const
type Phase = (typeof PHASES)[number]

/** Milliseconds after the moment is sealed. Restrained: one thing at a time. */
const TIMELINE: Record<Phase, number> = {
  sealed: 0,
  ring: 1100,
  houses: 2200,
  angles: 3200,
  planets: 4200,
  aspects: 5300,
  stars: 6300,
  remembers: 7300,
  born: 9000,
  done: 11200,
}

const WHEEL_STAGE: Partial<Record<Phase, WheelStage>> = {
  sealed: 'none',
  ring: 'ring',
  houses: 'houses',
  angles: 'angles',
  planets: 'planets',
  aspects: 'aspects',
}

interface Props {
  furby: Furby
  onDone: () => void
}

/**
 * The Birth ritual. The Furby is alone, then its sky forms around it in the
 * order an astrologer would draw it: ring, houses, angles, planets, aspects.
 */
export function BirthSequence({ furby, onDone }: Props) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const scale = reduced ? 0.3 : 1
  const [phase, setPhase] = useState<Phase>('sealed')
  const idx = PHASES.indexOf(phase)
  const at = (p: Phase) => idx >= PHASES.indexOf(p)

  useEffect(() => {
    const timers = PHASES.filter((p) => p !== 'sealed').map((p) => setTimeout(() => setPhase(p), TIMELINE[p] * scale))
    return () => timers.forEach(clearTimeout)
  }, [scale])

  useEffect(() => {
    if (phase === 'done') onDone()
  }, [phase, onDone])

  const record = furby.birth
  const wheelStage: WheelStage = at('aspects') ? 'aspects' : (WHEEL_STAGE[phase] ?? 'none')
  const born = new Date(record.timestampUtc)
  const sunSign = SIGN_BY_KEY[record.natal.sun.sign].name

  return (
    <div className={`ritual ritual--${phase}`} aria-live="polite" onClick={at('born') ? onDone : undefined}>
      <Starfield density={at('stars') ? 1.5 : 0.5} brightness={at('ring') ? 1 : 0.5} burst={at('stars') ? 30 : 0} />

      <div className="ritual__stage">
        <div className="ritual__wheel">
          <NatalWheel natal={record.natal} stage={wheelStage} centerClear={0.6} />
        </div>
        <div className="ritual__halo" />
        <div className="ritual__furby">
          <FurbyPortrait
            furby={furby}
            variant="birth"
            size="42%"
            decorative={false}
            asleep={!at('born')}
            lit={at('born')}
            float={at('born')}
            eyes={at('born') ? 'open' : 'closed'}
            animate={at('born')}
          />
        </div>
      </div>

      <div className="ritual__words">
        {!at('remembers') && (
          <div className="ritual__sealed">
            <div className="ritual__line">The moment is sealed.</div>
            <div className="ritual__time">{formatTime(born, record.timeZone)}</div>
          </div>
        )}
        {at('remembers') && !at('born') && <div className="ritual__remembers pop-in">The sky remembers.</div>}
        {at('born') && (
          <div className="ritual__born">
            <div className="title title--lg pop-in">{furby.name} has been born</div>
            <div className="ritual__under rise-in delay-2">Born under {sunSign}</div>
            <div className="ritual__tap rise-in delay-4">Tap to continue</div>
          </div>
        )}
      </div>
    </div>
  )
}
