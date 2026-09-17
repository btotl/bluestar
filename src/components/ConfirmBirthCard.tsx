import { useEffect, useState } from 'react'
import type { BirthLocation } from '../api/types'
import { formatCoordinates } from '../astro/format'
import { formatLongDate, formatTime } from '../lib/time'
import type { MomentChoice } from './BirthMomentPicker'
import { FurbyPortrait } from './FurbyPortrait'
import { EmbossButton } from './primitives'
import './ConfirmBirthCard.css'

interface Props {
  name: string
  location: BirthLocation
  moment: MomentChoice
  portraitId?: string
  busy: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
}

/** The permanence moment. Short, quiet, and the only irreversible tap in the app. */
export function ConfirmBirthCard({ name, location, moment, portraitId, busy, error, onCancel, onConfirm }: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (moment.mode !== 'moment') return
    const t = setInterval(() => setNow(new Date()), 250)
    return () => clearInterval(t)
  }, [moment.mode])

  const when = moment.mode === 'chosen' ? moment.utc : now
  const tz = location.timeZone

  return (
    <div className="confirm-backdrop" role="presentation">
      <div className="confirm-card rise-in" role="alertdialog" aria-labelledby="confirm-title" aria-modal="true">
        <span className="stripe stripe--center" aria-hidden="true" />
        <h2 id="confirm-title" className="confirm-card__title">This moment becomes permanent</h2>

        <div className="confirm-card__who">
          {portraitId && <FurbyPortrait portraitId={portraitId} variant="thumbnail" size={56} alt="" />}
          <div>
            <div className="confirm-card__name">{name}</div>
            <div className="hint">will be born at</div>
          </div>
        </div>

        <div className="confirm-card__time">{formatTime(when, tz)}</div>
        <div className="confirm-card__date">{formatLongDate(when, tz)}</div>
        <div className="confirm-card__place">
          {[location.name, location.region || location.country].filter(Boolean).join(', ')}
          <span className="confirm-card__coords">{formatCoordinates(location.latitude, location.longitude)}</span>
        </div>

        <p className="hint center">Sun, Moon, Rising, every planet and house follow from this instant. It cannot be changed later.</p>
        {error && <p className="confirm-card__error">{error}</p>}

        <div className="confirm-card__actions">
          <EmbossButton variant="ghost" onClick={onCancel} disabled={busy}>Not yet</EmbossButton>
          <EmbossButton onClick={onConfirm} disabled={busy}>{busy ? 'Sealing…' : 'Confirm birth'}</EmbossButton>
        </div>
      </div>
    </div>
  )
}
