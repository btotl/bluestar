import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BirthRecord } from '../api/types'
import type { NatalChart } from '../astro/types'
import type { PortraitRef } from '../portrait/types'

export interface Furby {
  id: string
  /** Renamable. The name at birth lives in birth.name. */
  name: string
  owner: string
  /** Immutable once written. */
  readonly birth: Readonly<BirthRecord>
  /** Derived from birth; cached so the certificate renders instantly. */
  readonly chart: Readonly<NatalChart>
  createdAtUtc: string
  /**
   * The Birth Portrait, if one was taken. Optional so Furbys born before
   * portraits existed keep working and fall back to the drawn sprite.
   */
  readonly birthPortraitId?: string
  /** All portraits, oldest first. The birth portrait is locked and never replaced. */
  portraits?: PortraitRef[]
}

interface FurbyState {
  furbys: Record<string, Furby>
  order: string[]
  addFurby: (furby: Furby) => void
  renameFurby: (id: string, name: string) => void
  setOwner: (id: string, owner: string) => void
  /** Removes the local copy only; the birth record persists on the server. */
  forgetFurby: (id: string) => void
  /** Adds a later portrait. A second 'birth' portrait is refused. */
  addPortrait: (id: string, ref: PortraitRef) => void
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v)
  }
  return value
}

export const useFurbyStore = create<FurbyState>()(
  persist(
    (set) => ({
      furbys: {},
      order: [],
      addFurby: (furby) =>
        set((s) => ({
          furbys: { ...s.furbys, [furby.id]: { ...furby, birth: deepFreeze(furby.birth), chart: deepFreeze(furby.chart) } },
          order: s.order.includes(furby.id) ? s.order : [...s.order, furby.id],
        })),
      renameFurby: (id, name) =>
        set((s) => {
          const f = s.furbys[id]
          if (!f) return s
          const clean = name.trim()
          if (!clean) return s
          return { furbys: { ...s.furbys, [id]: { ...f, name: clean } } }
        }),
      setOwner: (id, owner) =>
        set((s) => {
          const f = s.furbys[id]
          if (!f) return s
          return { furbys: { ...s.furbys, [id]: { ...f, owner: owner.trim() } } }
        }),
      addPortrait: (id, ref) =>
        set((s) => {
          const f = s.furbys[id]
          if (!f) return s
          if (ref.kind === 'birth' && f.birthPortraitId) return s
          const portraits = [...(f.portraits ?? []), ref]
          return { furbys: { ...s.furbys, [id]: { ...f, portraits } } }
        }),
      forgetFurby: (id) =>
        set((s) => {
          const rest = { ...s.furbys }
          delete rest[id]
          return { furbys: rest, order: s.order.filter((x) => x !== id) }
        }),
    }),
    {
      name: 'bluestar.furbys.v1',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        for (const f of Object.values(state.furbys)) {
          deepFreeze(f.birth)
          deepFreeze(f.chart)
        }
      },
    },
  ),
)

export function useFurby(id: string | undefined): Furby | undefined {
  return useFurbyStore((s) => (id ? s.furbys[id] : undefined))
}

export function formatCertificateNumber(n: number): string {
  return `№ ${String(n).padStart(6, '0')}`
}
