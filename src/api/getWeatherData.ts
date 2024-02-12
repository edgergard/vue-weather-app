import axios from "axios";
import { LocationQueryValue } from "vue-router";

type LocationData = LocationQueryValue | LocationQueryValue[];

const openweatherApiKey = "101c1c8cd72fb8827bba87bfb0bd9c99";

export const getWeatherData = async (lat: LocationData, lon: LocationData) => {
  const weatherData = await axios.get(
    `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${openweatherApiKey}`,
  );

  return weatherData.data;
};
