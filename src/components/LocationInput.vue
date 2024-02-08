<template>
  <div class="flex items-center gap-x-8 mb-16">
    <router-link to="/">
      <img :src="home" alt="home-icon" class="w-16 h-16" />
    </router-link>

    <input
      type="text"
      placeholder="Enter location name"
      class="w-full h-8 px-4 py-6 rounded-lg bg-transparent shadow-2xl text-[#FFF] border border-[#FFF] border-opacity-30 outline-[#FFF]"
    />
  </div>
</template>

<script setup lang="ts">
import home from "../assets/home.svg";
</script>
