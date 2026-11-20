<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { X } from 'lucide-vue-next'
import { placeRoute, usePlacesStore, type Place } from '@/entities/place'
import { describeCode, skyFor, useForecast, WeatherIcon } from '@/entities/weather'
import { useSettingsStore } from '@/entities/settings'
import { formatClock } from '@/shared/lib'
import { useMinuteClock } from '@/shared/lib/useMinuteClock'

const props = defineProps<{ place: Place }>()

const places = usePlacesStore()
const { fmt } = storeToRefs(useSettingsStore())
const now = useMinuteClock()
const { data: forecast, isError, refetch } = useForecast(() => props.place)

const sky = computed(() => (forecast.value ? skyFor(forecast.value, now.value) : null))
const today = computed(() => forecast.value?.daily[0])
const condition = computed(() => forecast.value && describeCode(forecast.value.current.code))

/** Each row is a slice of that place's own sky. */
const style = computed(() =>
  sky.value
    ? { backgroundImage: `linear-gradient(100deg, ${sky.value.top}, ${sky.value.bottom})` }
    : undefined,
)
</script>

<template>
  <li class="group relative">
    <RouterLink
      :to="placeRoute(place)"
      class="flex min-h-28 items-center gap-4 overflow-hidden rounded-pane border border-line bg-veil px-5 py-4 transition-[transform,border-color] duration-300 ease-out-soft hover:border-white/35 sm:gap-6 sm:px-7"
      :style="style"
    >
      <div class="min-w-0 flex-1">
        <p class="truncate font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {{ place.name }}
        </p>
        <p class="mt-1 truncate text-sm text-ink-muted">
          <template v-if="forecast">{{ formatClock(now, forecast.timezone) }}</template>
          <template v-if="forecast && place.region">, </template>
          {{ place.region }}
        </p>
      </div>

      <template v-if="forecast && condition">
        <div class="hidden items-center gap-2 text-ink-muted md:flex">
          <WeatherIcon :code="forecast.current.code" :is-day="forecast.current.isDay" :size="22" />
          <span>{{ condition.label }}</span>
        </div>
        <div class="text-right">
          <p class="font-display text-5xl leading-none font-light tracking-tighter sm:text-6xl">
            {{ fmt.temp(forecast.current.temperature) }}
          </p>
          <p v-if="today" class="mt-1 text-sm text-ink-muted">
            {{ fmt.temp(today.max) }} / {{ fmt.temp(today.min) }}
          </p>
        </div>
      </template>
      <button
        v-else-if="isError"
        type="button"
        class="relative z-10 rounded-full border border-line px-3 py-1.5 text-sm hover:bg-veil-strong"
        @click.prevent="refetch()"
      >
        Retry
      </button>
      <div v-else class="h-12 w-20 animate-pulse rounded-2xl bg-veil-strong" aria-label="Loading" />
    </RouterLink>

    <button
      type="button"
      class="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full border border-line bg-[#2a1745] text-ink-muted opacity-100 shadow-lg transition-opacity hover:text-ink focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      :aria-label="`Remove ${place.name}`"
      @click="places.remove(place.id)"
    >
      <X :size="16" />
    </button>
  </li>
</template>
