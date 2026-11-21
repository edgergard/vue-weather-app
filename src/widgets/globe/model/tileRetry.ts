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
  /** Whether the browser thinks it is online; offline retries wait for `online()` instead. */
  isOnline?: () => boolean
  baseDelayMs?: number
  maxDelayMs?: number
}

const keyOf = ({ x, y, z }: TileId) => `${z}/${x}/${y}`

/**
 * Retries map tiles that failed to load. MapLibre marks a failed tile as errored and never asks
 * for it again while it stays in view, so one network blip leaves a quarter of the globe as
 * flat land colour (no water, coasts or labels) until it spins out of sight a minute later.
 *
 * Each failed tile is retried after 1 s, 2 s, 4 s … up to 30 s, and all of them at once as soon
 * as the connection comes back.
 */
export function createTileRetry({
  refresh,
  isOnline = () => navigator.onLine,
  baseDelayMs = 1000,
  maxDelayMs = 30_000,
}: TileRetryOptions) {
  const entries = new Map<string, Entry>()

  function failed(id: TileId) {
    const key = keyOf(id)
    const entry = entries.get(key) ?? { id, attempt: 0, timer: null }
    entries.set(key, entry)
    if (entry.timer) return // a retry is already on its way
    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** entry.attempt)
    entry.attempt++
    entry.timer = setTimeout(() => {
      entry.timer = null
      // Offline: wait for online() rather than burning attempts.
      if (isOnline()) refresh([entry.id])
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
    refresh([...entries.values()].map((e) => e.id))
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
