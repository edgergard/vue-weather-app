<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useSkyStore } from '@/entities/weather'

const { sky } = storeToRefs(useSkyStore())

/** The sun travels a shallow arc from left (sunrise) to right (sunset). */
const orb = computed(() => {
  const p = sky.value.sunProgress
  if (p === null) return { x: 82, y: 14, size: 34, opacity: 0.3 } // moon
  // Kept faint: a bright glow behind white text would push it under 4.5:1 contrast.
  return {
    x: 8 + p * 84,
    y: 46 - Math.sin(Math.PI * p) * 36,
    size: 60,
    opacity: sky.value.group === 'clear' || sky.value.group === 'partly' ? 0.45 : 0.25,
  }
})

// Sky colours live on :root so any surface can tint itself with the current sky.
watchEffect(() => {
  const root = document.documentElement.style
  root.setProperty('--sky-top', sky.value.top)
  root.setProperty('--sky-bottom', sky.value.bottom)
  root.setProperty('--sky-glow', sky.value.glow)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sky.value.top)
})

const style = computed(() => ({
  '--orb-x': `${orb.value.x}%`,
  '--orb-y': `${orb.value.y}%`,
  '--orb-size': `${orb.value.size}vmax`,
  '--orb-opacity': orb.value.opacity,
}))
</script>

<template>
  <div class="sky" :style="style" aria-hidden="true">
    <div class="sky__orb" />
    <div v-if="sky.phase === 'night'" class="sky__stars" />
    <div class="sky__grain" />
  </div>
</template>

<style scoped>
.sky {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(to right, var(--sky-top), var(--sky-bottom));
  transition:
    --sky-top 1.6s var(--ease-out-soft),
    --sky-bottom 1.6s var(--ease-out-soft),
    --sky-glow 1.6s var(--ease-out-soft);
}

.sky__orb {
  position: absolute;
  inset: 0;
  opacity: var(--orb-opacity);
  background: radial-gradient(
    circle var(--orb-size) at var(--orb-x) var(--orb-y),
    color-mix(in oklab, var(--sky-glow) 22%, transparent) 0%,
    color-mix(in oklab, var(--sky-glow) 8%, transparent) 30%,
    transparent 70%
  );
  transition: opacity 1.6s var(--ease-out-soft);
}

.sky__stars {
  position: absolute;
  inset: 0 0 40% 0;
  opacity: 0.55;
  background-image:
    radial-gradient(1px 1px at 12% 18%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 27% 8%, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 41% 26%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 58% 12%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 66% 34%, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 74% 6%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 91% 22%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 6% 40%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 35% 44%, #fff 50%, transparent 51%),
    radial-gradient(1px 1px at 86% 46%, #fff 50%, transparent 51%);
  mask-image: linear-gradient(to bottom, #000, transparent);
}

/* A whisper of film grain keeps large gradients from banding. */
.sky__grain {
  position: absolute;
  inset: 0;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
