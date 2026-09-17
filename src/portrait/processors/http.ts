import type { PortraitProcessor, RemoveBackgroundOptions } from '../types'

/**
 * Remote segmentation, e.g. a small `rembg` service. Contract:
 *   POST {baseUrl}/api/portraits/segment   body: image/jpeg or image/png
 *   → 200 image/png with alpha
 * The service must not store the upload beyond the request.
 */
export class HttpProcessor implements PortraitProcessor {
  readonly id = 'http'
  readonly label = 'Birth portrait service'
  readonly runsOnDevice = false
  readonly producesAlpha = true
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async removeBackground(input: Blob, options: RemoveBackgroundOptions = {}): Promise<Blob> {
    options.onProgress?.('separating', 0)
    const res = await fetch(`${this.baseUrl}/api/portraits/segment`, {
      method: 'POST',
      headers: { 'content-type': input.type || 'application/octet-stream' },
      body: input,
      signal: options.signal,
    })
    if (!res.ok) throw new Error(`The portrait service refused the photo (${res.status}).`)
    const out = await res.blob()
    options.onProgress?.('separating', 1)
    return out
  }
}
