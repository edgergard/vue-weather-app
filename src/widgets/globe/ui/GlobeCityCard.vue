<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { ArrowRight, X } from 'lucide-vue-next'
import { createPlace, placeRoute } from '@/entities/place'
import {
  describeCode,
  todayOf,
  useForecast,
  WeatherIcon,
  type CurrentSnapshot,
} from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import { useMinuteClock } from '@/shared/lib/useMinuteClock'

export interface GlobeCardPlace {
  name: string
  /** Country (and state) when known; may be empty for places picked off the map. */
  region: string
  lat: number
  lon: number
}

const props = defineProps<{
  place: GlobeCardPlace
  /** Current weather from the markers' shared request, shown until the full forecast arrives. */
  snapshot?: CurrentSnapshot | null
}>()
defineEmits<{ close: [] }>()

const { fmt } = storeToRefs(useSettingsStore())
const now = useMinuteClock()
const headingId = useId()
const heading = useTemplateRef<HTMLElement>('heading')

// The full forecast also warms the cache, so "Open forecast" shows the page instantly.
const { data: forecast, isError } = useForecast(() => ({
  lat: props.place.lat,
  lon: props.place.lon,
}))

const current = computed(() => forecast.value?.current ?? props.snapshot ?? null)
const condition = computed(() => current.value && describeCode(current.value.code))
const today = computed(() => forecast.value && todayOf(forecast.value, now.value))

const to = computed(() => placeRoute(createPlace({ ...props.place })))

defineExpose({
  /** Moves focus into the card (used when it was opened from the keyboard). */
  focus: () => heading.value?.focus(),
})
</script>

<template>
  <section class="pane globe-card grid gap-4 p-5" :aria-labelledby="headingId">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2
          :id="headingId"
          ref="heading"
          tabindex="-1"
          class="font-display text-2xl leading-tight font-medium tracking-tight text-balance"
        >
          {{ place.name }}
        </h2>
        <p v-if="place.region" class="mt-0.5 text-sm text-ink-muted">{{ place.region }}</p>
      </div>
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-veil text-ink-muted hover:bg-veil-strong hover:text-ink"
        :aria-label="`Close ${place.name}`"
        @click="$emit('close')"
      >
        <X :size="16" aria-hidden="true" />
      </button>
    </div>

    <div v-if="current && condition" class="flex items-center gap-4">
      <p
        class="font-display text-[3.25rem] leading-none font-light tracking-tighter max-sm:text-[2.75rem]"
      >
        {{ fmt.temp(current.temperature) }}
      </p>
      <div class="grid gap-0.5 text-sm text-ink-muted">
        <WeatherIcon
          :code="current.code"
          :is-day="current.isDay"
          :size="24"
          class="mb-1 text-ink"
        />
        <strong class="font-semibold text-ink">{{ condition.label }}</strong>
        <span v-if="today">
          <span aria-hidden="true">
            H {{ fmt.temp(today.max) }} · L {{ fmt.temp(today.min) }}
          </span>
          <span class="sr-only">High {{ fmt.temp(today.max) }}, low {{ fmt.temp(today.min) }}</span>
        </span>
      </div>
    </div>
    <p v-else-if="isError" class="text-sm text-ink-muted">
      The weather service didn't respond. The forecast page may still load.
    </p>
    <div v-else class="flex items-center gap-4" role="status">
      <span class="sr-only">Loading the weather for {{ place.name }}</span>
      <span class="h-12 w-24 animate-pulse rounded-2xl bg-veil-strong" aria-hidden="true" />
      <span class="h-10 w-28 animate-pulse rounded-xl bg-veil" aria-hidden="true" />
    </div>

    <RouterLink
      :to="to"
      class="flex h-12 items-center justify-between rounded-full bg-ink px-5 font-semibold text-[#2a1745] transition-colors hover:bg-[#f1e8ff]"
    >
      Open forecast
      <ArrowRight :size="18" aria-hidden="true" />
    </RouterLink>
  </section>
</template>

<style scoped>
/* Where panels lose their backdrop blur (phones, touch), map labels would show through the
   card's light tint; a denser tint keeps the text readable. */
@media (hover: none), (max-width: 640px) {
  .globe-card {
    background: rgb(26 12 48 / 0.8);
  }
}
</style>
