import { describe, expect, it } from 'vitest'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { placeFromRoute, placeRoute } from './route'
import { createPlace } from './types'

/** Simulates following a place link: placeRoute → URL strings → placeFromRoute. */
function roundTrip(lat: number, lon: number) {
  const place = createPlace({ name: 'X', region: 'Y', lat, lon })
  const raw = placeRoute(place) as { params: Record<string, string>; query: Record<string, string> }
  const route = { params: raw.params, query: raw.query } as unknown as RouteLocationNormalizedLoaded
  return { place, fromRoute: placeFromRoute(route)! }
}

describe('place routes', () => {
  it('rebuilds the same id from a link, whatever the source precision', () => {
    // Values that broke when the id used 3 decimals of a 4-decimal URL value.
    for (const [lat, lon] of [
      [51.50853, -0.12574],
      [50.45449, 30.52381],
      [-33.86785, 151.20732],
    ] as const) {
      const { place, fromRoute } = roundTrip(lat, lon)
      expect(fromRoute.id).toBe(place.id)
    }
  })

  it('rejects coordinates out of range', () => {
    const route = {
      params: { lat: '91', lon: '0' },
      query: {},
    } as unknown as RouteLocationNormalizedLoaded
    expect(placeFromRoute(route)).toBeNull()
  })
})
