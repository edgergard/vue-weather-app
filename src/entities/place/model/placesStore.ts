import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { STORAGE_KEYS } from '@/shared/config'
import { createPlace, type Place } from './types'

/** v1 stored `{ id, city, state, lat, lon }` with string coordinates. */
interface LegacyLocation {
  city: string
  state: string
  lat: string | number
  lon: string | number
}

function readLegacyPlaces(): Place[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.legacyPlaces)
    if (!raw) return []
    const legacy = JSON.parse(raw) as LegacyLocation[]
    localStorage.removeItem(STORAGE_KEYS.legacyPlaces)
    return legacy
      .map((l) =>
        createPlace({ name: l.city, region: l.state, lat: Number(l.lat), lon: Number(l.lon) }),
      )
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
  } catch {
    return []
  }
}

export const usePlacesStore = defineStore('places', () => {
  const places = useLocalStorage<Place[]>(STORAGE_KEYS.places, [])

  // Re-normalise everything on load (fixes ids written by earlier builds) and fold in v1 places.
  const seen = new Set<string>()
  const normalised = [...places.value, ...readLegacyPlaces()]
    .map((p) => createPlace(p))
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
  if (JSON.stringify(normalised) !== JSON.stringify(places.value)) places.value = normalised

  const ids = computed(() => new Set(places.value.map((p) => p.id)))

  const isSaved = (id: string) => ids.value.has(id)

  function save(place: Place) {
    if (!isSaved(place.id)) places.value = [...places.value, place]
  }

  function remove(id: string) {
    places.value = places.value.filter((p) => p.id !== id)
  }

  function toggle(place: Place) {
    if (isSaved(place.id)) remove(place.id)
    else save(place)
  }

  return { places, isSaved, save, remove, toggle }
})
