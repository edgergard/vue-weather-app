<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { storeToRefs } from 'pinia'
import { onKeyStroke, useDevicePixelRatio, useEventListener, useResizeObserver } from '@vueuse/core'
import type {
  Map as MapLibreMap,
  MapLibreEvent,
  MapMouseEvent,
  Marker as MapLibreMarker,
} from 'maplibre-gl'
// The worker is a separate ES module in MapLibre 6; Vite emits it as an asset next to the chunk.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GLOBE_CITIES, reverseGeocode } from '@/entities/place'
import { describeCode, useCurrentWeatherMany } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import ErrorNotice from '@/shared/ui/ErrorNotice.vue'
import { motionAllowed, useSuspendAmbient } from '@/shared/lib/motion'
import {
  cameraDistance,
  cullMargin,
  DEFAULT_FOV,
  globeRadius,
  overlayFade,
  restingOutline,
  restingZoom,
  silhouetteRadius,
  sphereCenterY,
  stagePadding,
  wrapLng,
  type StageMetrics,
} from '../lib/geometry'
import { buildGlobeStyle, PLACE_LABEL_LAYERS } from '../lib/globeStyle'
import { placeFromFeature, regionWithout } from '../lib/placeFeature'
import { useAutoSpin } from '../model/useAutoSpin'
import GlobeCityCard, { type GlobeCardPlace } from './GlobeCityCard.vue'
import GlobeAttribution from './GlobeAttribution.vue'

interface Selection extends GlobeCardPlace {
  key: string
  /** Index into GLOBE_CITIES, or null for a settlement picked from the map's labels. */
  cityIndex: number | null
}

/** Degrees of longitude per millisecond: one turn in a minute and a half. */
const SPIN_SPEED = 0.004
/** Past this many zoom levels above the resting globe, the camera stays put. */
const SPIN_MAX_RELATIVE_ZOOM = 0.8
/** Opening a city zooms in at least this much past the resting globe. */
const SELECT_RELATIVE_ZOOM = 0.6
const START = { lng: 24, lat: 30 }
/** Map canvas resolution cap: sharp enough on high-DPI screens at well under half the pixels. */
const MAX_PIXEL_RATIO = 1.5
/** Marks the camera jumps made by the auto-spin, so 'moveend' handlers can skip them. */
const SPIN_EVENT = { autoSpin: true } as const
const RAD = Math.PI / 180

const cities = GLOBE_CITIES
const coords = cities.map((c) => ({ lat: c.lat, lon: c.lon }))
/** Per-city trigonometry, computed once: culling runs on every frame of the spin. */
const cityTrig = cities.map((c) => ({
  sinLat: Math.sin(c.lat * RAD),
  cosLat: Math.cos(c.lat * RAD),
  lon: c.lon * RAD,
}))

const { fmt } = storeToRefs(useSettingsStore())
const { data: snapshots } = useCurrentWeatherMany(coords)

const stage = useTemplateRef<HTMLDivElement>('stage')
const container = useTemplateRef<HTMLDivElement>('container')
const card = useTemplateRef<InstanceType<typeof GlobeCityCard>>('card')
const instructionsId = useId()

const status = ref<'loading' | 'ready' | 'failed'>('loading')
const failure = ref<'webgl' | 'network' | null>(null)
const tilesFailed = ref(false)
const selected = ref<Selection | null>(null)
const announcement = ref('')
const zoomedIn = ref(false)
/** Keyboard focus is on the map or a marker: the globe holds still. */
const keyboardInside = ref(false)

const markerEls: (HTMLButtonElement | null)[] = []
/**
 * Which markers are hidden. Markers start hidden (and out of the tab order) until the map has
 * placed them. Kept outside Vue: culling flips a few attributes on a few buttons per frame,
 * which is far cheaper than re-rendering the template with all 42 of them.
 */
const hidden = cities.map(() => true)
/** Stage size, read only when it changes: reading it on every frame forces a style recalc. */
const size = { width: 0, height: 0 }
/** The camera state the halo was last painted for; the spin changes only the longitude. */
let painted = { zoom: NaN, lat: NaN, width: NaN, height: NaN }
let map: MapLibreMap | null = null
let markers: MapLibreMarker[] = []
let disposed = false
let touched = false
let tilesLoaded = false
let returnFocusTo: HTMLElement | null = null
let lookupSeq = 0

