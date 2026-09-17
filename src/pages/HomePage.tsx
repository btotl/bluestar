import { Link, Navigate } from 'react-router-dom'
import { CosmicIdHeader } from '../components/CosmicIdHeader'
import { EmbossButton } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { useFurbyStore } from '../store/furbyStore'
import './HomePage.css'

export function HomePage() {
  const order = useFurbyStore((s) => s.order)
  const furbys = useFurbyStore((s) => s.furbys)
  if (order.length === 0) return <Navigate to="/birth" replace />

  return (
    <div className="screen">
      <Starfield density={0.7} />
      <header className="center" style={{ paddingTop: 8 }}>
        <div className="eyebrow">Bluestar</div>
        <h1 className="title title--lg stars-title">The nursery</h1>
      </header>

      <ul className="list nursery">
        {order.map((id) => {
          const f = furbys[id]
          if (!f) return null
          return (
            <li key={id}>
              <Link to={`/furby/${id}`} className="panel nursery__card">
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
