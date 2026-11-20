export type UnitSystem = 'metric' | 'imperial'

export const toFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32
export const toMph = (kmh: number) => kmh / 1.609344

export function formatTemp(celsius: number, units: UnitSystem, withUnit = false): string {
  const value = Math.round(units === 'imperial' ? toFahrenheit(celsius) : celsius)
  // Avoid "-0°"
  const safe = Object.is(value, -0) ? 0 : value
  return `${safe}°${withUnit ? (units === 'imperial' ? 'F' : 'C') : ''}`
}

export function formatWind(kmh: number, units: UnitSystem): string {
  return units === 'imperial' ? `${Math.round(toMph(kmh))} mph` : `${Math.round(kmh)} km/h`
}

export function formatDistance(meters: number, units: UnitSystem): string {
  if (units === 'imperial') return `${Math.round(meters / 1609.344)} mi`
  return meters >= 1000 ? `${Math.round(meters / 1000)} km` : `${Math.round(meters)} m`
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
export function compassPoint(degrees: number): string {
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8]!
}