// ---- Weather text -------------------------------------------------------------------------

const tempOf = (i: number) => {
  const s = snapshots.value?.[i]
  return s ? fmt.value.temp(s.temperature) : null
}
const spoken = (temp: string) => temp.replace('°', ' degrees')

function markerLabel(i: number) {
  const city = cities[i]!
  const temp = tempOf(i)
  return `${city.name}, ${city.country}${temp ? `, ${spoken(temp)}` : ''}`
}

const selectedSnapshot = computed(() => {
  const i = selected.value?.cityIndex
  return i === null || i === undefined ? null : (snapshots.value?.[i] ?? null)
})

// ---- Geometry -----------------------------------------------------------------------------

function measure() {
  size.width = stage.value?.clientWidth ?? 0
  size.height = stage.value?.clientHeight ?? 0
}

function metrics(): StageMetrics {
  const { width, height } = size
  const pad = stagePadding(width)
  return { width, height, padTop: pad.top, padBottom: pad.bottom }
}

const fov = () => map?.getVerticalFieldOfView() ?? DEFAULT_FOV
const restZoomAt = (lat: number) => restingZoom(metrics(), lat, fov())
const relativeZoom = () => (map ? map.getZoom() - restZoomAt(map.getCenter().lat) : 0)

/** Sizes the halo and glass highlight to the sphere and fades them as the camera moves in. */
function paintOverlay() {
  const el = stage.value
  if (!el) return
  const m = metrics()
  let radius = restingOutline(m)
  let fade = 1
  if (map) {
    const { lat } = map.getCenter()
    const zoom = map.getZoom()
    const p = painted
    if (p.zoom === zoom && p.lat === lat && p.width === m.width && p.height === m.height) return
    painted = { zoom, lat, width: m.width, height: m.height }
    radius = silhouetteRadius(globeRadius(map.getZoom(), lat), cameraDistance(m.height, fov()))
    const rel = map.getZoom() - restingZoom(m, lat, fov())
    fade = overlayFade(rel)
    const isZoomedIn = rel > SPIN_MAX_RELATIVE_ZOOM
    if (zoomedIn.value !== isZoomedIn) zoomedIn.value = isZoomedIn
  }
  el.style.setProperty('--globe-r', `${Math.min(radius, 4000).toFixed(1)}px`)
  el.style.setProperty('--globe-cy', `${sphereCenterY(m)}px`)
  el.style.setProperty('--globe-fade', fade.toFixed(3))
}

function updateMinZoom(e?: MapLibreEvent & { autoSpin?: boolean }) {
  // The spin moves only the longitude, so the minimum zoom (which depends on latitude) holds.
  if (!map || e?.autoSpin) return
  const min = restZoomAt(map.getCenter().lat) - 0.3
  if (Math.abs(map.getMinZoom() - min) > 0.01) map.setMinZoom(min)
}

/** Keeps the sphere centred between title and footer; until touched, it also keeps its size. */
function fit() {
  if (!map) return paintOverlay()
  const m = metrics()
  map.setPadding({ top: m.padTop, bottom: m.padBottom, left: 0, right: 0 })
  updateMinZoom()
  if (!touched) map.jumpTo({ zoom: restZoomAt(map.getCenter().lat) })
  paintOverlay()
}

/** Shows or hides one marker: out of sight, out of the tab order and out of the a11y tree. */
function setHidden(i: number, hide: boolean) {
  hidden[i] = hide
  const el = markerEls[i]
  if (!el) return
  el.dataset.hidden = String(hide)
  el.tabIndex = hide ? -1 : 0
  if (hide) el.setAttribute('aria-hidden', 'true')
  else el.removeAttribute('aria-hidden')
}

/**
 * Hides markers on the far side of the sphere or off screen. Runs on every move, so it reads
 * no layout and touches only the markers whose state changed.
 */
