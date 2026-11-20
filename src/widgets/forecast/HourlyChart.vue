<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Droplet } from 'lucide-vue-next'
import { WeatherIcon, type Forecast } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import { formatHour } from '@/shared/lib'

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
</script>

<template>
  <section class="pane overflow-hidden" aria-labelledby="hourly-title">
    <h2 id="hourly-title" class="px-6 pt-5 font-display text-lg font-medium sm:px-7">
      Next 24 hours
    </h2>
    <div
      class="scrollbar-none overflow-x-auto px-3 pt-3 pb-5 sm:px-4"
      tabindex="0"
      aria-label="Hourly forecast, scrollable"
    >
      <div class="relative" :style="{ width: `${width}px` }">
        <ol class="flex">
          <li
            v-for="(h, i) in hours"
            :key="h.time"
            class="flex shrink-0 flex-col items-center"
            :style="{ width: `${COL}px` }"
          >
            <span class="text-sm font-medium" :style="{ marginTop: `${points[i]!.y - 4}px` }">
              {{ fmt.temp(h.temperature) }}
            </span>
            <span :style="{ height: `${CHART_H - points[i]!.y + 4}px` }" aria-hidden="true" />
            <WeatherIcon :code="h.code" :is-day="h.isDay" :size="22" class="mt-3" />
            <span
              class="mt-1.5 flex h-4 items-center gap-0.5 text-xs text-violet-100"
              :class="h.precipitationChance >= 20 ? '' : 'invisible'"
            >
              <Droplet :size="10" aria-hidden="true" />{{ h.precipitationChance }}%
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
          <path :d="area" fill="url(#hourly-fill)" />
          <path
            :d="curve"
            fill="none"
            stroke="var(--color-sun)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle :cx="points[0]?.x" :cy="points[0]?.y" r="4" fill="var(--color-sun)" />
        </svg>
      </div>
    </div>
  </section>
</template>
