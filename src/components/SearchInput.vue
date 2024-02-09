<template>
  <div class="flex items-center gap-x-8 mb-16">
    <router-link to="/">
      <img :src="home" alt="home-icon" class="w-16 h-16" />
    </router-link>

    <div class="w-full relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Enter location name"
        class="w-full h-8 px-4 py-6 rounded-lg bg-transparent shadow-2xl text-[#FFF] border border-[#FFF] border-opacity-30 outline-[#FFF]"
        @input="getSearchResults"
      />

      <ul
        v-if="searchResults"
        class="absolute bg-[#FFF] text-[#000] w-full shadow-md top-16 rounded-lg"
      >
        <li
          v-for="searchResult in searchResults"
          :key="searchResult.id"
          class="py-2 px-2 cursor-pointer"
        >
          {{ searchResult.place_name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import home from "../assets/home.svg";
import { ref } from "vue";
import { getLocations } from "../api";

const searchQuery = ref("");
const searchResults = ref(null);
const queryTimeout = ref(null);

const getSearchResults = () => {
  clearTimeout(queryTimeout.value);

  queryTimeout.value = setTimeout(async () => {
    if (searchQuery.value !== "") {
      searchResults.value = await getLocations(searchQuery.value);

      console.log(searchResults.value);
      return;
    }

    searchResults.value = null;
  }, 300);
};
</script>
