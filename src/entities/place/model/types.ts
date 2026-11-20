export interface Place {
  /** Stable id derived from coordinates, so the same spot is never saved twice. */
  id: string
  name: string
  /** State / region / country — whatever helps tell two same-named places apart. */
  region: string
  lat: number
  lon: number
}

/**
 * Coordinates are stored at the same precision the URL carries (4 decimals, ~11 m), so a place
 * rebuilt from a link gets exactly the same id as the saved one.
 */
const round4 = (n: number) => Math.round(n * 1e4) / 1e4

export function placeId(lat: number, lon: number): string {
  return `${round4(lat).toFixed(4)},${round4(lon).toFixed(4)}`
}

export function createPlace(input: Omit<Place, 'id'> & { id?: string }): Place {
  const lat = round4(input.lat)
  const lon = round4(input.lon)
  return { name: input.name, region: input.region, lat, lon, id: placeId(lat, lon) }
}
