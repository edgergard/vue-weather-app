<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-vue-next'
import { describeCode } from '../lib/conditions'
import type { ConditionGroup } from '../model/types'

const props = withDefaults(defineProps<{ code: number; isDay?: boolean; size?: number }>(), {
  isDay: true,
  size: 24,
})

const ICONS: Record<ConditionGroup, [day: Component, night: Component]> = {
  clear: [Sun, Moon],
  partly: [CloudSun, CloudMoon],
  cloudy: [Cloud, Cloud],
  fog: [CloudFog, CloudFog],
  drizzle: [CloudDrizzle, CloudDrizzle],
  rain: [CloudRain, CloudRain],
  snow: [CloudSnow, CloudSnow],
  storm: [CloudLightning, CloudLightning],
}

const condition = computed(() => describeCode(props.code))
const icon = computed(() => ICONS[condition.value.group][props.isDay ? 0 : 1])
</script>

<template>
  <component :is="icon" :size="size" :stroke-width="1.5" role="img" :aria-label="condition.label" />
</template>
