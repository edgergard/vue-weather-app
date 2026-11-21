import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTileRetry, tileIdOf, type TileId } from './tileRetry'

const a: TileId = { z: 1, x: 0, y: 0 }
const b: TileId = { z: 0, x: 0, y: 0 }

describe('tile retry', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('retries a failed tile after a second, then backs off', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh })
    retry.failed(a)
    vi.advanceTimersByTime(999)
    expect(refresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(refresh).toHaveBeenLastCalledWith([a])

    // It failed again: the next try waits twice as long.
    retry.failed(a)
    vi.advanceTimersByTime(1999)
    expect(refresh).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('keeps trying every 8 seconds, so a recovered server is noticed quickly', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh })
    for (let i = 0; i < 10; i++) {
      retry.failed(a)
      vi.runOnlyPendingTimers()
    }
    refresh.mockClear()
    retry.failed(a)
    vi.advanceTimersByTime(7999)
    expect(refresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('does not stack retries for repeated errors of the same tile', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh })
    retry.failed(a)
    retry.failed(a)
    retry.failed(a)
    vi.advanceTimersByTime(1000)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('forgets a tile once it loads', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh })
    retry.failed(a)
    retry.loaded(a)
    vi.runAllTimers()
    expect(refresh).not.toHaveBeenCalled()
    expect(retry.pending).toBe(0)
  })

  it('retries everything at once, with fresh backoff, when the connection is back', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh })
    retry.failed(a)
    retry.failed(b)
    retry.online()
    expect(refresh).toHaveBeenCalledWith([a, b])
    // The pending timers were replaced, not left to fire as well.
    vi.runAllTimers()
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('survives a refresh that throws (map or source already gone)', () => {
    const refresh = vi.fn(() => {
      throw new Error('There is no source with ID')
    })
    const retry = createTileRetry({ refresh })
    retry.failed(a)
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(() => retry.online()).not.toThrow()
  })

  it('cancels everything on dispose', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh })
    retry.failed(a)
    retry.dispose()
    vi.runAllTimers()
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('tileIdOf', () => {
  const tile = { tileID: { canonical: { x: 1, y: 0, z: 1, key: 'ignored' } } }

  it('reads the tile of a MapLibre error or sourcedata event for our source', () => {
    expect(
      tileIdOf({ sourceId: 'openmaptiles', tile, error: new Error('x') }, 'openmaptiles'),
    ).toEqual({ x: 1, y: 0, z: 1 })
  })

  it('ignores other sources and events without a tile (style, glyphs, metadata)', () => {
    expect(tileIdOf({ sourceId: 'other', tile }, 'openmaptiles')).toBeNull()
    expect(tileIdOf({ sourceId: 'openmaptiles' }, 'openmaptiles')).toBeNull()
    expect(tileIdOf({ error: new Error('glyphs') }, 'openmaptiles')).toBeNull()
  })
})
