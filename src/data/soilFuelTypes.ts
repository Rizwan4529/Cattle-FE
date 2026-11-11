/**
 * Types for CROWDER Soil (composted manure + alfalfa/hay) and CROWDER Fuel
 * (dried, pressed manure fuel). See SPEC-SOIL-FUEL. Prices, rates, and
 * product names live in `config/soilFuel.ts`; seed records in `data/soilFuel.ts`.
 */

import type { ComplianceStatus } from './goodsTypes'

export type Division = 'soil' | 'fuel'

// ---------------------------------------------------------------- Soil

export type SoilProductId = 'garden-blend' | 'lawn-topdress' | 'ag-bulk' | 'potting-mix'

/** How compost is sold. A truckload is quoted, not added to the cart. */
export type SoilUnit = 'bag' | 'yard' | 'ton' | 'truckload'

/** What the coverage calculator is figuring for. */
export type SoilUse = 'new-lawn' | 'topdress' | 'garden-bed' | 'field'

/** How much to put down for one use: a depth (lawns, beds) or tons per acre (fields). */
export type ApplicationRate = { use: SoilUse; depthIn: number; note: string } | { use: SoilUse; tonsPerAcre: number; note: string }

/** Illustration for a soil or fuel product card. */
export type SoilFuelArt = 'garden-bag' | 'topdress' | 'bulk-pile' | 'potting-bag' | 'fuel-logs' | 'briquettes' | 'campfire' | 'cow-chips'

export interface SoilProduct {
  id: SoilProductId
  name: string
  /** One line under the name */
  tagline: string
  description: string
  /** What it's made of, in plain words */
  madeOf: string[]
  bestUses: string[]
  rates: ApplicationRate[]
  /** Bulk density, lb per cubic yard. PLACEHOLDER. */
  lbPerYard: number
  /** Bag size, cubic feet */
  bagCuFt: number
  /** Prices per bag, cubic yard, and ton. PLACEHOLDER. A truckload is derived from the ton price. */
  price: { bag: number; yard: number; ton: number }
  /** Compliance work this product needs before it's sold */
  requires: ComplianceRequirementId[]
  art: SoilFuelArt
  featured?: boolean
}

/** Commercial buyers on the Pro accounts page and the quote form. */
export type ProBuyerKind = 'landscaper' | 'golf-course' | 'farm' | 'garden-center' | 'other'

export interface ProTier {
  id: 'retail' | 'pro' | 'contractor' | 'wholesale'
  label: string
  /** Cubic yards a year to reach this tier */
  minYards: number
  /** Share off list price */
  off: number
  /** Who it usually fits */
  fits: string
}

export type DeliveryWindow = 'asap' | 'two-weeks' | 'month' | 'spring'

export type QuoteStatus = 'new' | 'quoted' | 'won' | 'lost'

/** A truckload quote request from the Soil page (lands in the dashboard). */
export interface TruckloadQuote {
  id: string
  name: string
  business: string
  kind: ProBuyerKind
  email: string
  phone: string
  zip: string
  productId: SoilProductId
  /** Truckloads */
  loads: number
  window: DeliveryWindow
  /** Road miles from the ranch, as estimated when requested */
  miles: number
  /** Delivered price shown when requested */
  estimate: number
  notes: string
  status: QuoteStatus
  /** The owner's quoted price, once sent */
  quoted?: number
  createdAt: string
}

export type ApplicationStatus = 'new' | 'approved' | 'declined'

/** A Pro account application. */
export interface ProApplication {
  id: string
  business: string
  kind: ProBuyerKind
  contact: string
  email: string
  phone: string
  city: string
  /** Cubic yards a year they expect to buy */
  yardsPerYear: number
  interests: SoilProductId[]
  message: string
  status: ApplicationStatus
  createdAt: string
}

// ---------------------------------------------------------------- Dealers

export type DealerKind = 'garden-center' | 'feed-store' | 'hardware' | 'nursery'

/** A store that stocks CROWDER Soil or Fuel (mock). */
export interface Dealer {
  id: string
  name: string
  kind: DealerKind
  address: string
  city: string
  zip: string
  lat: number
  lng: number
  phone: string
  hours: string
  carries: (SoilProductId | FuelProductId)[]
}

/** "Become a dealer" form submissions. */
export interface DealerApplication {
  id: string
  business: string
  kind: DealerKind
  contact: string
  email: string
  phone: string
  city: string
  interests: Division[]
  message: string
  status: ApplicationStatus
  createdAt: string
}

/** Launch-season pre-order / waitlist sign-up. */
export interface WaitlistSignup {
  id: string
  name: string
  email: string
  zip: string
  interests: (SoilProductId | FuelProductId)[]
  createdAt: string
}

// ---------------------------------------------------------------- Fuel

export type FuelProductId = 'fuel-logs' | 'briquettes' | 'campfire-bundle' | 'cow-chip-gift'

/** A bundle is the retail pack; a case holds several bundles; a pallet holds several cases. */
export type FuelUnit = 'bundle' | 'case' | 'pallet'

