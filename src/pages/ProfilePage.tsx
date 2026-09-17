import { Navigate, useParams } from 'react-router-dom'
import { CosmicIdHeader } from '../components/CosmicIdHeader'
import { Chip, EmbossButton, RetroPanel } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { SIGN_BY_KEY } from '../astro/signs'
import { interpret } from '../astro/interpretations'
import { formatCertificateNumber, useFurby } from '../store/furbyStore'

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000))
}

export function ProfilePage() {
  const { id } = useParams()
  const furby = useFurby(id)
  if (!furby) return <Navigate to="/" replace />

  const age = daysSince(furby.birth.timestampUtc)
  const sunCopy = interpret('sun', furby.chart.bigThree.sun, furby.name)
  const risingCopy = interpret('ascendant', furby.chart.bigThree.rising, furby.name)

  return (
    <div className="screen">
      <Starfield density={0.6} />
      <div className="row row--between">
        <EmbossButton to="/" variant="text">← Nursery</EmbossButton>
        <EmbossButton to={`/furby/${furby.id}/settings`} variant="text">Settings ⚙</EmbossButton>
      </div>

      <RetroPanel chrome>
        <CosmicIdHeader furby={furby} />
        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <Chip>FURBY {formatCertificateNumber(furby.birth.certificateNumber)}</Chip>
          <Chip>{age === 0 ? 'Born today' : `${age} day${age === 1 ? '' : 's'} old`}</Chip>
          <Chip tone="warn">ESP32 · not linked</Chip>
        </div>
      </RetroPanel>

      <RetroPanel label="Temperament">
        <div className="stack">
          <div>
            <div className="eyebrow"><span className="glyph">☉</span> {SIGN_BY_KEY[furby.chart.bigThree.sun].name} within</div>
            <p className="subcopy" style={{ color: 'var(--cream)', marginTop: 4 }}>{sunCopy.body}</p>
          </div>
          <div>
            <div className="eyebrow"><span className="glyph">↑</span> Meets the world as {SIGN_BY_KEY[furby.chart.bigThree.rising].name}</div>
            <p className="subcopy" style={{ color: 'var(--cream)', marginTop: 4 }}>{risingCopy.body}</p>
          </div>
        </div>
      </RetroPanel>

      <RetroPanel label="Owner">
        <div className="row row--between">
          <span className="mono" style={{ fontWeight: 600, color: furby.owner ? 'var(--cream)' : 'var(--text-faint)' }}>
            {furby.owner || 'Unclaimed'}
          </span>
          <EmbossButton to={`/furby/${furby.id}/settings`} variant="text">Edit</EmbossButton>
        </div>
      </RetroPanel>

      <div className="stack" style={{ marginTop: 'auto' }}>
        <EmbossButton to={`/furby/${furby.id}/certificate`} variant="gold">✦ Birth certificate</EmbossButton>
        <EmbossButton variant="chrome" disabled title="Device link arrives with the ESP32 firmware">Link to Furby (soon)</EmbossButton>
      </div>
    </div>
  )
}
