import type { CSSProperties } from 'react'
import type { SignKey } from './signs'
import type { AspectType, PointKey } from './types'

/**
 * One SVG glyph set for every zodiac sign, planet, angle and aspect so the
 * symbols look identical on iOS, Android, Safari, Chrome and desktop. Each
 * glyph is a stroke path on a 24×24 grid, drawn a little loosely on purpose.
 */

export type GlyphKey = SignKey | PointKey | AspectType

const PATHS: Record<GlyphKey, string> = {
  // ---- signs
  aries: 'M12 20V9 M12 9C9.5 3.5 4 4 4 9 M12 9c2.5-5.5 8-5 8 0',
  taurus: 'M7 16a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M5 4c1 5 4 7 7 7s6-2 7-7',
  gemini: 'M5 4c4 2 10 2 14 0 M5 20c4-2 10-2 14 0 M9 6v12 M15 6v12',
  cancer: 'M4 9c4-5 12-5 16-1 M4 16c4 5 12 5 16 1 M4 11a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M14 13a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  leo: 'M5 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M8 14c0-6 3-9 6-9s4.5 3 2.5 7c-2 4-2 7 2.5 7',
  virgo: 'M3 6c0-2 3-2 3 0v10 M6 6c0-2 3-2 3 0v10 M9 6c0-2 3-2 3 0v8c0 3 3 5 7 3 M12 11c3-1 6 1 6 4c0 3-3 5-6 7',
  libra: 'M3 19h18 M3 15h5a4 4 0 1 1 8 0h5',
  scorpio: 'M3 6c0-2 3-2 3 0v10 M6 6c0-2 3-2 3 0v10 M9 6c0-2 3-2 3 0v10c0 2 2 3 4 3h4 M17.5 16.5l3 2.5l-3 2.5',
  sagittarius: 'M4 20L19 5 M12 5h7v7 M7 13l4 4',
  capricorn: 'M3 6c2-2 5 0 5 3v6 M8 9c0-4 5-5 5 0v6c0 4 4 5 6 2c2-3-1-6-4-4c-2 2-1 5 1 5',
  aquarius: 'M3 9l3-3l3 3l3-3l3 3l3-3l3 3 M3 16l3-3l3 3l3-3l3 3l3-3l3 3',
  pisces: 'M6 4c4 4 4 12 0 16 M18 4c-4 4-4 12 0 16 M5 12h14',
  // ---- bodies
  sun: 'M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M12 12m-1.2 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0',
  moon: 'M15 3a9 9 0 1 0 0 18a7 7 0 1 1 0-18',
  mercury: 'M12 11m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M12 15v6 M9 18h6 M8 3c1 3 7 3 8 0',
  venus: 'M12 9m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M12 14v7 M9 18h6',
  mars: 'M10 14m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M14 10l6-6 M14 4h6v6',
  jupiter: 'M4 8c2-4 7-4 7 1c0 3-3 5-7 5h15 M15 4v17',
  saturn: 'M8 3v14 M5 7h7 M8 12c2-3 7-3 8 0c1 3-2 6-4 7c-1 1 0 2 2 2',
  uranus: 'M12 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M12 14V4 M6 4v12 M18 4v12 M6 8h12',
  neptune: 'M12 3v18 M8 18h8 M5 5v5c0 4 14 4 14 0V5',
  pluto: 'M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M7 6v3c0 4 10 4 10 0V6 M12 13v8 M8 18h8',
  northNode: 'M7 19m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0 M17 19m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0 M6.5 16.5C4 8 20 8 17.5 16.5',
  // ---- angles (drawn as small arrows / bars)
  ascendant: 'M12 20V5 M6 11l6-6l6 6',
  midheaven: 'M4 20V5l8 8l8-8v15',
  descendant: 'M12 4v15 M6 13l6 6l6-6',
  imumCoeli: 'M6 5v14h12 M12 5v14',
  // ---- aspects
  conjunction: 'M9 15m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M13 11l7-7',
  opposition: 'M7 17m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M17 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M10 14l4-4',
  trine: 'M12 4l9 16H3z',
  square: 'M4 4h16v16H4z',
  sextile: 'M12 3v18 M4 7.5l16 9 M4 16.5l16-9',
}

/** True for glyphs that read better with a filled dot (Sun's centre). */
interface Props {
  name: GlyphKey
  size?: number | string
  /** CSS colour; defaults to currentColor */
  color?: string
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  title?: string
}

/** Inline glyph for HTML: sits on the text baseline like an icon. */
export function Glyph({ name, size = '1em', color, strokeWidth = 1.9, className = '', style, title }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`glyph-svg ${className}`}
      style={{ verticalAlign: '-0.15em', color, ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Glyph for use inside another SVG (the natal wheel): a <g> centred on (x, y)
 * with the glyph scaled to `size` px.
 */
export function GlyphAt({
  name,
  x,
  y,
  size = 14,
  stroke = 'currentColor',
  strokeWidth = 2.1,
  className,
}: {
  name: GlyphKey
  x: number
  y: number
  size?: number
  stroke?: string
  strokeWidth?: number
  className?: string
}) {
  const s = size / 24
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`} className={className}>
      {/* strokeWidth is in the 24-unit glyph grid and scales with the glyph */}
      <path d={PATHS[name]} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}
