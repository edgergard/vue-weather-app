<template>
  <div v-if="weatherData" class="relative" >
    <div
      to="/"
      class="min-h-[400px] py-4 px-6 min-w-72 rounded-xl bg-opacity-0 text-[#FFF] shadow-2xl border border-[#FFF] border-opacity-30 hover:bg-[#804FB3] transition-all cursor-pointer"
      @click="previewLocation()"
    >
      <p
        class="min-h-[56px] w-32 md:w-40 text-start text-lg md:text-xl break-words"
      >
        {{ `${location.city}, ${location.state}` }}
      </p>

      <img
        :src="`https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png`"
        alt="card-image"
        class="mx-auto"
      />

      <p>{{ weatherData.current.weather[0].main }}</p>

      <div class="h-px bg-[#FFF] mb-4" />

      <p class="text-6xl mb-4">
        {{ `${weatherData.current.temp.toFixed(0)}°C` }}
      </p>

      <div class="flex flex-col gap-y-1">
        <div class="flex items-center gap-x-2">
          <img :src="thermometer" alt="thermometer-icon" class="w-7 h-7" />
          <p>
            {{ `Real feel: ${weatherData.current.feels_like.toFixed(0)}°` }}
          </p>
        </div>

        <div class="flex items-center gap-x-2">
          <img :src="humidity" alt="humidity-icon" class="w-7 h-7" />
          <p>{{ `Humidity: ${weatherData.current.humidity}%` }}</p>
        </div>

        <div class="flex items-center gap-x-2">
          <img :src="wind" alt="wind-icon" class="w-7 h-7" />
          <p>{{ `Wind: ${weatherData.current.wind_speed} km/h` }}</p>
        </div>
      </div>
    </div>

    <div class="z-10 absolute top-2 right-2 flex items-center">
      <button 
        class="rounded-full hover:bg-violet-900 p-2"
        @click="toggleRefresh"
      >
        <img :src="refresh" alt="close-icon" class="w-8 h-8" />
      </button>

      <button
        class="rounded-full hover:bg-violet-900 p-1"
        @click="removeLocation"
      >
        <img :src="close" alt="close-icon" class="w-10 h-10" />
      </button>
    </div>
  </div>

  <div
    v-else
    class="min-h-[400px] py-4 px-6 min-w-72 rounded-xl bg-opacity-0 text-[#FFF] shadow-2xl border border-[#FFF] border-opacity-30 hover:bg-[#804FB3] transition-all cursor-pointer flex justify-center items-center"
  >
    <Loader class="w-16 h-16" />
  </div>
</template>

<script setup lang="ts">
import { close, refresh, wind, humidity, thermometer } from "../assets";
import { useRouter } from "vue-router";
import { defineProps, defineEmits, ref, onMounted, watch } from "vue";
import { getWeatherData } from "../api/getWeatherData";
import { Loader } from "../components";
import { LocationType, WeatherData } from "../types";

const props = defineProps<{
  location: LocationType;
}>();

const emit = defineEmits(["remove"]);

const router = useRouter();
const weatherData = ref<WeatherData | null>(null);
const refreshFlag = ref(false);

const toggleRefresh = () => {
  weatherData.value = null;
  refreshFlag.value = !refreshFlag.value;
};

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

const loadWeatherData = async () => {
  weatherData.value = await getWeatherData(
    props.location.lat,
    props.location.lon,
  );
};

const removeLocation = () => {
  emit("remove", props.location.id);
};

onMounted(loadWeatherData);

watch(refreshFlag, () => {
  loadWeatherData();
});
</script>
