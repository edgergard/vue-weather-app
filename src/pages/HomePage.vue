<script setup lang="ts">
import { nextTick, ref, watchEffect } from 'vue'
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { createPlace, placeRoute, usePlacesStore, type Place } from '@/entities/place'
import { skyFor, useForecast, useSkyStore } from '@/entities/weather'
import SavedPlaceRow from '@/widgets/saved-places/SavedPlaceRow.vue'
import { useMinuteClock } from '@/shared/lib/useMinuteClock'
import { focusPageHeading, usePageFocus } from '@/shared/lib/focus'

const store = usePlacesStore()
const { places } = storeToRefs(store)
const announcement = ref('')
useTitle('Your places — Skyline')
usePageFocus()

/** Remove a place, then move focus to the row that took its place (or the heading) and say so. */
async function removePlace(place: Place, index: number) {
  store.remove(place.id)
  announcement.value = `${place.name} removed from your places.`
  await nextTick()
  const next = places.value[Math.min(index, places.value.length - 1)]
  const link = next && document.querySelector<HTMLElement>(`[data-place-id="${next.id}"]`)
  if (link) link.focus()
  else focusPageHeading()
}
const skyStore = useSkyStore()
const now = useMinuteClock()

// The home sky mirrors the first saved place, so the page always shows somewhere real.
const { data: lead } = useForecast(() => places.value[0] ?? null)
watchEffect(() => skyStore.set(lead.value ? skyFor(lead.value, now.value) : null))

const suggestions = [
  createPlace({ name: 'Kyiv', region: 'Ukraine', lat: 50.4547, lon: 30.5238 }),
  createPlace({ name: 'Lisbon', region: 'Portugal', lat: 38.7167, lon: -9.1333 }),
  createPlace({ name: 'Tokyo', region: 'Japan', lat: 35.6895, lon: 139.6917 }),
  createPlace({ name: 'New York', region: 'United States', lat: 40.7143, lon: -74.006 }),
  createPlace({ name: 'Reykjavík', region: 'Iceland', lat: 64.1355, lon: -21.8954 }),
]
</script>

<template>
  <div>
    <section v-if="places.length" aria-labelledby="places-title" class="pt-8 sm:pt-12">
      <h1 id="places-title" class="font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Your places
      </h1>
      <TransitionGroup
        tag="ul"
        class="relative mt-6 flex flex-col gap-3"
        move-class="transition-transform duration-300 ease-out-soft"
        leave-active-class="transition duration-200 ease-in absolute inset-x-0"
        leave-to-class="opacity-0 scale-98"
      >
        <SavedPlaceRow
          v-for="(place, i) in places"
          :key="place.id"
          :place="place"
          @remove="removePlace(place, i)"
        />
      </TransitionGroup>
    </section>

    <section
      v-else
      class="flex min-h-[60dvh] flex-col justify-center py-12"
      aria-labelledby="empty-title"
    >
      <h1
        id="empty-title"
        class="max-w-[14ch] font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.95] font-medium tracking-tight text-balance"
      >
        Where should we look?
      </h1>
      <p class="mt-5 max-w-md text-lg text-ink-muted">
        Search for a city above, or start with one of these. Save the places you check often and
        they'll wait for you here.
      </p>
      <ul class="mt-8 flex flex-wrap gap-2">
        <li v-for="s in suggestions" :key="s.id">
          <RouterLink
            :to="placeRoute(s)"
            class="inline-flex h-11 items-center rounded-full border border-line bg-veil px-5 font-medium transition-colors hover:bg-veil-strong"
          >
            {{ s.name }}
          </RouterLink>
        </li>
      </ul>
    </section>

    <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
