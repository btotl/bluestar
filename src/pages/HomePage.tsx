import { Link, Navigate } from 'react-router-dom'
import { CosmicIdHeader } from '../components/CosmicIdHeader'
import { Ornament } from '../components/Ornament'
import { EmbossButton } from '../components/primitives'
import { CelestialBackdrop } from '../components/CelestialBackdrop'
import { useFurbyStore } from '../store/furbyStore'
import './HomePage.css'
import './ProfilePage.css'

export function HomePage() {
  const order = useFurbyStore((s) => s.order)
  const furbys = useFurbyStore((s) => s.furbys)
  if (order.length === 0) return <Navigate to="/birth" replace />

  return (
    <div className="screen">
      <CelestialBackdrop density={0.5} />
      <header className="center" style={{ paddingTop: 8 }}>
        <Ornament name="rosette" width={52} style={{ marginBottom: 6 }} />
        <div className="eyebrow">Bluestar</div>
        <h1 className="title title--lg stars-title">The nursery</h1>
      </header>

      <ul className="list nursery">
        {order.map((id) => {
          const f = furbys[id]
          if (!f) return null
          return (
            <li key={id}>
              <Link to={`/furby/${id}`} className="card nursery__card">
                <CosmicIdHeader furby={f} compact />
              </Link>
            </li>
          )
        })}
      </ul>

      <div style={{ marginTop: 'auto' }}>
        <EmbossButton to="/birth" ceremonial>Birth a new Furby</EmbossButton>
      </div>
    </div>
  )
}
