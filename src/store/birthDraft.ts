import type { BirthLocation } from '../api/types'
import type { PortraitRef } from '../portrait/types'

/**
 * The in-progress Birth, kept in sessionStorage so a refresh mid-ritual does
 * not lose the name, the place or the portrait. Nothing here is a birth: the
 * server still stamps the moment when Confirm Birth arrives.
 */
export interface BirthDraft {
  name: string
  location: BirthLocation
  moment: { mode: 'moment' } | { mode: 'chosen'; utcIso: string }
  portraitId?: string
  portrait?: Omit<PortraitRef, 'id' | 'kind' | 'locked'>
  /** Idempotency key for the confirm request; minted when the card opens. */
  clientRequestId?: string
  updatedAtUtc: string
}

const KEY = 'bluestar.birthDraft.v1'

export function loadBirthDraft(): BirthDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as BirthDraft
    if (!d || typeof d.name !== 'string' || !d.location) return null
    return d
  } catch {
    return null
  }
}

export function saveBirthDraft(draft: Omit<BirthDraft, 'updatedAtUtc'>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAtUtc: new Date().toISOString() }))
  } catch {
    /* private mode: the draft simply does not survive a refresh */
  }
}

export function clearBirthDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function newClientRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
