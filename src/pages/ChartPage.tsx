import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Navigate, useParams } from 'react-router-dom'
import { formatCoordinates, formatDegree, formatPlacement, ordinalHouse } from '../astro/format'
import { Glyph } from '../astro/glyphs'
import { interpret } from '../astro/interpretations'
import { SIGN_BY_KEY, SIGNS } from '../astro/signs'
import type { PointKey } from '../astro/types'
import { bigThree, placement } from '../birth/birthRecord'
import { NatalChart, type ChartSelection } from '../chart/NatalChart'
import { CelestialBackdrop } from '../components/CelestialBackdrop'
import { FurbyPortrait } from '../components/FurbyPortrait'
import { EmbossButton } from '../components/primitives'
import { detectQuality } from '../lib/quality'
import { formatTime, tzAbbreviation } from '../lib/time'
import { useFurby } from '../store/furbyStore'
import './ChartPage.css'

type Tab = 'placements' | 'houses' | 'aspects'
const STORY_ORDER: PointKey[] = ['sun', 'moon', 'ascendant', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'midheaven']

/** The sky at the exact moment of birth, full width, then one thing at a time. */
export function ChartPage() {
  const { id } = useParams()
  const furby = useFurby(id)
  const [tab, setTab] = useState<Tab>('placements')
  const [selection, setSelection] = useState<ChartSelection>(null)
  if (!furby) return <Navigate to="/" replace />
  const b = furby.birth
  const { sun, moon, rising } = bigThree(b)
  const bornAt = new Date(b.timestampUtc)
  const reduced = detectQuality() === 'reduced'

  const select = (s: ChartSelection) => setSelection((cur) => (JSON.stringify(cur) === JSON.stringify(s) ? null : s))

  return (
    <div className="screen screen--tight chart">
      <CelestialBackdrop density={0.5} />
      <div className="topbar">
        <EmbossButton to={`/furby/${furby.id}`} variant="text" className="dim">← {furby.name}</EmbossButton>
        <span className="eyebrow">Natal chart</span>
      </div>

      <header className="center">
        <h1 className="title title--lg">{furby.name}'s natal chart</h1>
      </header>

      <div className="chart__wheel">
        <NatalChart
          birthRecord={b}
          mode="static"
          reducedMotion={reduced}
          selection={selection}
          onSelect={select}
          centerClear={0.62}
          portrait={<FurbyPortrait furby={furby} layoutId="furby-portrait" variant="celestial" size="30%" eyes="open" animate={false} decorative={false} />}
        />
      </div>

      <p className="chart__line">
        <Glyph name="sun" /> Sun {SIGN_BY_KEY[sun.sign].name} <span className="faint">·</span> <Glyph name="moon" /> Moon {SIGN_BY_KEY[moon.sign].name} <span className="faint">·</span> <Glyph name="ascendant" /> {SIGN_BY_KEY[rising.sign].name} Rising
      </p>

      <AnimatePresence mode="wait">
        {selection ? (
          <motion.section key={JSON.stringify(selection)} className="card card--glow chart__focus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
            <SelectionPanel record={b} name={furby.name} selection={selection} onClose={() => setSelection(null)} onSelect={select} />
          </motion.section>
        ) : (
          <motion.p key="hint" className="hint center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Tap a planet, a house or an aspect line.
          </motion.p>
        )}
      </AnimatePresence>

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
            const active = selection?.kind === 'point' && selection.key === key
            return (
              <button type="button" key={key} className={`planet-row ${active ? 'is-active' : ''}`} onClick={() => select({ kind: 'point', key })}>
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
                  <tr key={i} className={selection?.kind === 'house' && selection.number === i + 1 ? 'is-active' : ''} onClick={() => select({ kind: 'house', number: i + 1 })} style={{ cursor: 'pointer' }}>
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
                    <tr key={i} className={selection?.kind === 'aspect' && selection.index === i ? 'is-active' : ''} onClick={() => select({ kind: 'aspect', index: i })} style={{ cursor: 'pointer' }}>
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
    </div>
  )
}

/** Interpretation for whatever is selected on the wheel, shown right under it. */
function SelectionPanel({ record, name, selection, onClose, onSelect }: { record: NonNullable<ReturnType<typeof useFurby>>['birth']; name: string; selection: NonNullable<ChartSelection>; onClose: () => void; onSelect: (s: ChartSelection) => void }) {
  if (selection.kind === 'point') {
    const p = placement(record, selection.key)
    const sign = SIGN_BY_KEY[p.sign]
    const copy = interpret(p.key, p.sign, name)
    const title = p.key === 'ascendant' ? `${sign.name} Rising` : `${p.name} in ${sign.name}`
    const aspects = record.natal.aspects.map((a, index) => ({ a, index })).filter(({ a }) => a.a === p.key || a.b === p.key)
    return (
      <>
        <div className="row row--between" style={{ alignItems: 'flex-start' }}>
          <div className="row" style={{ gap: 12 }}>
            <span className="planet-row__glyph" style={{ width: 44, height: 44 }}><Glyph name={p.key} size={22} /></span>
            <div>
              <div className="eyebrow">{formatPlacement(p)} · {ordinalHouse(p.house)}</div>
              <h2 className="title title--md" style={{ marginTop: 4 }}>{title}</h2>
            </div>
          </div>
          <button type="button" className="btn btn--text dim" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="lead" style={{ color: 'var(--yellow)', fontSize: 15, marginTop: 10 }}>{copy.headline}</p>
        <p className="lead" style={{ marginTop: 6 }}>{copy.body}</p>
        {aspects.length > 0 && (
          <div className="chart__focus-aspects">
            {aspects.map(({ a, index }) => {
              const other = placement(record, a.a === p.key ? a.b : a.a)
              return (
                <button type="button" key={index} className="chip" onClick={() => onSelect({ kind: 'aspect', index })}>
                  <Glyph name={a.type} /> {a.type} <Glyph name={other.key} /> {other.name}
                </button>
              )
            })}
          </div>
        )}
      </>
    )
  }
  if (selection.kind === 'house') {
    const cusp = record.natal.houses.cusps[selection.number - 1]
    const sign = SIGNS[Math.floor(cusp / 30)]
    const inside = record.natal.planets.filter((p) => p.house === selection.number)
    return (
      <>
        <div className="row row--between">
          <div>
            <div className="eyebrow">Cusp {formatDegree(cusp % 30)} {sign.name}</div>
            <h2 className="title title--md" style={{ marginTop: 4 }}>{ordinalHouse(selection.number)}</h2>
          </div>
          <button type="button" className="btn btn--text dim" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="lead" style={{ marginTop: 10 }}>
          {inside.length === 0
            ? `Nothing sits here at ${name}'s birth. Its themes wait quietly.`
            : `${inside.map((p) => p.name).join(', ')} ${inside.length === 1 ? 'sits' : 'sit'} here, so this part of ${name}'s life is busy.`}
        </p>
        {inside.length > 0 && (
          <div className="chart__focus-aspects">
            {inside.map((p) => (
              <button type="button" key={p.key} className="chip" onClick={() => onSelect({ kind: 'point', key: p.key })}>
                <Glyph name={p.key} /> {p.name} · {SIGN_BY_KEY[p.sign].name}
              </button>
            ))}
          </div>
        )}
      </>
    )
  }
  const a = record.natal.aspects[selection.index]
  const p = placement(record, a.a)
  const q = placement(record, a.b)
  const tone = a.type === 'trine' || a.type === 'sextile' ? 'an easy, flowing link' : a.type === 'conjunction' ? 'a fusion' : 'a tension that keeps things moving'
  return (
    <>
      <div className="row row--between">
        <div>
          <div className="eyebrow">orb {formatDegree(a.orb)} · {a.applying ? 'applying' : 'separating'}</div>
          <h2 className="title title--md" style={{ marginTop: 4 }}>{p.name} {a.type} {q.name}</h2>
        </div>
        <button type="button" className="btn btn--text dim" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <p className="lead" style={{ marginTop: 10 }}>
        <Glyph name={a.type} /> {tone} between {p.name} in {SIGN_BY_KEY[p.sign].name} and {q.name} in {SIGN_BY_KEY[q.sign].name}.
      </p>
      <div className="chart__focus-aspects">
        <button type="button" className="chip" onClick={() => onSelect({ kind: 'point', key: p.key })}><Glyph name={p.key} /> {p.name}</button>
        <button type="button" className="chip" onClick={() => onSelect({ kind: 'point', key: q.key })}><Glyph name={q.key} /> {q.name}</button>
      </div>
    </>
  )
}
