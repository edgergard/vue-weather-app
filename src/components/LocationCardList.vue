<template>
  <div
    v-if="savedLocations.length"
    class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12"
  >
    <LocationCard
      v-for="location in savedLocations"
      :key="location.id"
      :location="location"
      @remove="removeLocation"
    />
  </div>
  <h1 v-else class="text-white font-bold text-xl md:text-5xl text-center">
    You do not have saved locations. Use search bar to add locations.
  </h1>
</template>

<script setup lang="ts">
import { LocationCard } from "../components";
import { ref, watch } from "vue";
import { LocationType } from "../types";

const savedLocationsData = localStorage.getItem("savedLocations");
const savedLocations = ref<LocationType[]>(savedLocationsData ? JSON.parse(savedLocationsData) : []);

const removeLocation = (id: string) => {
  const index = savedLocations.value.findIndex(
    (location) => location.id === id,
  );

  if (index !== -1) {
    savedLocations.value.splice(index, 1);
  };
};

watch(savedLocations.value, (newValue) => {
  localStorage.setItem("savedLocations", JSON.stringify(newValue));
});
</script>
