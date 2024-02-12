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
        v-if="searchQuery && searchResults"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import home from "../assets/home.svg";
import close from "../assets/close.svg";
import { ref } from "vue";
import { getLocations } from "../api";
import { useRouter } from "vue-router";

const searchQuery = ref("");
const searchResults = ref(null);
const queryTimeout = ref(null);
const isInputFocused = ref(false);

const router = useRouter();

const previewLocation = (searchResult) => {
  const [city, state] = searchResult.place_name.split(",");

  router.push({
    name: "Location",
    params: { state: state.replaceAll(" ", ""), city: city },
    query: {
      lat: searchResult.geometry.coordinates[1],
      lon: searchResult.geometry.coordinates[0],
    },
  });

  searchQuery.value = "";
};

const getSearchResults = () => {
  clearTimeout(queryTimeout.value);

  queryTimeout.value = setTimeout(async () => {
    if (searchQuery.value !== "") {
      searchResults.value = await getLocations(searchQuery.value);

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
