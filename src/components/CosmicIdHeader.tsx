import { SIGN_BY_KEY } from '../astro/signs'
import { formatDotDate } from '../lib/time'
import type { Furby } from '../store/furbyStore'
import { FurbySprite } from './FurbySprite'

export function CosmicIdHeader({ furby, compact = false }: { furby: Furby; compact?: boolean }) {
  const { sun, moon, rising } = furby.chart.bigThree
  const born = new Date(furby.birth.timestampUtc)
  return (
    <div className="cosmic-id">
      <FurbySprite eyes="open" size={compact ? 64 : 88} animate={false} />
      <div>
        <div className="cosmic-id__name">{furby.name}</div>
        <div className="cosmic-id__line">
          <span><span className="glyph">{SIGN_BY_KEY[sun].glyph}</span> {SIGN_BY_KEY[sun].name}</span>
          <span className="faint">·</span>
          <span><span className="glyph">☾</span> {SIGN_BY_KEY[moon].name}</span>
          <span className="faint">·</span>
          <span><span className="glyph">↑</span> {SIGN_BY_KEY[rising].name}</span>
        </div>
        <div className="cosmic-id__born">Born {formatDotDate(born, furby.birth.location.timeZone)}</div>
      </div>
    </div>
  )
}
