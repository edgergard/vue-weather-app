import { describe, expect, it } from 'vitest'
import { createSpinStepper } from './spinStepper'

/** Runs one second of frames at `hz` and reports how many steps happened and their total time. */
function runSecond(hz: number, jitter = 0) {
  const stepper = createSpinStepper()
  const frame = 1000 / hz
  let steps = 0
  let total = 0
  let fed = 0
  for (let i = 0; i < hz; i++) {
    // Alternate the rounding the way browsers that round rAF timestamps to 1 ms do.
    const delta = jitter ? (i % 2 ? Math.ceil(frame) : Math.floor(frame)) : frame
    fed += delta
    const step = stepper.next(delta)
    if (step !== null) {
      steps++
      total += step
    }
  }
  return { steps, total, fed }
}

describe('spin stepper', () => {
  it('steps on every frame of a 60 Hz screen, even with timestamps rounded to 1 ms', () => {
    expect(runSecond(60).steps).toBe(60)
    expect(runSecond(60, 1).steps).toBe(60)
  })

  it('gives 90 and 120 Hz screens about 60 steps, not every other frame', () => {
    expect(runSecond(90).steps).toBeGreaterThanOrEqual(59)
    expect(runSecond(90).steps).toBeLessThanOrEqual(61)
    expect(runSecond(120).steps).toBeGreaterThanOrEqual(59)
    expect(runSecond(120).steps).toBeLessThanOrEqual(61)
  })

  it('never loses time, so the spin speed does not depend on the refresh rate', () => {
    for (const hz of [60, 90, 120, 144]) {
      const { total, fed } = runSecond(hz)
      // Whatever has not been stepped yet is at most one frame's worth.
      expect(fed - total).toBeLessThan(1000 / hz + 1e-9)
    }
  })

  it('does not burst to catch up after a stall', () => {
    const stepper = createSpinStepper()
    expect(stepper.next(500)).toBe(500)
    // At 144 Hz right after the stall, frames are still paced, not all stepped.
    const steps = Array.from({ length: 4 }, () => stepper.next(1000 / 144)).filter(
      (s) => s !== null,
    )
    expect(steps.length).toBeLessThanOrEqual(3)
  })

  it('starts fresh after a reset', () => {
    const stepper = createSpinStepper()
    stepper.next(5)
    stepper.reset()
    expect(stepper.next(5)).toBeNull()
    expect(stepper.next(10)).toBe(15)
  })
})
