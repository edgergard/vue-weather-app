import { getJson } from '@/shared/api/http'
import { API } from '@/shared/config'
import { createPlace, type Place } from '../model/types'

interface GeocodingDto {
  results?: {
    id: number
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
  }[]
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const { results = [] } = await getJson<GeocodingDto>(
    API.geocoding,
    { name: query, count: 8, language: 'en', format: 'json' },
    { signal },
  )
  return results.map((r) =>
    createPlace({
      name: r.name,
      region: [r.admin1, r.country].filter((part) => part && part !== r.name).join(', '),
      lat: r.latitude,
      lon: r.longitude,
    }),
  )
}

interface ReverseDto {
  name?: string
  address?: Record<string, string | undefined>
}

/** Best-effort name for coordinates (used for "my location"). Never throws. */
export async function reverseGeocode(lat: number, lon: number): Promise<Place> {
  try {
    const dto = await getJson<ReverseDto>(API.reverseGeocoding, {
      lat,
      lon,
      format: 'jsonv2',
      zoom: 10,
      'accept-language': 'en',
    })
    const a = dto.address ?? {}
    const name = a.city ?? a.town ?? a.village ?? a.municipality ?? dto.name ?? 'Current location'
    return createPlace({ name, region: [a.state, a.country].filter(Boolean).join(', '), lat, lon })
  } catch {
    return createPlace({ name: 'Current location', region: '', lat, lon })
  }
}
