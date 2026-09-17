import { useEffect } from 'react'
import { useMotionValue, useSpring, type MotionValue } from 'motion/react'

export interface Parallax {
  /** −1 … 1 */
  x: MotionValue<number>
  y: MotionValue<number>
}

/**
 * A single pair of springs driven by pointer position or device tilt. Layers
 * multiply them by their own small factor (1 px far stars … 4 px Furby). No
 * React state per frame: Motion values update the transforms directly.
 */
export function useParallax(enabled: boolean): Parallax {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 40, damping: 14, mass: 0.6 })
  const y = useSpring(rawY, { stiffness: 40, damping: 14, mass: 0.6 })

  useEffect(() => {
    if (!enabled) {
      rawX.set(0)
      rawY.set(0)
      return
    }
    const onPointer = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1)
      rawY.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      rawX.set(Math.max(-1, Math.min(1, e.gamma / 25)))
      rawY.set(Math.max(-1, Math.min(1, (e.beta - 45) / 25)))
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('deviceorientation', onTilt, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('deviceorientation', onTilt)
    }
  }, [enabled, rawX, rawY])

  return { x, y }
}
