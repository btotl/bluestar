import { useEffect, useState } from 'react'
import type { BirthLocation } from '../api/types'
import { formatCoordinates } from '../astro/format'
import { formatLongDate, formatTime } from '../lib/time'
import type { MomentChoice } from './BirthMomentPicker'
import { EmbossButton } from './primitives'
import './ConfirmBirthCard.css'

interface Props {
  name: string
  location: BirthLocation
  moment: MomentChoice
  busy: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmBirthCard({ name, location, moment, busy, error, onCancel, onConfirm }: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (moment.mode !== 'moment') return
    const t = setInterval(() => setNow(new Date()), 250)
    return () => clearInterval(t)
  }, [moment.mode])

  const when = moment.mode === 'chosen' ? moment.utc : now
  const tz = location.timeZone
  const regionLine = [location.name, location.region || location.country].filter(Boolean).join(', ')

  return (
    <div className="confirm-backdrop" role="presentation">
      <div className="confirm-card panel panel--chrome rise-in" role="alertdialog" aria-labelledby="confirm-title" aria-modal="true">
        <div className="confirm-card__warn">
          <span className="glyph">{"\u26A0\uFE0E"}</span>
          <h2 id="confirm-title" className="title title--sm">This moment cannot be changed</h2>
        </div>

        <p className="confirm-card__lead">
          <span className="confirm-card__name">{name.toUpperCase()}</span> will be born at
        </p>
        <div className="confirm-card__time">{formatTime(when, tz)}</div>
        <div className="confirm-card__date">{formatLongDate(when, tz)}</div>
        {moment.mode === 'moment' && <div className="confirm-card__live">◉ live · stamped the instant you confirm</div>}

        <div className="confirm-card__place">
          <div>{regionLine}</div>
          <div className="mono dim">{formatCoordinates(location.latitude, location.longitude)}</div>
        </div>

        <p className="confirm-card__note">
          This moment will permanently determine {name}'s zodiac, planets, houses, ascendant and astrological identity.
        </p>

        {error && <p className="confirm-card__error">{error}</p>}

        <div className="confirm-card__actions">
          <EmbossButton variant="ghost" onClick={onCancel} disabled={busy}>Cancel</EmbossButton>
          <EmbossButton variant="gold" onClick={onConfirm} disabled={busy}>
            {busy ? 'Sending…' : 'Confirm Birth'}
          </EmbossButton>
        </div>
      </div>
    </div>
  )
}
