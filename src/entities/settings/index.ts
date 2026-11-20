import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { STORAGE_KEYS } from '@/shared/config'
import { formatTemp, formatWind, formatDistance, type UnitSystem } from '@/shared/lib'

function defaultUnits(): UnitSystem {
  // The US, Liberia and Myanmar are the only places that default to Fahrenheit.
  const region = new Intl.Locale(navigator.language).maximize().region
  return region && ['US', 'LR', 'MM'].includes(region) ? 'imperial' : 'metric'
}

export const useSettingsStore = defineStore('settings', () => {
  const units = useLocalStorage<UnitSystem>(STORAGE_KEYS.units, defaultUnits())

  const toggleUnits = () => {
    units.value = units.value === 'metric' ? 'imperial' : 'metric'
  }

  /** Unit-aware formatters, so components never deal with conversion. */
  const fmt = computed(() => ({
    temp: (c: number, withUnit = false) => formatTemp(c, units.value, withUnit),
    wind: (kmh: number) => formatWind(kmh, units.value),
    distance: (m: number) => formatDistance(m, units.value),
  }))

  return { units, toggleUnits, fmt }
})