function cull() {
  if (!map) return
  const center = map.getCenter()
  const zoom = map.getZoom()
  const { width: w, height: h } = size
  // Hide at the real horizon (it moves closer as the camera zooms in), where MapLibre makes the
  // marker transparent, so an invisible marker is never clickable, focusable or announced.
  const margin = cullMargin(globeRadius(zoom, center.lat), cameraDistance(h, fov()))
  // At rest the whole sphere fits on the stage; only a zoomed-in globe can put a city off screen.
  const checkBounds = zoom > restZoomAt(center.lat) + 0.05
  const sinC = Math.sin(center.lat * RAD)
  const cosC = Math.cos(center.lat * RAD)
  const lonC = center.lng * RAD
  let focusLost = false
  for (let i = 0; i < cities.length; i++) {
    const t = cityTrig[i]!
    // cosAngle() from geometry.ts, with the city's half precomputed.
    let hide = sinC * t.sinLat + cosC * t.cosLat * Math.cos(t.lon - lonC) < margin
    if (!hide && checkBounds) {
      const city = cities[i]!
      const p = map.project([city.lon, city.lat])
      hide = p.x < -24 || p.y < -24 || p.x > w + 24 || p.y > h + 24
    }
    if (hide === hidden[i]) continue
    if (hide && markerEls[i] === document.activeElement) focusLost = true
    setHidden(i, hide)
  }
  // Never leave keyboard focus on a marker that just disappeared.
  if (focusLost) map.getCanvas().focus({ preventScroll: true })
}

// ---- Motion -------------------------------------------------------------------------------

const spin = useAutoSpin({
  enabled: () =>
    status.value === 'ready' && !selected.value && !zoomedIn.value && !keyboardInside.value,
  onFrame(dt) {
    if (!map || map.isMoving()) return
    const c = map.getCenter()
    map.jumpTo({ center: [wrapLng(c.lng + dt * SPIN_SPEED), c.lat] }, SPIN_EVENT)
  },
})

function onUserInteraction() {
  touched = true
  spin.interrupt()
}

function flyToPlace(place: GlobeCardPlace) {
  if (!map) return
  const zoom = Math.min(
    map.getMaxZoom(),
    restZoomAt(place.lat) + Math.max(relativeZoom(), SELECT_RELATIVE_ZOOM),
  )
  const center: [number, number] = [place.lon, place.lat]
  // On phones the card covers the lower part of the globe: settle the place above it.
  const lift = metrics().width < 640 ? 90 : 0
  if (motionAllowed()) {
    map.flyTo({ center, zoom, offset: [0, -lift], duration: 1600, curve: 1.2, essential: false })
  } else {
    map.jumpTo({ center, zoom })
    if (lift) map.panBy([0, lift], { animate: false })
  }
}

// ---- Selection ----------------------------------------------------------------------------

async function announce(place: Selection) {
  const where = place.region ? `${place.name}, ${place.region}` : place.name
  const snap = place.cityIndex === null ? null : snapshots.value?.[place.cityIndex]
  const weather = snap
    ? ` ${spoken(fmt.value.temp(snap.temperature))}, ${describeCode(snap.code).label.toLowerCase()}.`
    : ''
  announcement.value = ''
  await nextTick()
  announcement.value = `${where}.${weather} Open forecast is in the card.`
}

function select(place: Selection, opts: { keyboard: boolean; trigger: HTMLElement | null }) {
  selected.value = place
  returnFocusTo = opts.trigger
  touched = true
  spin.interrupt()
  void announce(place)
  flyToPlace(place)
  if (opts.keyboard) void nextTick(() => card.value?.focus())
  if (place.cityIndex === null) void lookupRegion(place)
}

/** Places picked off the map come without a country: look it up, but never wait for it. */
async function lookupRegion(place: Selection) {
  const seq = ++lookupSeq
  const found = await reverseGeocode(place.lat, place.lon)
  if (seq !== lookupSeq || disposed || selected.value?.key !== place.key) return
  const region = regionWithout(place.name, found.region)
  if (region) selected.value = { ...selected.value, region }
}

function close(restoreFocus: boolean) {
  if (!selected.value) return
  selected.value = null
  lookupSeq++
  spin.interrupt()
  if (restoreFocus) {
    const target = returnFocusTo
    if (target?.isConnected && target.tabIndex >= 0) target.focus()
    else map?.getCanvas().focus()
  }
  returnFocusTo = null
}

function onMarkerClick(i: number, e: MouseEvent) {
  e.stopPropagation()
  const key = `city:${i}`
  if (selected.value?.key === key) return close(false)
  const city = cities[i]!
  select(
    { key, name: city.name, region: city.country, lat: city.lat, lon: city.lon, cityIndex: i },
    // A click with detail 0 came from the keyboard (Enter or Space).
    { keyboard: e.detail === 0, trigger: e.currentTarget as HTMLElement },
  )
}

