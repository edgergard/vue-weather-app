export interface TileId {
  x: number
  y: number
  z: number
}

interface Entry {
  id: TileId
  attempt: number
  timer: ReturnType<typeof setTimeout> | null
}

interface TileRetryOptions {
  /** Reloads these tiles (MapLibre: `map.refreshTiles(source, ids)`). */
  refresh: (ids: TileId[]) => void
  baseDelayMs?: number
  maxDelayMs?: number
}

const keyOf = ({ x, y, z }: TileId) => `${z}/${x}/${y}`

/**
 * The tile a MapLibre 'error' or 'sourcedata' event is about, if it is a tile of `sourceId`.
 * Relies on the event shape of MapLibre 6.x: the source's events carry `tile` (with
 * `tileID.canonical`), and the style adds `sourceId` as they bubble up to the map.
 */
export function tileIdOf(event: unknown, sourceId: string): TileId | null {
  const ev = event as { sourceId?: string; tile?: { tileID?: { canonical?: TileId } } }
  const c = ev.sourceId === sourceId ? ev.tile?.tileID?.canonical : undefined
  return c ? { x: c.x, y: c.y, z: c.z } : null
}

/**
 * Retries map tiles that failed to load. MapLibre marks a failed tile as errored and never asks
 * for it again while it stays in view, so one network blip leaves a quarter of the globe as
 * flat land colour (no water, coasts or labels) until it spins out of sight a minute later.
 *
 * Each failed tile is retried after 1 s, 2 s, 4 s, then every 8 s (one small request per tile,
 * so a server that recovers is noticed quickly), and all of them at once when the browser
 * reports it is back online. Retries don't wait for `navigator.onLine`: it can report false
 * while requests work, and an offline retry simply fails fast and backs off.
 */
export function createTileRetry({
  refresh,
  baseDelayMs = 1000,
  maxDelayMs = 8000,
}: TileRetryOptions) {
  const entries = new Map<string, Entry>()

  function run(ids: TileId[]) {
    try {
      refresh(ids)
    } catch {
      // The map or its source is gone (unmounting, style swap): nothing left to retry.
    }
  }

  function failed(id: TileId) {
    const key = keyOf(id)
    const entry = entries.get(key) ?? { id, attempt: 0, timer: null }
    entries.set(key, entry)
    if (entry.timer) return // a retry is already on its way
    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** entry.attempt)
    entry.attempt++
    entry.timer = setTimeout(() => {
      entry.timer = null
      run([entry.id])
    }, delay)
  }

  function loaded(id: TileId) {
    const key = keyOf(id)
    const entry = entries.get(key)
    if (!entry) return
    if (entry.timer) clearTimeout(entry.timer)
    entries.delete(key)
  }

  /** The connection is back: retry every failed tile now, with fresh backoff. */
  function online() {
    if (!entries.size) return
    for (const entry of entries.values()) {
      if (entry.timer) clearTimeout(entry.timer)
      entry.timer = null
      entry.attempt = 0
    }
    run([...entries.values()].map((e) => e.id))
  }

  function dispose() {
    for (const entry of entries.values()) if (entry.timer) clearTimeout(entry.timer)
    entries.clear()
  }

  return {
    failed,
    loaded,
    online,
    dispose,
    get pending() {
      return entries.size
    },
  }
}
