import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'
import { createPlace, type Place } from './types'

/** A place is fully described by its URL, so forecast links can be shared and bookmarked. */
export function placeRoute(place: Place): RouteLocationRaw {
  return {
    name: 'forecast',
    params: { lat: place.lat.toFixed(4), lon: place.lon.toFixed(4) },
    query: { name: place.name, region: place.region || undefined },
  }
}

export function placeFromRoute(route: RouteLocationNormalizedLoaded): Place | null {
  const lat = Number(route.params.lat)
  const lon = Number(route.params.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null
  }
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  return createPlace({
    name: str(route.query.name) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    region: str(route.query.region),
    lat,
    lon,
  })
}
