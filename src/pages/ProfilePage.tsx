import { Navigate, useParams } from 'react-router-dom'
import { Glyph } from '../astro/glyphs'
import { interpret } from '../astro/interpretations'
import { SIGN_BY_KEY } from '../astro/signs'
import { bigThree } from '../birth/birthRecord'
import { BigThree } from '../components/BigThree'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { Chip, EmbossButton } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { formatDotDate, formatTime } from '../lib/time'
import { formatCertificateNumber, useFurby } from '../store/furbyStore'
import './ProfilePage.css'

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000))
}

export function ProfilePage() {
  const { id } = useParams()
  const furby = useFurby(id)
  if (!furby) return <Navigate to="/" replace />
  const b = furby.birth
  const { sun, rising } = bigThree(b)
  const age = daysSince(b.timestampUtc)
  const bornAt = new Date(b.timestampUtc)
  const sunCopy = interpret('sun', sun.sign, furby.name)
  const risingCopy = interpret('ascendant', rising.sign, furby.name)

  return (
    <div className="screen screen--tight">
      <Starfield density={0.6} />
      <div className="topbar">
        <EmbossButton to="/" variant="text" className="dim">← Nursery</EmbossButton>
        <EmbossButton to={`/furby/${furby.id}/settings`} variant="text" className="dim">Settings</EmbossButton>
      </div>

      <header className="profile__hero">
        <FurbyPortrait furby={furby} variant="celestial" size={210} eyes="open" float />
        <h1 className="title title--xl">{furby.name}</h1>
        <div className="profile__id pixel">Furby {formatCertificateNumber(b.certificateNumber)}</div>
        <div className="profile__born">
          Born {formatDotDate(bornAt, b.timeZone)} · {formatTime(bornAt, b.timeZone, false)}
          <br />
          <span className="dim">{[b.location.name, b.location.region].filter(Boolean).join(', ')}</span>
        </div>
        <div className="row profile__chips">
          <Chip>{age === 0 ? 'Born today' : `${age} day${age === 1 ? '' : 's'} old`}</Chip>
          <Chip tone="warn">ESP32 · not linked</Chip>
        </div>
      </header>

      <BigThree record={b} />

      <section className="card">
        <div className="section-head"><span className="eyebrow">Temperament</span><span className="stripe" style={{ width: 32 }} /></div>
        <div className="stack stack--loose">
          <div>
            <div className="profile__trait"><Glyph name={sun.sign} /> {SIGN_BY_KEY[sun.sign].name} within</div>
            <p className="lead" style={{ fontSize: 15 }}>{sunCopy.body}</p>
          </div>
          <div>
            <div className="profile__trait"><Glyph name="ascendant" /> Meets the world as {SIGN_BY_KEY[rising.sign].name}</div>
            <p className="lead" style={{ fontSize: 15 }}>{risingCopy.body}</p>
          </div>
        </div>
      </section>

      <section className="rows">
        <div className="row-item">
          <span className="row-item__main">
            <span className="row-item__label">Owner</span>
            <span className="row-item__value" style={{ color: furby.owner ? undefined : 'var(--text-faint)' }}>{furby.owner || 'Unclaimed'}</span>
          </span>
          <EmbossButton to={`/furby/${furby.id}/settings`} variant="text">Edit</EmbossButton>
        </div>
      </section>

      <div className="stack">
        <EmbossButton to={`/furby/${furby.id}/chart`}>Natal chart</EmbossButton>
        <EmbossButton to={`/furby/${furby.id}/certificate`} variant="secondary">Birth certificate</EmbossButton>
        <EmbossButton variant="ghost" disabled title="Device link arrives with the ESP32 firmware">Link to Furby (soon)</EmbossButton>
      </div>
    </div>
  )
}
