<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/widgets/app-header/AppHeader.vue'
import SkyBackdrop from '@/widgets/sky-backdrop/SkyBackdrop.vue'
import { Pause, Play } from 'lucide-vue-next'
import { focusPageHeading } from '@/shared/lib/focus'
import { ambientPaused } from '@/shared/lib/motion'

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
  <footer
    class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-8 text-sm text-ink-muted sm:px-8"
  >
    <p>
      Weather data by
      <a href="https://open-meteo.com/" class="underline underline-offset-2 hover:text-ink"
        >Open-Meteo</a
      >
    </p>
    <!-- WCAG 2.2.2: the moving background can be paused; the choice is remembered. -->
    <button
      type="button"
      class="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-veil px-3 hover:bg-veil-strong hover:text-ink"
      :aria-pressed="ambientPaused"
      @click="ambientPaused = !ambientPaused"
    >
      <Play v-if="ambientPaused" :size="14" aria-hidden="true" />
      <Pause v-else :size="14" aria-hidden="true" />
      Pause animations
    </button>
  </footer>
</template>
