import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchCurrentMany } from '../api/currentApi'
import type { Coordinates } from './types'

export const currentManyKeys = {
  all: ['current-many'] as const,
  /** Rounded to ~1 km like forecast keys, so tiny coordinate differences share a cache entry. */
  byCoords: (coords: readonly Coordinates[]) =>
    [
      ...currentManyKeys.all,
      coords.map((c) => `${c.lat.toFixed(2)},${c.lon.toFixed(2)}`).join(';'),
    ] as const,
}

/** Live current temperature and condition for a list of places, fetched in one request. */
export function useCurrentWeatherMany(coords: MaybeRefOrGetter<readonly Coordinates[]>) {
  return useQuery({
    queryKey: computed(() => currentManyKeys.byCoords(toValue(coords))),
    queryFn: ({ signal }) => fetchCurrentMany(toValue(coords), signal),
    enabled: computed(() => toValue(coords).length > 0),
    // Open-Meteo refreshes current conditions every 15 minutes.
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })
}
