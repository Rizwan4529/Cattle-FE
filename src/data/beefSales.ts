/**
 * Sample beef sales since the ranch started selling beef direct (June 2026),
 * for the owner's beef analytics. Orders placed on the site are added on top.
 * Labeled "sample data" wherever shown.
 */

export interface BeefMonth {
  /** yyyy-mm */
  month: string
  shares: number
  cuts: number
  subscriptions: number
  /** Ranch Goods (hides, tallow, chews…), including dog chew and bone broth boxes */
  goods: number
  /** CROWDER Soil (first screened batches from August) */
  soil: number
  /** CROWDER Fuel (first logs packed in August) */
  fuel: number
}

export const beefSalesHistory: BeefMonth[] = [
  { month: '2026-06', shares: 6_200, cuts: 1_850, subscriptions: 0, goods: 0, soil: 0, fuel: 0 },
  { month: '2026-07', shares: 9_800, cuts: 2_640, subscriptions: 478, goods: 0, soil: 0, fuel: 0 },
  { month: '2026-08', shares: 12_400, cuts: 3_910, subscriptions: 1_195, goods: 420, soil: 0, fuel: 380 },
  { month: '2026-09', shares: 16_300, cuts: 4_420, subscriptions: 1_912, goods: 1_180, soil: 1_240, fuel: 920 },
  { month: '2026-10', shares: 19_700, cuts: 6_080, subscriptions: 2_629, goods: 1_960, soil: 2_980, fuel: 1_640 },
  { month: '2026-11', shares: 7_100, cuts: 2_210, subscriptions: 1_195, goods: 740, soil: 1_100, fuel: 860 },
]

/** Packs sold by cut since June (sample) */
export const cutsSold: Record<string, number> = {
  ribeye: 142,
  ground: 388,
  'ny-strip': 118,
  patties: 96,
  filet: 74,
  sirloin: 81,
  brisket: 39,
  roast: 57,
  't-bone': 33,
  'short-ribs': 41,
  'flat-iron': 28,
  stew: 35,
  bones: 22,
}

/** Earlier pools that filled, and how many days each took (sample) */
export const pastPools: { tagId: string; program: string; days: number }[] = [
  { tagId: 'CRW-2601', program: 'Grain-finished', days: 19 },
  { tagId: 'CRW-2604', program: 'Grass-finished', days: 26 },
  { tagId: 'CRW-2610', program: 'Grain-finished', days: 12 },
  { tagId: 'CRW-2615', program: 'Forage + grain', days: 16 },
  { tagId: 'CRW-2622', program: 'Grain-finished', days: 9 },
  { tagId: 'CRW-2630', program: 'Grass-finished', days: 21 },
]
