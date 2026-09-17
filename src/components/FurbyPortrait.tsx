import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { usePortraitUrl } from '../portrait/usePortraitUrl'
import type { PortraitRef, PortraitSize } from '../portrait/types'
import { FurbySprite, type EyeState } from './FurbySprite'
import { Ornament } from './Ornament'
import './FurbyPortrait.css'

export type PortraitVariant = 'profile' | 'birth' | 'certificate' | 'celestial' | 'thumbnail'

interface Props {
  /** Uses the Furby's Birth Portrait from its canonical Birth record. */
  furby?: { name: string; birth: { portrait?: PortraitRef } }
  /** Or any stored portrait id. */
  portraitId?: string
  /** Or a ready URL (review screens, before anything is saved). */
  src?: string
  variant?: PortraitVariant
  /** CSS size of the square frame. */
  size?: number | string
  glow?: boolean
  shadow?: boolean
  float?: boolean
  /** Dimmed, breathing, little z's. */
  asleep?: boolean
  /** Bright, with a one-off light sweep across the fur. */
  lit?: boolean
  /** Barely-there breathing: 3 px rise and ±0.3° over several seconds. Never deforms the photo. */
  alive?: boolean
  /** Draw the halo / orbit / frame behind the Furby. Defaults on for celestial & certificate. */
  decorative?: boolean
  /** Eye state for the fallback sprite (no portrait yet). */
  eyes?: EyeState
  animate?: boolean
  /** Shared-element id so the same portrait travels between screens. */
  layoutId?: string
  alt?: string
  className?: string
  style?: CSSProperties
}

function sizeFor(variant: PortraitVariant, size: number | string): PortraitSize {
  if (variant === 'thumbnail') return 'thumb'
  if (typeof size === 'number' && size <= 220) return 'ui'
  return 'master'
}

/**
 * The one way to show a Furby. Renders the real photographed portrait when the
 * Furby has one and falls back to the drawn sprite otherwise.
 */
export function FurbyPortrait({
  furby,
  portraitId,
  src,
  variant = 'profile',
  size = 160,
  glow,
  shadow = true,
  float,
  asleep,
  lit,
  alive,
  decorative,
  eyes,
  animate = true,
  layoutId,
  alt,
  className = '',
  style,
}: Props) {
  const id = portraitId ?? furby?.birth.portrait?.id
  const wanted = sizeFor(variant, size)
  const loaded = usePortraitUrl(src ? undefined : id, wanted)
  const url = src ?? loaded.url
  const loading = !src && loaded.status === 'loading'
  const deco = decorative ?? (variant === 'celestial' || variant === 'certificate' || variant === 'birth')
  const eyeState: EyeState = eyes ?? (asleep ? 'closed' : 'open')

  const cls = [
    'fp',
    `fp--${variant}`,
    glow ?? lit ? 'fp--glow' : '',
    shadow ? 'fp--shadow' : '',
    float ? 'fp--float' : '',
    asleep ? 'fp--asleep' : '',
    lit ? 'fp--lit' : '',
    loading ? 'fp--loading' : '',
    url ? 'fp--photo' : 'fp--sprite',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const cssSize = typeof size === 'number' ? `${size}px` : size
  const mask = url ? { WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")` } : undefined

  const stage = (
    <>
      {url ? (
        <>
          <img className="fp__img" src={url} alt={alt ?? (furby ? `${furby.name}'s birth portrait` : 'Furby portrait')} draggable={false} />
          {lit && <div className="fp__sweep" style={mask} />}
        </>
      ) : loading ? (
        <div className="fp__placeholder" />
      ) : (
        <FurbySprite eyes={eyeState} lit={lit} animate={animate} size="100%" className="fp__sprite" title={alt ?? 'Furby'} />
      )}
      {asleep && (
        <div className="fp__zzz" aria-hidden="true">
          <span>z</span><span>z</span><span>z</span>
        </div>
      )}
    </>
  )

  return (
    <motion.div className={cls} style={{ ...style, ['--fp-size' as string]: cssSize }} layoutId={layoutId} layout={layoutId ? true : undefined} transition={layoutId ? { layout: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] } } : undefined}>
      {deco && (
        <div className="fp__deco" aria-hidden="true">
          <div className="fp__halo" />
          {(variant === 'celestial' || variant === 'birth') && <Ornament name="orbitalHalo" tone="line" className="fp__orbit" />}
          {variant === 'certificate' && (
            <div className="fp__frame-deco">
              <span className="fp__corner fp__corner--tl">✦</span>
              <span className="fp__corner fp__corner--tr">✦</span>
              <span className="fp__corner fp__corner--bl">✦</span>
              <span className="fp__corner fp__corner--br">✦</span>
            </div>
          )}
        </div>
      )}
      {alive ? (
        <motion.div className="fp__stage" animate={{ y: [0, -3, 0], rotate: [-0.3, 0.3, -0.3] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          {stage}
        </motion.div>
      ) : (
        <div className="fp__stage">{stage}</div>
      )}
    </motion.div>
  )
}
