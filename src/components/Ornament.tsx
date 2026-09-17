import type { CSSProperties } from 'react'
import bracket from '../assets/ornaments/ancient_bracket.svg?raw'
import sunDisc from '../assets/ornaments/ancient_sun_disc.svg?raw'
import sideSigils from '../assets/ornaments/card_side_sigils.svg?raw'
import archFrame from '../assets/ornaments/celestial_arch_frame.svg?raw'
import corner from '../assets/ornaments/celestial_corner_ornament.svg?raw'
import rosette from '../assets/ornaments/celestial_rosette.svg?raw'
import constellation from '../assets/ornaments/constellation_cluster.svg?raw'
import eightStar from '../assets/ornaments/eight_point_star.svg?raw'
import fourStar from '../assets/ornaments/four_point_star.svg?raw'
import lunarPhases from '../assets/ornaments/lunar_phases_row.svg?raw'
import meander from '../assets/ornaments/meander_border.svg?raw'
import orbitalHalo from '../assets/ornaments/orbital_halo.svg?raw'
import sprinkle from '../assets/ornaments/starfield_sprinkle.svg?raw'
import templeDivider from '../assets/ornaments/temple_divider.svg?raw'
import waxSeal from '../assets/ornaments/wax_seal_star.svg?raw'
import './Ornament.css'

/**
 * The ancient-celestial ornament pack (src/assets/ornaments). Inlined so
 * `currentColor` inherits from CSS; an <img> would lose that. Every asset is
 * a small static vector with no text, so inlining the markup is safe.
 */
const SVG = {
  bracket,
  sunDisc,
  sideSigils,
  archFrame,
  corner,
  rosette,
  constellation,
  eightStar,
  fourStar,
  lunarPhases,
  meander,
  orbitalHalo,
  sprinkle,
  templeDivider,
  waxSeal,
} as const

export type OrnamentName = keyof typeof SVG

interface Props {
  name: OrnamentName
  /** CSS width; height follows the asset's aspect ratio. */
  width?: number | string
  /** Degrees, for corners and mirrored pieces. */
  rotate?: number
  tone?: 'gold' | 'line' | 'faint'
  className?: string
  style?: CSSProperties
  title?: string
}

export function Ornament({ name, width = '100%', rotate, tone = 'gold', className = '', style, title }: Props) {
  return (
    <span
      className={`ornament ornament--${tone} ornament--${name} ${className}`}
      style={{ width: typeof width === 'number' ? `${width}px` : width, transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: SVG[name] }}
    />
  )
}