/** Clicking the name of any city, town or village on the map picks it. */
function onMapClick(e: MapMouseEvent) {
  if (!map) return
  const target = e.originalEvent.target
  if (target instanceof Element && target.closest('[data-globe-marker]')) return
  const { x, y } = e.point
  const features = map.queryRenderedFeatures(
    [
      [x - 6, y - 6],
      [x + 6, y + 6],
    ],
    { layers: [...PLACE_LABEL_LAYERS] },
  )
  const picked = features.map(placeFromFeature).find((p) => p !== null)
  if (!picked) return
  const key = `map:${picked.lat.toFixed(4)},${picked.lon.toFixed(4)}`
  if (selected.value?.key === key) return
  select({ ...picked, key, region: '', cityIndex: null }, { keyboard: false, trigger: null })
}

onKeyStroke('Escape', (e) => {
  if (!selected.value) return
  // Escape in the header search belongs to the search box.
  const target = e.target as Node | null
  if (target && target !== document.body && !stage.value?.contains(target)) return
  e.preventDefault()
  close(true)
})

// ---- Map lifecycle ------------------------------------------------------------------------

async function init() {
  status.value = 'loading'
  failure.value = null
  let lib: typeof import('maplibre-gl')
  try {
    lib = await import('maplibre-gl')
  } catch {
    if (!disposed) fail('network')
    return
  }
  if (disposed || !container.value) return
  lib.setWorkerUrl(workerUrl)

  try {
    map = new lib.Map({
      container: container.value,
      style: buildGlobeStyle({ markerNames: cities.map((c) => c.name) }),
      center: [START.lng, START.lat],
      zoom: restZoomAt(START.lat),
      maxZoom: 12,
      pixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
      validateStyle: import.meta.env.DEV, // our own style, already checked by the tests
      refreshExpiredTiles: false, // no refetching of the same tiles during a long spin
      attributionControl: false, // credits are shown in our own, always-visible line
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      locale: { 'Map.Title': 'Globe map' },
    })
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Globe: map could not start', error)
    map = null
    fail('webgl')
    return
  }

  // Dev-only handle for inspecting the map from the console (stripped from production builds).
  if (import.meta.env.DEV) (window as unknown as { __globe: MapLibreMap }).__globe = map
  map.touchZoomRotate.disableRotation()
  map.keyboard.disableRotation()
  map.getCanvas().setAttribute('aria-describedby', instructionsId)

  markers = cities.map((city, i) =>
    new lib.Marker({
      element: markerEls[i]!,
      anchor: 'left',
      // Put the centre of the dot, not the edge of the button, on the city.
      offset: [city.tier === 1 ? -5 : -3.5, 0],
      opacityWhenCovered: 0,
      // Without this, every 'moveend' (each spin frame) snaps markers to whole pixels, so they
      // step while the globe turns smoothly under them.
      subpixelPositioning: true,
    })
      .setLngLat([city.lon, city.lat])
      .addTo(map!),
  )

  map.on('load', () => {
    status.value = 'ready'
    fit()
    cull()
  })
  map.on('move', () => {
    cull()
    paintOverlay()
  })
  map.on('moveend', updateMinZoom)
  map.on('click', onMapClick)
  map.on('mouseenter', [...PLACE_LABEL_LAYERS], () => {
    if (map) map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', [...PLACE_LABEL_LAYERS], () => {
    if (map) map.getCanvas().style.cursor = ''
  })
  map.on('sourcedata', (e) => {
    if (!e.tile) return
    tilesLoaded = true
    tilesFailed.value = false
  })
  // Tiles or fonts failing is not fatal: the globe, markers and cards keep working.
  map.on('error', (e) => {
    if (import.meta.env.DEV) console.warn('Globe:', e.error)
    if (!tilesLoaded) tilesFailed.value = true
  })
  fit()
}

function fail(kind: 'webgl' | 'network') {
  status.value = 'failed'
  failure.value = kind
}

function onFailureAction() {
  if (failure.value === 'network') return void init()
  document.querySelector<HTMLInputElement>('header input[type="search"]')?.focus()
}

onMounted(() => {
  measure()
  paintOverlay()
  void init()
})

// Browser zoom or a move to another monitor changes the pixel ratio; keep the canvas sharp (and
// capped) instead of keeping the ratio it started with.
const { pixelRatio } = useDevicePixelRatio()
watch(pixelRatio, (dpr) => map?.setPixelRatio(Math.min(dpr || 1, MAX_PIXEL_RATIO)))

