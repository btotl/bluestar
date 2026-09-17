import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { birthApi } from '../api/birthApi'
import type { BirthLocation, BirthRecord } from '../api/types'
import { buildNatalChart } from '../astro/chart'
import { BirthMomentPicker, type MomentChoice } from '../components/BirthMomentPicker'
import { BirthSequence } from '../components/BirthSequence'
import { ConfirmBirthCard } from '../components/ConfirmBirthCard'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { LocationPicker } from '../components/LocationPicker'
import { PortraitCapture } from '../components/portrait/PortraitCapture'
import { EmbossButton, RetroPanel } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { DEFAULT_PLACE_ID, findPlace } from '../data/places'
import { locationLabel, placeToLocation } from '../lib/location'
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

export function BirthPage() {
  const navigate = useNavigate()
  const addFurby = useFurbyStore((s) => s.addFurby)
  const furbys = useFurbyStore((s) => s.furbys)
  const hasFurbys = useFurbyStore((s) => s.order.length > 0)

  // A refresh mid-ritual restores the draft (name, place, portrait) from sessionStorage.
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

  // Abandoned captures from earlier sessions are cleaned up here, never mid-flow.
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
  const canBirth = name.trim().length > 0
  const needsPortraitStep = canBirth && !portrait && !portraitSkipped

  const replacePortrait = async (asset: PortraitAsset) => {
    // A retake before Birth replaces the draft; nothing is permanent yet.
    if (portrait && portrait.id !== asset.id) {
      forgetPortraitUrls(portrait.id)
      void deletePortrait(portrait.id)
    }
    await putPortrait(asset)
    setPortrait({
      id: asset.id,
      view: 'front',
      createdAtUtc: asset.createdAtUtc,
      width: asset.width,
      height: asset.height,
      processor: asset.processor,
      uncut: asset.uncut,
    })
    setPortraitSkipped(false)
    setPhase('form')
  }

  const openConfirm = () => {
    // One idempotency key per confirmation card: a double tap or a retry after
    // a dropped response resolves to the same birth on the server.
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
      const record: BirthRecord = await birthApi.confirmBirth({
        name: name.trim(),
        location,
        requestedMomentUtc: moment.mode === 'chosen' ? moment.utc.toISOString() : undefined,
        birthPortraitId: portrait?.id,
        clientRequestId: requestIdRef.current ?? newClientRequestId(),
      })
      const chart = buildNatalChart({
        timestampUtc: record.timestampUtc,
        latitude: record.location.latitude,
        longitude: record.location.longitude,
      })
      const birthPortrait: PortraitRef | undefined = portrait
        ? { id: portrait.id, kind: 'birth', view: portrait.view, createdAtUtc: portrait.createdAtUtc, width: portrait.width, height: portrait.height, processor: portrait.processor, locked: true, uncut: portrait.uncut }
        : undefined
      const furby: Furby = {
        id: record.furbyId,
        name: record.name,
        owner: '',
        birth: record,
        chart,
        createdAtUtc: record.recordedAtUtc,
        birthPortraitId: birthPortrait?.id,
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
    return <BirthSequence furby={born} onDone={() => navigate(`/furby/${born.id}/certificate?born=1`, { replace: true })} />
  }

  if (phase === 'portrait') {
    return (
      <PortraitCapture
        furbyName={name.trim()}
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
    <div className={`screen birth-page ${confirming ? 'birth-page--confirming' : ''}`}>
      <Starfield density={confirming ? 1.4 : 0.8} burst={confirming ? 40 : 0} />

      {hasFurbys && !confirming && (
        <div className="row row--between birth-page__nav">
          <button type="button" className="btn btn--text" onClick={() => navigate('/')}>← Nursery</button>
        </div>
      )}

      <header className="birth-page__header">
        <h1 className="title title--lg stars-title">A new Furby awaits</h1>
        <p className="subcopy">The stars will remember the moment it wakes.</p>
      </header>

      <div className="hero birth-page__hero">
        <div className={`halo ${confirming ? 'halo--lit' : ''}`} />
        <FurbyPortrait
          portraitId={portrait?.id}
          variant="birth"
          size={confirming ? 210 : 190}
          decorative={false}
          asleep={!confirming}
          lit={confirming}
          eyes="closed"
          alt={portrait ? `${name || 'Your Furby'}, asleep` : 'An unborn Furby, asleep'}
        />
      </div>

      <RetroPanel label="Birth record · draft" className="birth-page__panel">
        <div className="field">
          <label className="field__label" htmlFor="furby-name">Name</label>
          <input
            id="furby-name"
            className="input"
            placeholder="_______________"
            maxLength={18}
            autoComplete="off"
            autoCapitalize="words"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={confirming}
          />
        </div>

        <div className="field">
          <div className="field__label"><span className="glyph">◐</span> Birth portrait</div>
          <button type="button" className="value-row" onClick={() => setPhase('portrait')} disabled={confirming}>
            {portrait ? (
              <>
                <FurbyPortrait portraitId={portrait.id} variant="thumbnail" size={44} shadow={false} alt="" />
                <span className="value-row__main">
                  <span className="value-row__primary">Portrait ready</span>
                  <span className="value-row__secondary">{portrait.uncut ? 'Kept uncut' : 'Cut out and waiting'} · retake any time before birth</span>
                </span>
                <span className="value-row__action">Retake</span>
              </>
            ) : (
              <>
                <span className="value-row__icon glyph">📷</span>
                <span className="value-row__main">
                  <span className="value-row__primary">SHOW US YOUR FURBY</span>
                  <span className="value-row__secondary">{portraitSkipped ? 'Skipped · the drawn Furby stands in' : 'Photograph the real one'}</span>
                </span>
                <span className="value-row__action">{portraitSkipped ? 'Add' : 'Take'}</span>
              </>
            )}
          </button>
        </div>

        <div className="field">
          <div className="field__label"><span className="glyph">◍</span> Birth location</div>
          <button type="button" className="value-row" onClick={() => setSheet('location')} disabled={confirming}>
            <span className="value-row__icon glyph">⌖</span>
            <span className="value-row__main">
              <span className="value-row__primary">{locationLabel(location)}</span>
              <span className="value-row__secondary">{location.timeZone}</span>
            </span>
            <span className="value-row__action">Change</span>
          </button>
        </div>

        <div className="field">
          <div className="field__label"><span className="glyph">✦</span> Birth moment</div>
          <button type="button" className="value-row" onClick={() => setSheet('moment')} disabled={confirming}>
            <span className="value-row__icon glyph">{moment.mode === 'moment' ? '◉' : '◷'}</span>
            <span className="value-row__main">
              {moment.mode === 'moment' ? (
                <>
                  <span className="value-row__primary">USE THIS MOMENT</span>
                  <span className="value-row__secondary">Stamped the instant you confirm</span>
                </>
              ) : (
                <>
                  <span className="value-row__primary">{formatTime(moment.utc, location.timeZone)}</span>
                  <span className="value-row__secondary">{formatLongDate(moment.utc, location.timeZone)} · chosen</span>
                </>
              )}
            </span>
            <span className="value-row__action">{moment.mode === 'moment' ? 'Other' : 'Change'}</span>
          </button>
        </div>
      </RetroPanel>

      <div className="birth-page__cta">
        {needsPortraitStep ? (
          <EmbossButton variant="chrome" ceremonial disabled={confirming} onClick={() => setPhase('portrait')}>
            Show us your Furby
          </EmbossButton>
        ) : (
          <EmbossButton ceremonial disabled={!canBirth || confirming} onClick={openConfirm}>
            Birth my Furby
          </EmbossButton>
        )}
        {!canBirth && <p className="subcopy center faint" style={{ fontSize: 12 }}>Give it a name first.</p>}
      </div>

      {sheet === 'location' && <LocationPicker value={location} onChange={setLocation} onClose={closeSheet} />}
      {sheet === 'moment' && <BirthMomentPicker value={moment} timeZone={location.timeZone} onChange={setMoment} onClose={closeSheet} />}

      {confirming && (
        <ConfirmBirthCard
          name={name.trim()}
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