export interface FuelProduct {
  id: FuelProductId
  name: string
  tagline: string
  description: string
  /** Shape it's made in, from the research sheet: pressed log, briquette… */
  form: string
  /** What's in one bundle, e.g. "6 logs, about 15 lb" */
  bundleContents: string
  /** Pounds per bundle */
  bundleLb: number
  /** Burn time, minutes, low to high. PLACEHOLDER. */
  burnMinutes: [number, number]
  /** What "burn time" refers to, e.g. "per log" */
  burnPer: string
  bundlesPerCase: number
  casesPerPallet: number
  /** Price per bundle, per case, per pallet. PLACEHOLDER. */
  price: Record<FuelUnit, number>
  uses: string[]
  requires: ComplianceRequirementId[]
  art: SoilFuelArt
  /** Novelty gift item rather than a working fuel */
  novelty?: boolean
}

export type FuelBuyerKind = 'campground' | 'retailer' | 'institution' | 'other'

/** Bulk/wholesale inquiry from the Fuel page. */
export interface FuelInquiry {
  id: string
  business: string
  kind: FuelBuyerKind
  contact: string
  email: string
  phone?: string
  interests: FuelProductId[]
  volume: string
  message: string
  status: 'new' | 'replied' | 'handled'
  reply?: string
  createdAt: string
}

// ---------------------------------------------------------------- Compliance

export type ComplianceRequirementId =
  'fertilizer-registration' | 'soil-label' | 'lab-testing' | 'compost-permit' | 'air-quality' | 'fuel-label' | 'fire-safety'

export interface ComplianceRequirement {
  id: ComplianceRequirementId
  division: Division
  title: string
  /** What it involves and who to ask */
  detail: string
}

export type SoilFuelCompliance = Record<ComplianceRequirementId, ComplianceStatus>

// ---------------------------------------------------------------- Production

export type CompostStatus = 'mixing' | 'composting' | 'curing' | 'screened' | 'bagged'

export interface TempReading {
  date: string
  /** Core temperature, °F */
  f: number
}

/** One windrow of compost, from mixing to bagged. */
export interface CompostBatch {
  id: string
  windrow: string
  startDate: string
  manureTons: number
  hayTons: number
  status: CompostStatus
  temps: TempReading[]
  turns: { date: string; note?: string }[]
  /** Days it has cured (or must cure) after the hot phase */
  curingDays: number
  /** Screened, finished compost */
  finishedTons?: number
  /** Set when the finished tons went into inventory */
  converted?: { productId: SoilProductId; bags: number; yards: number; date: string }
}

export type FuelBatchStatus = 'pressed' | 'drying' | 'curing' | 'packed'

export interface FuelBatch {
  id: string
  productId: FuelProductId
  startDate: string
  /** Wet manure collected for the batch, tons */
  collectedTons: number
  /** Hay or straw share of the mix, 0–1 */
  hayShare: number
  /** Logs, briquettes, or chips pressed */
  pressedCount: number
  status: FuelBatchStatus
  /** Moisture readings while drying, % */
  moisture: { date: string; pct: number }[]
  /** Set when packed into inventory */
  converted?: { bundles: number; date: string }
}

/** Finished soil on hand, by how it's stored (bags, or bulk yards). */
export type SoilStock = Record<SoilProductId, { bags: number; yards: number }>

/** Finished fuel on hand, in bundles. */
export type FuelStock = Record<FuelProductId, number>

// ---------------------------------------------------------------- Planner

/** Manure Revenue Planner inputs (dashboard). Defaults in `config/manurePlanner.ts`. */
export interface PlannerSettings {
  headCount: number
  /** Wet manure per head per day, lb */
  lbPerHeadDay: number
  /** Share of manure that can be collected (pens, lots, barns), 0–1 */
  collectionRate: number
  /** Weight lost to drying and composting, 0–1, per product */
  compostLoss: number
  fuelLoss: number
  /** Tons of alfalfa/hay added per ton of manure */
  hayPerTon: number
  hayCostPerTon: number
  /** Share of collected manure to each use; the rest stays on pasture */
  toCompost: number
  toFuel: number
  /** How finished compost is sold, shares adding to 1 */
  compostMix: { bag: number; yard: number; ton: number }
  /** Revenue per unit */
  compostPrice: { bag: number; yard: number; ton: number }
  /** Fuel: finished lb per bundle, and blended price per bundle after case/pallet discounts */
  fuelLbPerBundle: number
  fuelPricePerBundle: number
  /** Costs */
  laborRate: number
  laborHoursPerTonCompost: number
  laborHoursPerTonFuel: number
  equipment: { turner: number; bagger: number; press: number }
  /** Years to spread equipment cost over */
  equipmentYears: number
  dryingSpacePerYear: number
  bagCost: number
  fuelPackCost: number
  deliveryCostPerTon: number
  /** Share of compost tons delivered (vs. picked up) */
  deliveredShare: number
  /** Spread sales by month, or flat */
  seasonal: boolean
}

// ---------------------------------------------------------------- Cart (wired in S4/S5)

/** Bagged or bulk soil in the cart (truckloads are quoted instead). */
export interface SoilCartItem {
  kind: 'soil'
  id: string
  productId: SoilProductId
  unit: Exclude<SoilUnit, 'truckload'>
  qty: number
  addedAt: string
}

/** Fuel in the cart by bundle, case, or pallet. */
export interface FuelCartItem {
  kind: 'fuel'
  id: string
  productId: FuelProductId
  unit: FuelUnit
  qty: number
  addedAt: string
}
