<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/entities/settings'
import type { UnitSystem } from '@/shared/lib'

const settings = useSettingsStore()
const { units } = storeToRefs(settings)
const group = ref<HTMLElement>()

const options = [
  { value: 'metric', label: '°C', name: 'Celsius' },
  { value: 'imperial', label: '°F', name: 'Fahrenheit' },
] as const

/** Radio-group keyboard model: one Tab stop, arrow keys move and select. */
function onKeydown(e: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  e.preventDefault()
  select(units.value === 'metric' ? 'imperial' : 'metric')
  nextTick(() => group.value?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
}

function select(value: UnitSystem) {
  units.value = value
}
</script>

<template>
  <div
    ref="group"
    role="radiogroup"
    aria-label="Temperature unit"
    class="relative flex h-12 shrink-0 items-center rounded-full border border-line bg-shade p-1"
  >
    <span
      class="absolute top-1 bottom-1 left-1 w-10 rounded-full bg-ink transition-transform duration-300 ease-out-soft"
      :class="units === 'imperial' ? 'translate-x-10' : ''"
      aria-hidden="true"
    />
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="units === o.value"
      :tabindex="units === o.value ? 0 : -1"
      class="relative z-10 h-full w-10 rounded-full text-sm font-semibold transition-colors"
      :class="units === o.value ? 'text-[#2a1745]' : 'text-ink-muted hover:text-ink'"
      @click="select(o.value)"
      @keydown="onKeydown"
    >
      {{ o.label }}<span class="sr-only"> {{ o.name }}</span>
    </button>
  </div>
</template>
