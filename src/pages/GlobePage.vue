<script setup lang="ts">
import { watchEffect } from 'vue'
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { usePlacesStore } from '@/entities/place'
import { skyFor, useForecast, useSkyStore } from '@/entities/weather'
import GlobeView from '@/widgets/globe/ui/GlobeView.vue'
import { useMinuteClock } from '@/shared/lib/useMinuteClock'
import { usePageFocus } from '@/shared/lib/focus'

useTitle('Globe — Skyline')
usePageFocus()

// Same sky as the places page (the first saved place), so the backdrop doesn't jump between them.
const { places } = storeToRefs(usePlacesStore())
const skyStore = useSkyStore()
const now = useMinuteClock()
const { data: lead } = useForecast(() => places.value[0] ?? null)
watchEffect(() => skyStore.set(lead.value ? skyFor(lead.value, now.value) : null))
</script>

<template>
  <GlobeView>
    <template #intro>
      <h1
        id="globe-title"
        class="font-display text-3xl font-medium tracking-tight text-balance sm:text-4xl"
      >
        Pick a place on the globe
      </h1>
      <p class="mx-auto mt-1.5 max-w-md text-sm text-ink-muted sm:text-base">
        Drag to spin, zoom in for towns, tap a city for its weather.
      </p>
    </template>
  </GlobeView>
</template>