useResizeObserver(stage, () => {
  measure()
  map?.resize()
  fit()
})

// User input stops the spin; it resumes after a few idle seconds.
for (const type of ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const) {
  useEventListener(container, type, onUserInteraction, { passive: true })
}
useEventListener(container, 'focusin', (e: FocusEvent) => {
  keyboardInside.value = e.target instanceof Element && e.target.matches(':focus-visible')
})
useEventListener(container, 'focusout', (e: FocusEvent) => {
  if (!container.value?.contains(e.relatedTarget as Node | null)) keyboardInside.value = false
})
// Focusing something outside an overflow:hidden box scrolls the box. Never let the map drift.
for (const el of [stage, container]) {
  useEventListener(el, 'scroll', (e: Event) => {
    const box = e.currentTarget as HTMLElement
    box.scrollTop = 0
    box.scrollLeft = 0
  })
}

// The globe covers most of the sky: let the sky's loops rest while it is open.
useSuspendAmbient()

onBeforeUnmount(() => {
  disposed = true
  lookupSeq++
  markers.forEach((m) => m.remove())
  markers = []
  map?.remove()
  map = null
})
</script>

<template>
  <div
    ref="stage"
    class="globe-stage relative h-[max(32rem,calc(100svh-5rem))] overflow-hidden max-sm:h-[max(30rem,calc(100svh-8rem))]"
  >
    <div v-if="!failure" class="globe-halo" aria-hidden="true" />
    <div v-if="status === 'loading'" class="globe-placeholder animate-pulse" aria-hidden="true" />

    <div
      class="absolute inset-0 z-[1] transition-opacity duration-700"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    >
      <!-- MapLibre owns this element (and adds its own classes), so it has no Vue bindings. -->
      <div
        ref="container"
        class="size-full"
        role="group"
        aria-label="Interactive globe"
        :aria-describedby="instructionsId"
      />
    </div>

    <div class="globe-gloss" :class="status === 'ready' ? '' : 'opacity-0!'" aria-hidden="true" />

    <div class="pointer-events-none absolute inset-x-0 top-0 z-[3] px-4 pt-5 text-center sm:pt-7">
      <slot name="intro" />
    </div>
    <p :id="instructionsId" class="sr-only">
      Drag, or use the arrow keys, to spin the globe; plus and minus zoom. Each city is a button
      with its current temperature. Zoom in to pick any town by clicking its name. You can also find
      any city with the search at the top of the page.
    </p>

    <div
      class="absolute inset-x-0 bottom-3 z-[3] flex flex-col items-center gap-2 px-4 sm:items-start sm:px-6"
    >
      <p
        v-if="tilesFailed"
        role="status"
        class="rounded-full border border-line bg-[rgb(26_12_48/0.5)] px-3 py-1 text-xs text-ink"
      >
        Map details didn't load. City markers still work.
      </p>
      <GlobeAttribution />
    </div>

    <Transition
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0 translate-y-2"
      enter-active-class="transition duration-300 ease-out-soft"
      leave-active-class="transition duration-200 ease-in"
    >
      <GlobeCityCard
        v-if="selected"
        ref="card"
        :place="selected"
        :snapshot="selectedSnapshot"
        class="absolute inset-x-4 bottom-16 z-[4] sm:inset-x-auto sm:right-[max(1.5rem,calc((100%-72rem)/2+2rem))] sm:bottom-14 sm:w-[19rem]"
        @close="close(true)"
      />
    </Transition>

    <div v-if="failure" class="absolute inset-0 z-[5] grid place-items-center px-4">
      <ErrorNotice
        class="max-w-lg"
        :title="failure === 'webgl' ? 'This device can’t show the globe' : 'The globe didn’t load'"
        :detail="
          failure === 'webgl'
            ? 'The 3D map needs WebGL, which your browser couldn’t start. You can still find any city with the search at the top.'
            : 'Check your connection and try again, or find a city with the search at the top.'
        "
        :action-label="failure === 'webgl' ? 'Search for a city' : 'Try again'"
        @retry="onFailureAction"
      />
    </div>

    <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>

    <!-- City markers. MapLibre moves each button into the map once it has loaded. -->
    <div hidden>
      <button
        v-for="(city, i) in cities"
        :key="city.name"
        :ref="(el) => (markerEls[i] = el as HTMLButtonElement | null)"
        type="button"
        class="globe-marker"
        data-globe-marker
        :data-tier="city.tier"
        data-hidden="true"
        tabindex="-1"
        aria-hidden="true"
        :aria-pressed="selected?.cityIndex === i ? 'true' : 'false'"
        :aria-label="markerLabel(i)"
        @click="onMarkerClick(i, $event)"
      >
        <span class="globe-marker__inner">
          <span class="globe-marker__dot" aria-hidden="true" />
          <span class="globe-marker__label" aria-hidden="true">
            {{ city.name }}<em v-if="tempOf(i)">{{ tempOf(i) }}</em>
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ---- Halo, loading placeholder and glass highlight, sized to the sphere from JS ---- */
.globe-halo,
.globe-gloss,
.globe-placeholder {
  position: absolute;
  left: calc(50% - var(--globe-r, 200px));
  top: calc(var(--globe-cy, 50%) - var(--globe-r, 200px));
  width: calc(var(--globe-r, 200px) * 2);
  height: calc(var(--globe-r, 200px) * 2);
  border-radius: 50%;
  pointer-events: none;
}

