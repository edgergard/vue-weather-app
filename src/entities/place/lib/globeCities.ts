export interface GlobeCity {
  name: string
  country: string
  lat: number
  lon: number
  /** 1: always labelled on the globe. 2: a dot whose label shows on hover, focus or selection. */
  tier: 1 | 2
}

/** Major cities shown as markers on the globe page, spread so every continent has a few. */
export const GLOBE_CITIES: readonly GlobeCity[] = [
  { name: 'Kyiv', country: 'Ukraine', lat: 50.4547, lon: 30.5238, tier: 1 },
  { name: 'London', country: 'United Kingdom', lat: 51.5085, lon: -0.1257, tier: 1 },
  { name: 'New York', country: 'United States', lat: 40.7143, lon: -74.006, tier: 1 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6895, lon: 139.6917, tier: 1 },
  { name: 'Sydney', country: 'Australia', lat: -33.8678, lon: 151.2073, tier: 1 },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9064, lon: -43.1822, tier: 1 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0626, lon: 31.2497, tier: 1 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9258, lon: 18.4232, tier: 1 },
  { name: 'Mumbai', country: 'India', lat: 19.0728, lon: 72.8826, tier: 1 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4285, lon: -99.1277, tier: 1 },
  { name: 'Reykjavík', country: 'Iceland', lat: 64.1355, lon: -21.8954, tier: 1 },
  { name: 'Singapore', country: 'Singapore', lat: 1.2897, lon: 103.8501, tier: 1 },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437, tier: 1 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6131, lon: -58.3772, tier: 1 },
  { name: 'Paris', country: 'France', lat: 48.8534, lon: 2.3488, tier: 2 },
  { name: 'Berlin', country: 'Germany', lat: 52.5244, lon: 13.4105, tier: 2 },
  { name: 'Madrid', country: 'Spain', lat: 40.4165, lon: -3.7026, tier: 2 },
  { name: 'Rome', country: 'Italy', lat: 41.8919, lon: 12.5113, tier: 2 },
  { name: 'Istanbul', country: 'Türkiye', lat: 41.0138, lon: 28.9497, tier: 2 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2298, lon: 21.0118, tier: 2 },
  { name: 'Lviv', country: 'Ukraine', lat: 49.8383, lon: 24.0232, tier: 2 },
  { name: 'Odesa', country: 'Ukraine', lat: 46.4775, lon: 30.7326, tier: 2 },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.0772, lon: 55.3093, tier: 2 },
  { name: 'Beijing', country: 'China', lat: 39.9075, lon: 116.3972, tier: 2 },
  { name: 'Seoul', country: 'South Korea', lat: 37.566, lon: 126.9784, tier: 2 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7539, lon: 100.5014, tier: 2 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2146, lon: 106.8451, tier: 2 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.4541, lon: 3.3947, tier: 2 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2833, lon: 36.8167, tier: 2 },
  { name: 'Toronto', country: 'Canada', lat: 43.7001, lon: -79.4163, tier: 2 },
  { name: 'Chicago', country: 'United States', lat: 41.85, lon: -87.65, tier: 2 },
  { name: 'Vancouver', country: 'Canada', lat: 49.2497, lon: -123.1193, tier: 2 },
  { name: 'Lima', country: 'Peru', lat: -12.0432, lon: -77.0282, tier: 2 },
  { name: 'Santiago', country: 'Chile', lat: -33.4569, lon: -70.6483, tier: 2 },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7635, tier: 2 },
  { name: 'Anchorage', country: 'United States', lat: 61.2181, lon: -149.9003, tier: 2 },
  { name: 'Delhi', country: 'India', lat: 28.6519, lon: 77.2315, tier: 2 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3294, lon: 18.0687, tier: 2 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7167, lon: -9.1333, tier: 2 },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7278, tier: 2 },
  { name: 'Honolulu', country: 'United States', lat: 21.3069, lon: -157.8583, tier: 2 },
  { name: 'Perth', country: 'Australia', lat: -31.9522, lon: 115.8614, tier: 2 },
]
