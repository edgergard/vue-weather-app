import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentMany, mapCurrentMany, type CurrentManyItemDto } from './currentApi'

const item = (temperature: number, code: number, isDay: number, locationId?: number) =>
  ({
    ...(locationId === undefined ? {} : { location_id: locationId }),
    current: { time: 1795237200, temperature_2m: temperature, weather_code: code, is_day: isDay },
  }) satisfies CurrentManyItemDto

describe('mapCurrentMany', () => {
  it('maps a multi-location array in request order', () => {
    expect(mapCurrentMany([item(5.6, 3, 0), item(4.7, 1, 1, 1)])).toEqual([
      { time: 1795237200, temperature: 5.6, code: 3, isDay: false },
      { time: 1795237200, temperature: 4.7, code: 1, isDay: true },
    ])
  })

  it('accepts the plain object Open-Meteo returns for a single location', () => {
    expect(mapCurrentMany(item(-2, 71, 1))).toEqual([
      { time: 1795237200, temperature: -2, code: 71, isDay: true },
    ])
  })

  it('places items by location_id when present', () => {
    const out = mapCurrentMany([item(2, 0, 1, 1), item(1, 0, 1, 0)])
    expect(out.map((s) => s.temperature)).toEqual([1, 2])
  })
})

describe('fetchCurrentMany', () => {
  afterEach(() => vi.restoreAllMocks())

  it('asks for every place in one request with comma-separated coordinates', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify([item(1, 0, 1, 0), item(2, 3, 0, 1)])))
    const out = await fetchCurrentMany([
      { lat: 50.4547, lon: 30.5238 },
      { lat: -33.867849, lon: 151.20732 },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(String(fetchMock.mock.calls[0]![0]))
    expect(url.searchParams.get('latitude')).toBe('50.4547,-33.8678')
    expect(url.searchParams.get('longitude')).toBe('30.5238,151.2073')
    expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code,is_day')
    expect(out).toHaveLength(2)
  })

  it('skips the request when there is nothing to ask for', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    expect(await fetchCurrentMany([])).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
