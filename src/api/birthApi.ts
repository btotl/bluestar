import type { BirthApi, BirthRecord, BirthRequest } from './types'

const SEQ_KEY = 'bluestar.birth.sequence'

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

  async confirmBirth(request: BirthRequest): Promise<BirthRecord> {
    // Simulate the request travelling to the server.
    await new Promise((r) => setTimeout(r, this.latencyMs))
    const receivedAt = new Date()
    const name = request.name.trim()
    if (!name) throw new Error('A Furby needs a name before it can be born.')
    const timestampUtc = request.requestedMomentUtc
      ? new Date(request.requestedMomentUtc).toISOString()
      : receivedAt.toISOString()
    return {
      furbyId: newId(),
      certificateNumber: this.nextCertificateNumber(),
      name,
      timestampUtc,
      mode: request.requestedMomentUtc ? 'chosen' : 'moment',
      location: { ...request.location },
      recordedAtUtc: receivedAt.toISOString(),
    }
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
