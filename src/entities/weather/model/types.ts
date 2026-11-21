export type ConditionGroup =
  'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

export interface CurrentWeather {
  time: number
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  visibility: number
  precipitation: number
  code: number
  isDay: boolean
}

export interface HourlyPoint {
  time: number
  temperature: number
  code: number
  precipitationChance: number
  isDay: boolean
}

export interface DailyPoint {
  time: number
  code: number
  max: number
  min: number
  sunrise: number
  sunset: number
  uvIndex: number
  precipitationChance: number
}

export interface Forecast {
  timezone: string
  current: CurrentWeather
  hourly: HourlyPoint[]
  daily: DailyPoint[]
}

export interface Coordinates {
  lat: number
  lon: number
}

/** Just enough current weather for a map marker: one of many places fetched together. */
export type CurrentSnapshot = Pick<CurrentWeather, 'time' | 'temperature' | 'code' | 'isDay'>
