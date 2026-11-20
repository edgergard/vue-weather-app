import { getJson } from '@/shared/api/http'
import { API } from '@/shared/config'
import type { Coordinates, Forecast } from '../model/types'

const CURRENT = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'is_day',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'pressure_msl',
  'visibility',
  'precipitation',
] as const
const HOURLY = ['temperature_2m', 'weather_code', 'precipitation_probability', 'is_day'] as const
const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_probability_max',
] as const

type Series<K extends string> = { time: number[] } & Record<K, (number | null)[]>

export interface ForecastDto {
  timezone: string
  current: { time: number } & Record<(typeof CURRENT)[number], number>
  hourly: Series<(typeof HOURLY)[number]>
  daily: Series<(typeof DAILY)[number]>
}

const n = (value: number | null | undefined) => value ?? 0

/** Converts Open-Meteo's column-oriented payload into row-oriented domain objects. */
export function mapForecast(dto: ForecastDto): Forecast {
  const { current: c, hourly: h, daily: d } = dto
  return {
    timezone: dto.timezone,
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      pressure: c.pressure_msl,
      visibility: c.visibility,
      precipitation: c.precipitation,
      code: c.weather_code,
      isDay: c.is_day === 1,
    },
    hourly: h.time.map((time, i) => ({
      time,
      temperature: n(h.temperature_2m[i]),
      code: n(h.weather_code[i]),
      precipitationChance: n(h.precipitation_probability[i]),
      isDay: h.is_day[i] === 1,
    })),
    daily: d.time.map((time, i) => ({
      time,
      code: n(d.weather_code[i]),
      max: n(d.temperature_2m_max[i]),
      min: n(d.temperature_2m_min[i]),
      sunrise: n(d.sunrise[i]),
      sunset: n(d.sunset[i]),
      uvIndex: n(d.uv_index_max[i]),
      precipitationChance: n(d.precipitation_probability_max[i]),
    })),
  }
}

export async function fetchForecast({ lat, lon }: Coordinates, signal?: AbortSignal) {
  const dto = await getJson<ForecastDto>(
    API.forecast,
    {
      latitude: lat,
      longitude: lon,
      current: CURRENT.join(','),
      hourly: HOURLY.join(','),
      daily: DAILY.join(','),
      timezone: 'auto',
      timeformat: 'unixtime',
      forecast_days: 10,
    },
    { signal },
  )
  return mapForecast(dto)
}
