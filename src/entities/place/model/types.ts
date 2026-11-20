export interface Place {
  /** Stable id derived from coordinates, so the same spot is never saved twice. */
  id: string
  name: string
  /** State / region / country — whatever helps tell two same-named places apart. */
  region: string
  lat: number
  lon: number
}

export function placeId(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`
}

export function createPlace(input: Omit<Place, 'id'>): Place {
  return { ...input, id: placeId(input.lat, input.lon) }
}
