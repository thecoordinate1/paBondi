/**
 * @fileOverview Delivery calculation utilities.
 */

export type DeliveryMethod = 'pickup' | 'economy' | 'normal' | 'express';

const BASE_FEE = 15.00; // Base cost for any delivery.

// Define different rates per kilometer for each tier
const RATE_ECONOMY = 2.00;
const RATE_NORMAL = 3.50;
const RATE_EXPRESS = 5.00;


/**
 * Calculates the delivery cost based on distance and delivery method.
 * @param distanceInKm The distance in kilometers.
 * @param method The selected delivery method.
 * @returns The calculated delivery cost. Returns 0 for 'pickup'.
 */
export function calculateDeliveryCost(distanceInKm: number, method: DeliveryMethod): number {
  if (method === 'pickup') {
    return 0;
  }
  
  let ratePerKm: number;
  switch (method) {
    case 'express':
      ratePerKm = RATE_EXPRESS;
      break;
    case 'economy':
      ratePerKm = RATE_ECONOMY;
      break;
    case 'normal':
    default:
      ratePerKm = RATE_NORMAL;
      break;
  }

  const calculatedCost = BASE_FEE + (distanceInKm * ratePerKm);
  
  // Round to the nearest .5 or .0
  return Math.round(calculatedCost * 2) / 2;
}
