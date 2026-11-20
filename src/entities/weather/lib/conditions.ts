import type { ConditionGroup } from '../model/types'

export interface Condition {
  label: string
  group: ConditionGroup
}

/** WMO weather interpretation codes, as used by Open-Meteo. */
const WMO: Record<number, Condition> = {
  0: { label: 'Clear', group: 'clear' },
  1: { label: 'Mostly clear', group: 'clear' },
  2: { label: 'Partly cloudy', group: 'partly' },
  3: { label: 'Overcast', group: 'cloudy' },
  45: { label: 'Fog', group: 'fog' },
  48: { label: 'Freezing fog', group: 'fog' },
  51: { label: 'Light drizzle', group: 'drizzle' },
  53: { label: 'Drizzle', group: 'drizzle' },
  55: { label: 'Heavy drizzle', group: 'drizzle' },
  56: { label: 'Freezing drizzle', group: 'drizzle' },
  57: { label: 'Freezing drizzle', group: 'drizzle' },
  61: { label: 'Light rain', group: 'rain' },
  63: { label: 'Rain', group: 'rain' },
  65: { label: 'Heavy rain', group: 'rain' },
  66: { label: 'Freezing rain', group: 'rain' },
  67: { label: 'Freezing rain', group: 'rain' },
  71: { label: 'Light snow', group: 'snow' },
  73: { label: 'Snow', group: 'snow' },
  75: { label: 'Heavy snow', group: 'snow' },
  77: { label: 'Snow grains', group: 'snow' },
  80: { label: 'Light showers', group: 'rain' },
  81: { label: 'Showers', group: 'rain' },
  82: { label: 'Heavy showers', group: 'rain' },
  85: { label: 'Snow showers', group: 'snow' },
  86: { label: 'Heavy snow showers', group: 'snow' },
  95: { label: 'Thunderstorm', group: 'storm' },
  96: { label: 'Thunderstorm with hail', group: 'storm' },
  99: { label: 'Thunderstorm with hail', group: 'storm' },
}

export function describeCode(code: number): Condition {
  return WMO[code] ?? { label: 'Unknown', group: 'cloudy' }
}
