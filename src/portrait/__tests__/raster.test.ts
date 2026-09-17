import { describe, expect, it } from 'vitest'
import { alphaBounds, cleanAlpha, coverage, defringe, keepMainComponents, looksImperfect, looksLikeNothing, padBox, type Raster } from '../raster'

function raster(width: number, height: number, fill: (x: number, y: number) => [number, number, number, number]): Raster {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fill(x, y)
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a
    }
  }
  return { width, height, data }
}

describe('raster helpers', () => {
  it('cleans faint alpha noise', () => {
    const r = raster(4, 1, (x) => [0, 0, 0, [0, 5, 9, 200][x]])
    cleanAlpha(r)
    expect(Array.from(r.data.filter((_, i) => i % 4 === 3))).toEqual([0, 0, 0, 200])
  })

  it('measures coverage and bounds of the opaque region', () => {
    const r = raster(10, 10, (x, y) => [0, 0, 0, x >= 2 && x < 6 && y >= 3 && y < 8 ? 255 : 0])
    expect(coverage(r)).toBeCloseTo(0.2, 6)
    expect(alphaBounds(r)).toEqual({ x: 2, y: 3, width: 4, height: 5 })
    expect(alphaBounds(raster(3, 3, () => [0, 0, 0, 0]))).toBeNull()
  })

  it('pads a box without leaving the raster', () => {
    expect(padBox({ x: 0, y: 0, width: 10, height: 10 }, 0.2, 100, 100)).toEqual({ x: 0, y: 0, width: 12, height: 12 })
    expect(padBox({ x: 95, y: 95, width: 5, height: 5 }, 0.5, 100, 100)).toEqual({ x: 92, y: 92, width: 8, height: 8 })
  })

  it('pulls halo colour on edge pixels toward the solid fur colour', () => {
    // Solid fur is grey (120,120,120); edge pixel is contaminated with white background.
    const r = raster(5, 1, (x) => (x < 3 ? [120, 120, 120, 255] : x === 3 ? [250, 250, 250, 60] : [0, 0, 0, 0]))
    defringe(r, 2)
    const i = 3 * 4
    expect(r.data[i]).toBeLessThan(200)
    expect(r.data[i]).toBeGreaterThan(120)
    expect(r.data[i + 3]).toBe(60) // alpha untouched
    expect(r.data[0]).toBe(120) // solid untouched
  })

  it('flags a mushy alpha as imperfect and a crisp one as fine', () => {
    const crisp = raster(20, 20, (x, y) => [0, 0, 0, x > 2 && x < 17 && y > 2 && y < 17 ? 255 : 0])
    expect(looksImperfect(crisp)).toBe(false)
    const mushy = raster(20, 20, (x, y) => [0, 0, 0, (x + y) % 3 === 0 ? 255 : 90])
    expect(looksImperfect(mushy)).toBe(true)
  })

  it('keeps the body with attached ears and drops disconnected faint islands', () => {
    // 40x40: a 16x16 body at (10,10), a 4x6 "ear" touching its top, a 2x2 island at (32,32)
    // and a faint smear (alpha 30) at (2..6, 20..30) away from everything.
    const r = raster(40, 40, (x, y) => {
      const body = x >= 10 && x < 26 && y >= 10 && y < 26
      const ear = x >= 12 && x < 16 && y >= 4 && y < 10
      const island = x >= 32 && x < 34 && y >= 32 && y < 34
      const smear = x >= 2 && x < 7 && y >= 20 && y < 31
      return [0, 0, 0, body || ear ? 255 : island ? 255 : smear ? 30 : 0]
    })
    const kept = keepMainComponents(r)
    expect(kept).toBe(1)
    const a = (x: number, y: number) => r.data[(y * 40 + x) * 4 + 3]
    expect(a(15, 15)).toBe(255) // body
    expect(a(13, 5)).toBe(255) // ear stays attached
    expect(a(33, 33)).toBe(0) // island gone
    expect(a(4, 25)).toBe(0) // smear gone
  })

  it('keeps faint fur pixels that hug the body edge', () => {
    const r = raster(20, 20, (x, y) => {
      const body = x >= 5 && x < 15 && y >= 5 && y < 15
      const fuzz = x === 4 && y >= 5 && y < 15 // 1 px soft edge left of the body
      return [0, 0, 0, body ? 255 : fuzz ? 25 : 0]
    })
    keepMainComponents(r)
    expect(r.data[(10 * 20 + 4) * 4 + 3]).toBe(25)
  })

  it('calls a frame-filling cloud of half-alpha noise nothing, and a solid shape something', () => {
    const cloud = raster(40, 40, (x, y) => [0, 0, 0, (x * 7 + y * 13) % 5 === 0 ? 255 : 60 + ((x + y) % 90)])
    expect(looksLikeNothing(cloud)).toBe(true)
    // Solid furry blob with a soft 2 px rim, not touching the frame edges.
    const furby = raster(60, 60, (x, y) => {
      const d = Math.hypot(x - 30, y - 30)
      return [0, 0, 0, d < 20 ? 255 : d < 22 ? 120 : 0]
    })
    expect(looksLikeNothing(furby)).toBe(false)
    expect(looksLikeNothing(raster(10, 10, () => [0, 0, 0, 0]))).toBe(true)
  })
})
