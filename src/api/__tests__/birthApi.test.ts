import { beforeEach, describe, expect, it } from 'vitest'
import { LocalBirthServer } from '../birthApi'
import type { BirthRequest } from '../types'

const mem = new Map<string, string>()
beforeEach(() => {
  mem.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
    },
  })
})

const req: BirthRequest = {
  name: 'Mimi',
  clientRequestId: 'req-1',
  location: { name: 'Bellingen', region: 'NSW', country: 'Australia', latitude: -30.45, longitude: 152.9, timeZone: 'Australia/Sydney' },
}

describe('LocalBirthServer', () => {
  it('stamps the moment on receipt and issues sequential certificates', async () => {
    const api = new LocalBirthServer(0)
    const before = Date.now()
    const a = await api.confirmBirth(req)
    const after = Date.now()
    expect(new Date(a.timestampUtc).getTime()).toBeGreaterThanOrEqual(before)
    expect(new Date(a.timestampUtc).getTime()).toBeLessThanOrEqual(after)
    expect(a.mode).toBe('moment')
    expect(a.certificateNumber).toBe(1)
    const b = await api.confirmBirth({ ...req, clientRequestId: 'req-2' })
    expect(b.certificateNumber).toBe(2)
  })

  it('returns the same birth for a repeated client request id', async () => {
    const api = new LocalBirthServer(0)
    const a = await api.confirmBirth(req)
    const b = await api.confirmBirth(req)
    expect(b.furbyId).toBe(a.furbyId)
    expect(b.certificateNumber).toBe(a.certificateNumber)
    expect(b.timestampUtc).toBe(a.timestampUtc)
  })

  it('carries the birth portrait id and refuses future moments', async () => {
    const api = new LocalBirthServer(0)
    const a = await api.confirmBirth({ ...req, clientRequestId: 'req-3', birthPortraitId: 'p-1' })
    expect(a.birthPortraitId).toBe('p-1')
    await expect(
      api.confirmBirth({ ...req, clientRequestId: 'req-4', requestedMomentUtc: new Date(Date.now() + 86400000).toISOString() }),
    ).rejects.toThrow(/future/)
  })
})
