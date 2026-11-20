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

/** Clear-sky palettes. Every stop keeps at least 4.5:1 contrast with white text. */
const CLEAR: Record<DayPhase, Palette> = {
  dawn: ['#2c3470', '#a04d57'],
  day: ['#174a8c', '#3a6fab'],
  dusk: ['#221f52', '#96432f'],
  night: ['#070f24', '#16244a'],
}

/** Overcast and precipitation replace the clear palette (twilight colour doesn't show through cloud). */
const WEATHER: Partial<Record<ConditionGroup, { light: Palette; dark: Palette }>> = {
  cloudy: { light: ['#36475a', '#56657a'], dark: ['#0f141c', '#252d39'] },
  fog: { light: ['#444e59', '#5f6873'], dark: ['#13171c', '#2a3036'] },
  drizzle: { light: ['#314256', '#4d5d74'], dark: ['#0c1320', '#212b3d'] },
  rain: { light: ['#26364a', '#405167'], dark: ['#090f1a', '#1b2536'] },
  snow: { light: ['#3b5274', '#5a7090'], dark: ['#111a2b', '#2a3650'] },
  storm: { light: ['#1d1f33', '#3b3452'], dark: ['#08080f', '#1f1a2e'] },
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
