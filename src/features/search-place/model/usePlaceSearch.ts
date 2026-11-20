import { computed, ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { searchPlaces } from '@/entities/place'

const MIN_LENGTH = 2

export function usePlaceSearch() {
  const query = ref('')
  const debounced = refDebounced(
    computed(() => query.value.trim()),
    250,
  )
  const enabled = computed(() => debounced.value.length >= MIN_LENGTH)

  const { data, isFetching, isError, isPlaceholderData } = useQuery({
    queryKey: computed(() => ['places', debounced.value.toLowerCase()]),
    queryFn: ({ signal }) => searchPlaces(debounced.value, signal),
    enabled,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })

  const results = computed(() => (enabled.value ? (data.value ?? []) : []))
  /**
   * The list on screen belongs to an earlier query (debounce pending or placeholder data shown).
   * It stays visible to avoid flicker, but must not be chosen with Enter.
   */
  const isStale = computed(() => debounced.value !== query.value.trim() || isPlaceholderData.value)
  /** True once a finished search came back empty — not while the user is still typing. */
  const isEmpty = computed(
    () =>
      enabled.value &&
      !isFetching.value &&
      results.value.length === 0 &&
      debounced.value === query.value.trim(),
  )

  return { query, results, isStale, isFetching, isError, isEmpty }
}
