import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { birthApi } from '../api/birthApi'
import type { BirthLocation, BirthRecord as ServerBirthRecord } from '../api/types'
import { Glyph } from '../astro/glyphs'
import { createBirthRecord } from '../birth/birthRecord'
import { BirthMomentPicker, type MomentChoice } from '../components/BirthMomentPicker'
import { BirthCinematic } from '../components/BirthCinematic'
import { ConfirmBirthCard } from '../components/ConfirmBirthCard'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { LocationPicker } from '../components/LocationPicker'
import { PortraitCapture } from '../components/portrait/PortraitCapture'
import { Ornament } from '../components/Ornament'
import { EmbossButton } from '../components/primitives'
import { CelestialBackdrop } from '../components/CelestialBackdrop'
import { DEFAULT_PLACE_ID, findPlace } from '../data/places'
import { placeToLocation } from '../lib/location'
import { formatLongDate, formatTime } from '../lib/time'
import { deletePortrait, forgetPortraitUrls, pruneOrphans, putPortrait, sealPortrait } from '../portrait/portraitDb'
import type { PortraitAsset, PortraitRef } from '../portrait/types'
import { clearBirthDraft, loadBirthDraft, newClientRequestId, saveBirthDraft, type BirthDraft } from '../store/birthDraft'
import { useFurbyStore, type Furby } from '../store/furbyStore'
import './BirthPage.css'

type Phase = 'form' | 'portrait' | 'confirm' | 'sequence'
type DraftPortrait = NonNullable<BirthDraft['portrait']> & { id: string }

function momentFromDraft(d: BirthDraft | null): MomentChoice {
  if (d?.moment.mode === 'chosen') return { mode: 'chosen', utc: new Date(d.moment.utcIso) }
  return { mode: 'moment' }
}

/** Live clock for "use this moment": the server still stamps the real one. */
function useTicking(active: boolean): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(new Date()), 250)
    return () => clearInterval(t)
  }, [active])
  return now
}

