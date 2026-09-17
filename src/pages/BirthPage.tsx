import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { birthApi } from '../api/birthApi'
import type { BirthLocation, BirthRecord } from '../api/types'
import { buildNatalChart } from '../astro/chart'
import { BirthMomentPicker, type MomentChoice } from '../components/BirthMomentPicker'
import { BirthSequence } from '../components/BirthSequence'
import { ConfirmBirthCard } from '../components/ConfirmBirthCard'
import { FurbySprite } from '../components/FurbySprite'
import { LocationPicker } from '../components/LocationPicker'
import { locationLabel, placeToLocation } from '../lib/location'
import { EmbossButton, RetroPanel } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { DEFAULT_PLACE_ID, findPlace } from '../data/places'
import { formatLongDate, formatTime } from '../lib/time'
import { useFurbyStore, type Furby } from '../store/furbyStore'
import './BirthPage.css'

type Phase = 'form' | 'confirm' | 'sequence'

export function BirthPage() {
  const navigate = useNavigate()
  const addFurby = useFurbyStore((s) => s.addFurby)
  const hasFurbys = useFurbyStore((s) => s.order.length > 0)

  const [name, setName] = useState('')
  const [location, setLocation] = useState<BirthLocation>(() => placeToLocation(findPlace(DEFAULT_PLACE_ID)!))
  const [moment, setMoment] = useState<MomentChoice>({ mode: 'moment' })
  const [phase, setPhase] = useState<Phase>('form')
  const [sheet, setSheet] = useState<'location' | 'moment' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [born, setBorn] = useState<Furby | null>(null)

  const closeSheet = useCallback(() => setSheet(null), [])
  const canBirth = name.trim().length > 0

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      // The only place a birth instant is created: the server stamps it on receipt.
      const record: BirthRecord = await birthApi.confirmBirth({
        name: name.trim(),
        location,
        requestedMomentUtc: moment.mode === 'chosen' ? moment.utc.toISOString() : undefined,
      })
      const chart = buildNatalChart({
        timestampUtc: record.timestampUtc,
        latitude: record.location.latitude,
        longitude: record.location.longitude,
      })
      const furby: Furby = {
        id: record.furbyId,
        name: record.name,
        owner: '',
        birth: record,
        chart,
        createdAtUtc: record.recordedAtUtc,
      }
      addFurby(furby)
      setBorn(furby)
      setPhase('sequence')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The stars did not answer. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'sequence' && born) {
    return <BirthSequence furby={born} onDone={() => navigate(`/furby/${born.id}/certificate?born=1`, { replace: true })} />
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
        <FurbySprite eyes="closed" lit={confirming} size={confirming ? 200 : 180} />
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
        <EmbossButton ceremonial disabled={!canBirth || confirming} onClick={() => setPhase('confirm')}>
          Birth my Furby
        </EmbossButton>
        {!canBirth && <p className="subcopy center faint" style={{ fontSize: 12 }}>Give it a name first.</p>}
      </div>

      {sheet === 'location' && <LocationPicker value={location} onChange={setLocation} onClose={closeSheet} />}
      {sheet === 'moment' && <BirthMomentPicker value={moment} timeZone={location.timeZone} onChange={setMoment} onClose={closeSheet} />}

      {confirming && (
        <ConfirmBirthCard
          name={name.trim()}
          location={location}
          moment={moment}
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
