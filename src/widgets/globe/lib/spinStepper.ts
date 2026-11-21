/** Target spin rate: one step per 60 Hz frame. */
export const SPIN_STEP_MS = 1000 / 60
/** Frames closer together than this are merged into the next one. */
export const MIN_STEP_MS = 12

/**
 * Paces the globe's auto-spin at about 60 steps a second, whatever the display's refresh rate.
 * Feed it each frame's delta; it returns the time elapsed since the last step when this frame
 * should step, or null to skip it.
 *
 * Skipped time is carried, never dropped, so the spin speed is exact. Steps are paced against
 * the 60 Hz budget instead of a hard 16.7 ms line, so jittery or rounded rAF timestamps don't
 * drop frames at random, and 90–100 Hz screens get a full 60 steps (not every other frame).
 */
export function createSpinStepper() {
  /** How far ahead of the 60 Hz budget the frames have run, in ms. */
  let budget = 0
  /** Time since the last step, in ms. */
  let elapsed = 0

  return {
    next(delta: number): number | null {
      const d = Math.max(0, delta)
      budget += d
      elapsed += d
      if (budget < MIN_STEP_MS) return null
      // Keep at most one frame of credit: after a long stall, don't burst to catch up.
      budget = Math.min(SPIN_STEP_MS, Math.max(0, budget - SPIN_STEP_MS))
      const step = elapsed
      elapsed = 0
      return step
    },
    reset() {
      budget = 0
      elapsed = 0
    },
  }
}
