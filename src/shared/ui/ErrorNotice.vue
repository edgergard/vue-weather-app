<script setup lang="ts">
import { RotateCw } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; detail?: string; actionLabel?: string }>(), {
  detail: undefined,
  actionLabel: 'Try again',
})
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
      class="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-[#2a1745] hover:bg-white/90"
      @click="$emit('retry')"
    >
      <RotateCw v-if="actionLabel === 'Try again'" :size="16" aria-hidden="true" />
      {{ actionLabel }}
    </button>
  </div>
</template>
