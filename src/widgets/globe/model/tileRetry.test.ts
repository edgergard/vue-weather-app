import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTileRetry, type TileId } from './tileRetry'

const a: TileId = { z: 1, x: 0, y: 0 }
const b: TileId = { z: 0, x: 0, y: 0 }

describe('tile retry', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('retries a failed tile after a second, then backs off', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh, isOnline: () => true })
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

  it('caps the wait at 30 seconds', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh, isOnline: () => true })
    for (let i = 0; i < 10; i++) {
      retry.failed(a)
      vi.runOnlyPendingTimers()
    }
    refresh.mockClear()
    retry.failed(a)
    vi.advanceTimersByTime(30_000)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('does not stack retries for repeated errors of the same tile', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh, isOnline: () => true })
    retry.failed(a)
    retry.failed(a)
    retry.failed(a)
    vi.advanceTimersByTime(1000)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('forgets a tile once it loads', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh, isOnline: () => true })
    retry.failed(a)
    retry.loaded(a)
    vi.runAllTimers()
    expect(refresh).not.toHaveBeenCalled()
    expect(retry.pending).toBe(0)
  })

  it('waits while offline and retries everything the moment the connection is back', () => {
    const refresh = vi.fn()
    let online = false
    const retry = createTileRetry({ refresh, isOnline: () => online })
    retry.failed(a)
    retry.failed(b)
    vi.runAllTimers()
    expect(refresh).not.toHaveBeenCalled()
    online = true
    retry.online()
    expect(refresh).toHaveBeenCalledWith([a, b])
  })

  it('cancels everything on dispose', () => {
    const refresh = vi.fn()
    const retry = createTileRetry({ refresh, isOnline: () => true })
    retry.failed(a)
    retry.dispose()
    vi.runAllTimers()
    expect(refresh).not.toHaveBeenCalled()
  })
})
