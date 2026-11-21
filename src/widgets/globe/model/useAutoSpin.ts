import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useDocumentVisibility, useMediaQuery, useRafFn } from '@vueuse/core'
import { ambientPaused, MOTION_OK, motionAllowed } from '@/shared/lib/motion'
import { createSpinStepper } from '../lib/spinStepper'

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

  // About 60 steps a second: on 120/144 Hz screens the spin would otherwise redraw the whole
  // globe twice as often for no visible gain. The stepper carries skipped time, so the speed
  // never changes.
  const stepper = createSpinStepper()
  const raf = useRafFn(
    ({ delta }) => {
      const step = stepper.next(delta)
      if (step !== null) onFrame(Math.min(100, step))
    },
    { immediate: false },
  )
  watch(
    running,
    (on) => {
      stepper.reset()
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
