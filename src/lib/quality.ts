/**
 * Progressive enhancement:
 *   full     SVG + Motion + WebGL atmosphere
 *   standard SVG + Motion + CSS stars
 *   reduced  static chart, opacity transitions only
 */
export type Quality = 'full' | 'standard' | 'reduced'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function detectQuality(): Quality {
  const forced = import.meta.env.VITE_QUALITY as Quality | undefined
  if (forced === 'full' || forced === 'standard' || forced === 'reduced') return forced
  if (prefersReducedMotion()) return 'reduced'
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }) : undefined
  const memory = nav?.deviceMemory ?? 4
  const saveData = nav?.connection?.saveData ?? false
  const cores = nav?.hardwareConcurrency ?? 4
  if (webglAvailable() && memory >= 3 && cores >= 4 && !saveData) return 'full'
  return 'standard'
}
