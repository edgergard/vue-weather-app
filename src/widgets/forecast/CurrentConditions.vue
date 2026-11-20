<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { Place } from '@/entities/place'
import { describeCode, todayOf, WeatherIcon, type Forecast } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import SavePlaceButton from '@/features/save-place/SavePlaceButton.vue'
import { formatClock, formatLongDate } from '@/shared/lib'
import SunArc from './SunArc.vue'

const props = defineProps<{ place: Place; forecast: Forecast; now: number }>()
const { fmt } = storeToRefs(useSettingsStore())

const current = computed(() => props.forecast.current)
const today = computed(() => todayOf(props.forecast, props.now))
const condition = computed(() => describeCode(current.value.code))
</script>

<template>
  <section
    class="grid gap-8 pt-6 sm:pt-10 lg:grid-cols-[1fr_auto] lg:items-end"
    aria-labelledby="place-name"
  >
    <div class="min-w-0">
      <h1
        id="place-name"
        class="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl"
      >
        {{ place.name }}
      </h1>
      <p class="mt-2 text-ink-muted">
        <span v-if="place.region">{{ place.region }}. </span>
        {{ formatLongDate(now, forecast.timezone) }}, {{ formatClock(now, forecast.timezone) }}
      </p>

      <div class="mt-6 flex items-start gap-3">
        <p
          class="font-display text-[clamp(6.5rem,22vw,12rem)] leading-[0.82] font-light tracking-[-0.06em]"
        >
          {{ fmt.temp(current.temperature) }}
        </p>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-lg">
        <span class="flex items-center gap-2">
          <WeatherIcon :code="current.code" :is-day="current.isDay" :size="26" />
          {{ condition.label }}
        </span>
        <span class="text-ink-muted">Feels like {{ fmt.temp(current.feelsLike) }}</span>
        <span v-if="today" class="text-ink-muted">
          High {{ fmt.temp(today.max) }}, low {{ fmt.temp(today.min) }}
        </span>
      </div>
    </div>

    <div class="flex flex-col items-start gap-6 lg:items-end">
      <SavePlaceButton :place="place" />
      <SunArc
        v-if="today"
        :sunrise="today.sunrise"
        :sunset="today.sunset"
        :now="now"
        :timezone="forecast.timezone"
      />
    </div>
  </section>
</template>
