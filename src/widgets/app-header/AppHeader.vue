<script setup lang="ts">
import { PlaceSearch } from '@/features/search-place'
import UnitsSwitch from '@/features/switch-units/UnitsSwitch.vue'
</script>

<template>
  <header
    class="mx-auto grid w-full max-w-6xl grid-cols-[auto_auto] items-center gap-3 px-4 pt-5 sm:grid-cols-[auto_1fr_auto] sm:gap-6 sm:px-8 sm:pt-8"
  >
    <RouterLink
      :to="{ name: 'home' }"
      class="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight"
      aria-label="Skyline, your places"
    >
      <svg viewBox="0 0 32 32" class="size-8" aria-hidden="true">
        <circle cx="16" cy="19" r="7" fill="var(--color-sun)" />
        <path d="M2 24h28" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      Skyline
    </RouterLink>
    <div class="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto sm:max-w-xl">
      <PlaceSearch />
    </div>
    <div class="justify-self-end">
      <UnitsSwitch />
    </div>
  </header>
</template>
