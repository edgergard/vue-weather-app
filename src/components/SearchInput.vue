<template>
  <div class="flex items-center gap-x-8 mb-16">
    <router-link to="/">
      <img :src="home" alt="home-icon" class="w-16 h-16" />
    </router-link>

    <div class="w-full relative">
      <div
        class="flex items-center gap-x-4 h-12 rounded-lg shadow-2xl text-[#FFF] border border-[#FFF] border-opacity-30 cursor-text"
        :class="{ outline: isInputFocused }"
      >
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Enter location name"
          class="w-full bg-transparent outline-none px-4 py-6"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @input="getSearchResults"
        />

        <img
          v-if="searchQuery"
          :src="close"
          alt="close-icon"
          class="w-18 h-8 cursor-pointer mr-2"
          @click="searchQuery = ''"
        />
      </div>

      <ul
        v-if="searchQuery && searchResults?.length"
        class="absolute bg-[#FFF] text-[#000] w-full shadow-md top-16 rounded-lg z-20"
      >
        <li
          v-for="searchResult in searchResults"
          :key="searchResult.id"
          class="py-2 px-2 cursor-pointer"
          @click="previewLocation(searchResult)"
        >
          {{ searchResult.place_name }}
        </li>
      </ul>

      <p
        v-else-if="searchQuery && !searchResults?.length"
        class="absolute bg-[#FFF] text-[#000] w-full shadow-md top-16 rounded-lg z-20 py-2 px-2"
      >
        No matched locations
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { home, close } from "../assets";
import { ref } from "vue";
import { getLocations } from "../api";
import { useRouter } from "vue-router";
import { SearchResult } from "../types";

const searchQuery = ref("");
const searchResults = ref<SearchResult[] | null>(null);
const queryTimeout = ref<number | null>(null);
const isInputFocused = ref(false);

const router = useRouter();

const previewLocation = (searchResult: SearchResult) => {
  const [city, state] = searchResult.place_name.split(",");

  const formattedState = state.replace(/\s/g, "");

  router.push({
    name: "Location",
    params: { state: formattedState, city: city.trim() },
    query: {
      lat: searchResult.geometry.coordinates[1],
      lon: searchResult.geometry.coordinates[0],
    },
  });

  searchQuery.value = "";
};

const getSearchResults = () => {
  if (queryTimeout.value !== null) {
    clearTimeout(queryTimeout.value);
  }

  queryTimeout.value = setTimeout(async () => {
    if (searchQuery.value !== "") {
      searchResults.value = await getLocations(searchQuery.value);
      console.log(searchResults.value);
      return;
    }

    searchResults.value = null;
  }, 300);
};

const handleInputFocus = () => {
  isInputFocused.value = true;
};

const handleInputBlur = () => {
  isInputFocused.value = false;
};
</script>
