<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSkyStore } from '@/entities/weather'
import { gsap, motionAllowed, useAmbientMotion } from '@/shared/lib/motion'
import WeatherParticles from './WeatherParticles.vue'
import EtherSilk from './EtherSilk.vue'

const { sky } = storeToRefs(useSkyStore())
const root = ref<HTMLElement>()

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

/**
 * Sky colours live on :root so any surface can tint itself with the current sky.
 * GSAP blends them when the place or the weather changes; with reduced motion they switch at once.
 */
watch(
  sky,
  (next, prev) => {
    const vars = { '--sky-top': next.top, '--sky-bottom': next.bottom, '--sky-glow': next.glow }
    if (prev && motionAllowed()) {
      gsap.to(document.documentElement, {
        ...vars,
        duration: 1.8,
        ease: 'sine.inOut',
        overwrite: 'auto',
      })
    } else {
      gsap.set(document.documentElement, vars)
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next.top)
  },
  { immediate: true },
)

const orbStyle = computed(() => ({
  '--orb-x': `${orb.value.x}%`,
  '--orb-y': `${orb.value.y}%`,
  '--orb-size': `${orb.value.size}vmax`,
  '--orb-opacity': orb.value.opacity,
}))

/** The sun/moon glow breathes gently, only ever dimmer than its contrast-checked strength. */
useAmbientMotion(root, (el) => {
  gsap.to(el.querySelector('.sky__orb-wrap'), {
    opacity: 0.7,
    duration: 6,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  })
})
</script>

<template>
  <div ref="root" class="sky" aria-hidden="true">
    <!-- The flowing "liquid silk" ether: sky gradient plus shimmering light, on one canvas. -->
    <EtherSilk />
    <div class="sky__orb-wrap">
      <div class="sky__orb" :style="orbStyle" />
    </div>
    <WeatherParticles :key="`${sky.group}-${sky.phase}`" :group="sky.group" :phase="sky.phase" />
    <div class="sky__grain" />
  </div>
</template>

<style scoped>
.sky {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: var(--sky-bottom);
}

.sky__orb-wrap {
  position: absolute;
  inset: 0;
  will-change: opacity;
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
