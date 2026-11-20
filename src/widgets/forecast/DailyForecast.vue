<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Droplet } from 'lucide-vue-next'
import { describeCode, WeatherIcon, type Forecast } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import { formatWeekday } from '@/shared/lib'

const props = defineProps<{ forecast: Forecast }>()
const { fmt } = storeToRefs(useSettingsStore())

const bounds = computed(() => {
  const d = props.forecast.daily
  const min = Math.min(...d.map((x) => x.min))
  const max = Math.max(...d.map((x) => x.max))
  return { min, span: Math.max(1, max - min) }
})

const pct = (t: number) => ((t - bounds.value.min) / bounds.value.span) * 100
</script>

<template>
  <section class="pane p-2 sm:p-3" aria-labelledby="daily-title">
    <h2 id="daily-title" class="px-4 pt-3 pb-2 font-display text-lg font-medium">Next 10 days</h2>
    <ul>
      <li
        v-for="(day, i) in forecast.daily"
        :key="day.time"
        class="grid grid-cols-[3rem_1.5rem_3rem_1fr] items-center gap-x-2.5 rounded-2xl px-3 py-2.5 sm:gap-x-3 sm:px-4 sm:grid-cols-[4rem_2rem_3rem_1fr]"
        :class="i === 0 ? 'bg-veil' : ''"
      >
        <span class="font-medium">{{
          i === 0 ? 'Today' : formatWeekday(day.time, forecast.timezone)
        }}</span>
        <WeatherIcon :code="day.code" :size="22" />
        <span
          class="flex items-center gap-0.5 text-xs text-violet-100"
          :class="day.precipitationChance >= 20 ? '' : 'invisible'"
          :aria-hidden="day.precipitationChance < 20"
        >
          <Droplet :size="10" aria-hidden="true" />{{ day.precipitationChance }}%
        </span>
        <span class="flex items-center gap-3">
          <span class="w-9 text-right text-ink-muted">{{ fmt.temp(day.min) }}</span>
          <span class="relative h-1.5 flex-1 rounded-full bg-shade">
            <span
              class="absolute inset-y-0 rounded-full bg-linear-to-r from-violet-300 to-sun"
              :style="{ left: `${pct(day.min)}%`, right: `${100 - pct(day.max)}%` }"
            />
            <span
              v-if="i === 0"
              class="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2a1745] bg-white"
              :style="{ left: `${pct(forecast.current.temperature)}%` }"
              aria-hidden="true"
            />
          </span>
          <span class="w-9 font-medium">{{ fmt.temp(day.max) }}</span>
          <span class="sr-only">{{ describeCode(day.code).label }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>
