<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSkyStore } from '@/entities/weather'
import { ambientPaused, gsap, motionAllowed, useAmbientMotion } from '@/shared/lib/motion'

/**
 * "Liquid silk": the sky gradient with large soft patches of light sliding over each other and
 * slowly changing hue, like mother-of-pearl, plus one dark fold for depth. Drawn on one canvas.
 *
 * Contrast rule (white text must stay ≥ 4.5:1):
 * - On light and mid skies the silk shimmers in hue only. ISO colours all share one luminance,
 *   a little below the lightest sky (white on each ≈ 6:1), so blending them in can't wash text out.
 * - On dark skies the patches glow (screen blend), violet to magenta only, at GLOW_ALPHA each.
 *   Even with all four glow patches stacked on one spot, the worst dark sky (snow at night)
 *   keeps white text at 6.0:1 and white/.9 at 5.2:1.
 * The two styles crossfade as the sky changes.
 */
const ISO = ['#8d34cc', '#a629a6', '#b02c79', '#2c62af', '#1f6c7c'].map((hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255] as const
})
const GLOW_ALPHA = 0.1
/** Canvas pixels per CSS pixel. Soft blobs need no detail; half resolution is 4× cheaper. */
const RES = 0.5

const { sky } = storeToRefs(useSkyStore())
const canvas = ref<HTMLElement>()
let ctx: CanvasRenderingContext2D | null = null
let w = 0
let h = 0
let dirty = true

const luminance = (hex: string) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
  const ch = (v: number) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(n >> 16) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255)
}
const isDarkSky = (top: string, bottom: string) => luminance(top) < 0.05 && luminance(bottom) < 0.08
/** ISO colour at a fractional position, blended with its neighbour so hue flows, never jumps. */
function isoAt(t: number, a: number) {
  const i = ((Math.floor(t) % ISO.length) + ISO.length) % ISO.length
  const f = t - Math.floor(t)
  const e = f * f * (3 - 2 * f) // smoothstep, so each colour lingers a moment
  const p = ISO[i]!
  const q = ISO[(i + 1) % ISO.length]!
  const c = p.map((v, j) => Math.round(v + (q[j]! - v) * e))
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`
}

/** Everything the frame reads; GSAP tweens these values. */
const state = {
  top: sky.value.top,
  bottom: sky.value.bottom,
  glow: isDarkSky(sky.value.top, sky.value.bottom) ? 1 : 0,
  angle: 0.35, // radians of the base gradient
  tone: 0, // 0–360, drives the hue cycle
}
const blobs = Array.from({ length: 5 }, (_, i) => ({
  x: [0.15, 0.8, 0.45, 0.25, 0.7][i]!,
  y: [0.2, 0.3, 0.75, 0.85, 0.6][i]!,
  r: [0.6, 0.55, 0.5, 0.65, 0.55][i]!,
}))

/** Pearlescent hue for glow mode: a smooth swing between violet (255°) and magenta (315°). */
function pearl(deg: number) {
  return 285 + Math.sin((deg * Math.PI) / 180) * 30
}

function draw() {
  if (!ctx || !w || !h) return
  const m = Math.max(w, h)

  // Base gradient, slowly turning.
  const cx = w / 2
  const cy = h / 2
  const dx = Math.cos(state.angle) * m * 0.6
  const dy = Math.sin(state.angle) * m * 0.6
  const base = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
  base.addColorStop(0, state.top)
  base.addColorStop(1, state.bottom)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  blobs.forEach((b, k) => {
    const x = b.x * w
    const y = b.y * h
    const r = b.r * m
    if (k === blobs.length - 1) {
      // The dark fold.
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, 'rgba(40, 18, 80, 0.5)')
      g.addColorStop(1, 'rgba(40, 18, 80, 0)')
      ctx!.globalCompositeOperation = 'multiply'
      ctx!.globalAlpha = 1
      ctx!.fillStyle = g
      ctx!.fillRect(0, 0, w, h)
      return
    }
    if (state.glow < 1) {
      const t = state.tone / 72 + k * 1.4
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, isoAt(t, 1))
      g.addColorStop(1, isoAt(t, 0))
      ctx!.globalCompositeOperation = 'source-over'
      ctx!.globalAlpha = 0.45 * (1 - state.glow)
      ctx!.fillStyle = g
      ctx!.fillRect(0, 0, w, h)
    }
    if (state.glow > 0) {
      const hue = pearl(state.tone + k * 75)
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `hsla(${hue}, 70%, 62%, 1)`)
      g.addColorStop(1, `hsla(${hue}, 70%, 62%, 0)`)
      ctx!.globalCompositeOperation = 'screen'
      ctx!.globalAlpha = GLOW_ALPHA * state.glow
      ctx!.fillStyle = g
      ctx!.fillRect(0, 0, w, h)
    }
  })
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

/** Draw every frame while animating; otherwise only when something changed (sky, size). */
const animating = () => motionAllowed() && !ambientPaused.value
function frame() {
  if (dirty || animating()) {
    dirty = false
    draw()
  }
}

function resize() {
  const el = canvas.value as HTMLCanvasElement | undefined
  if (!el) return
  w = Math.max(1, Math.round(window.innerWidth * RES))
  h = Math.max(1, Math.round(window.innerHeight * RES))
  el.width = w
  el.height = h
  // Resizing clears the canvas. Repaint now rather than on the next tick: in a background tab
  // the ticker doesn't run, and the sky would otherwise stay empty until the tab is shown.
  draw()
  dirty = false
}

// New place or weather: blend colours (and the glow/hue style) smoothly, or switch at once.
watch(sky, (next) => {
  const target = {
    top: next.top,
    bottom: next.bottom,
    glow: isDarkSky(next.top, next.bottom) ? 1 : 0,
  }
  if (motionAllowed()) {
    gsap.to(state, {
      ...target,
      duration: 1.8,
      ease: 'sine.inOut',
      overwrite: 'auto',
      onUpdate: () => void (dirty = true),
    })
  } else {
    // A blend may still be running from before reduced motion was turned on; stop it first.
    gsap.killTweensOf(state, 'top,bottom,glow')
    Object.assign(state, target)
    draw()
  }
})

// Turning "reduce motion" on reverts the drift; redraw once it has, so the still frame is current.
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const onMotionPreference = () => queueMicrotask(draw)

onMounted(() => {
  ctx = (canvas.value as HTMLCanvasElement | undefined)?.getContext('2d') ?? null
  resize()
  window.addEventListener('resize', resize)
  reducedQuery.addEventListener('change', onMotionPreference)
  gsap.ticker.add(frame)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  reducedQuery.removeEventListener('change', onMotionPreference)
  gsap.ticker.remove(frame)
})

// Endless drift and hue cycle; frozen by the Pause button, skipped under reduced motion.
useAmbientMotion(canvas, () => {
  gsap.to(state, { angle: 1.6, duration: 26, ease: 'sine.inOut', repeat: -1, yoyo: true })
  gsap.to(state, { tone: 360, duration: 30, ease: 'none', repeat: -1 })
  blobs.forEach((b) =>
    gsap.to(b, {
      x: 'random(-0.1, 1.1)',
      y: 'random(-0.1, 1.1)',
      r: 'random(0.4, 0.75)',
      duration: 'random(9, 15)',
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
    }),
  )
})
// When animation stops (pause / reduced motion), keep the last frame correct.
watch(ambientPaused, () => void (dirty = true))
</script>

<template>
  <canvas ref="canvas" class="ether" aria-hidden="true" />
</template>

<style scoped>
.ether {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
