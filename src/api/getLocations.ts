import axios from "axios";

const mapboxApiToken =
  "pk.eyJ1IjoiZWRnZXJnYXJkIiwiYSI6ImNsc2VrZDBpYjA1cjUyam1ybnRxanc4czUifQ.JXxAZmIFHrmN5VWVTzya6w";

export const getLocations = async (query: string) => {
  const result = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxApiToken}&types=place`,
  );

  return result.data.features;
};
