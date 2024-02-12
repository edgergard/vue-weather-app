<template>
  <div v-if="weatherData">
    <button
      v-if="
        savedLocations.some(
          (location) =>
            location.lat === router.query.lat &&
            location.lon === router.query.lon,
        )
      "
      class="w-full lg:w-48 px-4 py-2 text-lg font-medium bg-purple-900 text-[#FFF] rounded-lg mb-4"
      @click="removeLocation"
    >
      Delete from saved
    </button>
    <button
      v-else
      class="w-full lg:w-48 px-4 py-2 text-lg font-medium bg-purple-900 text-[#FFF] rounded-lg mb-4"
      @click="saveLocation"
    >
      Save location
    </button>
    <div
      class="text-[#FFF] grid md:grid-cols-2 xl:grid-cols-3 gap-4 break-words"
    >
      <div
        class="bg-opacity-0 border border-[#FFF] border-opacity-30 rounded-xl py-8 px-8 shadow-2xl flex flex-col items-center justify-around gap-y-16 text-center"
      >
        <p class="text-3xl sm:text-5xl font-bold">
          {{ `${router.params.city}, ${router.params.state}` }}
        </p>
        <p class="text-4xl sm:text-7xl font-bold">
          {{ convertDate(weatherData.timezone).time }}
        </p>
        <p class="text-3xl sm:text-5xl">
          {{ convertDate(weatherData.timezone).date }}
        </p>
      </div>

      <div
        class="bg-opacity-0 border border-[#FFF] border-opacity-30 rounded-xl py-4 px-8 shadow-2xl flex flex-col items-center justify-around"
      >
        <img
          :src="`https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png`"
          alt="card-image"
          class="w-32 h-32 mx-auto mb-4"
        />

        <div class="flex flex-col justify-between items-center gap-y-16">
          <div class="flex text-3xl sm:text-6xl gap-x-4">
            <p>{{ `${weatherData.current.temp.toFixed(0)}°C` }}</p>
            <div class="w-1 h-full bg-[#FFF]" />
            <p>{{ weatherData.current.weather[0].main }}</p>
          </div>

          <div class="flex gap-10 text-base sm:text-xl">
            <div class="flex flex-col gap-y-1">
              <p>
                {{
                  `High: ${weatherData.daily[0].temp.max.toFixed(0)}°C | Low: ${weatherData.daily[0].temp.min.toFixed(0)}°C`
                }}
              </p>
              <p>
                {{ `Real feel: ${weatherData.current.feels_like.toFixed(0)}°` }}
              </p>
            </div>

            <div class="flex flex-col gap-y-1">
              <p>{{ `Humidity: ${weatherData.current.humidity}%` }}</p>
              <p>{{ `Wind: ${weatherData.current.wind_speed} km/h` }}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex flex-col items-center bg-opacity-0 border border-[#FFF] border-opacity-30 rounded-xl py-4 px-8 shadow-2xl"
      >
        <p class="text-2xl sm:text-3xl text-center mb-4 font-medium">
          Hourly Forecast
        </p>

        <ul class="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <li
            v-for="hourlyWeather in weatherData.hourly.slice(0, 9)"
            :key="hourlyWeather.dt"
            class="flex flex-col justify-center items-center w-[100px] px-2 py-2 border-2 rounded-xl shadow-2xl"
          >
            <p>{{ convertTime(hourlyWeather.dt) }}</p>

            <div class="flex items-center justify-end">
              <img
                :src="`https://openweathermap.org/img/wn/${hourlyWeather.weather[0].icon}@2x.png`"
                alt="image"
                class="w-10 h-10"
              />

              <p>{{ `${hourlyWeather.temp.toFixed(0)}°C` }}</p>
            </div>

            <p class="text-sm">{{ hourlyWeather.weather[0].main }}</p>
          </li>
        </ul>
      </div>
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
import { getWeatherData } from "../api/getWeatherData";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { convertDate, convertTime } from "../utils";
import { Loader } from "../components";
import { WeatherData, LocationType } from "../types";

const router = useRoute();
const weatherData = ref<WeatherData | null>(null);

const savedLocationsData = localStorage.getItem("savedLocations");
const savedLocations = ref<LocationType[]>(
  savedLocationsData ? JSON.parse(savedLocationsData) : [],
);

const loadWeatherData = async () => {
  const [lat, lon] = [router.query.lat, router.query.lon];

  weatherData.value = await getWeatherData(lat, lon);
  console.log(weatherData.value);
};

const saveLocation = () => {
  const location = {
    id: Date.now().toString(),
    city: router.params.city,
    state: router.params.state,
    lat: router.query.lat,
    lon: router.query.lon,
  };

  savedLocations.value.push(location);
};

const removeLocation = () => {
  const index = savedLocations.value.findIndex(
    (location) =>
      location.lat === router.query.lat && location.lon === router.query.lon,
  );

  if (index !== -1) {
    savedLocations.value.splice(index, 1);
  }
};

onMounted(loadWeatherData);

watch(() => [router.query.lat, router.query.lon], loadWeatherData);
watch(savedLocations.value, (newValue) => {
  localStorage.setItem("savedLocations", JSON.stringify(newValue));
});
</script>
