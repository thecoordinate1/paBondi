/**
 * @fileOverview Delivery calculation utilities.
 */

/**
 * Calculates the delivery cost based on distance.
 * This is a simple model and can be expanded.
 * @param distanceInKm The distance in kilometers.
 * @returns The calculated delivery cost.
 */
export function calculateDeliveryCost(distanceInKm: number): number {
  const BASE_FEE = 15.00; // Base cost.
  const PER_KM_RATE = 3.00; // Cost per kilometer.

  const calculatedCost = BASE_FEE + (distanceInKm * PER_KM_RATE);
  
  // Round to 2 decimal places
  return Math.round(calculatedCost * 100) / 100;
}
