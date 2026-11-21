import { wrapLng } from './geometry'

/** The parts of a rendered map feature (MapLibre's MapGeoJSONFeature) that we read. */
export interface PlaceFeatureLike {
  properties?: Record<string, unknown> | null
  geometry?: { type: string; coordinates?: unknown } | null
}

export interface PickedPlace {
  name: string
  lat: number
  lon: number
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/**
 * Turns a clicked settlement label (OpenMapTiles "place" layer) into a place we can show and
 * open. Prefers the English name, like the labels do. Returns null for anything unusable.
 */
export function placeFromFeature(feature: PlaceFeatureLike): PickedPlace | null {
  const props = feature.properties ?? {}
  const name = text(props['name_en']) || text(props['name:en']) || text(props['name'])
  const geometry = feature.geometry
  if (!name || geometry?.type !== 'Point' || !Array.isArray(geometry.coordinates)) return null
  const [lon, lat] = geometry.coordinates as unknown[]
  if (typeof lon !== 'number' || typeof lat !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90) return null
  return { name, lat, lon: wrapLng(lon) }
}

/**
 * Region text from a reverse-geocoded "state, country" string, without repeating the place's
 * own name (city-states such as Singapore come back as "Singapore, Singapore").
 */
export function regionWithout(name: string, region: string): string {
  return region
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== name)
    .join(', ')
}
