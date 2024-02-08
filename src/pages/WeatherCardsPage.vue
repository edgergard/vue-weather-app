<template>
  <input
    type="text"
    placeholder="Enter location name"
    class="w-full h-8 px-2 py-6 mb-16 rounded-lg"
  />
  <WeatherCardList />
</template>

<script setup lang="ts">
import { WeatherCardList } from "../components";
</script>
