import { describe, expect, it } from 'vitest'
import { dayPhase, skyFor } from './sky'
import type { Forecast } from '../model/types'

const SUNRISE = 1_000_000
const SUNSET = SUNRISE + 10 * 3600

function forecast(code: number, now: number): Forecast {
  return {
    timezone: 'UTC',
    current: {
      time: now,
      temperature: 10,
      feelsLike: 8,
      humidity: 60,
      windSpeed: 10,
      windDirection: 0,
      pressure: 1013,
      visibility: 20000,
      precipitation: 0,
      code,
      isDay: true,
    },
    hourly: [],
    daily: [
      {
        time: SUNRISE,
        code,
        max: 12,
        min: 4,
        sunrise: SUNRISE,
        sunset: SUNSET,
        uvIndex: 2,
        precipitationChance: 0,
      },
    ],
  }
}

describe('sky', () => {
  it('detects phases around sunrise and sunset', () => {
    expect(dayPhase(SUNRISE - 1800, SUNRISE, SUNSET)).toBe('dawn')
    expect(dayPhase(SUNRISE + 5 * 3600, SUNRISE, SUNSET)).toBe('day')
    expect(dayPhase(SUNSET + 600, SUNRISE, SUNSET)).toBe('dusk')
    expect(dayPhase(SUNSET + 3 * 3600, SUNRISE, SUNSET)).toBe('night')
  })

  it('tracks the sun across the day', () => {
    expect(skyFor(forecast(0, SUNRISE + 5 * 3600)).sunProgress).toBeCloseTo(0.5)
    expect(skyFor(forecast(0, SUNSET + 3 * 3600)).sunProgress).toBeNull()
  })

  it('lets rain override the clear palette', () => {
    const clear = skyFor(forecast(0, SUNRISE + 3600 * 3))
    const rain = skyFor(forecast(63, SUNRISE + 3600 * 3))
    expect(rain.group).toBe('rain')
    expect(rain.top).not.toBe(clear.top)
  })
})
