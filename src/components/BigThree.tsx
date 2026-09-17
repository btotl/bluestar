import { Glyph } from '../astro/glyphs'
import { SIGN_BY_KEY } from '../astro/signs'
import type { PointKey } from '../astro/types'
import { bigThree, type BirthRecord } from '../birth/birthRecord'

/** The compact Sun · Moon · Rising strip. Reads only from the Birth record. */
export function BigThree({ record, onSelect, className = '' }: { record: BirthRecord; onSelect?: (key: PointKey) => void; className?: string }) {
  const { sun, moon, rising } = bigThree(record)
  const cells: { key: PointKey; kind: 'sun' | 'moon' | 'rising'; sign: string; role: string }[] = [
    { key: 'sun', kind: 'sun', sign: SIGN_BY_KEY[sun.sign].name, role: 'Sun' },
    { key: 'moon', kind: 'moon', sign: SIGN_BY_KEY[moon.sign].name, role: 'Moon' },
    { key: 'ascendant', kind: 'rising', sign: SIGN_BY_KEY[rising.sign].name, role: 'Rising' },
  ]
  return (
    <div className={`big-three ${className}`}>
      {cells.map((c) => {
        const inner = (
          <>
            <span className={`big-three__glyph big-three__glyph--${c.kind}`}>
              <Glyph name={c.key} size={26} strokeWidth={1.8} />
            </span>
            <span className="big-three__sign">{c.sign}</span>
            <span className="big-three__role">{c.role}</span>
          </>
        )
        return onSelect ? (
          <button type="button" key={c.key} className="big-three__cell" onClick={() => onSelect(c.key)}>
            {inner}
          </button>
        ) : (
          <div key={c.key} className="big-three__cell">
            {inner}
          </div>
        )
      })}
    </div>
  )
}
