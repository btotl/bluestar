import { useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { formatCoordinates, formatDegree, formatPlacement, ordinalHouse } from '../astro/format'
import { BIG_THREE_TAGLINES, interpret } from '../astro/interpretations'
import { SIGN_BY_KEY, SIGNS } from '../astro/signs'
import type { PointKey } from '../astro/types'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { NatalWheel } from '../components/NatalWheel'
import { PlanetSheet } from '../components/PlanetSheet'
import { EmbossButton, Medallion, RetroPanel } from '../components/primitives'
import { Starfield } from '../components/Starfield'
import { formatShortDate, formatTime, formatUtcOffset, tzAbbreviation } from '../lib/time'
import { formatCertificateNumber, useFurby } from '../store/furbyStore'
import './CertificatePage.css'

const STORY_ORDER: PointKey[] = ['venus', 'mars', 'mercury', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'midheaven']

export function CertificatePage() {
  const { id } = useParams()
  const furby = useFurby(id)
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<PointKey | null>(null)
  if (!furby) return <Navigate to="/" replace />

  const justBorn = params.get('born') === '1'
  const { chart, birth } = furby
  const tz = birth.location.timeZone
  const bornAt = new Date(birth.timestampUtc)
  const sun = SIGN_BY_KEY[chart.bigThree.sun]
  const moon = SIGN_BY_KEY[chart.bigThree.moon]
  const rising = SIGN_BY_KEY[chart.bigThree.rising]
  const placeLine = [birth.location.name, birth.location.region, birth.location.country].filter(Boolean).join(' · ').toUpperCase()

  return (
    <div className="screen cert">
      <Starfield density={0.7} />

      <header className="cert__top row row--between">
        <span className="eyebrow">✦ Birth certificate</span>
        <span className="chip">FURBY {formatCertificateNumber(birth.certificateNumber)}</span>
      </header>

      <div className={`cert__portrait ${justBorn ? 'pop-in' : ''}`}>
        <NatalWheel chart={chart} aspects={false} />
        <div className="cert__portrait-furby">
          <FurbyPortrait furby={furby} variant="celestial" size={124} lit eyes="open" />
        </div>
      </div>

      <div className="cert__identity">
        <h1 className="title title--xl">{furby.name}</h1>
        <div className="cert__under">
          <span className="glyph">{sun.glyph}</span> BORN UNDER {sun.name.toUpperCase()}
        </div>
        <div className="cert__when mono">
          {formatShortDate(bornAt, tz)} · {formatTime(bornAt, tz)}
        </div>
        <div className="cert__where pixel">{placeLine}</div>
      </div>

      <div className="stack">
        <Medallion kind="sun" glyph="☉" label="Sun" sign={sun.name} tagline={BIG_THREE_TAGLINES.sun} onClick={() => setSelected('sun')} className={justBorn ? 'rise-in delay-1' : ''} />
        <Medallion kind="moon" glyph="☾" label="Moon" sign={moon.name} tagline={BIG_THREE_TAGLINES.moon} onClick={() => setSelected('moon')} className={justBorn ? 'rise-in delay-2' : ''} />
        <Medallion kind="rising" glyph="↑" label="Rising" sign={rising.name} tagline={BIG_THREE_TAGLINES.rising} onClick={() => setSelected('ascendant')} className={justBorn ? 'rise-in delay-3' : ''} />
      </div>

      <RetroPanel label="The stars at your Furby's birth" chrome>
        <div className="cert__wheel-wrap">
          <NatalWheel chart={chart} onSelect={setSelected} selected={selected} />
        </div>
        <p className="subcopy center" style={{ marginTop: 10 }}>Tap a planet to see how it shows up in {furby.name}.</p>
        <div className="cert__legend">
          <span><i style={{ background: 'rgba(55,198,192,0.85)' }} /> harmonious</span>
          <span><i style={{ background: 'rgba(255,95,162,0.85)' }} /> tense</span>
          <span><i style={{ background: 'rgba(255,216,77,0.9)' }} /> conjunct</span>
        </div>
      </RetroPanel>

      <section className="stack">
        <h2 className="title title--sm">How {furby.name} is wired</h2>
        {STORY_ORDER.map((key) => {
          const p = chart.points.find((x) => x.key === key)
          if (!p) return null
          const copy = interpret(key, p.sign, furby.name)
          const title = key === 'midheaven' ? `Midheaven in ${SIGN_BY_KEY[p.sign].name}` : `${p.name} in ${SIGN_BY_KEY[p.sign].name}`
          return (
            <button type="button" key={key} className="planet-row" onClick={() => setSelected(key)}>
              <span className="planet-row__glyph">{p.glyph}</span>
              <span>
                <span className="planet-row__title">{title.toUpperCase()}</span>
                <br />
                <span className="planet-row__sub">{copy.headline}</span>
              </span>
              <span className="planet-row__meta">
                {formatDegree(p.degree)}
                <br />
                {ordinalHouse(p.house).replace(' house', 'H')}
                {p.retrograde && <><br /><span className="retro-tag">℞</span></>}
              </span>
            </button>
          )
        })}
      </section>

      <RetroPanel label="The fine print">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Point</th><th>Position</th><th>House</th><th>Speed</th></tr>
            </thead>
            <tbody>
              {chart.points.map((p) => (
                <tr key={p.key}>
                  <td><span className="glyph">{p.glyph}</span> {p.name}</td>
                  <td>{formatPlacement(p)}</td>
                  <td>{p.house}</td>
                  <td className="dim">{['ascendant', 'midheaven', 'descendant', 'imumCoeli'].includes(p.key) ? '—' : `${p.speed.toFixed(3)}°/d`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="eyebrow" style={{ margin: '14px 0 6px' }}>House cusps · {chart.houseSystem === 'placidus' ? 'Placidus' : 'Whole sign'}</div>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              {chart.cusps.map((c, i) => {
                const s = SIGNS[Math.floor(c / 30)]
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{formatDegree(c % 30)} <span className="glyph">{s.glyph}</span> {s.name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="eyebrow" style={{ margin: '14px 0 6px' }}>Aspects</div>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              {chart.aspects.map((a, i) => {
                const p = chart.points.find((x) => x.key === a.a)!
                const q = chart.points.find((x) => x.key === a.b)!
                return (
                  <tr key={i}>
                    <td><span className="glyph">{p.glyph}</span> {p.name}</td>
                    <td><span className="glyph">{a.glyph}</span> {a.type}</td>
                    <td><span className="glyph">{q.glyph}</span> {q.name}</td>
                    <td className="dim">{formatDegree(a.orb)} {a.applying ? 'a' : 's'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="eyebrow" style={{ margin: '14px 0 6px' }}>Cast for</div>
        <table className="data-table">
          <tbody>
            <tr><td>UTC</td><td>{birth.timestampUtc}</td></tr>
            <tr><td>Local</td><td>{formatTime(bornAt, tz)} {tzAbbreviation(bornAt, tz)} ({formatUtcOffset(bornAt, tz)})</td></tr>
            <tr><td>Coordinates</td><td>{formatCoordinates(birth.location.latitude, birth.location.longitude)}</td></tr>
            <tr><td>RAMC</td><td>{chart.ramc.toFixed(3)}°</td></tr>
            <tr><td>Obliquity</td><td>{chart.obliquity.toFixed(4)}°</td></tr>
            <tr><td>Zodiac</td><td>tropical · geocentric</td></tr>
            <tr><td>Recorded</td><td>{birth.mode === 'moment' ? 'server time at confirmation' : 'chosen by owner'}</td></tr>
          </tbody>
        </table>
      </RetroPanel>

      <div className="stack">
        <EmbossButton to={`/furby/${furby.id}`} variant="gold">Go to {furby.name}'s profile</EmbossButton>
        <EmbossButton to="/" variant="ghost">Nursery</EmbossButton>
      </div>

      {selected && <PlanetSheet chart={chart} pointKey={selected} name={furby.name} onClose={() => setSelected(null)} />}
    </div>
  )
}
