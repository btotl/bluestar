import type { PortraitProcessor } from '../types'
import { HttpProcessor } from './http'
import { ImglyProcessor } from './imgly'
import { PassthroughProcessor } from './passthrough'

export { HttpProcessor, ImglyProcessor, PassthroughProcessor }

/**
 * Provider selection, in one place:
 *   VITE_PORTRAIT_PROCESSOR = imgly (default) | http | none
 *   VITE_PORTRAIT_API_URL   = base URL for the http provider
 *   VITE_PORTRAIT_MODEL     = isnet | isnet_fp16 | isnet_quint8
 *   VITE_PORTRAIT_ASSETS    = self-hosted publicPath for the imgly model files
 */
export function createPortraitProcessor(): PortraitProcessor {
  const env = import.meta.env
  const kind = (env.VITE_PORTRAIT_PROCESSOR as string | undefined) ?? 'imgly'
  if (kind === 'none') return new PassthroughProcessor()
  if (kind === 'http') {
    const url = env.VITE_PORTRAIT_API_URL as string | undefined
    if (!url) throw new Error('VITE_PORTRAIT_API_URL is required for the http portrait processor')
    return new HttpProcessor(url)
  }
  const model = env.VITE_PORTRAIT_MODEL as 'isnet' | 'isnet_fp16' | 'isnet_quint8' | undefined
  return new ImglyProcessor({ model, publicPath: env.VITE_PORTRAIT_ASSETS as string | undefined })
}

export const portraitProcessor: PortraitProcessor = createPortraitProcessor()
export const uncutProcessor: PortraitProcessor = new PassthroughProcessor()
