import { Navigate, useParams } from 'react-router-dom'
import { formatCoordinates } from '../astro/format'
import { Glyph } from '../astro/glyphs'
import { SIGN_BY_KEY } from '../astro/signs'
import { placeLine } from '../birth/birthRecord'
import { BigThree } from '../components/BigThree'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { EmbossButton, Padlock } from '../components/primitives'
import { CelestialBackdrop } from '../components/CelestialBackdrop'
import { formatLongDate, formatTime, formatUtcOffset } from '../lib/time'
import { formatCertificateNumber, useFurby } from '../store/furbyStore'
import './CertificatePage.css'

/** The permanent record, as a collectible. No chart here; that has its own screen. */
export function CertificatePage() {
  const { id } = useParams()
  const furby = useFurby(id)
  if (!furby) return <Navigate to="/" replace />
  const b = furby.birth
  const bornAt = new Date(b.timestampUtc)
  const sun = SIGN_BY_KEY[b.natal.sun.sign]

  return (
    <div className="screen screen--tight">
      <CelestialBackdrop density={0.5} />
      <div className="topbar">
        <EmbossButton to={`/furby/${furby.id}`} variant="text" className="dim">← {furby.name}</EmbossButton>
        <span className="eyebrow">Birth certificate</span>
      </div>

      <article className="cert">
        <div className="cert__corner cert__corner--tl">✦</div>
        <div className="cert__corner cert__corner--tr">✦</div>
        <div className="cert__corner cert__corner--bl">✦</div>
        <div className="cert__corner cert__corner--br">✦</div>

        <header className="cert__head">
          <span className="stripe stripe--center" aria-hidden="true" />
          <div className="cert__kicker">Certificate of birth</div>
          <div className="cert__number">Furby {formatCertificateNumber(b.certificateNumber)}</div>
        </header>

        <FurbyPortrait furby={furby} variant="certificate" size={170} eyes="open" animate={false} className="cert__portrait" />

        <h1 className="cert__name">{b.furbyName}</h1>
        <div className="cert__under">
          <Glyph name={sun.key} size={18} /> Born under {sun.name}
        </div>

        <dl className="cert__facts">
          <div><dt>Date</dt><dd>{formatLongDate(bornAt, b.timeZone)}</dd></div>
          <div><dt>Time</dt><dd>{formatTime(bornAt, b.timeZone)} <span className="cert__tz">{formatUtcOffset(bornAt, b.timeZone)}</span></dd></div>
          <div><dt>Place</dt><dd>{placeLine(b)}</dd></div>
          <div><dt>Sky</dt><dd className="pixel cert__coords">{formatCoordinates(b.latitude, b.longitude)}</dd></div>
        </dl>

        <BigThree record={b} className="cert__big-three" />

        <footer className="cert__seal-row">
          <div className="cert__seal" aria-label="Sealed">
            <svg viewBox="0 0 100 100" width="84" height="84" aria-hidden="true">
              <defs>
                <path id={`seal-arc-${b.id}`} d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
              </defs>
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
              <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="1" />
              <text fontSize="8.2" fontFamily="Silkscreen, monospace" letterSpacing="1.6" fill="currentColor">
                <textPath href={`#seal-arc-${b.id}`} startOffset="2%">THE SKY REMEMBERS · SEALED ·</textPath>
              </text>
              <path d="M50 36 l3.5 9.5 9.5 3.5 -9.5 3.5 -3.5 9.5 -3.5 -9.5 -9.5 -3.5 9.5 -3.5z" fill="currentColor" />
            </svg>
          </div>
          <div className="cert__seal-text">
            <div className="cert__sealed">Sealed {formatLongDate(new Date(b.recordedAtUtc), b.timeZone)}</div>
            <div className="hint"><Padlock className="cert__pad" /> This record cannot be altered.</div>
          </div>
        </footer>
      </article>

      <div className="stack">
        <EmbossButton to={`/furby/${furby.id}/chart`} variant="secondary">View the natal chart</EmbossButton>
      </div>
    </div>
  )
}
