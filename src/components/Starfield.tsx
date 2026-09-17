import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  phase: number
  speed: number
  tint: string
  cross: boolean
  born: number
}

interface Props {
  /** Stars per 10,000 CSS pixels. */
  density?: number
  /** Extra stars that fade in (used when the ritual intensifies). */
  burst?: number
  className?: string
  /** 0..1, multiplies every star's brightness */
  brightness?: number
}

const TINTS = ['#fff4cc', '#ffd84d', '#ffffff', '#c9d2ff']

function makeStar(w: number, h: number, now: number, big = false): Star {
  const cross = Math.random() < (big ? 0.5 : 0.08)
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: cross ? 3 + Math.random() * 3 : Math.random() < 0.7 ? 1 : 2,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 1.4,
    tint: TINTS[Math.floor(Math.random() * TINTS.length)],
    cross,
    born: now,
  }
}

/** A canvas of faint pixel stars with slow twinkle. Purely decorative. */
export function Starfield({ density = 1.1, burst = 0, className, brightness = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const burstRef = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.floor((w * h) / 10000 * density)
      const now = performance.now()
      const stars = starsRef.current
      while (stars.length < target) stars.push(makeStar(w, h, now - 10000))
      if (stars.length > target * 1.5) stars.length = target
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const s of starsRef.current) {
        const age = Math.min(1, (now - s.born) / 900)
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(s.phase + (now / 1000) * s.speed))
        ctx.globalAlpha = Math.max(0, Math.min(1, tw * age * brightness))
        ctx.fillStyle = s.tint
        if (s.cross) {
          const half = s.size
          ctx.fillRect(s.x - half, s.y - 0.5, half * 2, 1)
          ctx.fillRect(s.x - 0.5, s.y - half, 1, half * 2)
          ctx.fillRect(s.x - 1, s.y - 1, 2, 2)
        } else {
          ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size)
        }
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [density, brightness])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || burst <= burstRef.current) {
      burstRef.current = burst
      return
    }
    const rect = canvas.getBoundingClientRect()
    const now = performance.now()
    const toAdd = burst - burstRef.current
    burstRef.current = burst
    let i = 0
    const timer = setInterval(() => {
      starsRef.current.push(makeStar(rect.width, rect.height, performance.now(), true))
      if (++i >= toAdd) clearInterval(timer)
    }, 60)
    void now
    return () => clearInterval(timer)
  }, [burst])

  return <canvas ref={ref} className={className} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}
