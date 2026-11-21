<script setup lang="ts">
import { Pause, Play } from 'lucide-vue-next'
import { ambientPaused } from '@/shared/lib/motion'
</script>

<template>
  <footer class="mt-auto border-t border-line bg-shade">
    <div
      class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 text-sm text-ink-muted sm:px-8"
    >
      <div class="flex items-center gap-3">
        <svg viewBox="0 0 32 32" class="size-6 shrink-0" aria-hidden="true">
          <circle cx="16" cy="19" r="7" fill="var(--color-sun)" />
          <path d="M2 24h28" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p>
          Weather data by
          <a
            href="https://open-meteo.com/"
            class="font-medium text-ink underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >Open-Meteo</a
          >
        </p>
      </div>

      <!-- WCAG 2.2.2: the moving background can be paused; the choice is remembered. -->
      <button
        type="button"
        class="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-veil px-3.5 hover:bg-veil-strong hover:text-ink"
        :aria-pressed="ambientPaused"
        @click="ambientPaused = !ambientPaused"
      >
        <Play v-if="ambientPaused" :size="14" aria-hidden="true" />
        <Pause v-else :size="14" aria-hidden="true" />
        Pause animations
      </button>
    </div>
  </footer>
</template>
