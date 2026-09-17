import type { BirthApi, BirthRecord, BirthRequest } from './types'

const SEQ_KEY = 'bluestar.birth.sequence'
const REQUESTS_KEY = 'bluestar.birth.requests'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `furby-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Stand-in for the birth service while there is no backend. It behaves the
 * way the real one must: the birth instant is read from the clock inside
 * confirmBirth(), at the moment the confirmation "arrives", not when the
 * page loaded or when the user first pressed Birth.
 */
export class LocalBirthServer implements BirthApi {
  private readonly latencyMs: number

  constructor(latencyMs = 350) {
    this.latencyMs = latencyMs
  }

  private nextCertificateNumber(): number {
    let seq = 0
    try {
      seq = Number(localStorage.getItem(SEQ_KEY) ?? '0')
      if (!Number.isFinite(seq)) seq = 0
    } catch {
      seq = 0
    }
    seq += 1
    try {
      localStorage.setItem(SEQ_KEY, String(seq))
    } catch {
      /* private mode etc. — the number is still issued */
    }
    return seq
  }

  private readRequests(): Record<string, BirthRecord> {
    try {
      return JSON.parse(localStorage.getItem(REQUESTS_KEY) ?? '{}') as Record<string, BirthRecord>
    } catch {
      return {}
    }
  }

  private remember(id: string, record: BirthRecord): void {
    try {
      const all = this.readRequests()
      all[id] = record
      // Keep the map small; only recent requests can plausibly be retried.
      const keys = Object.keys(all)
      for (const k of keys.slice(0, Math.max(0, keys.length - 20))) delete all[k]
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(all))
    } catch {
      /* ignore */
    }
  }

  async confirmBirth(request: BirthRequest): Promise<BirthRecord> {
    // Simulate the request travelling to the server.
    await new Promise((r) => setTimeout(r, this.latencyMs))
    // Same client request id → same birth. Never two Furbys from one tap.
    const existing = request.clientRequestId ? this.readRequests()[request.clientRequestId] : undefined
    if (existing) return existing
    const receivedAt = new Date()
    const name = request.name.trim()
    if (!name) throw new Error('A Furby needs a name before it can be born.')
    if (request.requestedMomentUtc && new Date(request.requestedMomentUtc).getTime() > receivedAt.getTime()) {
      throw new Error('A Furby cannot be born in the future.')
    }
    const timestampUtc = request.requestedMomentUtc
      ? new Date(request.requestedMomentUtc).toISOString()
      : receivedAt.toISOString()
    const record: BirthRecord = {
      furbyId: newId(),
      certificateNumber: this.nextCertificateNumber(),
      name,
      timestampUtc,
      mode: request.requestedMomentUtc ? 'chosen' : 'moment',
      location: { ...request.location },
      recordedAtUtc: receivedAt.toISOString(),
      birthPortraitId: request.birthPortraitId,
    }
    if (request.clientRequestId) this.remember(request.clientRequestId, record)
    return record
  }
}

/** Real client for the contract documented in docs/birth-flow.md. */
export class HttpBirthServer implements BirthApi {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async confirmBirth(request: BirthRequest): Promise<BirthRecord> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/furbys/birth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error(`Birth service refused the request (${res.status})`)
    return (await res.json()) as BirthRecord
  }
}

export function createBirthApi(): BirthApi {
  const url = import.meta.env.VITE_BIRTH_API_URL as string | undefined
  return url ? new HttpBirthServer(url) : new LocalBirthServer()
}

export const birthApi: BirthApi = createBirthApi()
