/**
 * @fileOverview Delivery calculation utilities.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the Haversine distance between two points on Earth.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in kilometers.
 */
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates the delivery cost based on distance.
 * This is a simple model and can be expanded.
 * @param distanceInKm The distance in kilometers.
 * @returns The calculated delivery cost.
 */
export function calculateDeliveryCost(distanceInKm: number): number {
  const BASE_FEE = 15.00; // Base cost.
  const PER_KM_RATE = 8.00; // Cost per kilometer.

  const calculatedCost = BASE_FEE + (distanceInKm * PER_KM_RATE);
  
  // Round to 2 decimal places
  return Math.round(calculatedCost * 100) / 100;
}


/**
 * Calculates delivery cost between two coordinate points.
 * @param userCoords - The user's coordinates { latitude: number, longitude: number }.
 * @param storeCoords - The store's coordinates { latitude: number, longitude: number }.
 * @returns The delivery cost, or null if coordinates are invalid.
 */
export function getDeliveryCostForStore(
  userCoords: { latitude: number; longitude: number; },
  storeCoords: { latitude: number; longitude: number; }
): number | null {
  if (!userCoords || !storeCoords) {
    return null;
  }
  const distance = getHaversineDistance(
    userCoords.latitude,
    userCoords.longitude,
    storeCoords.latitude,
    storeCoords.longitude
  );
  return calculateDeliveryCost(distance);
}
