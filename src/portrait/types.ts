/**
 * Furby Birth Portrait types.
 *
 * A portrait is a transparent cutout of the user's real, physical Furby. The
 * heavy image data lives in IndexedDB as a PortraitAsset; the Furby record only
 * carries a small PortraitRef so the persisted store stays tiny.
 */

export type PortraitKind = 'birth' | 'later'
/** Reserved for future front/left/right portraits. */
export type PortraitView = 'front' | 'left' | 'right'
export type PortraitSize = 'master' | 'ui' | 'thumb'

export interface PortraitRef {
  id: string
  kind: PortraitKind
  view: PortraitView
  createdAtUtc: string
  /** Master pixel dimensions, for layout before the blob loads. */
  width: number
  height: number
  /** Which processor produced the cutout, e.g. "imgly-isnet". */
  processor: string
  /** True for the Birth Portrait: it is part of the historical record. */
  locked: boolean
  /** The processor could not separate the Furby and the owner approved the uncut photo. */
  uncut?: boolean
}

export interface PortraitAsset {
  id: string
  createdAtUtc: string
  processor: string
  width: number
  height: number
  mimeType: string
  /** Transparent cutout, long edge ≤ 1600 px. Canonical. */
  master: Blob
  /** Long edge ≤ 800 px, for profile and cards. */
  ui: Blob
  /** Long edge ≤ 240 px, for lists and chips. */
  thumb: Blob
  /**
   * The oriented, EXIF-stripped, downscaled source photo. Kept only while the
   * portrait is a draft so "try this photo again" can re-run; dropped at Birth.
   */
  source?: Blob
  uncut?: boolean
}

export type ProcessingStage = 'finding' | 'separating' | 'preparing'

export type ProgressFn = (stage: ProcessingStage, fraction: number) => void

export interface RemoveBackgroundOptions {
  onProgress?: ProgressFn
  signal?: AbortSignal
}

/**
 * Anything that can turn a photo into a transparent cutout. Implementations
 * must not read or keep EXIF, and must not use the image for anything else.
 */
export interface PortraitProcessor {
  readonly id: string
  readonly label: string
  readonly runsOnDevice: boolean
  /** False for the passthrough provider, which returns the photo unchanged. */
  readonly producesAlpha: boolean
  /** Optional model download / warm-up so the first capture is not slow. */
  warmUp?(onProgress?: ProgressFn): Promise<void>
  /** Input: an RGB JPEG/PNG already oriented and downscaled. Output: PNG with alpha. */
  removeBackground(input: Blob, options?: RemoveBackgroundOptions): Promise<Blob>
}

export interface ProcessDiagnostics {
  processor: string
  /** Fraction of the source frame the Furby occupies after segmentation. */
  coverage: number
  durationMs: number
  /** True when the result is usable but the alpha looks rough. */
  imperfect: boolean
}

export interface ProcessResult {
  asset: PortraitAsset
  diagnostics: ProcessDiagnostics
}

export class PortraitNotFoundError extends Error {
  readonly coverage: number
  constructor(coverage: number) {
    super("We couldn't quite find your Furby")
    this.name = 'PortraitNotFoundError'
    this.coverage = coverage
  }
}
