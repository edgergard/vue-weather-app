<script setup lang="ts">
import { computed, nextTick, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { placeFromRoute } from '@/entities/place'
import { skyFor, useForecast, useSkyStore } from '@/entities/weather'
import CurrentConditions from '@/widgets/forecast/CurrentConditions.vue'
import HourlyChart from '@/widgets/forecast/HourlyChart.vue'
import DailyForecast from '@/widgets/forecast/DailyForecast.vue'
import WeatherDetails from '@/widgets/forecast/WeatherDetails.vue'
import ErrorNotice from '@/shared/ui/ErrorNotice.vue'
import { useMinuteClock } from '@/shared/lib/useMinuteClock'
import { focusPageHeading, isFocusParked, usePageFocus } from '@/shared/lib/focus'

const route = useRoute()
const place = computed(() => placeFromRoute(route))
const now = useMinuteClock()
const skyStore = useSkyStore()
usePageFocus()

const { data: forecast, isPending, isError, refetch } = useForecast(place)

watchEffect(() => skyStore.set(forecast.value ? skyFor(forecast.value, now.value) : null))
// The heading only exists once data arrives; if focus was parked on <main> meanwhile, move it there.
watch(
  () => !!forecast.value,
  async (loaded) => {
    if (!loaded) return
    await nextTick()
    if (isFocusParked()) focusPageHeading()
  },
)

useTitle(computed(() => (place.value ? `${place.value.name} — Skyline` : 'Skyline')))
</script>

<template>
  <!-- Single root element so the page transition (and its focus hook) applies. -->
  <div>
    <ErrorNotice
      v-if="!place"
      class="mt-10"
      title="This link doesn't point to a place"
      detail="The coordinates in the address are missing or out of range. Search for a city instead."
      action-label="Go to your places"
      @retry="$router.push({ name: 'places' })"
    />

    <template v-else-if="forecast">
      <CurrentConditions :place="place" :forecast="forecast" :now="now" />
      <div class="mt-10 flex flex-col gap-4 sm:mt-14">
        <HourlyChart :forecast="forecast" :now="now" />
        <div class="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <DailyForecast :forecast="forecast" :now="now" />
          <WeatherDetails :forecast="forecast" />
        </div>
      </div>
    </template>

    <ErrorNotice
      v-else-if="isError"
      class="mt-10"
      :title="`Couldn't load the forecast for ${place.name}`"
      detail="The weather service didn't respond. Check your connection, then try again."
      @retry="refetch()"
    />

    <div v-else-if="isPending" class="pt-10" role="status">
      <span class="sr-only">Loading the forecast for {{ place.name }}</span>
      <div aria-hidden="true">
        <div class="h-12 w-64 animate-pulse rounded-2xl bg-veil-strong" />
        <div class="mt-4 h-5 w-80 max-w-full animate-pulse rounded-lg bg-veil" />
        <div class="mt-8 h-40 w-72 animate-pulse rounded-3xl bg-veil" />
        <div class="mt-14 h-56 animate-pulse rounded-pane bg-veil" />
      </div>
    </div>
  </div>
</template>
