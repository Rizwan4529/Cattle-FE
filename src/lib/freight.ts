import { ranch } from '@/config/ranch'
import type { UsState } from '@/data/geo'

/**
 * Mock freight estimate. Straight-line distance from the ranch to the center
 * of the buyer's state, times a road factor, priced per loaded mile.
 * Small loads go on a gooseneck stock trailer; anything heavier goes on a
 * semi ("pot") at ~48,000 lb per load.
 */

const ROAD_FACTOR = 1.2
const MIN_MILES = 25
const GOOSENECK = { name: 'Gooseneck stock trailer', perMile: 3.25, minimum: 200, capacityLb: 24_000 }
const POT = { name: 'Semi cattle pot', perMile: 4.75, minimum: 600, capacityLb: 48_000 }

export interface FreightEstimate {
  miles: number
  hours: number
  trailer: string
  loads: number
  cost: number
  perHead: number
  perCwt: number
  /** Expected shrink as a share of live weight, e.g. 0.03 */
  shrink: number
  shrinkLb: number
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(a))
}

/** Typical shrink: about 2% on a short haul, rising with time on the truck. */
function shrinkFor(miles: number) {
  if (miles < 100) return 0.02
  if (miles < 300) return 0.03
  if (miles < 600) return 0.045
  return 0.06
}

export function estimateFreight(dest: UsState, headCount: number, totalWeightLb: number): FreightEstimate {
  const { lat, lng } = ranch.location
  const miles = Math.max(MIN_MILES, Math.round(haversineMiles(lat, lng, dest.lat, dest.lng) * ROAD_FACTOR))
  const trailer = totalWeightLb <= GOOSENECK.capacityLb ? GOOSENECK : POT
  const loads = Math.max(1, Math.ceil(totalWeightLb / trailer.capacityLb))
  const cost = Math.round(Math.max(trailer.minimum, miles * trailer.perMile) * loads)
  const shrink = shrinkFor(miles)
  // Drivers average ~50 mph with stops; add an hour for loading.
  const hours = Math.round(miles / 50 + 1)

  return {
    miles,
    hours,
    trailer: trailer.name,
    loads,
    cost,
    perHead: headCount ? cost / headCount : cost,
    perCwt: totalWeightLb ? cost / (totalWeightLb / 100) : 0,
    shrink,
    shrinkLb: Math.round(totalWeightLb * shrink),
  }
}
