import type { PortraitAsset, PortraitSize } from './types'

/**
 * IndexedDB keeps the image blobs. localStorage would need base64 and fill up
 * after two Furbys; IndexedDB stores Blobs natively.
 */
const DB_NAME = 'bluestar-portraits'
const DB_VERSION = 1
const STORE = 'portraits'

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser cannot store portraits.'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Could not open portrait storage.'))
  })
  return dbPromise
}

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error ?? new Error('Portrait storage failed.'))
  })
}

export async function putPortrait(asset: PortraitAsset): Promise<void> {
  const db = await open()
  await request(db.transaction(STORE, 'readwrite').objectStore(STORE).put(asset))
}

export async function getPortrait(id: string): Promise<PortraitAsset | undefined> {
  const db = await open()
  return request(db.transaction(STORE, 'readonly').objectStore(STORE).get(id)) as Promise<PortraitAsset | undefined>
}

export async function deletePortrait(id: string): Promise<void> {
  const db = await open()
  await request(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id))
}

export async function listPortraitIds(): Promise<string[]> {
  const db = await open()
  const keys = await request(db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys())
  return keys.map(String)
}

/** Drop the archival source once a portrait becomes a permanent Birth Portrait. */
export async function sealPortrait(id: string): Promise<void> {
  const asset = await getPortrait(id)
  if (!asset || !asset.source) return
  const { source: _source, ...rest } = asset
  void _source
  await putPortrait(rest)
}

/** Remove drafts nobody references any more (abandoned captures). */
export async function pruneOrphans(keep: Set<string>): Promise<number> {
  let removed = 0
  try {
    for (const id of await listPortraitIds()) {
      if (!keep.has(id)) {
        await deletePortrait(id)
        removed++
      }
    }
  } catch {
    /* storage unavailable: nothing to prune */
  }
  return removed
}

/* ---------- Object URL cache ---------- */

const urlCache = new Map<string, string>()
const pending = new Map<string, Promise<string | null>>()

export function cacheKey(id: string, size: PortraitSize): string {
  return `${id}:${size}`
}

/** Resolve a portrait blob to a stable object URL (cached for the page's life). */
export function portraitUrl(id: string, size: PortraitSize): Promise<string | null> {
  const key = cacheKey(id, size)
  const hit = urlCache.get(key)
  if (hit) return Promise.resolve(hit)
  const inflight = pending.get(key)
  if (inflight) return inflight
  const p = getPortrait(id)
    .then((asset) => {
      if (!asset) return null
      const url = URL.createObjectURL(asset[size])
      urlCache.set(key, url)
      return url
    })
    .catch(() => null)
    .finally(() => pending.delete(key))
  pending.set(key, p)
  return p
}

/** Register a blob under an id before it is saved, so review screens can show it. */
export function primePortraitUrl(id: string, size: PortraitSize, blob: Blob): string {
  const key = cacheKey(id, size)
  const existing = urlCache.get(key)
  if (existing) URL.revokeObjectURL(existing)
  const url = URL.createObjectURL(blob)
  urlCache.set(key, url)
  return url
}

export function forgetPortraitUrls(id: string): void {
  for (const size of ['master', 'ui', 'thumb'] as PortraitSize[]) {
    const key = cacheKey(id, size)
    const url = urlCache.get(key)
    if (url) {
      URL.revokeObjectURL(url)
      urlCache.delete(key)
    }
  }
}
