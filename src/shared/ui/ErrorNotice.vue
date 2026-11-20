<script setup lang="ts">
import { RotateCw } from 'lucide-vue-next'

defineProps<{ title: string; detail?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div role="alert" class="pane flex flex-col items-start gap-4 p-6 sm:p-8">
    <div>
      <p class="font-display text-xl font-medium">{{ title }}</p>
      <p v-if="detail" class="mt-1 max-w-prose text-ink-muted">{{ detail }}</p>
    </div>
    <button
      type="button"
      class="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-[#0e1d36] hover:bg-white/90"
      @click="$emit('retry')"
    >
      <RotateCw :size="16" aria-hidden="true" />
      Try again
    </button>
  </div>
</template>
