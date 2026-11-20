<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { usePlacesStore, type Place } from '@/entities/place'

const props = defineProps<{ place: Place }>()
const store = usePlacesStore()
const saved = computed(() => store.isSaved(props.place.id))
</script>

<template>
  <button
    type="button"
    class="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
    :class="
      saved
        ? 'border-sun/50 bg-sun/15 text-ink hover:bg-sun/25'
        : 'border-line bg-veil hover:bg-veil-strong'
    "
    :aria-pressed="saved"
    @click="store.toggle(place)"
  >
    <Star
      :size="16"
      :class="saved ? 'fill-sun text-sun' : ''"
      class="transition-transform active:scale-125"
      aria-hidden="true"
    />
    {{ saved ? 'Saved' : 'Save place' }}
  </button>
</template>
