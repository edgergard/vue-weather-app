<script setup lang="ts">
import { computed } from 'vue'
import { formatClock } from '@/shared/lib'

const props = defineProps<{ sunrise: number; sunset: number; now: number; timezone: string }>()

const W = 240
const H = 96
const PAD = 12

const progress = computed(() => {
  const p = (props.now - props.sunrise) / (props.sunset - props.sunrise)
  return Math.min(1, Math.max(0, p))
})
const isUp = computed(() => props.now >= props.sunrise && props.now <= props.sunset)

/** Point on the arc (a half-ellipse) for progress t ∈ [0, 1]. */
function point(t: number) {
  const angle = Math.PI * (1 - t)
  return { x: W / 2 + Math.cos(angle) * (W / 2 - PAD), y: H - Math.sin(angle) * (H - PAD) }
}
const sun = computed(() => point(progress.value))
const arc = `M ${PAD} ${H} A ${W / 2 - PAD} ${H - PAD} 0 0 1 ${W - PAD} ${H}`

const daylight = computed(() => {
  const minutes = Math.round((props.sunset - props.sunrise) / 60)
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min of daylight`
})
</script>

<template>
  <figure class="w-full max-w-[260px]">
    <svg
      :viewBox="`0 0 ${W} ${H + 4}`"
      class="w-full overflow-visible"
      role="img"
      :aria-label="daylight"
    >
      <defs>
        <clipPath id="sun-elapsed">
          <rect x="0" y="0" :width="sun.x" :height="H + 4" />
        </clipPath>
      </defs>
      <path
        :d="arc"
        fill="none"
        stroke="var(--color-line)"
        stroke-width="1.5"
        stroke-dasharray="3 5"
      />
      <path
        :d="arc"
        fill="none"
        stroke="var(--color-sun)"
        stroke-width="2"
        stroke-linecap="round"
        clip-path="url(#sun-elapsed)"
        opacity="0.9"
      />
      <line :x1="0" :x2="W" :y1="H" :y2="H" stroke="var(--color-line)" />
      <g v-if="isUp">
        <circle :cx="sun.x" :cy="sun.y" r="14" fill="var(--color-sun)" opacity="0.2" />
        <circle :cx="sun.x" :cy="sun.y" r="7" fill="var(--color-sun)" />
      </g>
    </svg>
    <figcaption class="mt-2 flex justify-between text-sm text-ink-muted">
      <span>Sunrise {{ formatClock(sunrise, timezone) }}</span>
      <span>Sunset {{ formatClock(sunset, timezone) }}</span>
    </figcaption>
  </figure>
</template>
