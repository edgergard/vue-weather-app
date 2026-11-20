/** All timestamps in the app are unix seconds; all formatting happens in the place's own time zone. */

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  const key = timeZone + JSON.stringify(options)
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone, ...options })
    formatters.set(key, f)
  }
  return f
}

export const formatClock = (unix: number, timeZone: string) =>
  formatter(timeZone, { hour: '2-digit', minute: '2-digit', hour12: false }).format(unix * 1000)

export const formatHour = (unix: number, timeZone: string) =>
  formatter(timeZone, { hour: '2-digit', hour12: false }).format(unix * 1000)

export const formatWeekday = (unix: number, timeZone: string) =>
  formatter(timeZone, { weekday: 'short' }).format(unix * 1000)

export const formatLongDate = (unix: number, timeZone: string) =>
  formatter(timeZone, { weekday: 'long', day: 'numeric', month: 'long' }).format(unix * 1000)

/** Hour of day (0–23, fractional) at `unix` in `timeZone`. */
export function localHour(unix: number, timeZone: string): number {
  const parts = formatter(timeZone, {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(unix * 1000)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h + m / 60
}

export const nowUnix = () => Math.floor(Date.now() / 1000)
