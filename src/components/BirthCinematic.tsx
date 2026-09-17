import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SIGN_BY_KEY } from '../astro/signs'
import { BIRTH_T, REDUCED_SCALE } from '../chart/birthTimeline'
import { NatalChart } from '../chart/NatalChart'
import { useParallax } from '../chart/useParallax'
import { formatTime } from '../lib/time'
import { detectQuality } from '../lib/quality'
import type { Furby } from '../store/furbyStore'
import { CelestialBackdrop } from './CelestialBackdrop'
import { FurbyPortrait } from './FurbyPortrait'
import './BirthCinematic.css'

const CelestialScene = lazy(() => import('./CelestialScene'))

type Beat = 'moment' | 'forming' | 'illuminate' | 'remembers' | 'born' | 'exit'

interface Props {
  furby: Furby
  onDone: () => void
}

/**
 * The Birth. Fullscreen: no navigation, no form, no cards. The Furby, then
 * the exact sky of its moment assembling around it from the same geometry
 * that will be its permanent chart. Word beats come from the one timeline.
 */
export function BirthCinematic({ furby, onDone }: Props) {
  const quality = useMemo(() => detectQuality(), [])
  const reduced = quality === 'reduced'
  const scale = reduced ? REDUCED_SCALE : 1
  const [beat, setBeat] = useState<Beat>('moment')
  const parallax = useParallax(!reduced)

  useEffect(() => {
    const beats: [Beat, number][] = [
      ['forming', BIRTH_T.ring],
      ['illuminate', BIRTH_T.illuminate],
      ['remembers', BIRTH_T.remembers],
      ['born', BIRTH_T.born],
      ['exit', BIRTH_T.exit],
    ]
    const timers = beats.map(([b, t]) => setTimeout(() => setBeat(b), t * 1000 * scale))
    return () => timers.forEach(clearTimeout)
  }, [scale])

  useEffect(() => {
    if (beat === 'exit') onDone()
  }, [beat, onDone])

  const past = (b: Beat) => ['moment', 'forming', 'illuminate', 'remembers', 'born', 'exit'].indexOf(beat) >= ['moment', 'forming', 'illuminate', 'remembers', 'born', 'exit'].indexOf(b)
  const record = furby.birth
  const born = new Date(record.timestampUtc)
  const sun = SIGN_BY_KEY[record.natal.sun.sign].name
  const intensity = past('born') ? 1 : past('illuminate') ? 0.8 : past('forming') ? 0.45 : 0.2

  return (
    <motion.div className={`cinematic cinematic--${beat} cinematic--${quality}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} onClick={past('born') ? onDone : undefined}>
      <CelestialBackdrop className="backdrop--fixed" density={0.7} brightness={past('illuminate') ? 1.4 : 0.8} seed={record.certificateNumber} />
      {quality === 'full' && (
        <Suspense fallback={null}>
          <CelestialScene intensity={intensity} bloom={past('remembers')} />
        </Suspense>
      )}

      <div className="cinematic__stage">
        <NatalChart
          birthRecord={record}
          mode="birth-animation"
          reducedMotion={reduced}
          illuminated={past('illuminate')}
          recede={past('born')}
          parallax={parallax}
          centerClear={0.62}
          portrait={
            <motion.div
              className="cinematic__furby"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: past('born') ? 1.06 : past('illuminate') ? 0.98 : past('forming') ? 0.94 : 1.14 }}
              transition={{ duration: past('born') ? 1.6 : 1.4, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <FurbyPortrait
                furby={furby}
                layoutId="furby-portrait"
                variant="birth"
                size="44%"
                decorative={false}
                asleep={!past('born')}
                lit={past('born')}
                alive={!reduced}
                eyes={past('born') ? 'open' : 'closed'}
                animate={past('born')}
              />
            </motion.div>
          }
        />
      </div>

      <div className="cinematic__words" aria-live="polite">
        <AnimatePresence mode="wait">
          {!past('remembers') && (
            <motion.div key="sealed" className="cinematic__sealed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.3 } }} transition={{ duration: 0.7 }}>
              <div className="cinematic__line">The moment is sealed.</div>
              <div className="cinematic__time">{formatTime(born, record.timeZone)}</div>
            </motion.div>
          )}
          {past('remembers') && !past('born') && (
            <motion.div key="remembers" className="cinematic__remembers" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }} transition={{ duration: 0.8 }}>
              The sky remembers.
            </motion.div>
          )}
          {past('born') && (
            <motion.div key="born" className="cinematic__born" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="title title--lg">{furby.name} has been born</div>
              <motion.div className="cinematic__under" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>Born under {sun}</motion.div>
              <motion.div className="cinematic__tap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>Tap to continue</motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
