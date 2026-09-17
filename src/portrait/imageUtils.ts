import type { Raster } from './raster'

/** Long edge of the transparent master. Plenty for a phone screen and print-ish certificates. */
export const MASTER_MAX = 1600
export const UI_MAX = 800
export const THUMB_MAX = 240

/**
 * Decode any camera file through an <img>, which applies EXIF orientation in
 * every current browser, then draw to a canvas. The canvas has no metadata at
 * all, so GPS and the rest of the EXIF never reach storage.
 */
export async function decodeOriented(file: Blob, maxLongEdge = MASTER_MAX): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.decoding = 'async'
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('That file could not be read as an image.'))
      el.src = url
    })
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) throw new Error('That image is empty.')
    const scale = Math.min(1, maxLongEdge / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas unavailable')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return decodeOriented(blob, Number.POSITIVE_INFINITY)
}

export function canvasToRaster(canvas: HTMLCanvasElement): Raster {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return { width: img.width, height: img.height, data: img.data }
}

export function rasterToCanvas(r: Raster, crop?: { x: number; y: number; width: number; height: number }): HTMLCanvasElement {
  const full = document.createElement('canvas')
  full.width = r.width
  full.height = r.height
  const pixels = new Uint8ClampedArray(r.data.length)
  pixels.set(r.data)
  full.getContext('2d')!.putImageData(new ImageData(pixels, r.width, r.height), 0, 0)
  if (!crop) return full
  const out = document.createElement('canvas')
  out.width = crop.width
  out.height = crop.height
  out.getContext('2d')!.drawImage(full, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return out
}

export function resizeCanvas(src: HTMLCanvasElement, maxLongEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxLongEdge / Math.max(src.width, src.height))
  if (scale === 1) return src
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(src.width * scale))
  out.height = Math.max(1, Math.round(src.height * scale))
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, out.width, out.height)
  return out
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Encode with alpha. WebP where the browser can encode it, otherwise PNG.
 * Safari's canvas returns PNG when asked for WebP, so we check the result type.
 */
export async function encodeTransparent(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  const webp = await toBlob(canvas, 'image/webp', quality)
  if (webp && webp.type === 'image/webp') return webp
  const png = await toBlob(canvas, 'image/png')
  if (!png) throw new Error('Could not encode the portrait.')
  return png
}

export async function encodeOpaque(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
  const jpeg = await toBlob(canvas, 'image/jpeg', quality)
  if (!jpeg) throw new Error('Could not encode the photo.')
  return jpeg
}

/** Grab the current frame of a live camera <video> at native resolution. */
export async function captureVideoFrame(video: HTMLVideoElement, mirrored = false): Promise<Blob> {
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) throw new Error('The camera has not started yet.')
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  if (mirrored) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, w, h)
  return encodeOpaque(canvas, 0.95)
}
