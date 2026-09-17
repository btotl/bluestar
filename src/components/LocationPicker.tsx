import { useState } from 'react'
import type { BirthLocation } from '../api/types'
import { PLACES, searchPlaces } from '../data/places'
import { placeToLocation } from '../lib/location'
import { deviceTimeZone } from '../lib/time'
import { EmbossButton, Sheet } from './primitives'

interface Props {
  value: BirthLocation
  onChange: (loc: BirthLocation) => void
  onClose: () => void
}

export function LocationPicker({ value, onChange, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [manual, setManual] = useState(false)
  const [lat, setLat] = useState(String(value.latitude))
  const [lon, setLon] = useState(String(value.longitude))
  const [label, setLabel] = useState('')
  const [geoState, setGeoState] = useState<'idle' | 'busy' | 'error'>('idle')

  const results = searchPlaces(query)

  const useDevice = () => {
    if (!('geolocation' in navigator)) {
      setGeoState('error')
      return
    }
    setGeoState('busy')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          name: 'Where you are',
          region: `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`,
          country: '',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timeZone: deviceTimeZone(),
        })
        onClose()
      },
      () => setGeoState('error'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    )
  }

  const applyManual = () => {
    const la = Number(lat)
    const lo = Number(lon)
    if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return
    onChange({
      name: label.trim() || 'Custom location',
      region: '',
      country: '',
      latitude: la,
      longitude: lo,
      timeZone: deviceTimeZone(),
    })
    onClose()
  }

  return (
    <Sheet title="Birth location" onClose={onClose}>
      <div className="stack">
        <EmbossButton variant="secondary" small onClick={useDevice} disabled={geoState === 'busy'}>
          {geoState === 'busy' ? 'Finding you…' : '⌖ Use where I am'}
        </EmbossButton>
        {geoState === 'error' && <p className="subcopy" style={{ color: 'var(--orange)' }}>Could not read the device location. Pick a place below instead.</p>}

        {!manual ? (
          <>
            <input
              className="input input--small"
              placeholder="Search a town or city"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              aria-label="Search places"
            />
            <ul className="list" style={{ maxHeight: '40dvh', overflow: 'auto' }}>
              {results.map((p) => {
                const selected = p.latitude === value.latitude && p.longitude === value.longitude
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`list__item ${selected ? 'is-selected' : ''}`}
                      onClick={() => {
                        onChange(placeToLocation(p))
                        onClose()
                      }}
                    >
                      <span className="glyph" style={{ color: 'var(--teal)' }}>◉</span>
                      <span className="grow">
                        <span className="list__item-primary">{p.name}</span>
                        <br />
                        <span className="list__item-secondary">{[p.region, p.country].filter(Boolean).join(', ')} · {p.timeZone}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
              {results.length === 0 && (
                <li className="subcopy" style={{ padding: 10 }}>
                  Not in the list of {PLACES.length} places. Enter coordinates instead.
                </li>
              )}
            </ul>
            <button type="button" className="btn btn--text" onClick={() => setManual(true)}>
              Enter coordinates by hand
            </button>
          </>
        ) : (
          <>
            <input className="input input--small" placeholder="Name this place" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Place name" />
            <div className="input-row">
              <input className="input input--small" inputMode="decimal" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} aria-label="Latitude" />
              <input className="input input--small" inputMode="decimal" placeholder="Longitude" value={lon} onChange={(e) => setLon(e.target.value)} aria-label="Longitude" />
            </div>
            <p className="subcopy">South and west are negative. Time zone will be this device's ({deviceTimeZone()}).</p>
            <EmbossButton variant="secondary" small onClick={applyManual}>Use these coordinates</EmbossButton>
            <button type="button" className="btn btn--text" onClick={() => setManual(false)}>Back to the list</button>
          </>
        )}
      </div>
    </Sheet>
  )
}
