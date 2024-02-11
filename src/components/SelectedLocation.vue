<template>
  <div
    class="w-full bg-opacity-0 border border-[#FFF] border-opacity-30 text-[#FFF] rounded-xl py-4 px-8 shadow-2xl"
  >
    <div class="flex justify-between">
      <div>
        <img :src="image" alt="card-image" class="w-32 h-32" />
        <p class="text-4xl mb-1">Kyiv, UA</p>

        <div class="h-px bg-[#FFF] mb-4" />

        <p class="text-5xl mb-3">27°C</p>

        <p class="mb-3">High: 2°C | Low: 1°C</p>

        <div class="flex flex-col gap-y-1">
          <p>Real feel: 27°</p>
          <p>Humidity: 84%</p>
          <p>Wind: 4 km/h</p>
        </div>
      </div>
      <p class="text-lg pl-32">Local time: Thursday, 3:36pm</p>

      <div>
        <p class="text-lg text-end mb-2">Hourly Forecast</p>

        <ul class="grid grid-cols-3 gap-4">
          <li
            v-for="block in list"
            :key="block"
            class="flex flex-col justify-center items-center w-[100px] h-[100px] px-2 py-2 border-2 rounded-xl"
          >
            <p>5:00 pm</p>

            <div class="flex items-center justify-end">
              <img :src="image" alt="image" class="w-10 h-10" />

              <p>2°C</p>
            </div>

            <p class="text-sm">Clouds</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getWeatherData } from "../api/getWeatherData";
import image from "../assets/image.png";
import { onMounted, ref } from "vue";
import { useRoute } from 'vue-router'

const route = useRoute();
console.log(route.query);
const [lat, lon] = [route.query.lat, route.query.lon];

const list = [1, 1, 1, 1, 1, 1, 1, 1];
const weatherData = ref(null);

onMounted(() => {
  weatherData.value = getWeatherData(lat, lon);
})
</script>