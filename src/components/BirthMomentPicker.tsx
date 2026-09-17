import { useState } from 'react'
import { formatTime, formatLongDate, utcToLocalParts, zonedLocalToUtc, type LocalParts } from '../lib/time'
import { EmbossButton, Sheet } from './primitives'

export type MomentChoice = { mode: 'moment' } | { mode: 'chosen'; utc: Date }

interface Props {
  value: MomentChoice
  timeZone: string
  onChange: (m: MomentChoice) => void
  onClose: () => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function BirthMomentPicker({ value, timeZone, onChange, onClose }: Props) {
  const initial: LocalParts = value.mode === 'chosen' ? utcToLocalParts(value.utc, timeZone) : utcToLocalParts(new Date(), timeZone)
  const [date, setDate] = useState(`${initial.year}-${pad(initial.month)}-${pad(initial.day)}`)
  const [time, setTime] = useState(`${pad(initial.hour)}:${pad(initial.minute)}:${pad(initial.second)}`)

  const parsed = (() => {
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm, ss = 0] = time.split(':').map(Number)
    if (![y, m, d, hh, mm].every(Number.isFinite)) return null
    return zonedLocalToUtc({ year: y, month: m, day: d, hour: hh, minute: mm, second: ss || 0 }, timeZone)
  })()

  return (
    <Sheet title="Birth moment" onClose={onClose}>
      <div className="stack">
        <button
          type="button"
          className={`list__item ${value.mode === 'moment' ? 'is-selected' : ''}`}
          onClick={() => {
            onChange({ mode: 'moment' })
            onClose()
          }}
        >
          <span className="glyph" style={{ color: 'var(--yellow)', fontSize: 20 }}>✦</span>
          <span className="grow">
            <span className="list__item-primary">Use this moment</span>
            <br />
            <span className="list__item-secondary">The server stamps the exact second Confirm Birth arrives. Recommended for a new Furby.</span>
          </span>
        </button>

        <div className={`list__item ${value.mode === 'chosen' ? 'is-selected' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div>
            <span className="list__item-primary">Choose another birth time</span>
            <br />
            <span className="list__item-secondary">For a Furby that already exists. Entered in {timeZone}.</span>
          </div>
          <div className="input-row">
            <input className="input input--small" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Birth date" />
            <input className="input input--small" type="time" step={1} value={time} onChange={(e) => setTime(e.target.value)} aria-label="Birth time" />
          </div>
          {parsed && (
            <p className="subcopy">
              {formatTime(parsed, timeZone)} · {formatLongDate(parsed, timeZone)}
              <br />
              <span className="faint">= {parsed.toISOString().replace('T', ' ').replace('.000Z', ' UTC')}</span>
            </p>
          )}
          <EmbossButton
            variant="secondary"
            small
            disabled={!parsed}
            onClick={() => {
              if (!parsed) return
              onChange({ mode: 'chosen', utc: parsed })
              onClose()
            }}
          >
            Use this time
          </EmbossButton>
        </div>
      </div>
    </Sheet>
  )
}
