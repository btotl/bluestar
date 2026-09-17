import { useMemo } from 'react'
import './CelestialBackdrop.css'

interface Props {
  /** Stars per 10,000 px²; ordinary screens stay sparse. */
  density?: number
  /** 0..1, lifts star brightness (the moment the sky is illuminated). */
  brightness?: number
  seed?: number
  className?: string
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A sparse star field made of CSS radial gradients on two fixed layers.
 * No canvas, no per-star DOM nodes, no animation loop: the only movement
 * is three twinkling sparks on the compositor.
 */
export function CelestialBackdrop({ density = 0.55, brightness = 1, seed = 7, className = '' }: Props) {
  const layers = useMemo(() => {
    const rnd = mulberry32(seed)
    const make = (count: number, tint: string, sizePx: number) => {
      const stops: string[] = []
      for (let i = 0; i < count; i++) {
        const x = (rnd() * 100).toFixed(2)
        const y = (rnd() * 100).toFixed(2)
        const s = sizePx * (0.6 + rnd() * 0.8)
        stops.push(`radial-gradient(${s.toFixed(1)}px ${s.toFixed(1)}px at ${x}% ${y}%, ${tint} 0 45%, transparent 55%)`)
      }
      return stops.join(',')
    }
    const n = Math.round(60 * density)
    return {
      far: make(n, 'rgba(255, 244, 204, 0.55)', 1.4),
      near: make(Math.round(n / 3), 'rgba(255, 216, 77, 0.85)', 2.2),
    }
  }, [density, seed])

  return (
    <div className={`backdrop ${className}`} aria-hidden="true" style={{ ['--bd-bright' as string]: brightness }}>
      <div className="backdrop__layer backdrop__layer--far" style={{ backgroundImage: layers.far }} />
      <div className="backdrop__layer backdrop__layer--near" style={{ backgroundImage: layers.near }} />
      <i className="backdrop__spark" style={{ top: '18%', left: '22%' }} />
      <i className="backdrop__spark" style={{ top: '64%', left: '81%', animationDelay: '1.4s' }} />
      <i className="backdrop__spark" style={{ top: '86%', left: '30%', animationDelay: '2.6s' }} />
    </div>
  )
}
