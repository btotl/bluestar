import { formatDegree, formatPlacement, ordinalHouse } from '../astro/format'
import { Glyph } from '../astro/glyphs'
import { interpret } from '../astro/interpretations'
import { SIGN_BY_KEY } from '../astro/signs'
import type { PointKey } from '../astro/types'
import { placement, type BirthRecord } from '../birth/birthRecord'
import { Sheet } from './primitives'

const ROLE: Partial<Record<PointKey, string>> = {
  sun: 'The Furby within',
  moon: 'The Furby when nobody is watching',
  ascendant: 'The Furby the world meets',
}

const ANGLES: PointKey[] = ['ascendant', 'midheaven', 'descendant', 'imumCoeli', 'northNode']

export function PlanetSheet({ record, pointKey, name, onClose }: { record: BirthRecord; pointKey: PointKey; name: string; onClose: () => void }) {
  const p = placement(record, pointKey)
  const sign = SIGN_BY_KEY[p.sign]
  const copy = interpret(p.key, p.sign, name)
  const aspects = record.natal.aspects.filter((a) => a.a === p.key || a.b === p.key)
  const title = p.key === 'ascendant' ? `${sign.name} Rising` : `${p.name} in ${sign.name}`

  return (
    <Sheet onClose={onClose}>
      <div className="stack stack--loose">
        <div className="row" style={{ gap: 14 }}>
          <span className="planet-row__glyph" style={{ width: 52, height: 52 }}><Glyph name={p.key} size={28} /></span>
          <div>
            <div className="eyebrow">{ROLE[p.key] ?? 'Placement'}</div>
            <h2 className="title title--lg" style={{ marginTop: 4 }}>{title}</h2>
          </div>
        </div>
        <div>
          <p className="lead" style={{ color: 'var(--yellow)', fontSize: 15 }}>{copy.headline}</p>
          <p className="lead" style={{ marginTop: 8 }}>{copy.body}</p>
        </div>

        <div className="card">
          <div className="eyebrow eyebrow--dim" style={{ marginBottom: 6 }}>The fine print</div>
          <table className="data-table">
            <tbody>
              <tr><td>Position</td><td>{formatPlacement(p)}</td></tr>
              <tr><td>Longitude</td><td>{p.longitude.toFixed(4)}°</td></tr>
              <tr><td>House</td><td>{ordinalHouse(p.house)}</td></tr>
              <tr><td>Element</td><td>{sign.element} · {sign.modality}</td></tr>
              <tr><td>Ruler</td><td>{sign.ruler}</td></tr>
              {!ANGLES.includes(p.key) && (
                <tr><td>Motion</td><td>{p.retrograde ? <span className="retro-tag">retrograde</span> : 'direct'} · {Math.abs(p.speed).toFixed(3)}°/day</td></tr>
              )}
            </tbody>
          </table>
          {aspects.length > 0 && (
            <>
              <div className="eyebrow eyebrow--dim" style={{ margin: '14px 0 6px' }}>Aspects</div>
              <table className="data-table">
                <tbody>
                  {aspects.map((a, i) => {
                    const other = placement(record, a.a === p.key ? a.b : a.a)
                    return (
                      <tr key={i}>
                        <td><Glyph name={a.type} /> {a.type}</td>
                        <td><Glyph name={other.key} /> {other.name}</td>
                        <td className="dim">orb {formatDegree(a.orb)} {a.applying ? 'applying' : 'separating'}</td>
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
