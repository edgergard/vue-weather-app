import { localHour } from '@/shared/lib'
import type { ConditionGroup, Forecast } from '../model/types'
import { describeCode } from './conditions'

export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk'

/** The colour scene painted behind a place: derived from its weather and its local time of day. */
export interface Sky {
  phase: DayPhase
  group: ConditionGroup
  /** Gradient stops, top to bottom. */
  top: string
  bottom: string
  /** Colour of the sun/moon glow. */
  glow: string
  /** 0 at sunrise, 1 at sunset; null when the sun is down. */
  sunProgress: number | null
}

const HOUR = 3600

export function dayPhase(now: number, sunrise: number, sunset: number): DayPhase {
  if (Math.abs(now - sunrise) < HOUR) return 'dawn'
  if (Math.abs(now - sunset) < HOUR) return 'dusk'
  return now > sunrise && now < sunset ? 'day' : 'night'
}

type Palette = readonly [top: string, bottom: string]

/**
 * Clear-sky palettes, all in the app's signature violet.
 * `day` is the original v1 gradient (#9969C7 → #804FB3); other phases are its variations.
 */
const CLEAR: Record<DayPhase, Palette> = {
  dawn: ['#8a5fc0', '#a95e98'],
  day: ['#9969c7', '#804fb3'],
  dusk: ['#5b3a96', '#87499a'],
  night: ['#2a1a4a', '#3d2766'],
}

/** Overcast and precipitation mute the violet (twilight colour doesn't show through cloud). */
const WEATHER: Partial<Record<ConditionGroup, { light: Palette; dark: Palette }>> = {
  cloudy: { light: ['#7a6699', '#6a5689'], dark: ['#241c33', '#33284a'] },
  fog: { light: ['#7e7392', '#6c6182'], dark: ['#26222e', '#363042'] },
  drizzle: { light: ['#6f5a96', '#5f4b85'], dark: ['#1e1730', '#2d2345'] },
  rain: { light: ['#5e4887', '#4e3a75'], dark: ['#18122a', '#271e3e'] },
  snow: { light: ['#8572b0', '#72609f'], dark: ['#2a2340', '#3a3157'] },
  storm: { light: ['#3f2a63', '#2e1f4a'], dark: ['#120b20', '#22163a'] },
}

const GLOW: Record<DayPhase, string> = {
  dawn: '#ffb38a',
  day: '#ffe1a0',
  dusk: '#ff9466',
  night: '#c9d6ff',
}

function phaseOf(forecast: Forecast, now: number): { phase: DayPhase; sunProgress: number | null } {
  const today = forecast.daily[0]
  if (!today) {
    const hour = localHour(now, forecast.timezone)
    return { phase: hour >= 7 && hour < 19 ? 'day' : 'night', sunProgress: null }
  }
  const up = now >= today.sunrise && now <= today.sunset
  return {
    phase: dayPhase(now, today.sunrise, today.sunset),
    sunProgress: up ? (now - today.sunrise) / (today.sunset - today.sunrise) : null,
  }
}

export function skyFor(forecast: Forecast, now = forecast.current.time): Sky {
  const { group } = describeCode(forecast.current.code)
  const { phase, sunProgress } = phaseOf(forecast, now)
  const weather = WEATHER[group]
  const [top, bottom] = !weather
    ? CLEAR[phase]
    : phase === 'day'
      ? weather.light
      : phase === 'night'
        ? weather.dark
        : // Twilight under cloud: night above, the last light near the horizon.
          [weather.dark[1], weather.light[0]]
  return { phase, group, top, bottom, glow: GLOW[phase], sunProgress }
}

export const DEFAULT_SKY: Sky = {
  phase: 'day',
  group: 'clear',
  top: CLEAR.day[0],
  bottom: CLEAR.day[1],
  glow: GLOW.day,
  sunProgress: 0.35,
}