.globe-halo {
  z-index: 0;
  transform: scale(1.32);
  opacity: var(--globe-fade, 1);
  background: radial-gradient(
    closest-side,
    rgb(168 110 255 / 0) 70%,
    rgb(168 110 255 / 0.4) 76.5%,
    rgb(168 110 255 / 0.12) 87%,
    transparent 100%
  );
}

.globe-placeholder {
  z-index: 0;
  background: radial-gradient(circle at 40% 35%, rgb(152 118 207 / 0.45), rgb(43 21 82 / 0.55));
}

.globe-gloss {
  z-index: 2;
  opacity: var(--globe-fade, 1);
  transition: opacity 0.5s;
  background:
    radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.16), transparent 45%),
    radial-gradient(circle at 70% 78%, rgb(20 6 50 / 0.45), transparent 60%);
}

/* ---- City markers: glass pills with the temperature ---- */
.globe-marker {
  appearance: none;
  border: 0;
  background: none;
  padding: 0;
  color: var(--color-ink);
  font: inherit;
}

/* A comfortable hit area, even for the small dots. */
.globe-marker::before {
  content: '';
  position: absolute;
  inset: -8px -6px;
}

.globe-marker:hover,
.globe-marker:focus-visible {
  z-index: 3;
}

.globe-marker[aria-pressed='true'] {
  z-index: 2;
}

.globe-marker__inner {
  display: flex;
  align-items: center;
  gap: 6px;
  transition:
    opacity 0.25s,
    visibility 0.25s;
}

/* MapLibre sets opacity on the button itself, so far-side fading happens one level down. */
.globe-marker[data-hidden='true'] {
  pointer-events: none;
}

.globe-marker[data-hidden='true'] .globe-marker__inner {
  opacity: 0;
  visibility: hidden;
}

.globe-marker__dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 3px rgb(255 255 255 / 0.25);
  transition: transform 0.2s;
}

.globe-marker__label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 600;
  background: rgb(26 12 48 / 0.62);
  border: 1px solid var(--color-line);
}

.globe-marker__label em {
  font-style: normal;
  font-weight: 500;
  color: var(--color-ink-muted);
}

.globe-marker[data-tier='2'] .globe-marker__dot {
  width: 7px;
  height: 7px;
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.2);
}

.globe-marker[data-tier='2'] .globe-marker__label {
  display: none;
}

.globe-marker[data-tier='2']:is(:hover, :focus-visible) .globe-marker__label,
.globe-marker[aria-pressed='true'] .globe-marker__label {
  display: flex;
}

.globe-marker:is(:hover, :focus-visible, [aria-pressed='true']) .globe-marker__dot {
  transform: scale(1.35);
}

.globe-marker[aria-pressed='true'] .globe-marker__label {
  background: var(--color-ink);
  color: #2a1745;
}

.globe-marker[aria-pressed='true'] .globe-marker__label em {
  color: #4b2d75;
}

/* The focus ring (same white ring with dark halo as everywhere else) goes around the pill. */
.globe-marker:focus-visible {
  outline: none;
  box-shadow: none;
}

.globe-marker:focus-visible .globe-marker__label {
  outline: 2px solid #fff;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #1a0f2c;
}
</style>
