import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { placeRoute, reverseGeocode } from '@/entities/place'

const MESSAGES: Record<number, string> = {
  1: 'Location access is blocked. Allow it in your browser settings, or search for a place.',
  2: 'Your position is unavailable right now. Search for a place instead.',
  3: 'Finding your position took too long. Try again or search for a place.',
}

/** Resolves the device position to a place and opens its forecast. */
export function useLocateMe() {
  const router = useRouter()
  const isLocating = ref(false)
  const error = ref<string | null>(null)
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  function locate() {
    if (!isSupported || isLocating.value) return
    isLocating.value = true
    error.value = null
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const place = await reverseGeocode(coords.latitude, coords.longitude)
        isLocating.value = false
        await router.push(placeRoute(place))
      },
      (err) => {
        isLocating.value = false
        error.value = MESSAGES[err.code] ?? MESSAGES[2]!
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }

  return { locate, isLocating, error, isSupported }
}
