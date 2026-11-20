<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { LoaderCircle, LocateFixed, Search, X } from 'lucide-vue-next'
import { placeRoute, type Place } from '@/entities/place'
import { useLocateMe } from '@/features/locate-me/useLocateMe'
import { usePlaceSearch } from '../model/usePlaceSearch'

const router = useRouter()
const { query, results, isFetching, isError, isEmpty } = usePlaceSearch()
const { locate, isLocating, error: locateError, isSupported: canLocate } = useLocateMe()

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const isOpen = ref(false)
const active = ref(-1)
const listId = useId()

const showPanel = computed(
  () => isOpen.value && (results.value.length > 0 || isEmpty.value || isError.value),
)

watch(results, () => (active.value = results.value.length ? 0 : -1))

function choose(place: Place) {
  query.value = ''
  isOpen.value = false
  input.value?.blur()
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
    const place = results.value[active.value]
    if (place) choose(place)
  } else if (e.key === 'Escape') {
    if (query.value) query.value = ''
    else input.value?.blur()
    isOpen.value = false
  }
}

onClickOutside(root, () => (isOpen.value = false))

// "/" focuses search from anywhere, like most search-first tools.
onKeyStroke('/', (e) => {
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable]')) return
  e.preventDefault()
  input.value?.focus()
})
</script>

<template>
  <div ref="root" class="relative w-full">
    <div
      class="flex h-12 items-center gap-2 rounded-full border border-line bg-shade pr-1.5 pl-4 transition-colors focus-within:border-white/40 focus-within:bg-white/12"
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
        :aria-expanded="showPanel"
        :aria-controls="listId"
        :aria-activedescendant="active >= 0 ? `${listId}-${active}` : undefined"
        class="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted [&::-webkit-search-cancel-button]:hidden"
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
        <X :size="18" />
      </button>
      <button
        v-else-if="canLocate"
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-veil-strong hover:text-ink disabled:opacity-60"
        :aria-label="isLocating ? 'Finding your location' : 'Use my location'"
        :title="isLocating ? 'Finding your location' : 'Use my location'"
        :disabled="isLocating"
        @click="locate"
      >
        <LoaderCircle v-if="isLocating" :size="18" class="animate-spin" />
        <LocateFixed v-else :size="18" />
      </button>
    </div>

    <p v-if="locateError" role="alert" class="mt-2 px-4 text-sm text-ink-muted">
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
        class="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-line bg-[#0e1d36]/90 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl"
      >
        <ul v-if="results.length" :id="listId" role="listbox" aria-label="Matching cities">
          <li
            v-for="(place, i) in results"
            :id="`${listId}-${i}`"
            :key="place.id"
            role="option"
            :aria-selected="i === active"
            class="flex cursor-pointer items-baseline gap-3 rounded-2xl px-4 py-2.5"
            :class="i === active ? 'bg-veil-strong' : ''"
            @mousemove="active = i"
            @mousedown.prevent="choose(place)"
          >
            <span class="font-medium">{{ place.name }}</span>
            <span class="truncate text-sm text-ink-muted">{{ place.region }}</span>
          </li>
        </ul>
        <p v-else-if="isError" class="px-4 py-3 text-sm text-ink-muted">
          Search isn't responding. Check your connection and try again.
        </p>
        <p v-else class="px-4 py-3 text-sm text-ink-muted">
          No city called “{{ query.trim() }}”. Check the spelling or try a nearby city.
        </p>
      </div>
    </Transition>
  </div>
</template>
