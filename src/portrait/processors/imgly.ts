import type { PortraitProcessor, ProgressFn, RemoveBackgroundOptions } from '../types'

type ImglyModule = typeof import('@imgly/background-removal')

export interface ImglyOptions {
  /** Where the model and wasm files are served from. Default: img.ly's CDN. */
  publicPath?: string
  model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8'
  device?: 'cpu' | 'gpu'
}

/**
 * On-device segmentation with IS-Net via @imgly/background-removal
 * (ONNX Runtime Web). The photo never leaves the phone. The ~40–80 MB model
 * downloads once and is cached by the browser.
 *
 * Licence note: the library is AGPL-3.0. Serving it publicly means the app's
 * source must be offered under a compatible licence, or swap this provider
 * for the HTTP one (see docs/birth-portrait.md).
 */
export class ImglyProcessor implements PortraitProcessor {
  readonly id: string
  readonly label = 'On-device (IS-Net)'
  readonly runsOnDevice = true
  readonly producesAlpha = true
  private mod: Promise<ImglyModule> | null = null
  private readonly options: ImglyOptions

  constructor(options: ImglyOptions = {}) {
    this.options = options
    this.id = `imgly-${options.model ?? 'isnet_fp16'}`
  }

  private load(): Promise<ImglyModule> {
    // Lazy: keeps ONNX Runtime out of the main bundle until a photo is taken.
    if (!this.mod) this.mod = import('@imgly/background-removal')
    return this.mod
  }

  private config(onProgress?: ProgressFn) {
    return {
      publicPath: this.options.publicPath,
      model: this.options.model ?? 'isnet_fp16',
      device: this.options.device ?? 'cpu',
      output: { format: 'image/png' as const, quality: 1 },
      progress: (key: string, current: number, total: number) => {
        if (!onProgress) return
        // Asset downloads report as "fetch:<file>"; inference reports "compute:…".
        const stage = key.startsWith('compute') ? 'separating' : 'finding'
        onProgress(stage, total > 0 ? current / total : 0)
      },
    }
  }

  async warmUp(onProgress?: ProgressFn): Promise<void> {
    const mod = await this.load()
    await mod.preload(this.config(onProgress))
  }

  async removeBackground(input: Blob, options: RemoveBackgroundOptions = {}): Promise<Blob> {
    const mod = await this.load()
    options.onProgress?.('finding', 0)
    const out = await mod.removeBackground(input, this.config(options.onProgress))
    options.onProgress?.('separating', 1)
    return out
  }
}
