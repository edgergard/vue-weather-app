import { getJson } from '@/shared/api/http'
import { API } from '@/shared/config'
import type { Coordinates, CurrentSnapshot } from '../model/types'

const CURRENT = ['temperature_2m', 'weather_code', 'is_day'] as const

export interface CurrentManyItemDto {
  /** Present when several locations were requested: the index of the coordinate pair. */
  location_id?: number
  current: { time: number } & Record<(typeof CURRENT)[number], number>
}

/**
 * Open-Meteo answers a multi-location request with an array (in request order, each item tagged
 * with `location_id`), but a single location with a plain object. Both become one list, ordered
 * like the request.
 */
export function mapCurrentMany(dto: CurrentManyItemDto | CurrentManyItemDto[]): CurrentSnapshot[] {
  const items = Array.isArray(dto) ? dto : [dto]
  const out: CurrentSnapshot[] = []
  items.forEach((item, i) => {
    const c = item.current
    out[item.location_id ?? i] = {
      time: c.time,
      temperature: c.temperature_2m,
      code: c.weather_code,
      isDay: c.is_day === 1,
    }
  })
  return out
}

/** Current conditions for many places in a single request. */
export async function fetchCurrentMany(
  coords: readonly Coordinates[],
  signal?: AbortSignal,
): Promise<CurrentSnapshot[]> {
  if (!coords.length) return []
  const dto = await getJson<CurrentManyItemDto | CurrentManyItemDto[]>(
    API.forecast,
    {
      latitude: coords.map((c) => c.lat.toFixed(4)).join(','),
      longitude: coords.map((c) => c.lon.toFixed(4)).join(','),
      current: CURRENT.join(','),
      timeformat: 'unixtime',
    },
    { signal },
  )
  return mapCurrentMany(dto)
}
