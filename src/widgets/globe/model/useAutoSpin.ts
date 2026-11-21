import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useDocumentVisibility, useMediaQuery, useRafFn } from '@vueuse/core'
import { ambientPaused, MOTION_OK, motionAllowed } from '@/shared/lib/motion'

/** Shortest step between two spin updates: lets every 60 Hz frame through, halves 120 Hz. */
const MIN_STEP_MS = 12

interface AutoSpinOptions {
  /** Whether the globe may spin at all right now (map ready, no card open, not zoomed in…). */
  enabled: MaybeRefOrGetter<boolean>
  /** Called every animation frame while spinning, with the elapsed time in ms (capped). */
  onFrame: (deltaMs: number) => void
  /** How long the globe waits after the last interaction before it starts spinning again. */
  idleMs?: number
}

/**
 * A gentle, endless rotation for the globe. It runs only while motion is allowed (OS setting),
 * the footer's "Pause animations" is off, the tab is visible and the user has left the globe
 * alone for a few seconds. Nothing runs (no animation frames at all) otherwise.
 */
export function useAutoSpin({ enabled, onFrame, idleMs = 4000 }: AutoSpinOptions) {
  const motionOk = useMediaQuery(MOTION_OK)
  const visibility = useDocumentVisibility()
  const resting = ref(true)
  let timer: ReturnType<typeof setTimeout> | undefined

  /** The user touched the globe: stop now, try again after `idleMs` without interaction. */
  function interrupt() {
    resting.value = false
    clearTimeout(timer)
    timer = setTimeout(() => (resting.value = true), idleMs)
  }

  const running = computed(
    () =>
      toValue(enabled) &&
      resting.value &&
      motionOk.value &&
      motionAllowed() &&
      !ambientPaused.value &&
      visibility.value === 'visible',
  )

  // About 60 steps a second at most: on 120/144 Hz screens the spin would otherwise redraw the
  // whole globe twice as often for no visible gain. Frames closer than MIN_STEP_MS are merged into
  // the next one (not dropped against a hard 16.7 ms line, which jittery or rounded rAF timestamps
  // would cross at random), and the step is real elapsed time, so the speed never changes.
  let pending = 0
  const raf = useRafFn(
    ({ delta }) => {
      pending += Math.max(0, delta)
      if (pending < MIN_STEP_MS) return
      onFrame(Math.min(100, pending))
      pending = 0
    },
    { immediate: false },
  )
  watch(
    running,
    (on) => {
      pending = 0
      if (on) raf.resume()
      else raf.pause()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    clearTimeout(timer)
    raf.pause()
  })

  return { running, interrupt }
}
