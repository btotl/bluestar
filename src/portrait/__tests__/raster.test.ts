import { describe, expect, it } from 'vitest'
import { alphaBounds, cleanAlpha, coverage, defringe, looksImperfect, padBox, type Raster } from '../raster'

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
})
