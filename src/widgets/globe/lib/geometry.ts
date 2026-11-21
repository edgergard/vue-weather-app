/**
 * Pure camera maths for the globe page. MapLibre's globe is a sphere of radius
 * `512 · 2^zoom / (2π · cos(centre latitude))` px, seen by a perspective camera that sits
 * `cameraToCenterDistance` px in front of its nearest point. These helpers turn that into what
 * the page needs: the on-screen size of the sphere, the zoom that makes it fit, and whether a
 * city faces the viewer.
 */

const RAD = Math.PI / 180
const TILE_SIZE = 512
/** MapLibre clamps the latitude used for the globe size to the Web Mercator limit. */
const MAX_LAT = 85.051129
/** MapLibre's default vertical field of view, in degrees. */
export const DEFAULT_FOV = 36.87

export interface LngLatLite {
  lng: number
  lat: number
}

export interface StageMetrics {
  width: number
  height: number
  /** Space kept free above the sphere (title and hint). */
  padTop: number
  /** Space kept free below the sphere (attribution). */
  padBottom: number
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Cosine of the angle between two points, seen from the centre of the Earth: 1 for the same
 * point, 0 on the horizon (the visible edge of the sphere), negative on the far side.
 */
export function cosAngle(a: LngLatLite, b: LngLatLite): number {
  return cosBetween(preparePoint(a), preparePoint(b))
}

/** A point's trigonometry, computed once for points that are compared on every frame. */
export interface PreparedPoint {
  sinLat: number
  cosLat: number
  /** Longitude in radians. */
  lng: number
}

export function preparePoint({ lng, lat }: LngLatLite): PreparedPoint {
  return { sinLat: Math.sin(lat * RAD), cosLat: Math.cos(lat * RAD), lng: lng * RAD }
}

/** cosAngle() for prepared points: one cosine per call. */
export function cosBetween(a: PreparedPoint, b: PreparedPoint): number {
  return a.sinLat * b.sinLat + a.cosLat * b.cosLat * Math.cos(b.lng - a.lng)
}

/**
 * Markers are hidden a little before they reach the edge of the sphere, where they would be
 * squashed against the rim and overlap each other.
 */
export const LIMB_MARGIN = 0.12

const latScale = (lat: number) => Math.cos(Math.min(Math.abs(lat), MAX_LAT) * RAD)

/** Radius of MapLibre's globe in px (as a model, before perspective) at a zoom and latitude. */
export function globeRadius(zoom: number, lat: number): number {
  return (TILE_SIZE * 2 ** zoom) / (2 * Math.PI) / latScale(lat)
}

export function zoomForGlobeRadius(radius: number, lat: number): number {
  return Math.log2((radius * 2 * Math.PI * latScale(lat)) / TILE_SIZE)
}

/** Distance from the camera to the point it looks at, in px (MapLibre's cameraToCenterDistance). */
export function cameraDistance(height: number, fovDegrees = DEFAULT_FOV): number {
  return height / 2 / Math.tan((fovDegrees * RAD) / 2)
}

/**
 * Radius of the sphere's outline on screen. Perspective makes it smaller than the model radius:
 * the camera sees the sphere from `distance` px in front of its surface.
 */
export function silhouetteRadius(radius: number, distance: number): number {
  return (distance * radius) / Math.sqrt(distance * distance + 2 * distance * radius)
}

/**
 * The camera is a finite distance away, so it sees less than half the sphere: points with
 * cosAngle below this value (from the camera's centre) are behind the horizon. MapLibre makes
 * markers there transparent; ours must also stop being clickable and focusable there.
 */
export function horizonCos(radius: number, distance: number): number {
  return radius / (radius + distance)
}

/**
 * Cosine below which a marker is hidden: the visible horizon plus a small band before it, and
 * never less than LIMB_MARGIN.
 */
export function cullMargin(radius: number, distance: number): number {
  return Math.max(LIMB_MARGIN, horizonCos(radius, distance) + 0.03)
}

/** Inverse of silhouetteRadius: the model radius whose outline is `outline` px on screen. */
export function radiusForSilhouette(outline: number, distance: number): number {
  return (
    (outline * outline + outline * Math.sqrt(outline * outline + distance * distance)) / distance
  )
}

/** The largest globe we show at rest, in px across, so it stays a globe on big screens. */
export const MAX_REST_DIAMETER = 640

/** On-screen radius of the sphere at rest: it fills the free space between title and footer. */
export function restingOutline({ width, height, padTop, padBottom }: StageMetrics): number {
  const diameter = Math.min(width * 0.86, height - padTop - padBottom, MAX_REST_DIAMETER)
  return Math.max(60, diameter / 2)
}

/** Zoom at which the sphere's outline has its resting size, for a camera centred at `lat`. */
export function restingZoom(stage: StageMetrics, lat: number, fovDegrees = DEFAULT_FOV): number {
  const outline = restingOutline(stage)
  const radius = radiusForSilhouette(outline, cameraDistance(stage.height, fovDegrees))
  return zoomForGlobeRadius(radius, lat)
}

/** Where the sphere's centre sits vertically: the middle of the padded area. */
export function sphereCenterY({ height, padTop, padBottom }: StageMetrics): number {
  return padTop + (height - padTop - padBottom) / 2
}

/**
 * The halo and glass highlight are drawn for a whole sphere; once the camera moves in and the
 * sphere outgrows the screen they would no longer line up, so they fade out over `range` zoom
 * levels past the resting zoom.
 */
export function overlayFade(relativeZoom: number, range = 0.35): number {
  return clamp(1 - relativeZoom / range, 0, 1)
}

/** Free space above and below the sphere: the title block on top, the attribution below. */
export function stagePadding(width: number): { top: number; bottom: number } {
  return width < 640 ? { top: 104, bottom: 48 } : { top: 128, bottom: 60 }
}

/** Longitude wrapped into [-180, 180). */
export function wrapLng(lng: number): number {
  if (lng >= -180 && lng < 180) return lng // exact, no floating-point drift
  return ((((lng + 180) % 360) + 360) % 360) - 180
}
