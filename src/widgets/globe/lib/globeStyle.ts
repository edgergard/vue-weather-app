import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl'

/** OpenFreeMap: free OpenMapTiles-schema vector tiles, no key needed. */
export const OPENFREEMAP = {
  tiles: 'https://tiles.openfreemap.org/planet',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
} as const

/** "Amethyst": lavender land, deep violet water, the same family as the app's sky. */
export const AMETHYST = {
  water: '#2b1552',
  land: '#9876cf',
  coast: '#d9c6f7',
  border: '#5b3a92',
  ice: '#b39be0',
  road: '#e4d8fb',
  label: '#ffffff',
  labelHalo: '#24104a',
  waterLabel: '#d9c6f7',
} as const

/** Font stacks served by OpenFreeMap (checked against its "liberty" style). */
export const FONTS = {
  regular: ['Noto Sans Regular'],
  bold: ['Noto Sans Bold'],
  italic: ['Noto Sans Italic'],
} as const

/** The one vector tile source the globe draws from. */
export const SOURCE = 'openmaptiles'

/**
 * Tiles end at the Web Mercator limit, so water polygons have an edge there and the coastline
 * layer would draw a ring around the North Pole. A line in the water colour along that latitude
 * hides it.
 */
const MASK_LAT = 85 // just inside the tile edge (85.0511°); no land is this far north
const worldEdge = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'LineString' as const,
    coordinates: Array.from({ length: 73 }, (_, i) => [i * 5 - 180, MASK_LAT]),
  },
}

/** Settlement label layers: clicking one of their labels picks that place. */
export const PLACE_LABEL_LAYERS = ['place-city', 'place-town', 'place-village'] as const

const NAME: ExpressionSpecification = ['coalesce', ['get', 'name_en'], ['get', 'name']]

const zoomRamp = (...stops: number[]): ExpressionSpecification =>
  ['interpolate', ['linear'], ['zoom'], ...stops] as ExpressionSpecification

const isLine: ExpressionSpecification = [
  'match',
  ['geometry-type'],
  ['LineString', 'MultiLineString'],
  true,
  false,
]

const labelPaint = (opacity = 1) => ({
  'text-color': AMETHYST.label,
  'text-opacity': opacity,
  'text-halo-color': AMETHYST.labelHalo,
  'text-halo-width': 1.4,
  'text-halo-blur': 0.4,
})

function roads(
  id: string,
  classes: string[],
  minzoom: number,
  opacity: number,
  width: number[],
): LayerSpecification {
  return {
    id,
    type: 'line',
    source: SOURCE,
    'source-layer': 'transportation',
    minzoom,
    filter: ['all', isLine, ['match', ['get', 'class'], classes, true, false]],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': AMETHYST.road,
      'line-opacity': zoomRamp(minzoom, 0, minzoom + 1.5, opacity),
      'line-width': zoomRamp(...width),
    },
  }
}

function settlementLabels(
  id: (typeof PLACE_LABEL_LAYERS)[number],
  placeClass: string,
  minzoom: number,
  size: number[],
  skip: ExpressionSpecification | null,
  opacity = 1,
): LayerSpecification {
  const byClass: ExpressionSpecification = ['==', ['get', 'class'], placeClass]
  return {
    id,
    type: 'symbol',
    source: SOURCE,
    'source-layer': 'place',
    minzoom,
    filter: skip ? ['all', byClass, skip] : byClass,
    layout: {
      'text-field': NAME,
      'text-font': [...FONTS.regular],
      'text-size': zoomRamp(...size),
      'text-max-width': 8,
      'symbol-sort-key': ['coalesce', ['get', 'rank'], 99],
    },
    paint: labelPaint(opacity),
  }
}

export interface GlobeStyleOptions {
  /**
   * Names that already have a city marker; their map labels are left out so a city is not
   * labelled twice.
   */
  markerNames?: readonly string[]
}

/**
 * Our own compact style on OpenFreeMap tiles. At rest the globe reads like the approved
 * "Amethyst" design (land, water, coastline glow, borders). Zooming in adds detail: country
 * and ocean names, rivers and lakes in the water colour, faint roads, then city, town and
 * village names, which can be clicked.
 */
