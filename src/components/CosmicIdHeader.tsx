import { Glyph } from '../astro/glyphs'
import { SIGN_BY_KEY } from '../astro/signs'
import { bigThree } from '../birth/birthRecord'
import { formatDotDate } from '../lib/time'
import type { Furby } from '../store/furbyStore'
import { FurbyPortrait } from './FurbyPortrait'

export function CosmicIdHeader({ furby, compact = false }: { furby: Furby; compact?: boolean }) {
  const { sun, moon, rising } = bigThree(furby.birth)
  const born = new Date(furby.birth.timestampUtc)
  return (
    <div className="cosmic-id">
      <FurbyPortrait furby={furby} variant={compact ? 'thumbnail' : 'profile'} size={compact ? 64 : 112} eyes="open" animate={false} />
      <div className="cosmic-id__text">
        <div className="cosmic-id__name">{furby.name}</div>
        <div className="cosmic-id__line">
          <span><Glyph name={sun.sign} /> {SIGN_BY_KEY[sun.sign].name}</span>
          <span className="faint">·</span>
          <span><Glyph name="moon" /> {SIGN_BY_KEY[moon.sign].name}</span>
          <span className="faint">·</span>
          <span><Glyph name="ascendant" /> {SIGN_BY_KEY[rising.sign].name}</span>
        </div>
        <div className="cosmic-id__born">Born {formatDotDate(born, furby.birth.timeZone)}</div>
      </div>
    </div>
  )
}
