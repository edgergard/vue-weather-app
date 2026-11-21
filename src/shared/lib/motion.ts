import { computed, onBeforeUnmount, onMounted, readonly, ref, watch, type Ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

// Dev-only handle for inspecting animations from the console (stripped from production builds).
if (import.meta.env.DEV) (window as unknown as { __gsap: typeof gsap }).__gsap = gsap

export { gsap, SplitText }

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Dev-only escape hatch for testing animations on a machine that has reduced motion turned on:
 * `localStorage.setItem('skyline:force-motion', '1')`. Production builds ignore it.
 */
function forced(): boolean {
  if (!import.meta.env.DEV) return false
  try {
    return localStorage.getItem('skyline:force-motion') === '1'
  } catch {
    return false
  }
}

/** Media query that matches when motion is allowed. */
export const MOTION_OK = forced() ? 'all' : '(prefers-reduced-motion: no-preference)'

/** Whether animations may run right now (respects the OS "reduce motion" setting). */
export function motionAllowed(): boolean {
  if (forced()) return true
  return typeof window === 'undefined' || !window.matchMedia(REDUCED).matches
}

/**
 * Runs `setup` inside a GSAP matchMedia context scoped to `scope`, only while motion is allowed.
 * Everything created inside (tweens, timelines, SplitText) is reverted on unmount or when the user
 * turns "reduce motion" on, so elements always end up in their natural, readable state.
 */
type MotionSetup = (el: HTMLElement) => void | (() => void)

export function useMotion(scope: Ref<HTMLElement | undefined>, setup: MotionSetup) {
  const mm = gsap.matchMedia()
  onMounted(() => {
    if (!scope.value) return
    mm.add(MOTION_OK, () => setup(scope.value!), scope.value)
  })
  onBeforeUnmount(() => mm.revert())
  return mm
}

/**
 * User switch for the endless background animation (WCAG 2.2.2 Pause, Stop, Hide). One-off
 * entrance animations are short and unaffected; the OS reduced-motion setting turns off both.
 */
export const ambientPaused = useLocalStorage('skyline:ambient-paused', false)

/**
 * Set by a page that covers the sky with something animating on its own (the globe): the sky's
 * loops hold still meanwhile, to leave the frame budget to that page. Not saved, and separate
 * from the user's choice above, which it never changes.
 */
export const ambientSuspended = ref(false)

/** The ambient loops should hold still: the user paused them, or the page suspended them. */
export const ambientStill = computed(() => ambientPaused.value || ambientSuspended.value)

/** Suspends the sky's ambient loops while the calling component is mounted. */
export function useSuspendAmbient() {
  onMounted(() => (ambientSuspended.value = true))
  onBeforeUnmount(() => (ambientSuspended.value = false))
}

/**
 * Like useMotion, for looping ambient animation: everything it creates freezes while
 * `ambientStill` is on and picks up again when it is turned off.
 */
export function useAmbientMotion(scope: Ref<HTMLElement | undefined>, setup: MotionSetup) {
  // Pause only top-level animations: pausing a timeline freezes its children with it, so loops
  // resume exactly where they stopped instead of jumping.
  const apply = (paused: boolean) =>
    mm.contexts.forEach((ctx) =>
      (ctx.data as unknown[])
        .filter(
          (a): a is gsap.core.Animation =>
            a instanceof gsap.core.Animation && a.parent === gsap.globalTimeline,
        )
        .forEach((a) => a.paused(paused)),
    )
  const mm = useMotion(scope, (el) => {
    const cleanup = setup(el)
    // Animations exist only after setup has run, so honour a saved "paused" choice right away.
    queueMicrotask(() => apply(ambientStill.value))
    return cleanup
  })
  watch(ambientStill, apply)
  return mm
}

interface TweenedOptions {
  /** Starting value on first mount, derived from the target (e.g. count up from target − 8). */
  from?: (target: number) => number
  duration?: number
  ease?: string
}

/**
 * A number that glides to `source()` whenever it changes (count-ups, the sun moving along its arc).
 * With reduced motion it simply equals the source.
 */
export function useTweened(source: () => number, options: TweenedOptions = {}) {
  const { from, duration = 1, ease = 'power3.out' } = options
  const initial = source()
  const value = ref(from && motionAllowed() ? from(initial) : initial)
  const state = { v: value.value }
  let tween: gsap.core.Tween | undefined

  function glide(to: number) {
    tween?.kill()
    if (!motionAllowed()) {
      state.v = to
      value.value = to
      return
    }
    tween = gsap.to(state, { v: to, duration, ease, onUpdate: () => void (value.value = state.v) })
  }

  onMounted(() => glide(source()))
  watch(source, glide)
  onBeforeUnmount(() => tween?.kill())
  return readonly(value)
}
