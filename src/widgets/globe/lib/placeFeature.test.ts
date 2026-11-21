import { describe, expect, it } from 'vitest'
import { placeFromFeature, regionWithout } from './placeFeature'

const point = (lon: number, lat: number) => ({ type: 'Point', coordinates: [lon, lat] })

describe('placeFromFeature', () => {
  it('prefers the English name and reads coordinates from the point', () => {
    expect(
      placeFromFeature({
        properties: { name: 'Біла Церква', name_en: 'Bila Tserkva', class: 'town' },
        geometry: point(30.1, 49.8),
      }),
    ).toEqual({ name: 'Bila Tserkva', lat: 49.8, lon: 30.1 })
  })

  it('falls back to the local name', () => {
    expect(
      placeFromFeature({ properties: { name: 'Zgierz' }, geometry: point(19.4, 51.85) }),
    ).toEqual({ name: 'Zgierz', lat: 51.85, lon: 19.4 })
  })

  it('wraps longitudes from world copies', () => {
    expect(placeFromFeature({ properties: { name: 'X' }, geometry: point(370, 10) })?.lon).toBe(10)
  })

  it('rejects features without a usable name or point', () => {
    expect(placeFromFeature({ properties: { name: '  ' }, geometry: point(1, 2) })).toBeNull()
    expect(placeFromFeature({ properties: { name: 'X' }, geometry: null })).toBeNull()
    expect(
      placeFromFeature({
        properties: { name: 'X' },
        geometry: { type: 'LineString', coordinates: [] },
      }),
    ).toBeNull()
    expect(placeFromFeature({ properties: { name: 'X' }, geometry: point(1, 95) })).toBeNull()
  })
})

describe('regionWithout', () => {
  it('drops the place name from a reverse-geocoded region', () => {
    expect(regionWithout('Singapore', 'Singapore, Singapore')).toBe('')
    expect(regionWithout('Brovary', 'Kyiv Oblast, Ukraine')).toBe('Kyiv Oblast, Ukraine')
    expect(regionWithout('X', '')).toBe('')
  })
})
