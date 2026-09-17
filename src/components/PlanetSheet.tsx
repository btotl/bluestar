import { formatDegree, formatPlacement, ordinalHouse } from '../astro/format'
import { interpret } from '../astro/interpretations'
import { SIGN_BY_KEY } from '../astro/signs'
import type { NatalChart, PointKey } from '../astro/types'
import { Sheet } from './primitives'

const ROLE_KIND: Partial<Record<PointKey, string>> = {
  sun: 'The Furby within',
  moon: 'The Furby when nobody is watching',
  ascendant: 'The Furby the world meets',
}

export function PlanetSheet({ chart, pointKey, name, onClose }: { chart: NatalChart; pointKey: PointKey; name: string; onClose: () => void }) {
  const p = chart.points.find((x) => x.key === pointKey)
  if (!p) return null
  const sign = SIGN_BY_KEY[p.sign]
  const copy = interpret(p.key, p.sign, name)
  const aspects = chart.aspects.filter((a) => a.a === p.key || a.b === p.key)
  const titleName = p.key === 'ascendant' ? 'Rising' : p.name
  const title = p.key === 'ascendant' ? `${sign.name} Rising` : `${titleName} in ${sign.name}`

  return (
    <Sheet onClose={onClose}>
      <div className="stack">
        <div className="row">
          <span className="planet-row__glyph" style={{ width: 48, height: 48, fontSize: 26 }}>{p.glyph}</span>
          <div>
            <div className="eyebrow">{ROLE_KIND[p.key] ?? copy.headline}</div>
            <h2 className="title title--lg" style={{ marginTop: 2 }}>{title}</h2>
          </div>
        </div>
        {ROLE_KIND[p.key] && <p className="subcopy" style={{ color: 'var(--cream)' }}>{copy.headline}</p>}
        <p style={{ margin: 0, fontSize: 15, color: 'var(--cream)' }}>{copy.body}</p>

        <div className="panel" style={{ padding: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>The fine print</div>
          <table className="data-table">
            <tbody>
              <tr><td>Position</td><td>{formatPlacement(p)}</td></tr>
              <tr><td>Longitude</td><td>{p.longitude.toFixed(4)}°</td></tr>
              <tr><td>House</td><td>{ordinalHouse(p.house)}</td></tr>
              <tr><td>Element</td><td>{sign.element} · {sign.modality}</td></tr>
              <tr><td>Ruler</td><td>{sign.ruler}</td></tr>
              {!['ascendant', 'midheaven', 'descendant', 'imumCoeli', 'northNode'].includes(p.key) && (
                <tr><td>Motion</td><td>{p.retrograde ? <span className="retro-tag">℞ retrograde</span> : 'direct'} · {Math.abs(p.speed).toFixed(3)}°/day</td></tr>
              )}
            </tbody>
          </table>
          {aspects.length > 0 && (
            <>
              <div className="eyebrow" style={{ margin: '12px 0 6px' }}>Aspects</div>
              <table className="data-table">
                <tbody>
                  {aspects.map((a, i) => {
                    const otherKey = a.a === p.key ? a.b : a.a
                    const other = chart.points.find((x) => x.key === otherKey)!
                    return (
                      <tr key={i}>
                        <td><span className="glyph">{a.glyph}</span> {a.type}</td>
                        <td><span className="glyph">{other.glyph}</span> {other.name}</td>
                        <td className="dim">orb {formatDegree(a.orb)} {a.applying ? '↗' : '↘'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </Sheet>
  )
}
