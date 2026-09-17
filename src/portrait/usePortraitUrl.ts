import { useEffect, useState } from 'react'
import { portraitUrl } from './portraitDb'
import type { PortraitSize } from './types'

export type PortraitUrlState = { status: 'idle' | 'loading' | 'ready' | 'missing'; url: string | null }

interface Tracked extends PortraitUrlState {
  key: string
}

/** Loads a stored portrait as an object URL. `missing` means fall back to the sprite. */
export function usePortraitUrl(id: string | undefined, size: PortraitSize): PortraitUrlState {
  const key = id ? `${id}:${size}` : ''
  const [tracked, setTracked] = useState<Tracked>({ key, status: id ? 'loading' : 'idle', url: null })

  useEffect(() => {
    if (!id) return
    let alive = true
    portraitUrl(id, size).then((url) => {
      if (!alive) return
      setTracked({ key, status: url ? 'ready' : 'missing', url })
    })
    return () => {
      alive = false
    }
  }, [id, size, key])

  // Derive during render: a new id is "loading" until its own result arrives.
  if (tracked.key !== key) return { status: id ? 'loading' : 'idle', url: null }
  return { status: tracked.status, url: tracked.url }
}
