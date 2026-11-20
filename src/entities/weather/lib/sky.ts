import { localHour } from '@/shared/lib'
import type { ConditionGroup, DailyPoint, Forecast } from '../model/types'
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
 * `day` keeps the v1 gradient end (#804FB3); its start is the v1 #9969C7 darkened just enough for
 * WCAG AA text contrast (#845AAB). Other phases are variations of it.
 */
const CLEAR: Record<DayPhase, Palette> = {
  dawn: ['#8b55b0', '#a94d78'],
  day: ['#845aab', '#804fb3'],
  dusk: ['#6a3aa8', '#ae4971'],
  night: ['#1f1240', '#3a2370'],
}

/**
 * Each kind of weather pulls the violet in its own direction, so it reads at a glance:
 * cloud goes grey-lilac, rain goes indigo, snow goes lavender, storms go almost black.
 * (Twilight colour doesn't show through cloud, so these replace the clear palette.)
 */
const WEATHER: Partial<Record<ConditionGroup, { light: Palette; dark: Palette }>> = {
  partly: { light: ['#7a60a2', '#7559a6'], dark: ['#231740', '#372a5c'] },
  cloudy: { light: ['#716980', '#665e7b'], dark: ['#24212c', '#35303f'] },
  fog: { light: ['#6f6b7b', '#696477'], dark: ['#2a2830', '#3b3842'] },
  drizzle: { light: ['#6865a7', '#535295'], dark: ['#19193a', '#2a2a52'] },
  rain: { light: ['#4c4fa0', '#363a85'], dark: ['#10122e', '#1d2149'] },
  snow: { light: ['#7263a4', '#6f60ae'], dark: ['#29274a', '#3b3966'] },
  storm: { light: ['#2e1a4c', '#160c2a'], dark: ['#0d0718', '#1a0f2c'] },
}

const GLOW: Record<DayPhase, string> = {
  dawn: '#ffb38a',
  day: '#ffe1a0',
  dusk: '#ff9466',
  night: '#c9d6ff',
}

/**
 * Index of the daily entry that covers `now`. Daily times are the place's local midnights, so
 * this stays correct after midnight even if the cached forecast was fetched the day before.
 */
export function todayIndex(daily: readonly DailyPoint[], now: number): number {
  let index = 0
  for (let i = 0; i < daily.length; i++) {
    if (daily[i]!.time <= now) index = i
  }
  return index
}

export function todayOf(forecast: Forecast, now: number): DailyPoint | undefined {
  return forecast.daily[todayIndex(forecast.daily, now)]
}

function phaseOf(forecast: Forecast, now: number): { phase: DayPhase; sunProgress: number | null } {
  const today = todayOf(forecast, now)
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
