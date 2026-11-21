<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Droplet } from 'lucide-vue-next'
import { describeCode, todayIndex, WeatherIcon, type Forecast } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import { formatWeekday } from '@/shared/lib'
import { gsap, useMotion } from '@/shared/lib/motion'

const props = defineProps<{ forecast: Forecast; now: number }>()
const { fmt } = storeToRefs(useSettingsStore())

/** Starts at the place's current local day, so a forecast cached overnight never shows yesterday. */
const days = computed(() => props.forecast.daily.slice(todayIndex(props.forecast.daily, props.now)))

const bounds = computed(() => {
  const d = days.value
  const min = Math.min(...d.map((x) => x.min))
  const max = Math.max(...d.map((x) => x.max))
  return { min, span: Math.max(1, max - min) }
})

const root = ref<HTMLElement>()

/** Each day's temperature range grows out from its low end, one row after another. */
useMotion(root, () => {
  gsap
    .timeline({ delay: 0.2 })
    .from('.df-row', {
      opacity: 0,
      x: -8,
      duration: 0.45,
      stagger: 0.05,
      ease: 'power2.out',
      clearProps: 'transform,opacity',
    })
    .from(
      '.df-range',
      {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.8,
        stagger: 0.05,
        ease: 'power3.out',
      },
      0.15,
    )
    .from('.df-now', { scale: 0, duration: 0.4, ease: 'back.out(3)' }, '-=0.4')
})

const pct = (t: number) => ((t - bounds.value.min) / bounds.value.span) * 100
</script>

<template>
  <section ref="root" class="pane p-2 sm:p-3" aria-labelledby="daily-title">
    <h2 id="daily-title" class="px-4 pt-3 pb-2 font-display text-lg font-medium">
      Next {{ days.length }} days
    </h2>
    <ul>
      <li
        v-for="(day, i) in days"
        :key="day.time"
        class="df-row grid grid-cols-[3rem_1.5rem_3rem_1fr] items-center gap-x-2.5 rounded-2xl px-3 py-2.5 sm:gap-x-3 sm:px-4 sm:grid-cols-[4rem_2rem_3rem_1fr]"
        :class="i === 0 ? 'bg-veil' : ''"
      >
        <span class="font-medium">{{
          i === 0 ? 'Today' : formatWeekday(day.time, forecast.timezone)
        }}</span>
        <WeatherIcon :code="day.code" :size="22" />
        <span
          class="flex items-center gap-0.5 text-xs text-ink"
          :class="day.precipitationChance >= 20 ? '' : 'invisible'"
          :aria-hidden="day.precipitationChance < 20"
        >
          <Droplet :size="10" aria-hidden="true" /><span class="sr-only">Chance of rain </span
          >{{ day.precipitationChance }}%
        </span>
        <span class="flex items-center gap-2 sm:gap-3">
          <span class="min-w-8 text-right text-ink-muted"
            ><span class="sr-only">Low </span>{{ fmt.temp(day.min) }}</span
          >
          <span class="relative h-1.5 min-w-6 flex-1 rounded-full bg-shade" aria-hidden="true">
            <span
              class="df-range absolute inset-y-0 rounded-full bg-linear-to-r from-violet-300 to-sun"
              :style="{ left: `${pct(day.min)}%`, right: `${100 - pct(day.max)}%` }"
            />
            <span
              v-if="i === 0"
              class="df-now absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2a1745] bg-white"
              :style="{ left: `${pct(forecast.current.temperature)}%` }"
              aria-hidden="true"
            />
          </span>
          <span class="min-w-8 font-medium"
            ><span class="sr-only">High </span>{{ fmt.temp(day.max) }}</span
          >
          <span class="sr-only">{{ describeCode(day.code).label }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>
