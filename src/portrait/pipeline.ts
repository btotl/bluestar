import {
  MASTER_MAX,
  THUMB_MAX,
  UI_MAX,
  blobToCanvas,
  canvasToRaster,
  decodeOriented,
  encodeOpaque,
  encodeTransparent,
  rasterToCanvas,
  resizeCanvas,
} from './imageUtils'
import { alphaBounds, cleanAlpha, coverage, defringe, looksImperfect, padBox } from './raster'
import { PortraitNotFoundError, type PortraitAsset, type PortraitProcessor, type ProcessResult, type ProgressFn } from './types'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Below this share of the frame the model found nothing worth calling a Furby. */
const MIN_COVERAGE = 0.012
/** Above this the model kept the background too; nothing was separated. */
const MAX_COVERAGE = 0.96
/** Breathing room around the cutout so ears and feet are never clipped. */
const CROP_PAD = 0.06

export interface ProcessOptions {
  onProgress?: ProgressFn
  signal?: AbortSignal
  /** A previously prepared source (from a failed attempt), skips decode. */
  preparedSource?: Blob
}

/**
 * capture → oriented, metadata-free source → segmentation → alpha clean-up →
 * auto-crop → master / ui / thumb derivatives.
 */
export async function processCapture(file: Blob, processor: PortraitProcessor, options: ProcessOptions = {}): Promise<ProcessResult> {
  const started = performance.now()
  const progress = options.onProgress ?? (() => {})
  const throwIfAborted = () => {
    if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  }

  progress('finding', 0)
  let source = options.preparedSource
  if (!source) {
    const oriented = await decodeOriented(file, MASTER_MAX)
    source = await encodeOpaque(oriented, 0.92)
  }
  throwIfAborted()

  const cutoutBlob = await processor.removeBackground(source, { onProgress: progress, signal: options.signal })
  throwIfAborted()
  progress('preparing', 0)

  const cutoutCanvas = await blobToCanvas(cutoutBlob)
  const raster = canvasToRaster(cutoutCanvas)

  let box = { x: 0, y: 0, width: raster.width, height: raster.height }
  let imperfect = false
  let cov = 1
  if (processor.producesAlpha) {
    cleanAlpha(raster)
    cov = coverage(raster)
    if (cov < MIN_COVERAGE || cov > MAX_COVERAGE) throw new PortraitNotFoundError(cov)
    defringe(raster)
    imperfect = looksImperfect(raster)
    const bounds = alphaBounds(raster)
    if (!bounds) throw new PortraitNotFoundError(0)
    box = padBox(bounds, CROP_PAD, raster.width, raster.height)
  }
  progress('preparing', 0.5)

  const master = resizeCanvas(rasterToCanvas(raster, box), MASTER_MAX)
  const ui = resizeCanvas(master, UI_MAX)
  const thumb = resizeCanvas(master, THUMB_MAX)
  const encode = processor.producesAlpha ? encodeTransparent : (c: HTMLCanvasElement) => encodeOpaque(c, 0.9)
  const [masterBlob, uiBlob, thumbBlob] = await Promise.all([encode(master), encode(ui), encode(thumb)])
  progress('preparing', 1)

  const asset: PortraitAsset = {
    id: newId(),
    createdAtUtc: new Date().toISOString(),
    processor: processor.id,
    width: master.width,
    height: master.height,
    mimeType: masterBlob.type,
    master: masterBlob,
    ui: uiBlob,
    thumb: thumbBlob,
    source,
    uncut: !processor.producesAlpha,
  }
  return {
    asset,
    diagnostics: { processor: processor.id, coverage: cov, durationMs: performance.now() - started, imperfect },
  }
}
