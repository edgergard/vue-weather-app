import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchForecast } from '../api/forecastApi'
import type { Coordinates } from './types'

/** Round to ~1 km so nearby lookups share one cache entry. */
const key = ({ lat, lon }: Coordinates) => [lat.toFixed(2), lon.toFixed(2)] as const

export const forecastKeys = {
  all: ['forecast'] as const,
  byCoords: (c: Coordinates) => [...forecastKeys.all, ...key(c)] as const,
}

export function useForecast(coords: MaybeRefOrGetter<Coordinates | null>) {
  return useQuery({
    queryKey: computed(() => {
      const c = toValue(coords)
      return c ? forecastKeys.byCoords(c) : forecastKeys.all
    }),
    queryFn: ({ signal }) => fetchForecast(toValue(coords)!, signal),
    enabled: computed(() => toValue(coords) !== null),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })
}
