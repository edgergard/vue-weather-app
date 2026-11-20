export const API = {
  forecast: 'https://api.open-meteo.com/v1/forecast',
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  reverseGeocoding: 'https://nominatim.openstreetmap.org/reverse',
} as const

export const STORAGE_KEYS = {
  places: 'skyline:places',
  units: 'skyline:units',
  /** Key used by v1 of the app; read once for migration. */
  legacyPlaces: 'savedLocations',
} as const
