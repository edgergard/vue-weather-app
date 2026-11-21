<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Star } from 'lucide-vue-next'
import { usePlacesStore, type Place } from '@/entities/place'
import { gsap, motionAllowed } from '@/shared/lib/motion'

const props = defineProps<{ place: Place }>()
const store = usePlacesStore()
const saved = computed(() => store.isSaved(props.place.id))

const icon = ref<HTMLElement>()
const SPARKS = 6
let burst: gsap.core.Timeline | undefined

/** Saving pops the star and throws a few sparks; un-saving just lets it settle. */
function celebrate() {
  const el = icon.value
  if (!el || !motionAllowed()) return
  burst?.progress(1).kill()
  const sparks = el.querySelectorAll<HTMLElement>('.spark')
  burst = gsap
    .timeline()
    .fromTo(
      el.querySelector('svg'),
      { scale: 0.3, rotation: -120 },
      { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.5)' },
    )
    .fromTo(
      sparks,
      { x: 0, y: 0, scale: 1, opacity: 1 },
      {
        x: (i) => Math.cos((i / SPARKS) * Math.PI * 2) * 16,
        y: (i) => Math.sin((i / SPARKS) * Math.PI * 2) * 16,
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      },
      0,
    )
}

function onClick() {
  const wasSaved = saved.value
  store.toggle(props.place)
  if (!wasSaved) celebrate()
}

onBeforeUnmount(() => burst?.kill())
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
    @click="onClick"
  >
    <span ref="icon" class="relative grid size-4 place-items-center" aria-hidden="true">
      <span
        v-for="i in SPARKS"
        :key="i"
        class="spark absolute size-1 rounded-full bg-sun opacity-0"
      />
      <Star :size="16" :class="saved ? 'fill-sun text-sun' : ''" />
    </span>
    {{ saved ? 'Saved' : 'Save place' }}
  </button>
</template>
