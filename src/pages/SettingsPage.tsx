import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { formatCoordinates, formatPlacement } from '../astro/format'
import { SIGN_BY_KEY } from '../astro/signs'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { EmbossButton, LockedField, Padlock, RetroPanel } from '../components/primitives'
import { deletePortrait, forgetPortraitUrls } from '../portrait/portraitDb'
import { Starfield } from '../components/Starfield'
import { formatLongDate, formatTime, formatUtcOffset } from '../lib/time'
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

  const { birth, chart } = furby
  const tz = birth.location.timeZone
  const bornAt = new Date(birth.timestampUtc)
  const dirty = name.trim() !== furby.name || owner.trim() !== furby.owner
  const bigThree = chart.points.filter((p) => ['sun', 'moon', 'ascendant'].includes(p.key))

  return (
    <div className="screen">
      <Starfield density={0.5} />
      <div className="row row--between">
        <EmbossButton to={`/furby/${furby.id}`} variant="text">← {furby.name}</EmbossButton>
        <span className="eyebrow">Settings</span>
      </div>

      <RetroPanel label="Editable">
        <div className="field">
          <label className="field__label" htmlFor="rename">Name</label>
          <input id="rename" className="input" maxLength={18} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="owner">Owner</label>
          <input id="owner" className="input input--small" placeholder="Who looks after this Furby?" value={owner} onChange={(e) => setOwnerText(e.target.value)} />
        </div>
        <EmbossButton
          variant="chrome"
          small
          disabled={!dirty || !name.trim()}
          onClick={() => {
            rename(furby.id, name)
            setOwner(furby.id, owner)
          }}
          style={{ marginTop: 8, width: '100%' }}
        >
          Save changes
        </EmbossButton>
      </RetroPanel>

      <RetroPanel label="Birth record" chrome>
        <LockedField
          label="Birth portrait"
          value={
            furby.birthPortraitId ? (
              <span className="row" style={{ alignItems: 'center' }}>
                <FurbyPortrait furby={furby} variant="thumbnail" size={72} />
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>
                  Taken at birth{furby.portraits?.[0]?.uncut ? ' · kept uncut' : ''}
                  <br />
                  {furby.portraits?.[0] ? `${furby.portraits[0].width}×${furby.portraits[0].height}` : ''}
                </span>
              </span>
            ) : (
              <span className="faint" style={{ fontWeight: 400 }}>None taken. This Furby wears the drawn portrait.</span>
            )
          }
        />
        <LockedField label="Name at birth" value={birth.name} />
        <LockedField label="Certificate" value={`FURBY ${formatCertificateNumber(birth.certificateNumber)}`} />
        <LockedField label="Born at" value={formatTime(bornAt, tz)} sub={`${formatLongDate(bornAt, tz)} · ${formatUtcOffset(bornAt, tz)}`} />
        <LockedField label="UTC instant" value={birth.timestampUtc} />
        <LockedField
          label="Place"
          value={[birth.location.name, birth.location.region, birth.location.country].filter(Boolean).join(', ')}
          sub={`${formatCoordinates(birth.location.latitude, birth.location.longitude)} · ${tz}`}
        />
        <LockedField
          label="Cosmic ID"
          value={
            <span>
              {bigThree.map((p) => (
                <span key={p.key} style={{ marginRight: 10 }}>
                  <span className="glyph">{p.key === 'ascendant' ? '↑' : p.glyph}</span> {SIGN_BY_KEY[p.sign].name}
                </span>
              ))}
            </span>
          }
          sub={bigThree.map((p) => `${p.key === 'ascendant' ? 'AC' : p.name} ${formatPlacement(p)}`).join(' · ')}
        />
        <LockedField label="House system" value={chart.houseSystem === 'placidus' ? 'Placidus' : 'Whole sign'} />
        <LockedField label="How the moment was set" value={birth.mode === 'moment' ? 'Server time at confirmation' : 'Chosen by owner'} sub={`Recorded ${birth.recordedAtUtc}`} />
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
            <p className="subcopy">This removes the local copy only. The birth record itself stays as it was recorded.</p>
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
