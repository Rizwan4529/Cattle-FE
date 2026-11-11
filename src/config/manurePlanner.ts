/**
 * Manure Revenue Planner defaults (owner dashboard).
 *
 * ⚠ PLACEHOLDERS: CONFIRM WITH YOUR OWN NUMBERS. These are rough figures for
 * beef cows on Colorado pasture with winter feeding ground, not CROWDER's
 * measurements. The owner can change every one of them on the planner page
 * (saved in the browser); this file is only the starting point.
 */

import type { PlannerSettings } from '@/data/soilFuelTypes'

export const plannerDefaults: PlannerSettings = {
  headCount: 250,
  /** A 1,200 lb cow makes roughly 60–70 lb of wet manure a day */
  lbPerHeadDay: 65,
  /** Only manure from pens, lots, and winter feeding ground can be picked up */
  collectionRate: 0.3,
  /** Wet manure + hay → finished, screened compost keeps about half its weight */
  compostLoss: 0.5,
  /** Drying from ~75% to under 15% moisture loses most of the weight */
  fuelLoss: 0.7,
  /** Tons of alfalfa/hay per ton of manure, for the carbon balance */
  hayPerTon: 0.15,
  hayCostPerTon: 190,

  toCompost: 0.55,
  toFuel: 0.15,

  compostMix: { bag: 0.25, yard: 0.45, ton: 0.3 },
  compostPrice: { bag: 9.5, yard: 46, ton: 70 },

  fuelLbPerBundle: 13,
  /** Blended across bundles, cases, and pallets */
  fuelPricePerBundle: 10.5,

  laborRate: 22,
  laborHoursPerTonCompost: 0.8,
  laborHoursPerTonFuel: 6,
  equipment: { turner: 28000, bagger: 16000, press: 14000 },
  equipmentYears: 7,
  dryingSpacePerYear: 3000,
  bagCost: 0.9,
  fuelPackCost: 1.25,
  deliveryCostPerTon: 18,
  deliveredShare: 0.4,
  seasonal: true,
}

/** How each year's sales fall by month, Jan–Dec (each adds to 1). PLACEHOLDER. */
export const plannerSeasonality = {
  /** Spring planting and fall topdressing */
  compost: [0.02, 0.03, 0.1, 0.16, 0.17, 0.12, 0.07, 0.06, 0.1, 0.1, 0.04, 0.03],
  /** Camping season and fall fire-pit nights; drying limits winter supply */
  fuel: [0.04, 0.04, 0.05, 0.07, 0.1, 0.12, 0.12, 0.11, 0.11, 0.11, 0.07, 0.06],
}

/** Shown next to every planner input */
export const plannerNote = 'Placeholder: confirm with your own numbers.'
