import { useCallback, useEffect, useRef, useState } from 'react'
import { FurbyPortrait } from '../FurbyPortrait'
import { EmbossButton } from '../primitives'
import { CelestialBackdrop } from '../CelestialBackdrop'
import { captureVideoFrame } from '../../portrait/imageUtils'
import { processCapture } from '../../portrait/pipeline'
import { primePortraitUrl } from '../../portrait/portraitDb'
import { portraitProcessor, uncutProcessor } from '../../portrait/processors'
import { PortraitNotFoundError, type PortraitAsset, type ProcessDiagnostics, type ProcessingStage } from '../../portrait/types'
import './PortraitCapture.css'

type Step = 'intro' | 'camera' | 'processing' | 'review' | 'error'

interface Props {
  furbyName: string
  /** The owner approved a portrait. The caller stores it. */
  onDone: (asset: PortraitAsset, diagnostics: ProcessDiagnostics) => void
  /** Continue the Birth without a portrait. */
  onSkip: () => void
  onCancel: () => void
}

const STAGE_COPY: Record<ProcessingStage, string> = {
  finding: 'Finding your Furby…',
  separating: 'Separating Furby from the mortal realm…',
  preparing: 'Preparing birth portrait…',
}

const TIPS = [
  'Face the Furby toward the camera.',
  'Make sure both ears are visible.',
  'Include the whole Furby.',
  'Use reasonable lighting.',
  'A simple background works best.',
]

/** Furby silhouette used for the camera positioning guide. */
function GuideOutline({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 250" className={className} aria-hidden="true">
      <path d="M62 80 C 20 40, 14 10, 44 22 C 62 30, 72 56, 72 78" />
      <path d="M158 80 C 200 40, 206 10, 176 22 C 158 30, 148 56, 148 78" />
      <ellipse cx="110" cy="140" rx="82" ry="94" />
      <ellipse cx="78" cy="228" rx="30" ry="12" />
      <ellipse cx="142" cy="228" rx="30" ry="12" />
    </svg>
  )
}

