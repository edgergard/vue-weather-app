<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { LoaderCircle, LocateFixed, Search, X } from 'lucide-vue-next'
import { placeRoute, type Place } from '@/entities/place'
import { useLocateMe } from '@/features/locate-me/useLocateMe'
import { usePlaceSearch } from '../model/usePlaceSearch'

const router = useRouter()
const { query, results, isStale, isFetching, isError, isEmpty } = usePlaceSearch()
const { locate, isLocating, error: locateError, isSupported: canLocate } = useLocateMe()

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const isOpen = ref(false)
const active = ref(-1)
const listId = useId()

const showPanel = computed(
  () => isOpen.value && (results.value.length > 0 || isEmpty.value || isError.value),
)
const activeId = computed(() =>
  showPanel.value && active.value >= 0 && results.value[active.value]
    ? `${listId}-${active.value}`
    : undefined,
)

/** Announced politely to screen readers; the visible panel shows the same information. */
const status = computed(() => {
  if (isLocating.value) return 'Finding your location…'
  if (!isOpen.value || query.value.trim().length < 2 || isStale.value || isFetching.value) return ''
  if (isError.value) return "Search isn't responding. Check your connection and try again."
  const n = results.value.length
  if (n) return `${n} ${n === 1 ? 'city' : 'cities'} found. Use the up and down arrows to choose.`
  return `No city called ${query.value.trim()}.`
})

watch(results, () => (active.value = results.value.length ? 0 : -1))

/** Enter pressed while the list still shows an older query: act once fresh results arrive. */
const enterPending = ref(false)
watch([isStale, isFetching, results], () => {
  if (!enterPending.value || isStale.value || isFetching.value) return
  enterPending.value = false
  const place = results.value[0]
  if (place) choose(place)
})
watch(query, () => {
  if (!query.value.trim()) enterPending.value = false
})

function choose(place: Place) {
  enterPending.value = false
  query.value = ''
  isOpen.value = false
  // Focus moves to the new page's heading after navigation (see App.vue).
  router.push(placeRoute(place))
}

function onKeydown(e: KeyboardEvent) {
  const count = results.value.length
  if (e.key === 'ArrowDown' && count) {
    e.preventDefault()
    isOpen.value = true
    active.value = (active.value + 1) % count
  } else if (e.key === 'ArrowUp' && count) {
    e.preventDefault()
    active.value = (active.value - 1 + count) % count
  } else if (e.key === 'Enter') {
    if (isStale.value || isFetching.value) {
      enterPending.value = query.value.trim().length > 0
      return
    }
    const place = results.value[active.value]
    if (place) choose(place)
  } else if (e.key === 'Escape') {
    if (showPanel.value || query.value) e.preventDefault()
    if (!showPanel.value) query.value = ''
    isOpen.value = false
  } else if (e.key === 'Tab') {
    isOpen.value = false
  }
}

function onFocusOut(e: FocusEvent) {
  if (!root.value?.contains(e.relatedTarget as Node | null)) isOpen.value = false
}

function onLocate() {
  if (!isLocating.value) locate()
}

onClickOutside(root, () => (isOpen.value = false))

// Ctrl/⌘ + K focuses search. A modifier keeps it from firing on speech input or stray keys.
onKeyStroke('k', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  input.value?.focus()
})
</script>

<template>
  <div ref="root" class="relative w-full" @focusout="onFocusOut">
    <div
      class="flex h-12 items-center gap-2 rounded-full border border-line bg-shade pr-1.5 pl-4 transition-colors focus-within:border-white/60 focus-within:shadow-[0_0_0_2px_#1a0f2c] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white"
    >
      <Search :size="18" class="shrink-0 text-ink-muted" aria-hidden="true" />
      <input
        ref="input"
        v-model="query"
        type="search"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        placeholder="Search a city"
        aria-label="Search a city"
        aria-autocomplete="list"
        aria-keyshortcuts="Control+K Meta+K"
        :aria-expanded="showPanel"
        :aria-controls="showPanel ? listId : undefined"
        :aria-activedescendant="activeId"
        class="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted focus-visible:shadow-none [&::-webkit-search-cancel-button]:hidden"
        @focus="isOpen = true"
        @input="isOpen = true"
        @keydown="onKeydown"
      />
      <LoaderCircle
        v-if="isFetching"
        :size="18"
        class="shrink-0 animate-spin text-ink-muted"
        aria-hidden="true"
      />
      <button
        v-if="query"
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-veil-strong hover:text-ink"
        aria-label="Clear search"
        @click="((query = ''), input?.focus())"
      >
        <X :size="18" aria-hidden="true" />
      </button>
      <!-- aria-disabled (not disabled) keeps focus on the button while it works. -->
      <button
        v-else-if="canLocate"
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-veil-strong hover:text-ink aria-disabled:opacity-60"
        :aria-label="isLocating ? 'Finding your location' : 'Use my location'"
        :title="isLocating ? 'Finding your location' : 'Use my location'"
        :aria-disabled="isLocating"
        @click="onLocate"
      >
        <LoaderCircle v-if="isLocating" :size="18" class="animate-spin" aria-hidden="true" />
        <LocateFixed v-else :size="18" aria-hidden="true" />
      </button>
    </div>

    <p class="sr-only" role="status" aria-live="polite">{{ status }}</p>

    <p v-if="locateError" role="alert" class="mt-2 px-4 text-sm text-ink">
      {{ locateError }}
    </p>

    <Transition
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
      enter-active-class="transition duration-150 ease-out"
      leave-active-class="transition duration-100 ease-in"
    >
      <div
        v-if="showPanel"
        class="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-line bg-[#2a1745]/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl"
      >
        <!-- The listbox always exists while the combobox is expanded, so aria-controls is valid. -->
        <ul
          :id="listId"
          role="listbox"
          aria-label="Matching cities"
          :aria-busy="isStale"
          class="transition-opacity"
          :class="isStale ? 'opacity-60' : ''"
        >
          <li
            v-for="(place, i) in results"
            :id="`${listId}-${i}`"
            :key="place.id"
            role="option"
            :aria-selected="i === active"
            class="flex items-baseline gap-3 rounded-2xl px-4 py-2.5"
            :class="i === active ? 'bg-ink text-[#2a1745]' : ''"
            @mousemove="active = i"
            @mousedown.prevent
            @click="choose(place)"
          >
            <span class="font-medium">{{ place.name }}</span>
            <span
              class="truncate text-sm"
              :class="i === active ? 'text-[#2a1745]/80' : 'text-ink-muted'"
            >
              {{ place.region }}
            </span>
          </li>
        </ul>
        <p v-if="!results.length && isError" class="px-4 py-3 text-sm text-ink">
          Search isn't responding. Check your connection and try again.
        </p>
        <p v-else-if="!results.length" class="px-4 py-3 text-sm text-ink">
          No city called “{{ query.trim() }}”. Check the spelling or try a nearby city.
        </p>
      </div>
    </Transition>
  </div>
</template>
