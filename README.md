# Skyline — Vue weather app

Forecasts for the places you care about. The whole interface is painted with the sky of the place
you're looking at: its current weather and its real local time of day (dawn, day, dusk, night),
with the sun tracking its actual position between sunrise and sunset.

- [Demo](https://edgergard.github.io/vue-weather-app/)
- Weather & geocoding: [Open-Meteo](https://open-meteo.com/) (free, no API key)
- Reverse geocoding for "use my location": [Nominatim / OpenStreetMap](https://nominatim.org/)

## Features

- City search with keyboard navigation (`/` to focus, arrows, Enter, Esc)
- "Use my location" via the browser Geolocation API
- Current conditions, 24-hour temperature curve, 10-day forecast with temperature ranges, details
  (wind, humidity, UV, pressure, visibility, precipitation), sunrise/sunset arc
- Saved places with live temperatures, persisted in `localStorage` (places saved by v1 are migrated)
- °C / °F switch (defaults from the browser locale)
- Shareable URLs: `#/forecast/:lat/:lon?name=…`
- Animated with GSAP: a flowing sky (drifting colour fields, a slowly turning gradient, an
  accent shimmer), weather particles (rain, snow, fog, stars, lightning) and entrance animations
  (the temperature counts up, the sun rolls along its arc, the hourly line draws itself)
- Responsive, keyboard accessible (WCAG 2.2 AA). All motion is off under
  `prefers-reduced-motion`, and a footer button pauses the looping background

## Stack

Vue 3.5 (`<script setup>`), TypeScript (strict), Vite 6, Tailwind CSS 4, Pinia, TanStack Query,
VueUse, Vue Router, GSAP (with SplitText), Lucide icons, Vitest.

## Architecture

The code follows a [Feature-Sliced](https://feature-sliced.design/)-style layering. Each layer may
only import from layers below it.

```
src/
  app/        bootstrap: main.ts, router, global styles, App shell
  pages/      route screens: HomePage, ForecastPage
  widgets/    composed UI blocks: header, sky backdrop, saved places, forecast sections
  features/   user actions: search a place, locate me, save a place, switch units
  entities/   domain: weather (API, mapping, conditions, sky), place (API, store, routes), settings
  shared/     framework-agnostic helpers: http client, formatting (units, time), base UI
```

Key decisions:

- **Server state vs client state.** Forecasts and search results live in TanStack Query (caching,
  deduplication, background refresh, retries). Saved places and settings live in Pinia stores
  persisted with `useLocalStorage`.
- **DTO → domain mapping.** The API layer converts Open-Meteo's column-oriented payload into typed
  domain objects; components never see raw API shapes.
- **Time zones.** All timestamps are unix seconds and are always formatted in the place's own time
  zone, never the browser's.
- **The sky** (`entities/weather/lib/sky.ts`) is a pure function of forecast + time, unit-tested,
  and painted by a single `SkyBackdrop` widget through CSS custom properties.
- **Motion** goes through `shared/lib/motion.ts`: `useMotion` (one-off, inside a GSAP
  `matchMedia` context so it is skipped under reduced motion and reverted on unmount),
  `useAmbientMotion` (looping, follows the Pause button) and `useTweened` (count-ups). Ambient
  layers animate only `transform` and `opacity`.
- To test animations on a machine with reduced motion turned on, run
  `localStorage.setItem('skyline:force-motion', '1')` in the dev server (ignored in production).

## Development

```bash
npm install
npm run dev        # start dev server
npm test           # unit tests
npm run typecheck  # vue-tsc
npm run lint       # eslint
npm run build      # production build
npm run deploy     # build and publish dist/ to GitHub Pages
```
