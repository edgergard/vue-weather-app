<script setup lang="ts">
import AppHeader from '@/widgets/app-header/AppHeader.vue'
import SkyBackdrop from '@/widgets/sky-backdrop/SkyBackdrop.vue'
</script>

<template>
  <SkyBackdrop />
  <AppHeader />
  <main class="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
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
  <footer class="mx-auto max-w-6xl px-4 pb-8 text-sm text-ink-faint sm:px-8">
    Weather data by
    <a href="https://open-meteo.com/" class="underline underline-offset-2 hover:text-ink"
      >Open-Meteo</a
    >
  </footer>
</template>
