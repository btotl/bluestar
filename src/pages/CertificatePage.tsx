import { Navigate, useParams } from 'react-router-dom'
import { formatCoordinates } from '../astro/format'
import { Glyph } from '../astro/glyphs'
import { SIGN_BY_KEY } from '../astro/signs'
import { placeLine } from '../birth/birthRecord'
import { BigThree } from '../components/BigThree'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { Ornament } from '../components/Ornament'
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
        <Ornament name="corner" width={54} className="cert__corner cert__corner--tl" />
        <Ornament name="corner" width={54} rotate={90} className="cert__corner cert__corner--tr" />
        <Ornament name="corner" width={54} rotate={270} className="cert__corner cert__corner--bl" />
        <Ornament name="corner" width={54} rotate={180} className="cert__corner cert__corner--br" />
        <Ornament name="sideSigils" tone="line" width={16} className="cert__sigils cert__sigils--l" />
        <Ornament name="sideSigils" tone="line" width={16} className="cert__sigils cert__sigils--r" />

        <header className="cert__head">
          <span className="stripe stripe--center" aria-hidden="true" />
          <div className="cert__kicker">Certificate of birth</div>
          <div className="cert__number">Furby {formatCertificateNumber(b.certificateNumber)}</div>
        </header>

        <div className="cert__arch">
          <Ornament name="archFrame" className="cert__arch-frame" />
          <FurbyPortrait furby={furby} variant="celestial" decorative={false} size={150} eyes="open" animate={false} className="cert__portrait" />
        </div>

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

        <Ornament name="templeDivider" tone="line" className="cert__divider" />
        <BigThree record={b} className="cert__big-three" />

        <footer className="cert__seal-row">
          <div className="cert__seal" aria-label="Sealed">
            <Ornament name="waxSeal" width={84} title="Sealed" />
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
