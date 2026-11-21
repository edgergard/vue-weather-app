<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Navigation } from 'lucide-vue-next'
import { todayOf, type Forecast } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import { compassPoint } from '@/shared/lib'
import { gsap, useMotion } from '@/shared/lib/motion'

const props = defineProps<{ forecast: Forecast }>()
const { fmt } = storeToRefs(useSettingsStore())

const root = ref<HTMLElement>()

useMotion(root, () => {
  gsap.from('.wd-cell', {
    opacity: 0,
    y: 12,
    duration: 0.5,
    stagger: { each: 0.06, grid: 'auto', from: 'start' },
    delay: 0.3,
    ease: 'power2.out',
    clearProps: 'transform,opacity',
  })
  // The wind arrow swings round to its bearing.
  gsap.from('.wd-wind', {
    rotation: '-=180',
    duration: 1.4,
    delay: 0.5,
    ease: 'elastic.out(1, 0.5)',
  })
})

function uvLabel(uv: number) {
  if (uv < 3) return 'Low'
  if (uv < 6) return 'Moderate'
  if (uv < 8) return 'High'
  if (uv < 11) return 'Very high'
  return 'Extreme'
}

function humidityNote(h: number) {
  if (h < 30) return 'Dry air'
  if (h > 75) return 'Muggy'
  return 'Comfortable'
}

const items = computed(() => {
  const c = props.forecast.current
  const uv = todayOf(props.forecast, c.time)?.uvIndex ?? 0
  return [
    {
      key: 'wind',
      label: 'Wind',
      value: fmt.value.wind(c.windSpeed),
      note: `From the ${compassPoint(c.windDirection)}`,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      value: `${Math.round(c.humidity)}%`,
      note: humidityNote(c.humidity),
    },
    { key: 'uv', label: 'UV index', value: String(Math.round(uv)), note: `${uvLabel(uv)} today` },
    {
      key: 'pressure',
      label: 'Pressure',
      value: `${Math.round(c.pressure)} hPa`,
      note: 'At sea level',
    },
    {
      key: 'visibility',
      label: 'Visibility',
      value: fmt.value.distance(c.visibility),
      note: c.visibility >= 10_000 ? 'Clear view' : 'Reduced',
    },
    {
      key: 'precipitation',
      label: 'Precipitation',
      value: `${c.precipitation.toFixed(1)} mm`,
      note: 'In the last hour',
    },
  ]
})
</script>

<template>
  <section ref="root" class="pane p-2 sm:p-3" aria-labelledby="details-title">
    <h2 id="details-title" class="px-4 pt-3 pb-2 font-display text-lg font-medium">Right now</h2>
    <dl class="grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] bg-line">
      <div
        v-for="item in items"
        :key="item.key"
        class="wd-cell bg-[color-mix(in_oklab,var(--sky-bottom)_88%,black)] px-4 py-4"
      >
        <dt class="text-sm text-ink-muted">{{ item.label }}</dt>
        <dd class="mt-1 flex items-center gap-2 font-display text-2xl font-medium tracking-tight">
          {{ item.value }}
          <Navigation
            v-if="item.key === 'wind'"
            :size="16"
            class="wd-wind text-ink-muted"
            :style="{ transform: `rotate(${forecast.current.windDirection + 180}deg)` }"
            aria-hidden="true"
          />
        </dd>
        <dd class="mt-0.5 text-sm text-ink-muted">{{ item.note }}</dd>
      </div>
    </dl>
  </section>
</template>
