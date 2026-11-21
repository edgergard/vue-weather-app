<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ConditionGroup, DayPhase } from '@/entities/weather'
import { ambientPaused, gsap, useAmbientMotion } from '@/shared/lib/motion'

/**
 * Decorative weather layer: rain streaks, snowflakes, drifting fog, twinkling stars and the odd
 * lightning flicker. It is re-created (keyed) whenever the weather or time of day changes.
 * Nothing here moves when the user prefers reduced motion; stars still show, just still.
 */
const props = defineProps<{ group: ConditionGroup; phase: DayPhase }>()
const root = ref<HTMLElement>()

/** Deterministic pseudo-random numbers, so the layout doesn't jump on re-render. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

const rainCount = computed(() =>
  props.group === 'storm' ? 90 : props.group === 'rain' ? 70 : props.group === 'drizzle' ? 35 : 0,
)
const snowCount = computed(() => (props.group === 'snow' ? 60 : 0))
const showFog = computed(() => props.group === 'fog' || props.group === 'cloudy')
const showStars = computed(
  () => props.phase === 'night' && (props.group === 'clear' || props.group === 'partly'),
)

const drops = computed(() =>
  range(rainCount.value).map((i) => ({
    left: `${rand(i, 1) * 110 - 5}%`,
    height: `${50 + rand(i, 2) * 60}px`,
    opacity: props.group === 'drizzle' ? 0.18 + rand(i, 3) * 0.12 : 0.22 + rand(i, 3) * 0.18,
  })),
)
const flakes = computed(() =>
  range(snowCount.value).map((i) => {
    const size = 2 + rand(i, 4) * 4
    return { left: `${rand(i, 5) * 100}%`, size: `${size}px`, opacity: 0.35 + rand(i, 6) * 0.45 }
  }),
)
const stars = computed(() =>
  showStars.value
    ? range(46).map((i) => ({
        left: `${rand(i, 7) * 100}%`,
        top: `${rand(i, 8) * 58}%`,
        size: `${1 + rand(i, 9) * 1.6}px`,
      }))
    : [],
)

useAmbientMotion(root, (el) => {
  // Fall distances follow the viewport, so rotating a phone keeps rain reaching the bottom.
  const vh = () => window.innerHeight
  const falling: gsap.core.Tween[] = []

  gsap.utils.toArray<HTMLElement>('.wp-drop', el).forEach((drop, i) => {
    const fall = gsap
      .fromTo(
        drop,
        { y: -160, x: 0 },
        {
          y: () => vh() + 160,
          x: () => -(vh() + 320) * 0.18, // matches the 10° slant of the streak
          duration: props.group === 'drizzle' ? 1.6 + rand(i, 10) : 0.7 + rand(i, 10) * 0.5,
          ease: 'none',
          repeat: -1,
        },
      )
      .progress(rand(i, 11)) // start mid-fall, so the sky is already full of rain
    falling.push(fall)
  })

  gsap.utils.toArray<HTMLElement>('.wp-flake', el).forEach((flake, i) => {
    const fall = gsap
      .fromTo(
        flake,
        { y: -20 },
        { y: () => vh() + 20, duration: 9 + rand(i, 12) * 9, ease: 'none', repeat: -1 },
      )
      .progress(rand(i, 13))
    falling.push(fall)
    gsap.to(flake, {
      x: `random(-40, 40)`,
      duration: 2.5 + rand(i, 14) * 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
    })
  })

  gsap.utils.toArray<HTMLElement>('.wp-fog', el).forEach((band, i) => {
    gsap.fromTo(
      band,
      { xPercent: -60 + i * 20 },
      { xPercent: 60 - i * 15, duration: 40 + i * 12, ease: 'sine.inOut', repeat: -1, yoyo: true },
    )
  })

  gsap.utils.toArray<HTMLElement>('.wp-star', el).forEach((star, i) => {
    gsap.to(star, {
      opacity: 0.15,
      duration: 1.2 + rand(i, 15) * 2.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: rand(i, 16) * 3,
    })
  })

  // Lightning: a faint double flicker every 7–14 s. Low intensity and under 3 flashes per
  // second, well clear of WCAG 2.3.1.
  if (props.group === 'storm') {
    gsap
      .timeline({ repeat: -1, repeatDelay: 7, repeatRefresh: true, delay: 3 })
      .to('.wp-flash', { opacity: 0.1, duration: 0.06 })
      .to('.wp-flash', { opacity: 0, duration: 0.14 })
      .to('.wp-flash', { opacity: 0.06, duration: 0.05 }, '+=0.12')
      .to('.wp-flash', { opacity: 0, duration: 0.5, ease: 'power2.out' })
      .to({}, { duration: 'random(0, 7)' })
  }

  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  const onResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => falling.forEach((t) => t.invalidate()), 200)
  }
  window.addEventListener('resize', onResize)
  return () => {
    clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
  }
})
</script>

<template>
  <div ref="root" class="wp">
    <span
      v-for="(s, i) in stars"
      :key="`s${i}`"
      class="wp-star"
      :style="{ left: s.left, top: s.top, width: s.size, height: s.size }"
    />
    <template v-if="showFog">
      <span
        v-for="i in 3"
        v-show="!ambientPaused"
        :key="`f${i}`"
        class="wp-fog"
        :class="phase === 'night' ? 'wp-fog--light' : 'wp-fog--dark'"
        :style="{ top: `${12 + i * 22}%` }"
      />
    </template>
    <span
      v-for="(d, i) in drops"
      v-show="!ambientPaused"
      :key="`d${i}`"
      class="wp-drop"
      :style="{ left: d.left, height: d.height, opacity: d.opacity }"
    />
    <span
      v-for="(f, i) in flakes"
      v-show="!ambientPaused"
      :key="`k${i}`"
      class="wp-flake"
      :style="{ left: f.left, width: f.size, height: f.size, opacity: f.opacity }"
    />
    <span v-if="group === 'storm'" v-show="!ambientPaused" class="wp-flash" />
  </div>
</template>

<style scoped>
.wp {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wp-star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: 0.7;
}

/* Particles sit above the top edge until GSAP moves them, so reduced motion shows none. */
.wp-drop {
  position: absolute;
  top: -160px;
  width: 1px;
  background: linear-gradient(to bottom, transparent, #fff);
  rotate: 10deg;
  will-change: transform;
}

.wp-flake {
  position: absolute;
  top: -20px;
  border-radius: 50%;
  background: #fff;
  will-change: transform;
}

.wp-fog {
  position: absolute;
  left: -20%;
  width: 140%;
  height: 26vh;
  border-radius: 50%;
  will-change: transform;
}
/* By day mist darkens slightly (contrast only improves); at night there is headroom for a light haze. */
.wp-fog--dark {
  background: radial-gradient(closest-side, rgb(24 16 40 / 0.14), transparent);
}
.wp-fog--light {
  background: radial-gradient(closest-side, rgb(255 255 255 / 0.06), transparent);
}

.wp-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
}
</style>
