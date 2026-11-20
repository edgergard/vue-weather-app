import { describe, expect, it } from 'vitest'
import { compassPoint, formatDistance, formatTemp, formatWind } from './units'

describe('units', () => {
  it('formats temperatures in both systems', () => {
    expect(formatTemp(21.4, 'metric')).toBe('21°')
    expect(formatTemp(0, 'imperial', true)).toBe('32°F')
    expect(formatTemp(-0.3, 'metric')).toBe('0°')
  })

  it('formats wind and distance', () => {
    expect(formatWind(16.1, 'metric')).toBe('16 km/h')
    expect(formatWind(16.09344, 'imperial')).toBe('10 mph')
    expect(formatDistance(24_000, 'metric')).toBe('24 km')
    expect(formatDistance(800, 'metric')).toBe('800 m')
  })

  it('maps degrees to compass points', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(350)).toBe('N')
    expect(compassPoint(225)).toBe('SW')
    expect(compassPoint(-90)).toBe('W')
  })
})
