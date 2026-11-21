<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Droplet } from 'lucide-vue-next'
import { WeatherIcon, type Forecast } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import { formatHour } from '@/shared/lib'
import { gsap, useAmbientMotion, useMotion } from '@/shared/lib/motion'

const props = defineProps<{ forecast: Forecast; now: number }>()
const { fmt } = storeToRefs(useSettingsStore())

const COL = 64
const CHART_H = 72
const PAD_Y = 10

const hours = computed(() => {
  const start = props.forecast.hourly.findIndex((h) => h.time + 3600 > props.now)
  return props.forecast.hourly.slice(Math.max(0, start), Math.max(0, start) + 25)
})

const points = computed(() => {
  const temps = hours.value.map((h) => h.temperature)
  const min = Math.min(...temps)
  const range = Math.max(1, Math.max(...temps) - min)
  return hours.value.map((h, i) => ({
    x: i * COL + COL / 2,
    y: PAD_Y + (1 - (h.temperature - min) / range) * (CHART_H - PAD_Y * 2),
  }))
})

/** Smooth curve through the points (Catmull-Rom → cubic Bézier). */
const curve = computed(() => {
  const p = points.value
  if (p.length < 2) return ''
  let d = `M ${p[0]!.x} ${p[0]!.y}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]!
    const p1 = p[i]!
    const p2 = p[i + 1]!
    const p3 = p[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
})
const area = computed(() => {
  const p = points.value
  if (p.length < 2) return ''
  return `${curve.value} L ${p.at(-1)!.x} ${CHART_H} L ${p[0]!.x} ${CHART_H} Z`
})
const width = computed(() => hours.value.length * COL)

const root = ref<HTMLElement>()

/** The temperature line draws itself left to right and the hours follow. */
useMotion(root, (el) => {
  const line = el.querySelector<SVGPathElement>('.hc-curve')
  const length = line?.getTotalLength() ?? 0
  gsap
    .timeline({ defaults: { ease: 'power2.out' } })
    .fromTo(
      line,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: 'power2.inOut',
        clearProps: 'strokeDasharray,strokeDashoffset',
      },
    )
    .from('.hc-area', { opacity: 0, duration: 1 }, 0.5)
    .from(
      '.hc-col',
      { y: 10, opacity: 0, duration: 0.5, stagger: 0.03, clearProps: 'transform,opacity' },
      0.15,
    )
    .from('.hc-now', { scale: 0, svgOrigin: '0 0', duration: 0.4, ease: 'back.out(3)' }, 0)
})

/** A soft ring keeps pulsing around "now". Ambient, so the Pause button stops it too. */
useAmbientMotion(root, () => {
  gsap.fromTo(
    '.hc-pulse',
    { scale: 1, opacity: 0.6 },
    {
      scale: 3,
      opacity: 0,
      svgOrigin: '0 0',
      duration: 1.8,
      ease: 'power1.out',
      repeat: -1,
      repeatDelay: 0.6,
    },
  )
})
</script>

<template>
  <section ref="root" class="pane overflow-hidden" aria-labelledby="hourly-title">
    <h2 id="hourly-title" class="px-6 pt-5 font-display text-lg font-medium sm:px-7">
      Next 24 hours
    </h2>
    <div
      class="scrollbar-none overflow-x-auto px-3 pt-3 pb-5 sm:px-4"
      role="region"
      tabindex="0"
      aria-label="Next 24 hours, scrolls sideways"
    >
      <div class="relative" :style="{ width: `${width}px` }">
        <ol class="flex">
          <li
            v-for="(h, i) in hours"
            :key="h.time"
            class="hc-col flex shrink-0 flex-col items-center"
            :style="{ width: `${COL}px` }"
          >
            <span class="text-sm font-medium" :style="{ marginTop: `${points[i]!.y - 4}px` }">
              {{ fmt.temp(h.temperature) }}
            </span>
            <span :style="{ height: `${CHART_H - points[i]!.y + 4}px` }" aria-hidden="true" />
            <WeatherIcon :code="h.code" :is-day="h.isDay" :size="22" class="mt-3" />
            <span
              class="mt-1.5 flex h-4 items-center gap-0.5 text-xs text-ink"
              :class="h.precipitationChance >= 20 ? '' : 'invisible'"
            >
              <Droplet :size="10" aria-hidden="true" /><span class="sr-only">Chance of rain </span
              >{{ h.precipitationChance }}%
            </span>
            <span class="mt-1.5 text-sm text-ink-muted">
              {{ i === 0 ? 'Now' : formatHour(h.time, forecast.timezone) }}
            </span>
          </li>
        </ol>
        <svg
          class="pointer-events-none absolute top-6 left-0"
          :width="width"
          :height="CHART_H"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hourly-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="var(--color-sun)" stop-opacity="0.28" />
              <stop offset="1" stop-color="var(--color-sun)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path class="hc-area" :d="area" fill="url(#hourly-fill)" />
          <path
            class="hc-curve"
            :d="curve"
            fill="none"
            stroke="var(--color-sun)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <!-- Circles sit at the origin of a translated group, so scaling stays centred on "now"
               even when the hour rolls over and the point moves. -->
          <g :transform="`translate(${points[0]?.x ?? 0} ${points[0]?.y ?? 0})`">
            <circle
              class="hc-pulse"
              r="4"
              fill="none"
              stroke="var(--color-sun)"
              stroke-width="1.5"
              opacity="0"
            />
            <circle class="hc-now" r="4" fill="var(--color-sun)" />
          </g>
        </svg>
      </div>
    </div>
  </section>
</template>
