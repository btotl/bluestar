import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Glyph } from '../astro/glyphs'
import { SIGN_BY_KEY } from '../astro/signs'
import { BigThree } from '../components/BigThree'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { EmbossButton } from '../components/primitives'
import { CelestialBackdrop } from '../components/CelestialBackdrop'
import { useFurby } from '../store/furbyStore'
import './RevealPage.css'

/** Emotional, minimal. The Furby and its new identity, nothing else. */
export function RevealPage() {
  const { id } = useParams()
  const furby = useFurby(id)
  const navigate = useNavigate()
  if (!furby) return <Navigate to="/" replace />
  const sun = SIGN_BY_KEY[furby.birth.natal.sun.sign]

  return (
    <div className="screen screen--center reveal">
      <CelestialBackdrop density={0.9} />
      <div className="reveal__body">
        <FurbyPortrait furby={furby} layoutId="furby-portrait" variant="celestial" size={230} lit alive eyes="open" />
        <h1 className="title title--lg rise-in delay-1">{furby.name} has been born</h1>
        <div className="reveal__sign rise-in delay-2">
          <Glyph name={sun.key} size={44} strokeWidth={1.6} />
          <div className="reveal__under">Born under {sun.name}</div>
        </div>
        <BigThree record={furby.birth} className="rise-in delay-3" />
      </div>
      <div className="stack rise-in delay-4">
        <EmbossButton onClick={() => navigate(`/furby/${furby.id}`, { replace: true })}>Meet {furby.name} →</EmbossButton>
        <EmbossButton variant="ghost" to={`/furby/${furby.id}/certificate`}>See the birth certificate</EmbossButton>
      </div>
    </div>
  )
}
