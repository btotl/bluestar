import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BirthRecord as ServerBirthRecord } from '../api/types'
import type { NatalChart } from '../astro/types'
import { createBirthRecord, freezeBirthRecord, type BirthRecord } from '../birth/birthRecord'
import type { PortraitRef } from '../portrait/types'

export interface Furby {
  id: string
  /** Renamable. The name at birth lives in birth.furbyName. */
  name: string
  owner: string
  /** The canonical, immutable Birth object. Everything astrological derives from it. */
  readonly birth: BirthRecord
  createdAtUtc: string
  /** All portraits, oldest first. birth.portrait is the locked Birth Portrait. */
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

/** Shape persisted by the first release, before the canonical BirthRecord. */
interface LegacyFurby {
  id: string
  name: string
  owner: string
  birth: ServerBirthRecord
  chart: NatalChart
  createdAtUtc: string
  birthPortraitId?: string
  portraits?: PortraitRef[]
}

function migrateLegacy(f: LegacyFurby): Furby {
  const portrait = f.portraits?.find((p) => p.id === f.birthPortraitId) ?? f.portraits?.find((p) => p.kind === 'birth')
  return {
    id: f.id,
    name: f.name,
    owner: f.owner ?? '',
    birth: createBirthRecord(f.birth, portrait),
    createdAtUtc: f.createdAtUtc,
    portraits: f.portraits,
  }
}

export const useFurbyStore = create<FurbyState>()(
  persist(
    (set) => ({
      furbys: {},
      order: [],
      addFurby: (furby) =>
        set((s) => ({
          furbys: { ...s.furbys, [furby.id]: { ...furby, birth: freezeBirthRecord(furby.birth) } },
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
          if (ref.kind === 'birth') return s
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
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { furbys: Record<string, unknown>; order: string[] }
        if (version < 2) {
          const furbys: Record<string, Furby> = {}
          for (const [id, raw] of Object.entries(state.furbys ?? {})) {
            try {
              furbys[id] = migrateLegacy(raw as LegacyFurby)
            } catch {
              /* a record that cannot be rebuilt is dropped rather than shown wrong */
            }
          }
          return { furbys, order: (state.order ?? []).filter((id) => furbys[id]) }
        }
        return state as unknown as FurbyState
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        for (const f of Object.values(state.furbys)) freezeBirthRecord(f.birth)
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
