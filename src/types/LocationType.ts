import { LocationQueryValue } from "vue-router";

export type LocationType = {
  city: string | string[];
  state: string | string[];
  lat: LocationQueryValue | LocationQueryValue[];
  lon: LocationQueryValue | LocationQueryValue[];
  id: string;
};
