<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/entities/settings'

const settings = useSettingsStore()
const { units } = storeToRefs(settings)

const options = [
  { value: 'metric', label: '°C', name: 'Celsius' },
  { value: 'imperial', label: '°F', name: 'Fahrenheit' },
] as const
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Temperature unit"
    class="relative flex h-12 shrink-0 items-center rounded-full border border-line bg-shade p-1"
  >
    <span
      class="absolute top-1 bottom-1 left-1 w-10 rounded-full bg-veil-strong transition-transform duration-300 ease-out-soft"
      :class="units === 'imperial' ? 'translate-x-10' : ''"
      aria-hidden="true"
    />
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="units === o.value"
      :aria-label="o.name"
      class="relative z-10 h-full w-10 rounded-full text-sm font-medium transition-colors"
      :class="units === o.value ? 'text-ink' : 'text-ink-muted hover:text-ink'"
      @click="units = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>
