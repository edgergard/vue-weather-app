<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/widgets/app-header/AppHeader.vue'
import SkyBackdrop from '@/widgets/sky-backdrop/SkyBackdrop.vue'
import { focusPageHeading } from '@/shared/lib/focus'

const mainEl = ref<HTMLElement>()
</script>

<template>
  <a
    href="#main"
    class="sr-only z-50 rounded-full bg-ink px-4 py-2 font-medium text-[#2a1745] focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
    @click.prevent="focusPageHeading(mainEl)"
  >
    Skip to content
  </a>
  <SkyBackdrop />
  <AppHeader />
  <main
    id="main"
    ref="mainEl"
    tabindex="-1"
    class="mx-auto w-full max-w-6xl px-4 pb-16 outline-none sm:px-8"
  >
    <RouterView v-slot="{ Component, route }">
      <Transition
        mode="out-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
      >
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </main>
  <footer class="mx-auto max-w-6xl px-4 pb-8 text-sm text-ink-muted sm:px-8">
    Weather data by
    <a href="https://open-meteo.com/" class="underline underline-offset-2 hover:text-ink"
      >Open-Meteo</a
    >
  </footer>
</template>
