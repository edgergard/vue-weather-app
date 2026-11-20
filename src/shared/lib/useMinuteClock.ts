import { computed } from 'vue'
import { useNow } from '@vueuse/core'

/** Current unix time (seconds), ticking once a minute — enough for clocks and the sky. */
export function useMinuteClock() {
  const now = useNow({ interval: 30_000 })
  return computed(() => Math.floor(now.value.getTime() / 1000))
}
