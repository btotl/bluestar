/**
 * Pure raster helpers over plain RGBA buffers. No DOM, so they are unit-testable
 * in node and can later move into a worker untouched.
 */

export interface Raster {
  width: number
  height: number
  /** RGBA, row-major, straight (non-premultiplied) alpha. */
  data: Uint8ClampedArray
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Zero out near-transparent noise so faint background does not survive as haze. */
export function cleanAlpha(r: Raster, threshold = 10): void {
  const d = r.data
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < threshold) d[i] = 0
  }
}

/** Fraction of pixels with alpha above `min`. */
export function coverage(r: Raster, min = 128): number {
  const d = r.data
  let n = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > min) n++
  return n / (r.width * r.height)
}

/** Tight bounding box of pixels with alpha above `min`, or null when empty. */
export function alphaBounds(r: Raster, min = 24): Box | null {
  const { width, height, data } = r
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    const row = y * width * 4
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] > min) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/** Grow a box by a fraction of its larger side, clamped to the raster. */
export function padBox(box: Box, fraction: number, width: number, height: number): Box {
  const pad = Math.round(Math.max(box.width, box.height) * fraction)
  const x = Math.max(0, box.x - pad)
  const y = Math.max(0, box.y - pad)
  const right = Math.min(width, box.x + box.width + pad)
  const bottom = Math.min(height, box.y + box.height + pad)
  return { x, y, width: right - x, height: bottom - y }
}

/**
 * Defringe: semi-transparent edge pixels usually carry the background colour
 * mixed in, which shows as a halo on a dark page. Pull each edge pixel's colour
 * toward the average of its solid neighbours. Operates in place, 1 pass.
 */
export function defringe(r: Raster, radius = 2, solid = 200): void {
  const { width, height } = r
  const src = r.data
  const out = new Uint8ClampedArray(src)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const a = src[i + 3]
      if (a === 0 || a >= solid) continue
      let rr = 0
      let gg = 0
      let bb = 0
      let n = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= height) continue
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= width) continue
          const j = (yy * width + xx) * 4
          if (src[j + 3] >= solid) {
            rr += src[j]
            gg += src[j + 1]
            bb += src[j + 2]
            n++
          }
        }
      }
      if (n === 0) continue
      // The weaker the pixel, the more it should borrow from solid fur.
      const w = 1 - a / solid
      out[i] = src[i] * (1 - w) + (rr / n) * w
      out[i + 1] = src[i + 1] * (1 - w) + (gg / n) * w
      out[i + 2] = src[i + 2] * (1 - w) + (bb / n) * w
    }
  }
  r.data.set(out)
}

/** Rough "is this alpha rough?" heuristic: many isolated semi-transparent islands. */
export function looksImperfect(r: Raster): boolean {
  const { width, height, data } = r
  let edge = 0
  let solid = 0
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i]
    if (a >= 250) solid++
    else if (a > 5) edge++
  }
  if (solid === 0) return true
  // A clean cutout has a thin edge band; more than ~35% edge is mushy.
  return edge / (solid + edge) > 0.35 || solid / (width * height) < 0.02
}
