<template>
  <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
    <LocationCard
      v-for="location in savedLocations"
      :key="location.id"
      :location="location"
      @remove="removeLocation"
    />
  </div>
</template>

<script setup lang="ts">
import { LocationCard } from "../components";
import { ref, watch } from "vue";

const savedLocations = ref(
  JSON.parse(localStorage.getItem("savedLocations")) || [],
);

const removeLocation = (id) => {
  const index = savedLocations.value.findIndex(location => location.id === id);

  if (index !== -1) {
    savedLocations.value.splice(index, 1);
  };
};

watch(savedLocations.value, (newValue) => {
  localStorage.setItem("savedLocations", JSON.stringify(newValue));
});
</script>
