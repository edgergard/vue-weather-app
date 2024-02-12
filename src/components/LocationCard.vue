<template>
  <div class="relative">
    <div
    to="/"
    class="min-h-[400px] py-4 px-6 min-w-72 rounded-xl bg-opacity-0 text-[#FFF] shadow-2xl border border-[#FFF] border-opacity-30 hover:bg-[#804FB3] transition-all cursor-pointer"
    @click="previewLocation()"
    >
      <p class="min-h-[56px] w-48 md:w-64 text-start text-lg md:text-xl">
        {{ `${location.city}, ${location.state}` }}
      </p>

      <img :src="image" alt="card-image" class="mx-auto" />

      <p>Clouds</p>

      <div class="h-px bg-[#FFF] mb-4" />

      <p class="text-6xl mb-4">27°C</p>

      <div class="flex flex-col gap-y-1">
        <p>Real feel: 27°</p>

        <p>Humidity: 84%</p>

        <p>Wind: 4 km/h</p>
      </div>
    </div>

    <button class="z-10 absolute top-2 right-2" @click="removeLocation">
      <img :src="close" alt="close-icon" class="w-10 h-10">
    </button> 
  </div>
</template>

<script setup lang="ts">
import image from "../assets/image.png";
import close from "../assets/close.svg";
import { useRouter } from "vue-router";
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  location: Object,
});

const emit = defineEmits(['remove']);

const router = useRouter();


const previewLocation = () => {
  router.push({
    name: "Location",
    params: {
      state: props.location.state,
      city: props.location.city,
    },
    query: {
      lat: props.location.lat,
      lon: props.location.lon,
    },
  });
};

const removeLocation = () => {
  emit('remove', props.location.id);
};
</script>
