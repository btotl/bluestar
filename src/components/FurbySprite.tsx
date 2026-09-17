import { DEFAULT_PALETTE, type FurbyPalette } from './furbyPalette'
import './FurbySprite.css'

export type EyeState = 'closed' | 'open'

function Eye({ cx, cy, id, palette }: { cx: number; cy: number; id: string; palette: FurbyPalette }) {
  return (
    <g className="furby__eye" style={{ transformOrigin: `${cx}px ${cy - 24}px` }}>
      <clipPath id={`eyeclip-${id}`}>
        <ellipse cx={cx} cy={cy} rx="21" ry="25" />
      </clipPath>
      <ellipse cx={cx} cy={cy} rx="21" ry="25" fill="#fffdf6" stroke="#05060f" strokeWidth="3.5" />
      <circle cx={cx} cy={cy + 3} r="12.5" fill={palette.iris} stroke="#05060f" strokeWidth="2" />
      <circle cx={cx} cy={cy + 3} r="6.5" fill="#05060f" />
      <circle cx={cx - 4} cy={cy - 3} r="3.2" fill="#fff" />
      <circle cx={cx + 5} cy={cy + 7} r="1.6" fill="#fff" opacity="0.8" />
      <g className="furby__lid" clipPath={`url(#eyeclip-${id})`} style={{ transformOrigin: `${cx}px ${cy - 26}px` }}>
        <rect x={cx - 24} y={cy - 28} width="48" height="56" fill={palette.fur} />
        <path d={`M ${cx - 17} ${cy + 4} Q ${cx} ${cy + 18} ${cx + 17} ${cy + 4}`} fill="none" stroke="#05060f" strokeWidth="3" strokeLinecap="round" />
        <path d={`M ${cx - 11} ${cy + 12} l -3 5 M ${cx} ${cy + 15} l 0 6 M ${cx + 11} ${cy + 12} l 3 5`} stroke="#05060f" strokeWidth="2" strokeLinecap="round" />
      </g>
      <ellipse cx={cx} cy={cy} rx="21" ry="25" fill="none" stroke="#05060f" strokeWidth="3.5" />
    </g>
  )
}

interface Props {
  eyes?: EyeState
  /** Adds a warm glow around the body. */
  lit?: boolean
  /** Small ear wiggle loop. */
  animate?: boolean
  size?: number | string
  palette?: FurbyPalette
  className?: string
  title?: string
}

/**
 * A hand-drawn-looking 1998-style Furby. The eyelids are SVG shapes driven by
 * CSS so the "opens its eyes" moment is a single class flip.
 */
export function FurbySprite({
  eyes = 'closed',
  lit = false,
  animate = true,
  size = 200,
  palette = DEFAULT_PALETTE,
  className = '',
  title = 'Furby',
}: Props) {
  const cls = ['furby', `furby--${eyes}`, lit ? 'furby--lit' : '', animate ? 'furby--animate' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <svg
      className={cls}
      viewBox="0 0 220 250"
      width={size}
      height={typeof size === 'number' ? (size * 250) / 220 : undefined}
      role="img"
      aria-label={title}
    >
      <defs>
        <filter id="fur-edge" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id="fur-shade" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={palette.fur} />
          <stop offset="100%" stopColor={palette.furDark} />
        </radialGradient>
        <radialGradient id="belly-shade" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor={palette.belly} />
        </radialGradient>
      </defs>

      {/* feet */}
      <g className="furby__feet">
        <ellipse cx="78" cy="228" rx="30" ry="12" fill={palette.furDark} stroke="#05060f" strokeWidth="3.5" />
        <ellipse cx="142" cy="228" rx="30" ry="12" fill={palette.furDark} stroke="#05060f" strokeWidth="3.5" />
        <path d="M60 226 l-6 -8 M74 224 l-2 -10 M88 226 l4 -9 M124 226 l-4 -9 M138 224 l2 -10 M152 226 l6 -8" stroke="#05060f" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* ears */}
      <g className="furby__ear furby__ear--l" style={{ transformOrigin: '62px 78px' }}>
        <path d="M62 80 C 20 40, 14 10, 44 22 C 62 30, 72 56, 72 78 Z" fill={palette.fur} stroke="#05060f" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M60 70 C 40 48, 36 30, 48 32 C 58 36, 64 54, 64 70 Z" fill={palette.earInner} />
      </g>
      <g className="furby__ear furby__ear--r" style={{ transformOrigin: '158px 78px' }}>
        <path d="M158 80 C 200 40, 206 10, 176 22 C 158 30, 148 56, 148 78 Z" fill={palette.fur} stroke="#05060f" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M160 70 C 180 48, 184 30, 172 32 C 162 36, 156 54, 156 70 Z" fill={palette.earInner} />
      </g>

      {/* body */}
      <g filter="url(#fur-edge)">
        <ellipse cx="110" cy="140" rx="82" ry="94" fill="url(#fur-shade)" stroke="#05060f" strokeWidth="4" />
      </g>
      <ellipse cx="110" cy="176" rx="52" ry="50" fill="url(#belly-shade)" stroke="#05060f" strokeWidth="3" />

      {/* tuft */}
      <path d="M104 48 Q 98 26 84 18 M110 46 Q 110 22 106 8 M116 48 Q 124 26 138 20" fill="none" stroke="#05060f" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M104 48 Q 98 26 84 18 M110 46 Q 110 22 106 8 M116 48 Q 124 26 138 20" fill="none" stroke={palette.fur} strokeWidth="1.5" strokeLinecap="round" />

      {/* eyes */}
      <Eye cx={84} cy={112} id="l" palette={palette} />
      <Eye cx={136} cy={112} id="r" palette={palette} />

      {/* beak */}
      <path d="M110 138 L 93 152 Q 110 172 127 152 Z" fill={palette.beak} stroke="#05060f" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M96 153 Q 110 160 124 153" fill="none" stroke="#05060f" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="103" cy="146" rx="3" ry="2" fill="#fff" opacity="0.7" />
    </svg>
  )
}
