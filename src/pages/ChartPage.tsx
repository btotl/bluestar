import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { formatCoordinates, formatDegree, formatPlacement } from '../astro/format'
import { Glyph } from '../astro/glyphs'
import { interpret } from '../astro/interpretations'
import { SIGN_BY_KEY, SIGNS } from '../astro/signs'
import type { PointKey } from '../astro/types'
import { bigThree, placement } from '../birth/birthRecord'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { NatalWheel } from '../components/NatalWheel'
import { PlanetSheet } from '../components/PlanetSheet'
import { EmbossButton } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { formatTime, tzAbbreviation } from '../lib/time'
import { useFurby } from '../store/furbyStore'
import './ChartPage.css'

type Tab = 'placements' | 'houses' | 'aspects'
const STORY_ORDER: PointKey[] = ['sun', 'moon', 'ascendant', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'midheaven']

/** Technical and exploratory. The sky at the exact moment of birth, full width. */
export function ChartPage() {
  const { id } = useParams()
  const furby = useFurby(id)
  const [tab, setTab] = useState<Tab>('placements')
  const [selected, setSelected] = useState<PointKey | null>(null)
  if (!furby) return <Navigate to="/" replace />
  const b = furby.birth
  const { sun, moon, rising } = bigThree(b)
  const bornAt = new Date(b.timestampUtc)

  return (
    <div className="screen screen--tight chart">
      <Starfield density={0.6} />
      <div className="topbar">
        <EmbossButton to={`/furby/${furby.id}`} variant="text" className="dim">← {furby.name}</EmbossButton>
        <span className="eyebrow">Natal chart</span>
      </div>

      <header className="center">
        <h1 className="title title--lg">{furby.name}'s natal chart</h1>
      </header>

      <div className="chart__wheel">
        <NatalWheel natal={b.natal} onSelect={setSelected} selected={selected} centerClear={0.62} />
        <div className="chart__furby">
          <FurbyPortrait furby={furby} variant="celestial" size="30%" eyes="open" animate={false} decorative={false} />
        </div>
      </div>

      <p className="chart__line">
        <Glyph name="sun" /> Sun {SIGN_BY_KEY[sun.sign].name} <span className="faint">·</span> <Glyph name="moon" /> Moon {SIGN_BY_KEY[moon.sign].name} <span className="faint">·</span> <Glyph name="ascendant" /> {SIGN_BY_KEY[rising.sign].name} Rising
      </p>

      <div className="tabs" role="tablist">
        {(['placements', 'houses', 'aspects'] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'placements' && (
        <section className="rows">
          {STORY_ORDER.map((key) => {
            const p = placement(b, key)
            const copy = interpret(key, p.sign, furby.name)
            const title = key === 'ascendant' ? `${SIGN_BY_KEY[p.sign].name} Rising` : `${p.name} in ${SIGN_BY_KEY[p.sign].name}`
            return (
              <button type="button" key={key} className="planet-row" onClick={() => setSelected(key)}>
                <span className="planet-row__glyph"><Glyph name={key} size={20} /></span>
                <span>
                  <span className="planet-row__title">{title}</span>
                  <br />
                  <span className="planet-row__sub">{copy.headline}</span>
                </span>
                <span className="planet-row__meta">
                  {formatDegree(p.degree)}
                  <br />
                  house {p.house}
                  {p.retrograde && <><br /><span className="retro-tag">retro</span></>}
                </span>
              </button>
            )
          })}
        </section>
      )}

      {tab === 'houses' && (
        <section className="card">
          <div className="section-head"><span className="eyebrow eyebrow--dim">{b.natal.houses.system === 'placidus' ? 'Placidus' : 'Whole sign'} cusps</span></div>
          <table className="data-table">
            <thead><tr><th>House</th><th>Cusp</th><th>Sign</th></tr></thead>
            <tbody>
              {b.natal.houses.cusps.map((c, i) => {
                const s = SIGNS[Math.floor(c / 30)]
                return (
                  <tr key={i}>
                    <td>{i + 1}{i === 0 ? ' · AC' : i === 9 ? ' · MC' : i === 6 ? ' · DC' : i === 3 ? ' · IC' : ''}</td>
                    <td>{formatDegree(c % 30)}</td>
                    <td><Glyph name={s.key} /> {s.name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'aspects' && (
        <section className="card">
          <div className="section-head"><span className="eyebrow eyebrow--dim">{b.natal.aspects.length} aspects, tightest first</span></div>
          <div className="table-wrap">
            <table className="data-table">
              <tbody>
                {b.natal.aspects.map((a, i) => {
                  const p = placement(b, a.a)
                  const q = placement(b, a.b)
                  return (
                    <tr key={i}>
                      <td><Glyph name={p.key} /> {p.name}</td>
                      <td><Glyph name={a.type} /> {a.type}</td>
                      <td><Glyph name={q.key} /> {q.name}</td>
                      <td className="dim">{formatDegree(a.orb)} {a.applying ? 'a' : 's'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="chart__cast">
        <div className="eyebrow eyebrow--dim">Cast for</div>
        <div className="pixel chart__cast-line">{bornAt.toISOString().replace('T', ' ').replace(/\.\d+Z/, ' UTC')}</div>
        <div className="pixel chart__cast-line">{formatTime(bornAt, b.timeZone)} {tzAbbreviation(bornAt, b.timeZone)} · {formatCoordinates(b.latitude, b.longitude)}</div>
        <div className="pixel chart__cast-line">Tropical · geocentric · RAMC {b.natal.ramc.toFixed(2)}° · ε {b.natal.obliquity.toFixed(3)}°</div>
        <div className="hint" style={{ marginTop: 8 }}>Sun {formatPlacement(sun)} · Moon {formatPlacement(moon)} · AC {formatPlacement(rising)}</div>
      </section>

      {selected && <PlanetSheet record={b} pointKey={selected} name={furby.name} onClose={() => setSelected(null)} />}
    </div>
  )
}
