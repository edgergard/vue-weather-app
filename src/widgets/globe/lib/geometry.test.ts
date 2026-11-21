import { describe, expect, it } from 'vitest'
import {
  cameraDistance,
  cosAngle,
  globeRadius,
  cullMargin,
  horizonCos,
  cosBetween,
  preparePoint,
  LIMB_MARGIN,
  MAX_REST_DIAMETER,
  overlayFade,
  radiusForSilhouette,
  restingOutline,
  restingZoom,
  silhouetteRadius,
  sphereCenterY,
  wrapLng,
  zoomForGlobeRadius,
} from './geometry'

const kyiv = { lng: 30.52, lat: 50.45 }

describe('back-side culling', () => {
  it('treats the point under the camera as fully facing the viewer', () => {
    expect(cosAngle(kyiv, kyiv)).toBeCloseTo(1, 10)
  })

  it('puts the antipode on the far side and a nearby city on the near side', () => {
    const antipode = { lng: kyiv.lng - 180, lat: -kyiv.lat }
    expect(cosAngle(kyiv, antipode)).toBeCloseTo(-1, 10)
    expect(cosAngle(kyiv, antipode)).toBeLessThan(LIMB_MARGIN)
    expect(cosAngle(kyiv, { lng: 24.03, lat: 49.84 })).toBeGreaterThan(LIMB_MARGIN) // Lviv
  })

  it('gives the same answer for prepared points as for plain ones', () => {
    const lviv = { lng: 24.03, lat: 49.84 }
    const sydney = { lng: 151.21, lat: -33.87 }
    for (const p of [kyiv, lviv, sydney]) {
      expect(cosBetween(preparePoint(kyiv), preparePoint(p))).toBeCloseTo(
        Math.sin(kyiv.lat * (Math.PI / 180)) * Math.sin(p.lat * (Math.PI / 180)) +
          Math.cos(kyiv.lat * (Math.PI / 180)) *
            Math.cos(p.lat * (Math.PI / 180)) *
            Math.cos((p.lng - kyiv.lng) * (Math.PI / 180)),
        12,
      )
    }
  })

  it('hides points just before the horizon, not only behind it', () => {
    const center = { lng: 0, lat: 0 }
    // A camera far away sees half the sphere; the rim margin alone decides.
    const margin = cullMargin(1, 1e6)
    expect(cosAngle(center, { lng: 80, lat: 0 })).toBeGreaterThan(margin) // cos 80 deg = 0.17
    expect(cosAngle(center, { lng: 85, lat: 0 })).toBeLessThan(margin) // cos 85 deg = 0.09
    expect(cosAngle(center, { lng: 85, lat: 0 })).toBeGreaterThan(0) // still in front
  })

  it('hides markers at the real horizon, which comes closer as the camera zooms in', () => {
    const d = cameraDistance(800)
    const atRest = globeRadius(
      restingZoom({ width: 1200, height: 800, padTop: 128, padBottom: 60 }, 0),
      0,
    )
    // About 78 degrees out, MapLibre already makes markers transparent at rest.
    expect(horizonCos(atRest, d)).toBeGreaterThan(Math.cos(80 * (Math.PI / 180)))
    expect(cullMargin(atRest, d)).toBeGreaterThan(horizonCos(atRest, d))
    // Zoomed in, the horizon is nearer still, and the margin follows it.
    expect(cullMargin(atRest * 4, d)).toBeGreaterThan(cullMargin(atRest, d))
    // A camera far away sees (almost) half the sphere: the plain rim margin applies.
    expect(cullMargin(1, 1e6)).toBe(LIMB_MARGIN)
  })

  it('does not care how longitudes are wrapped', () => {
    expect(cosAngle({ lng: 179, lat: 0 }, { lng: -179, lat: 0 })).toBeCloseTo(
      cosAngle({ lng: 0, lat: 0 }, { lng: 2, lat: 0 }),
      10,
    )
  })
})

describe('globe size', () => {
  it('matches MapLibre: 512 * 2^z / 2pi at the equator, larger towards the poles', () => {
    expect(globeRadius(0, 0)).toBeCloseTo(512 / (2 * Math.PI), 10)
    expect(globeRadius(1, 60)).toBeCloseTo((1024 / (2 * Math.PI)) * 2, 6)
  })

  it('inverts zoom and radius at any latitude', () => {
    for (const lat of [0, 30, -64, 89]) {
      expect(zoomForGlobeRadius(globeRadius(2.3, lat), lat)).toBeCloseTo(2.3, 10)
    }
  })

  it('shrinks the outline for perspective and inverts it exactly', () => {
    const d = cameraDistance(800) // default fov: 1.5 x height
    expect(d).toBeCloseTo(1200, 0)
    const outline = silhouetteRadius(300, d)
    expect(outline).toBeLessThan(300)
    expect(outline).toBeCloseTo(244.9, 1)
    expect(radiusForSilhouette(outline, d)).toBeCloseTo(300, 8)
  })
})

describe('fit zoom', () => {
  const desktop = { width: 1280, height: 800, padTop: 128, padBottom: 60 }
  const phone = { width: 375, height: 640, padTop: 104, padBottom: 48 }

  it('fits the sphere between title and footer, capped on big screens', () => {
    expect(restingOutline({ ...desktop, height: 900 }) * 2).toBe(MAX_REST_DIAMETER)
    expect(restingOutline({ ...desktop, height: 600 }) * 2).toBe(600 - 128 - 60)
    expect(restingOutline(phone) * 2).toBeCloseTo(375 * 0.86, 8)
  })

  it('gives a zoom whose sphere outline has exactly the resting size', () => {
    for (const lat of [0, 30, 64]) {
      const z = restingZoom(desktop, lat)
      const outline = silhouetteRadius(globeRadius(z, lat), cameraDistance(desktop.height))
      expect(outline).toBeCloseTo(restingOutline(desktop), 6)
    }
  })

  it('needs a lower zoom number at high latitudes for the same sphere', () => {
    expect(restingZoom(desktop, 64)).toBeLessThan(restingZoom(desktop, 0))
  })

  it('centres the sphere in the padded area', () => {
    expect(sphereCenterY(desktop)).toBe(128 + (800 - 188) / 2)
  })
})

describe('overlay fade', () => {
  it('is fully visible at rest and gone once zoomed in', () => {
    expect(overlayFade(-0.3)).toBe(1)
    expect(overlayFade(0)).toBe(1)
    expect(overlayFade(0.175)).toBeCloseTo(0.5, 10)
    expect(overlayFade(2)).toBe(0)
  })
})

describe('wrapLng', () => {
  it('wraps into [-180, 180)', () => {
    expect(wrapLng(190)).toBe(-170)
    expect(wrapLng(-190)).toBe(170)
    expect(wrapLng(540)).toBe(-180)
    expect(wrapLng(30.5)).toBe(30.5)
  })
})
