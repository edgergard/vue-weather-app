import { describe, expect, it } from 'vitest'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { GLOBE_CITIES } from '@/entities/place'
import { AMETHYST, buildGlobeStyle, FONTS, OPENFREEMAP, PLACE_LABEL_LAYERS } from './globeStyle'

const style = buildGlobeStyle({ markerNames: GLOBE_CITIES.map((c) => c.name) })
const layer = (id: string) => style.layers.find((l) => l.id === id)
const filterOf = (l: unknown) => JSON.stringify((l as { filter?: unknown } | undefined)?.filter)

describe('buildGlobeStyle', () => {
  it('is a valid MapLibre style', () => {
    expect(validateStyleMin(style)).toEqual([])
    expect(validateStyleMin(buildGlobeStyle())).toEqual([])
  })

  it('renders a globe from OpenFreeMap tiles and fonts', () => {
    expect(style.projection).toEqual({ type: 'globe' })
    expect(style.glyphs).toBe(OPENFREEMAP.glyphs)
    expect(style.sources.openmaptiles).toEqual({ type: 'vector', url: OPENFREEMAP.tiles })
    expect(style.sky?.['atmosphere-blend']).toBeDefined()
  })

  it('has unique layer ids and only uses fonts OpenFreeMap serves', () => {
    const ids = style.layers.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    const served = new Set<string>([...FONTS.regular, ...FONTS.bold, ...FONTS.italic])
    for (const l of style.layers) {
      if (l.type !== 'symbol') continue
      const fonts = l.layout?.['text-font'] as string[]
      expect(
        fonts.every((f) => served.has(f)),
        l.id,
      ).toBe(true)
    }
  })

  it('paints the Amethyst palette', () => {
    const land = layer('land')
    const water = layer('water')
    const coast = layer('coast')
    const borders = layer('boundary-country')
    expect(land?.type === 'background' && land.paint?.['background-color']).toBe('#9876cf')
    expect(water?.type === 'fill' && water.paint?.['fill-color']).toBe('#2b1552')
    expect(coast?.type === 'line' && coast.paint?.['line-color']).toBe('#d9c6f7')
    expect(borders?.type === 'line' && borders.paint?.['line-color']).toBe('#5b3a92')
    expect(AMETHYST.water).toBe('#2b1552')
  })

  it('keeps the background first and the clickable settlement labels on top', () => {
    expect(style.layers[0]?.type).toBe('background')
    const ids = style.layers.map((l) => l.id)
    expect(ids.slice(-PLACE_LABEL_LAYERS.length).sort()).toEqual([...PLACE_LABEL_LAYERS].sort())
  })

  it('leaves out labels for cities that already have a marker', () => {
    expect(filterOf(layer('place-city'))).toContain('"Kyiv"')
    expect(filterOf(layer('place-town'))).toContain('"Odesa"')
    const plain = buildGlobeStyle().layers.find((l) => l.id === 'place-city')
    expect(filterOf(plain)).not.toContain('Kyiv')
  })
})
