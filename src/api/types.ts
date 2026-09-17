export interface BirthLocation {
  /** Human label, e.g. "Bellingen" */
  name: string
  region: string
  country: string
  latitude: number
  longitude: number
  /** IANA time zone the birth is displayed in */
  timeZone: string
}

export type BirthMode = 'moment' | 'chosen'

export interface BirthRequest {
  name: string
  location: BirthLocation
  /**
   * Omitted for "use this moment": the server stamps the instant the request
   * is received. Present (ISO 8601 UTC) only when the user chose another
   * birth time for an existing Furby.
   */
  requestedMomentUtc?: string
  /** Id of the approved Birth Portrait asset, if one was taken. */
  birthPortraitId?: string
  /**
   * Generated once when the confirmation card opens. The server treats a
   * repeated id as the same birth, so a double tap or a retry after a lost
   * response cannot create two Furbys.
   */
  clientRequestId: string
}

export interface BirthRecord {
  furbyId: string
  /** Sequential certificate number, e.g. 184 → "FURBY № 000184" */
  certificateNumber: number
  name: string
  /** The canonical, immutable birth instant. */
  timestampUtc: string
  mode: BirthMode
  location: BirthLocation
  /** When the server wrote the record (equals timestampUtc for mode 'moment'). */
  recordedAtUtc: string
  birthPortraitId?: string
}

export interface BirthApi {
  /**
   * The only call that can create a birth instant. The server stamps the
   * timestamp when this request arrives, never earlier.
   */
  confirmBirth(request: BirthRequest): Promise<BirthRecord>
}