export function buildGlobeStyle({ markerNames = [] }: GlobeStyleOptions = {}): StyleSpecification {
  const skip: ExpressionSpecification | null = markerNames.length
    ? ['!', ['in', NAME, ['literal', [...markerNames]]]]
    : null

  return {
    version: 8,
    name: 'Skyline Amethyst',
    projection: { type: 'globe' },
    glyphs: OPENFREEMAP.glyphs,
    sources: {
      [SOURCE]: { type: 'vector', url: OPENFREEMAP.tiles },
      'world-edge': { type: 'geojson', data: worldEdge },
    },
    // The atmosphere glows at rest and thins out as the camera moves in.
    sky: { 'atmosphere-blend': zoomRamp(0, 1, 4, 0.4, 7, 0) },
    layers: [
      // Land is the background: the tiles only need to paint water on top of it.
      { id: 'land', type: 'background', paint: { 'background-color': AMETHYST.land } },
      {
        id: 'ice',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'ice'],
        paint: { 'fill-color': AMETHYST.ice, 'fill-opacity': zoomRamp(0, 0.6, 8, 0.35) },
      },
      {
        id: 'water',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': AMETHYST.water },
      },
      {
        id: 'river',
        type: 'line',
        source: SOURCE,
        'source-layer': 'waterway',
        minzoom: 6,
        filter: [
          'all',
          isLine,
          ['!=', ['get', 'brunnel'], 'tunnel'],
          ['==', ['get', 'class'], 'river'],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': AMETHYST.water, 'line-width': zoomRamp(6, 0.5, 10, 1.4, 14, 3) },
      },
      {
        id: 'stream',
        type: 'line',
        source: SOURCE,
        'source-layer': 'waterway',
        minzoom: 11,
        filter: [
          'all',
          isLine,
          ['!=', ['get', 'brunnel'], 'tunnel'],
          ['!=', ['get', 'class'], 'river'],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': AMETHYST.water, 'line-width': zoomRamp(11, 0.4, 14, 1.2) },
      },
      // Coastline and lake shores: a light rim, like the outline in the design.
      {
        id: 'coast',
        type: 'line',
        source: SOURCE,
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        layout: { 'line-join': 'round' },
        paint: {
          'line-color': AMETHYST.coast,
          'line-opacity': zoomRamp(0, 0.9, 5, 0.9, 8, 0.55, 12, 0.35),
          'line-width': zoomRamp(1, 0.7, 4, 1.26, 10, 1.6),
        },
      },
      {
        id: 'world-edge',
        type: 'line',
        source: 'world-edge',
        paint: { 'line-color': AMETHYST.water, 'line-width': 10 },
      },
      roads('road-minor', ['minor', 'service'], 12, 0.25, [12, 0.5, 14, 1.5]),
      roads('road-medium', ['secondary', 'tertiary'], 9, 0.3, [9, 0.4, 12, 1, 14, 2]),
      roads('road-major', ['motorway', 'trunk', 'primary'], 6, 0.4, [6, 0.4, 10, 1.1, 14, 2.6]),
      {
        id: 'boundary-state',
        type: 'line',
        source: SOURCE,
        'source-layer': 'boundary',
        minzoom: 4,
        filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
        layout: { 'line-join': 'round' },
        paint: {
          'line-color': AMETHYST.border,
          'line-opacity': zoomRamp(4, 0, 5, 0.55),
          'line-width': zoomRamp(4, 0.5, 10, 1),
          'line-dasharray': [2, 2],
        },
      },
      {
        id: 'boundary-country',
        type: 'line',
        source: SOURCE,
        'source-layer': 'boundary',
        filter: [
          'all',
          ['==', ['get', 'admin_level'], 2],
          ['!=', ['get', 'maritime'], 1],
          ['!=', ['get', 'disputed'], 1],
        ],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': AMETHYST.border,
          'line-opacity': 0.85,
          'line-width': zoomRamp(1, 0.5, 4, 1.1, 10, 1.8),
        },
      },
      {
        id: 'boundary-disputed',
        type: 'line',
        source: SOURCE,
        'source-layer': 'boundary',
        filter: [
          'all',
          ['==', ['get', 'admin_level'], 2],
          ['!=', ['get', 'maritime'], 1],
          ['==', ['get', 'disputed'], 1],
        ],
        paint: {
          'line-color': AMETHYST.border,
          'line-opacity': 0.7,
          'line-width': zoomRamp(1, 0.5, 4, 1, 10, 1.6),
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'water-name',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'water_name',
        minzoom: 2.2,
        filter: [
          'all',
          ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
          ['match', ['get', 'class'], ['ocean', 'sea'], true, false],
        ],
        layout: {
          'text-field': NAME,
          'text-font': [...FONTS.italic],
          'text-size': zoomRamp(2, 10, 6, 13),
          'text-letter-spacing': 0.08,
          'text-max-width': 6,
        },
        paint: {
          'text-color': AMETHYST.waterLabel,
          'text-opacity': 0.75,
          'text-halo-color': AMETHYST.water,
          'text-halo-width': 1,
        },
      },
      {
        id: 'place-country',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'place',
        minzoom: 2.6,
        maxzoom: 8,
        filter: ['==', ['get', 'class'], 'country'],
        layout: {
          'text-field': NAME,
          'text-font': [...FONTS.bold],
          'text-size': zoomRamp(2.6, 10, 5, 14, 8, 16),
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
          'text-max-width': 7,
          'symbol-sort-key': ['coalesce', ['get', 'rank'], 99],
        },
        paint: labelPaint(0.8),
      },
      settlementLabels('place-village', 'village', 9, [9, 10.5, 12, 12.5], skip, 0.88),
      settlementLabels('place-town', 'town', 6, [6, 10.5, 9, 12, 12, 14], skip, 0.94),
      settlementLabels('place-city', 'city', 4, [4, 11, 8, 14, 12, 17], skip),
    ],
  }
}
