import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { formatCoordinates, formatPlacement } from '../astro/format'
import { Glyph } from '../astro/glyphs'
import { SIGN_BY_KEY } from '../astro/signs'
import { bigThree, placeLine } from '../birth/birthRecord'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { EmbossButton, LockedField, Padlock, RetroPanel } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { formatLongDate, formatTime, formatUtcOffset } from '../lib/time'
import { deletePortrait, forgetPortraitUrls } from '../portrait/portraitDb'
import { formatCertificateNumber, useFurby, useFurbyStore } from '../store/furbyStore'

export function SettingsPage() {
  const { id } = useParams()
  const furby = useFurby(id)
  const navigate = useNavigate()
  const rename = useFurbyStore((s) => s.renameFurby)
  const setOwner = useFurbyStore((s) => s.setOwner)
  const forget = useFurbyStore((s) => s.forgetFurby)
  const [name, setName] = useState(furby?.name ?? '')
  const [owner, setOwnerText] = useState(furby?.owner ?? '')
  const [confirmForget, setConfirmForget] = useState(false)
  if (!furby) return <Navigate to="/" replace />

  const b = furby.birth
  const bornAt = new Date(b.timestampUtc)
  const dirty = name.trim() !== furby.name || owner.trim() !== furby.owner
  const { sun, moon, rising } = bigThree(b)

  return (
    <div className="screen screen--tight">
      <Starfield density={0.5} />
      <div className="topbar">
        <EmbossButton to={`/furby/${furby.id}`} variant="text" className="dim">← {furby.name}</EmbossButton>
        <span className="eyebrow">Settings</span>
      </div>

      <RetroPanel label="Editable">
        <div className="stack">
          <div>
            <label className="row-item__label" htmlFor="rename">Name</label>
            <input id="rename" className="input" maxLength={18} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="row-item__label" htmlFor="owner">Owner</label>
            <input id="owner" className="input" placeholder="Who looks after this Furby?" value={owner} onChange={(e) => setOwnerText(e.target.value)} />
          </div>
          <EmbossButton
            variant="secondary"
            disabled={!dirty || !name.trim()}
            onClick={() => {
              rename(furby.id, name)
              setOwner(furby.id, owner)
            }}
          >
            Save changes
          </EmbossButton>
        </div>
      </RetroPanel>

      <RetroPanel label="Birth record" chrome>
        <LockedField
          label="Birth portrait"
          value={
            b.portrait ? (
              <span className="row" style={{ alignItems: 'center' }}>
                <FurbyPortrait furby={furby} variant="thumbnail" size={64} />
                <span className="hint">Taken at birth{b.portrait.uncut ? ' · kept uncut' : ''}<br />{b.portrait.width}×{b.portrait.height}</span>
              </span>
            ) : (
              <span className="hint">None taken. This Furby wears the drawn portrait.</span>
            )
          }
        />
        <LockedField label="Name at birth" value={b.furbyName} />
        <LockedField label="Certificate" value={`Furby ${formatCertificateNumber(b.certificateNumber)}`} />
        <LockedField label="Born at" value={formatTime(bornAt, b.timeZone)} sub={`${formatLongDate(bornAt, b.timeZone)} · ${formatUtcOffset(bornAt, b.timeZone)}`} />
        <LockedField label="UTC instant" value={<span className="mono" style={{ fontSize: 14 }}>{b.timestampUtc}</span>} />
        <LockedField label="Place" value={placeLine(b)} sub={`${formatCoordinates(b.latitude, b.longitude)} · ${b.timeZone}`} />
        <LockedField
          label="Cosmic ID"
          value={
            <span className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              <span><Glyph name={sun.sign} /> {SIGN_BY_KEY[sun.sign].name}</span>
              <span><Glyph name="moon" /> {SIGN_BY_KEY[moon.sign].name}</span>
              <span><Glyph name="ascendant" /> {SIGN_BY_KEY[rising.sign].name}</span>
            </span>
          }
          sub={`Sun ${formatPlacement(sun)} · Moon ${formatPlacement(moon)} · AC ${formatPlacement(rising)}`}
        />
        <LockedField label="House system" value={b.natal.houses.system === 'placidus' ? 'Placidus' : 'Whole sign'} />
        <LockedField label="How the moment was set" value={b.mode === 'moment' ? 'Server time at confirmation' : 'Chosen by owner'} sub={`Recorded ${b.recordedAtUtc}`} />
        <div className="locked-note">
          <Padlock className="locked__pad" style={{ marginTop: 0 }} />
          Birth records cannot be altered.
        </div>
      </RetroPanel>

      <RetroPanel label="This device">
        {!confirmForget ? (
          <EmbossButton variant="ghost" onClick={() => setConfirmForget(true)}>Forget {furby.name} on this device</EmbossButton>
        ) : (
          <div className="stack">
            <p className="hint">This removes the local copy only. The birth record itself stays as it was recorded.</p>
            <div className="row">
              <EmbossButton variant="ghost" onClick={() => setConfirmForget(false)}>Keep</EmbossButton>
              <EmbossButton
                variant="violet"
                onClick={() => {
                  for (const ref of furby.portraits ?? []) {
                    forgetPortraitUrls(ref.id)
                    void deletePortrait(ref.id)
                  }
                  forget(furby.id)
                  navigate('/', { replace: true })
                }}
              >
                Forget
              </EmbossButton>
            </div>
          </div>
        )}
      </RetroPanel>
    </div>
  )
}