export function PortraitCapture({ furbyName, onDone, onSkip, onCancel }: Props) {
  const [step, setStep] = useState<Step>('intro')
  const [stage, setStage] = useState<ProcessingStage>('finding')
  const [fraction, setFraction] = useState(0)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [result, setResult] = useState<{ asset: PortraitAsset; diagnostics: ProcessDiagnostics; url: string } | null>(null)
  const [error, setError] = useState<{ kind: 'notfound' | 'other'; message: string } | null>(null)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showTips, setShowTips] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastFileRef = useRef<Blob | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const sourceUrlRef = useRef<string | null>(null)
  useEffect(() => {
    sourceUrlRef.current = sourceUrl
  }, [sourceUrl])

  // Unmount only: stop the camera, cancel any in-flight processing, free the preview URL.
  // (This must not depend on sourceUrl, or every new preview would abort its own processing.)
  useEffect(
    () => () => {
      stopCamera()
      abortRef.current?.abort()
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    },
    [stopCamera],
  )

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1920 } },
        audio: false,
      })
      streamRef.current = stream
      const v = videoRef.current
      if (v) {
        v.srcObject = stream
        await v.play().catch(() => {})
      }
      return true
    } catch (e) {
      setCameraError(e instanceof Error && e.name === 'NotAllowedError' ? 'Camera permission was refused. Choose a photo instead.' : 'The camera would not start. Choose a photo instead.')
      return false
    }
  }, [stopCamera])

  useEffect(() => {
    if (step !== 'camera') {
      stopCamera()
      return
    }
    // Synchronising with the camera hardware; state changes happen after awaits.
    // oxlint-disable-next-line react/set-state-in-effect
    void startCamera(facing)
  }, [step, facing, startCamera, stopCamera])

  const process = useCallback(async (file: Blob, opts: { uncut?: boolean; preparedSource?: Blob } = {}) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    lastFileRef.current = file
    setStep('processing')
    setStage('finding')
    setFraction(0)
    setError(null)
    setSourceUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(file)
    })
    try {
      const processor = opts.uncut ? uncutProcessor : portraitProcessor
      const res = await processCapture(file, processor, {
        signal: ac.signal,
        preparedSource: opts.preparedSource,
        onProgress: (s, f) => {
          setStage(s)
          setFraction(f)
        },
      })
      if (ac.signal.aborted) return
      const url = primePortraitUrl(res.asset.id, 'master', res.asset.master)
      primePortraitUrl(res.asset.id, 'ui', res.asset.ui)
      primePortraitUrl(res.asset.id, 'thumb', res.asset.thumb)
      setResult({ ...res, url })
      setStep('review')
    } catch (e) {
      if (ac.signal.aborted) return
      if (e instanceof PortraitNotFoundError) {
        setError({ kind: 'notfound', message: e.message })
      } else {
        setError({ kind: 'other', message: e instanceof Error ? e.message : 'Something went wrong preparing the portrait.' })
      }
      setStep('error')
    }
  }, [])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void process(f)
  }

  const shutter = async () => {
    const v = videoRef.current
    if (!v) return
    try {
      const blob = await captureVideoFrame(v, facing === 'user')
      stopCamera()
      void process(blob)
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Could not take the photo.')
    }
  }

  const openPicker = (withCapture: boolean) => {
    const input = fileRef.current
    if (!input) return
    if (withCapture) input.setAttribute('capture', 'environment')
    else input.removeAttribute('capture')
    input.click()
  }

  const takePortrait = () => {
    setCameraError(null)
    // No live camera API (older WebViews): hand off to the phone's camera app.
    if (!navigator.mediaDevices?.getUserMedia) {
      openPicker(true)
      return
    }
    setStep('camera')
  }

  /* ---------- screens ---------- */

  if (step === 'intro') {
    return (
      <div className="screen pc">
        <CelestialBackdrop density={0.5} />
        <div className="row row--between">
          <button type="button" className="btn btn--text" onClick={onCancel}>← Back</button>
          <span className="eyebrow">Birth portrait</span>
        </div>
        <header className="center">
          <h1 className="title title--lg stars-title">Show us your Furby</h1>
          <p className="subcopy">Every Furby is different. Take a portrait so we'll always know exactly who was born under these stars.</p>
        </header>

        <div className="pc__viewport card">
          <div className="pc__viewport-inner">
            <CelestialBackdrop density={0.5} />
            <GuideOutline className="pc__guide pc__guide--intro" />
            <div className="pc__viewport-label pixel">{furbyName || 'Your Furby'} goes here</div>
          </div>
        </div>

        <div className="stack" style={{ marginTop: 'auto' }}>
          <EmbossButton onClick={takePortrait}>📷 Take birth portrait</EmbossButton>
          <EmbossButton variant="secondary" onClick={() => openPicker(false)}>Choose photo</EmbossButton>
          <button type="button" className="btn btn--text dim" style={{ alignSelf: 'center' }} onClick={onSkip}>Birth without a portrait</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} tabIndex={-1} />
      </div>
    )
  }

  if (step === 'camera') {
    return (
      <div className="pc-camera">
        <div className="pc-camera__top">
          <button type="button" className="pc-camera__icon" onClick={() => setStep('intro')} aria-label="Close camera">✕</button>
          <span className="pc-camera__hint pixel">Place your Furby inside the outline</span>
          <button type="button" className="pc-camera__icon" onClick={() => setShowTips((s) => !s)} aria-label="Tips" aria-expanded={showTips}>?</button>
        </div>
        <div className="pc-camera__view">
          <video ref={videoRef} className={`pc-camera__video ${facing === 'user' ? 'is-mirrored' : ''}`} playsInline muted autoPlay />
          <GuideOutline className="pc__guide pc__guide--live" />
          <div className="pc-camera__bracket pc-camera__bracket--tl" />
          <div className="pc-camera__bracket pc-camera__bracket--tr" />
          <div className="pc-camera__bracket pc-camera__bracket--bl" />
          <div className="pc-camera__bracket pc-camera__bracket--br" />
          {showTips && (
            <ul className="pc-camera__tips">
              {TIPS.map((t) => <li key={t}>✦ {t}</li>)}
            </ul>
          )}
          {cameraError && (
            <div className="pc-camera__error">
              <p>{cameraError}</p>
              <EmbossButton variant="secondary" small onClick={() => openPicker(true)}>Use the phone camera app</EmbossButton>
            </div>
          )}
        </div>
        <div className="pc-camera__bar">
          <button type="button" className="pc-camera__side" onClick={() => openPicker(false)} aria-label="Choose from photos">▣</button>
          <button type="button" className="pc-camera__shutter" onClick={shutter} aria-label="Take photo" disabled={!!cameraError}>
            <span />
          </button>
          <button type="button" className="pc-camera__side" onClick={() => { setCameraError(null); setFacing((f) => (f === 'user' ? 'environment' : 'user')) }} aria-label="Flip camera">⟲</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} tabIndex={-1} />
      </div>
    )
  }

  if (step === 'processing') {
    const pct = stage === 'finding' && fraction > 0 && fraction < 1 ? ` ${Math.round(fraction * 100)}%` : ''
    return (
      <div className="screen pc screen--center">
        <CelestialBackdrop density={0.5} />
        <div className="pc__processing">
          <div className="pc__orbit-stage">
            <div className="pc__orbit-ring pc__orbit-ring--a"><i /><i /><i /></div>
            <div className="pc__orbit-ring pc__orbit-ring--b"><i /><i /></div>
            {sourceUrl && <img className="pc__source" src={sourceUrl} alt="" />}
          </div>
          <h2 className="title title--md center pc__stage" aria-live="polite">{STAGE_COPY[stage]}{pct}</h2>
          {stage === 'finding' && fraction > 0 && fraction < 1 && (
            <p className="subcopy center faint">First time only: the star charts are downloading.</p>
          )}
          <button type="button" className="btn btn--text" onClick={() => { abortRef.current?.abort(); setStep('intro') }}>Cancel</button>
        </div>
      </div>
    )
  }

  if (step === 'review' && result) {
    return (
      <div className="screen pc">
        <CelestialBackdrop density={0.5} />
        <div className="row row--between">
          <button type="button" className="btn btn--text" onClick={() => setStep('intro')}>✕</button>
          <span className="eyebrow">Birth portrait</span>
        </div>
        <header className="center">
          <h1 className="title title--lg">Is this your Furby?</h1>
        </header>
        <div className="pc__review">
          <FurbyPortrait src={result.url} variant="celestial" size="min(78vw, 340px)" lit alt="Your Furby, cut out" />
        </div>
        {result.asset.uncut ? (
          <p className="subcopy center">Kept uncut, background and all. It will still be your Furby.</p>
        ) : result.diagnostics.imperfect ? (
          <p className="subcopy center">The edges look a little fuzzy around the fur. Keep it, or retake with a plainer background.</p>
        ) : (
          <p className="subcopy center">Check the ears, feet and fur edges.</p>
        )}
        <div className="stack" style={{ marginTop: 'auto' }}>
          <EmbossButton onClick={() => onDone(result.asset, result.diagnostics)}>Use this portrait</EmbossButton>
          <EmbossButton variant="secondary" onClick={takePortrait}>Retake</EmbossButton>
        </div>
      </div>
    )
  }

  // error
  return (
    <div className="screen pc screen--center">
      <CelestialBackdrop density={0.5} />
      <div className="pc__error">
        <FurbyPortrait variant="celestial" size={140} eyes="closed" animate={false} decorative alt="" />
        <h1 className="title title--lg center">We couldn't quite find your Furby</h1>
        <p className="subcopy center">
          {error?.kind === 'notfound'
            ? 'Try again with your Furby fully visible and a little more space around its ears.'
            : error?.message}
        </p>
        <div className="stack">
          <EmbossButton onClick={takePortrait}>Retake photo</EmbossButton>
          <EmbossButton variant="secondary" onClick={() => lastFileRef.current && process(lastFileRef.current)}>Try this photo again</EmbossButton>
          <button type="button" className="btn btn--text" onClick={() => lastFileRef.current && process(lastFileRef.current, { uncut: true })}>
            Use the photo uncut
          </button>
          <button type="button" className="btn btn--text" onClick={onSkip}>Birth without a portrait</button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} tabIndex={-1} />
    </div>
  )
}
