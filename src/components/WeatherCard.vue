<template>
  <router-link to="/selected" class="py-4 px-6 min-w-72 rounded-xl bg-[#333333] text-[#FFF]">
    <p class="text-center text-base">Kyiv, UA</p>

    <img :src="image" alt="card-image" class="mx-auto" />
    <p>Clouds</p>
    <div class="h-px bg-[#FFF] mb-4" />

    <p class="text-6xl mb-4">27°C</p>
    <div class="flex flex-col gap-y-1">
      <p>Real feel: 27°</p>
      <p>Humidity: 84%</p>
      <p>Wind: 4 km/h</p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import image from "../assets/image.png";
</script>
