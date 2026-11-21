<script setup lang="ts">
const links = [
  { href: 'https://openfreemap.org', label: 'OpenFreeMap' },
  { href: 'https://www.openmaptiles.org/', label: '© OpenMapTiles' },
  { href: 'https://www.openstreetmap.org/copyright', label: '© OpenStreetMap contributors' },
]
</script>

<!-- Required map credits, always visible and readable (not hidden behind an "i" button). -->
<template>
  <p
    class="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-full border border-line bg-[rgb(26_12_48/0.5)] px-3 py-1 text-xs text-ink-muted"
  >
    <span class="sr-only">Map data:</span>
    <template v-for="(link, i) in links" :key="link.href">
      <span v-if="i" aria-hidden="true">·</span>
      <a
        :href="link.href"
        class="rounded-sm underline decoration-white/30 underline-offset-2 hover:text-ink hover:decoration-white"
        >{{ link.label }}</a
      >
    </template>
  </p>
</template>
