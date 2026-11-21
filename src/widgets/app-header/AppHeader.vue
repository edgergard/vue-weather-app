<script setup lang="ts">
import { Bookmark, Globe } from 'lucide-vue-next'
import { PlaceSearch } from '@/features/search-place'
import UnitsSwitch from '@/features/switch-units/UnitsSwitch.vue'

const sections = [
  { name: 'globe', label: 'Globe', icon: Globe },
  { name: 'places', label: 'Places', icon: Bookmark },
] as const
</script>

<template>
  <header
    class="mx-auto grid w-full max-w-6xl grid-cols-[auto_auto] items-center gap-3 px-4 pt-5 sm:grid-cols-[auto_1fr_auto] sm:gap-6 sm:px-8 sm:pt-8"
  >
    <!-- Rendered by hand so the logo never claims aria-current: the Globe link already does. -->
    <RouterLink v-slot="{ href, navigate }" :to="{ name: 'globe' }" custom>
      <a
        :href="href"
        class="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight"
        aria-label="Skyline, home"
        @click="navigate"
      >
        <svg viewBox="0 0 32 32" class="size-8" aria-hidden="true">
          <circle cx="16" cy="19" r="7" fill="var(--color-sun)" />
          <path d="M2 24h28" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <!-- On the narrowest phones the sections need the room; the link keeps its name. -->
        <span class="max-[399px]:sr-only">Skyline</span>
      </a>
    </RouterLink>
    <div class="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto sm:max-w-xl">
      <PlaceSearch />
    </div>
    <div class="flex items-center gap-2 justify-self-end">
      <!-- RouterLink sets aria-current="page" on the open section. -->
      <nav
        aria-label="Sections"
        class="flex h-12 shrink-0 rounded-full border border-line bg-shade p-1"
      >
        <RouterLink
          v-for="item in sections"
          :key="item.name"
          :to="{ name: item.name }"
          class="inline-flex items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-[#2a1745] sm:px-3.5"
        >
          <component :is="item.icon" :size="18" aria-hidden="true" />
          <span class="max-sm:sr-only">{{ item.label }}</span>
        </RouterLink>
      </nav>
      <UnitsSwitch />
    </div>
  </header>
</template>
