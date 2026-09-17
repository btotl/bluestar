import type { PortraitProcessor } from '../types'

/**
 * Keeps the photo as it is. Used when the owner chooses "use the photo uncut"
 * after segmentation fails, and as the provider for environments with no
 * model available. Never the default.
 */
export class PassthroughProcessor implements PortraitProcessor {
  readonly id = 'passthrough'
  readonly label = 'Uncut photo'
  readonly runsOnDevice = true
  readonly producesAlpha = false

  async removeBackground(input: Blob): Promise<Blob> {
    return input
  }
}