export function BirthPage() {
  const navigate = useNavigate()
  const addFurby = useFurbyStore((s) => s.addFurby)
  const furbys = useFurbyStore((s) => s.furbys)
  const hasFurbys = useFurbyStore((s) => s.order.length > 0)

  const [draft] = useState(() => loadBirthDraft())
  const [name, setName] = useState(draft?.name ?? '')
  const [location, setLocation] = useState<BirthLocation>(() => draft?.location ?? placeToLocation(findPlace(DEFAULT_PLACE_ID)!))
  const [moment, setMoment] = useState<MomentChoice>(() => momentFromDraft(draft))
  const [portrait, setPortrait] = useState<DraftPortrait | null>(() =>
    draft?.portraitId && draft.portrait ? { id: draft.portraitId, ...draft.portrait } : null,
  )
  const [portraitSkipped, setPortraitSkipped] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [sheet, setSheet] = useState<'location' | 'moment' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [born, setBorn] = useState<Furby | null>(null)
  const requestIdRef = useRef<string | null>(draft?.clientRequestId ?? null)
  const inFlightRef = useRef(false)
  const now = useTicking(phase === 'form' && moment.mode === 'moment')

  useEffect(() => {
    const keep = new Set<string>()
    for (const f of Object.values(furbys)) for (const r of f.portraits ?? []) keep.add(r.id)
    if (draft?.portraitId) keep.add(draft.portraitId)
    void pruneOrphans(keep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === 'sequence') return
    saveBirthDraft({
      name,
      location,
      moment: moment.mode === 'chosen' ? { mode: 'chosen', utcIso: moment.utc.toISOString() } : { mode: 'moment' },
      portraitId: portrait?.id,
      portrait: portrait ? { view: portrait.view, createdAtUtc: portrait.createdAtUtc, width: portrait.width, height: portrait.height, processor: portrait.processor, uncut: portrait.uncut } : undefined,
      clientRequestId: requestIdRef.current ?? undefined,
    })
  }, [name, location, moment, portrait, phase])

  const closeSheet = useCallback(() => setSheet(null), [])
  const trimmed = name.trim()
  const canBirth = trimmed.length > 0
  const needsPortraitStep = canBirth && !portrait && !portraitSkipped
  const displayMoment = moment.mode === 'chosen' ? moment.utc : now

  const replacePortrait = async (asset: PortraitAsset) => {
    if (portrait && portrait.id !== asset.id) {
      forgetPortraitUrls(portrait.id)
      void deletePortrait(portrait.id)
    }
    await putPortrait(asset)
    setPortrait({ id: asset.id, view: 'front', createdAtUtc: asset.createdAtUtc, width: asset.width, height: asset.height, processor: asset.processor, uncut: asset.uncut })
    setPortraitSkipped(false)
    setPhase('form')
  }

  const openConfirm = () => {
    if (!requestIdRef.current) requestIdRef.current = newClientRequestId()
    setPhase('confirm')
  }

  const confirm = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setBusy(true)
    setError(null)
    try {
      // The only place a birth instant is created: the server stamps it on receipt.
      const server: ServerBirthRecord = await birthApi.confirmBirth({
        name: trimmed,
        location,
        requestedMomentUtc: moment.mode === 'chosen' ? moment.utc.toISOString() : undefined,
        birthPortraitId: portrait?.id,
        clientRequestId: requestIdRef.current ?? newClientRequestId(),
      })
      const birthPortrait: PortraitRef | undefined = portrait
        ? { id: portrait.id, kind: 'birth', view: portrait.view, createdAtUtc: portrait.createdAtUtc, width: portrait.width, height: portrait.height, processor: portrait.processor, locked: true, uncut: portrait.uncut }
        : undefined
      // One canonical, immutable Birth object. Everything else derives from it.
      const birth = createBirthRecord(server, birthPortrait)
      const furby: Furby = {
        id: birth.id,
        name: birth.furbyName,
        owner: '',
        birth,
        createdAtUtc: birth.recordedAtUtc,
        portraits: birthPortrait ? [birthPortrait] : undefined,
      }
      addFurby(furby)
      if (birthPortrait) void sealPortrait(birthPortrait.id)
      clearBirthDraft()
      setBorn(furby)
      setPhase('sequence')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The stars did not answer. Try again.')
    } finally {
      setBusy(false)
      inFlightRef.current = false
    }
  }

  if (phase === 'sequence' && born) {
    return <BirthCinematic furby={born} onDone={() => navigate(`/furby/${born.id}/reveal`, { replace: true })} />
  }

  if (phase === 'portrait') {
    return (
      <PortraitCapture
        furbyName={trimmed}
        onDone={(asset) => void replacePortrait(asset)}
        onSkip={() => {
          setPortraitSkipped(true)
          setPhase('form')
        }}
        onCancel={() => setPhase('form')}
      />
    )
  }

  const confirming = phase === 'confirm'

  return (
    <div className={`screen birth ${confirming ? 'birth--confirming' : ''}`}>
      <CelestialBackdrop density={0.6} brightness={confirming ? 1.3 : 1} />

      {hasFurbys && !confirming && (
        <div className="topbar">
          <button type="button" className="btn btn--text dim" onClick={() => navigate('/')}>← Nursery</button>
        </div>
      )}

      {/* 1. The Furby. Nothing on this screen outweighs it. */}
      <section className="birth__hero">
        <div className="birth__intro">
          <Ornament name="fourStar" width={18} className="birth__star" />
          <h1 className="title title--xl">A new Furby<br />awaits</h1>
          <p className="lead dim">The stars will remember the moment it wakes.</p>
        </div>
        <div className="birth__portrait">
          <div className={`halo ${confirming ? 'halo--lit' : ''}`} />
          <FurbyPortrait
            portraitId={portrait?.id}
            variant="birth"
            layoutId="furby-portrait"
            size={250}
            decorative={false}
            asleep={!confirming}
            lit={confirming}
            float
            eyes="closed"
            className="birth__portrait-img"
            alt={portrait ? `${trimmed || 'Your Furby'}, asleep` : 'An unborn Furby, asleep'}
          />
        </div>
        <div className="birth__name">
          <label className="sr-only" htmlFor="furby-name">Name</label>
          <input
            id="furby-name"
            className="name-edit"
            placeholder="NAME IT"
            maxLength={18}
            autoComplete="off"
            autoCapitalize="words"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={confirming}
          />
          <div className="name-edit__hint">{trimmed ? 'Tap to edit' : 'Every Furby needs a name'}</div>
        </div>
      </section>

      {/* 2. Three facts, as light rows. */}
      <section className="rows">
        <button type="button" className="row-item" onClick={() => setPhase('portrait')} disabled={confirming}>
          <span className="row-item__icon">
            {portrait ? <FurbyPortrait portraitId={portrait.id} variant="thumbnail" size={40} shadow={false} alt="" /> : <Glyph name="sun" size={22} />}
          </span>
          <span className="row-item__main">
            <span className="row-item__label">Birth portrait</span>
            <span className="row-item__value">{portrait ? 'Portrait ready' : portraitSkipped ? 'Not taken' : 'Show us your Furby'}</span>
            <span className="row-item__sub">{portrait ? (portrait.uncut ? 'Kept uncut · retake any time before birth' : 'Retake any time before birth') : 'Photograph the real one'}</span>
          </span>
          <span className="row-item__action">
            {portrait ? <span className="row-item__check">✓</span> : <span className="row-item__chevron">›</span>}
          </span>
        </button>

        <button type="button" className="row-item" onClick={() => setSheet('location')} disabled={confirming}>
          <span className="row-item__icon"><Glyph name="conjunction" size={22} /></span>
          <span className="row-item__main">
            <span className="row-item__label">Birth place</span>
            <span className="row-item__value">{[location.name, location.region || location.country].filter(Boolean).join(', ')}</span>
            <span className="row-item__sub">{location.country && location.region ? `${location.country} · ` : ''}{location.timeZone}</span>
          </span>
          <span className="row-item__action"><span className="row-item__chevron">›</span></span>
        </button>
      </section>

      {/* 3. The moment. The one input that decides everything. */}
      <section className="moment">
        <div className="eyebrow moment__label">Birth moment</div>
        <div className="moment__time">{formatTime(displayMoment, location.timeZone)}</div>
        <div className="moment__date">{formatLongDate(displayMoment, location.timeZone).toUpperCase()}</div>
        <p className="moment__note">
          {moment.mode === 'moment'
            ? `This exact instant will determine ${trimmed || 'your Furby'}'s permanent sky.`
            : `A chosen time, for a Furby that already exists. It will determine ${trimmed || 'your Furby'}'s permanent sky.`}
        </p>
        <button type="button" className="btn btn--text dim moment__change" onClick={() => setSheet('moment')} disabled={confirming}>
          {moment.mode === 'moment' ? 'Choose another birth time' : 'Use this moment instead'}
        </button>
      </section>

      {/* 4. The decision. */}
      <section className="birth__cta">
        {needsPortraitStep ? (
          <EmbossButton variant="chrome" ceremonial disabled={confirming} onClick={() => setPhase('portrait')}>
            Show us your Furby
          </EmbossButton>
        ) : (
          <EmbossButton ceremonial disabled={!canBirth || confirming} onClick={openConfirm}>
            Birth {trimmed || 'Furby'}
          </EmbossButton>
        )}
        <p className="hint center">{canBirth ? 'This moment becomes permanent.' : 'Give it a name first.'}</p>
      </section>

      {sheet === 'location' && <LocationPicker value={location} onChange={setLocation} onClose={closeSheet} />}
      {sheet === 'moment' && <BirthMomentPicker value={moment} timeZone={location.timeZone} onChange={setMoment} onClose={closeSheet} />}

      {confirming && (
        <ConfirmBirthCard
          name={trimmed}
          location={location}
          moment={moment}
          portraitId={portrait?.id}
          busy={busy}
          error={error}
          onCancel={() => {
            setPhase('form')
            setError(null)
          }}
          onConfirm={confirm}
        />
      )}
    </div>
  )
}
