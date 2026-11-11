/**
 * Soil & Fuel math: unit conversions, prices per unit, truckloads, delivered
 * price by ZIP, the coverage calculator, pro tiers, dealer distance, and
 * low-stock checks. Pure functions; config is passed in so tests and the
 * owner's edits can swap it.
 */

import { ranch } from '@/config/ranch'
import { soilFuelConfig, type SoilFuelConfig } from '@/config/soilFuel'
import { CO_ZIP3, CO_ZIP5 } from '@/data/coloradoZips'
import type {
  CompostBatch,
  CompostStatus,
  Dealer,
  FuelBatch,
  FuelBatchStatus,
  FuelProduct,
  FuelProductId,
  FuelStock,
  FuelUnit,
  ProTier,
  SoilProduct,
  SoilProductId,
  SoilStock,
  SoilUnit,
  SoilUse,
} from '@/data/soilFuelTypes'

const round2 = (n: number) => Math.round(n * 100) / 100

export const soilProduct = (id: SoilProductId, cfg: SoilFuelConfig = soilFuelConfig) => cfg.soil.products.find((p) => p.id === id)!
export const fuelProduct = (id: FuelProductId, cfg: SoilFuelConfig = soilFuelConfig) => cfg.fuel.products.find((p) => p.id === id)!

// ---------------------------------------------------------------- Soil units

export const tonsPerYard = (p: SoilProduct) => p.lbPerYard / 2000
export const yardsPerBag = (p: SoilProduct) => p.bagCuFt / 27
export const bagLb = (p: SoilProduct) => Math.round(p.lbPerYard * yardsPerBag(p))

/** Tons in one truckload: the box holds `yards`, but the scale caps it at `maxTons`. */
export const truckloadTons = (p: SoilProduct, cfg: SoilFuelConfig = soilFuelConfig) =>
  round2(Math.min(cfg.soil.truckload.yards * tonsPerYard(p), cfg.soil.truckload.maxTons))
export const truckloadYards = (p: SoilProduct, cfg: SoilFuelConfig = soilFuelConfig) => round2(truckloadTons(p, cfg) / tonsPerYard(p))

/** Cubic yards and tons in one of a unit. */
export function unitAmount(p: SoilProduct, unit: SoilUnit, cfg: SoilFuelConfig = soilFuelConfig) {
  const yards = unit === 'bag' ? yardsPerBag(p) : unit === 'yard' ? 1 : unit === 'ton' ? 1 / tonsPerYard(p) : truckloadYards(p, cfg)
  return { yards: round2(yards), tons: round2(yards * tonsPerYard(p)) }
}

/** List price for one of a unit. A truckload is the ton price × tons, less the truckload discount (delivery extra). */
export function soilUnitPrice(p: SoilProduct, unit: SoilUnit, cfg: SoilFuelConfig = soilFuelConfig) {
  if (unit === 'truckload') return Math.round(p.price.ton * truckloadTons(p, cfg) * (1 - cfg.soil.truckload.discount))
  return p.price[unit]
}

/** Price per cubic yard when bought by that unit, for "you save" comparisons. */
export const pricePerYard = (p: SoilProduct, unit: SoilUnit, cfg: SoilFuelConfig = soilFuelConfig) =>
  round2(soilUnitPrice(p, unit, cfg) / unitAmount(p, unit, cfg).yards)

// ---------------------------------------------------------------- Pro tiers

export const proTierFor = (yardsPerYear: number, cfg: SoilFuelConfig = soilFuelConfig): ProTier =>
  [...cfg.soil.proTiers].reverse().find((t) => yardsPerYear >= t.minYards) ?? cfg.soil.proTiers[0]

export const proPrice = (p: SoilProduct, unit: SoilUnit, tier: ProTier, cfg: SoilFuelConfig = soilFuelConfig) =>
  round2(soilUnitPrice(p, unit, cfg) * (1 - tier.off))

// ---------------------------------------------------------------- Delivery

const toRad = (d: number) => (d * Math.PI) / 180

/** Great-circle miles between two points. */
export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

/** Where a Colorado ZIP is, roughly; undefined outside Colorado or for a bad ZIP. */
export const zipPoint = (zip: string) => {
  const z = zip.trim()
  return /^\d{5}$/.test(z) ? (CO_ZIP5[z] ?? CO_ZIP3[z.slice(0, 3)]) : undefined
}

/** Estimated road miles from the ranch to a ZIP, or null if we can't place it. */
export function roadMiles(zip: string, cfg: SoilFuelConfig = soilFuelConfig): number | null {
  const pt = zipPoint(zip)
  if (!pt) return null
  return Math.max(1, Math.round(milesBetween(ranch.location, pt) * cfg.soil.delivery.roadFactor))
}

export interface DeliveryQuote {
  available: boolean
  miles: number | null
  /** Delivery for all loads */
  delivery: number
  product: number
  total: number
  reason?: string
}

/** Mock delivered price for truckloads (or one bulk trip): product + (base + per mile) per load. */
export function deliveredQuote(p: SoilProduct, zip: string, loads: number, cfg: SoilFuelConfig = soilFuelConfig): DeliveryQuote {
  const product = soilUnitPrice(p, 'truckload', cfg) * loads
  if (!/^\d{5}$/.test(zip.trim())) return { available: false, miles: null, delivery: 0, product, total: product, reason: 'Enter a 5-digit ZIP code.' }
  const miles = roadMiles(zip, cfg)
  const d = cfg.soil.delivery
  if (miles === null)
    return { available: false, miles, delivery: 0, product, total: product, reason: 'We deliver in Colorado. Call us about loads farther out.' }
  if (miles > d.maxMiles)
    return {
      available: false,
      miles,
      delivery: 0,
      product,
      total: product,
      reason: `That’s about ${miles} miles out; we deliver up to ${d.maxMiles}. Call us.`,
    }
  const perLoad = miles <= d.freeMiles ? 0 : d.base + d.perMile * miles
  const delivery = Math.round(perLoad * loads)
  return { available: true, miles, delivery, product, total: product + delivery }
}

/** One delivery trip for bulk yards or tons in the cart, or null when out of range. */
export function bulkTripCost(zip: string, cfg: SoilFuelConfig = soilFuelConfig): number | null {
  const miles = roadMiles(zip, cfg)
  if (miles === null || miles > cfg.soil.delivery.maxMiles) return null
  return Math.round(cfg.soil.delivery.base + cfg.soil.delivery.perMile * miles)
}

// ---------------------------------------------------------------- Coverage calculator

export type AreaUnit = 'sqft' | 'acres'
export const SQFT_PER_ACRE = 43_560

export interface CoverageOption {
  unit: Exclude<SoilUnit, 'truckload'> | 'truckload'
  qty: number
  cost: number
}

export interface Coverage {
  yards: number
  tons: number
  bags: number
  /** Ways to buy that much, cheapest first; truckloads only for big jobs. Bulk has a 1-yard (or ton) minimum. */
  options: CoverageOption[]
  best: CoverageOption
  note: string
}

/** How much of a product covers an area for a use, and what it costs bought each way. */
export function coverage(p: SoilProduct, area: number, areaUnit: AreaUnit, use: SoilUse, cfg: SoilFuelConfig = soilFuelConfig): Coverage | null {
  if (!(area > 0)) return null
  const rate = p.rates.find((r) => r.use === use)
  if (!rate) return null
  const sqft = areaUnit === 'acres' ? area * SQFT_PER_ACRE : area
  const exactYards = 'depthIn' in rate ? (sqft * rate.depthIn) / 12 / 27 : ((sqft / SQFT_PER_ACRE) * rate.tonsPerAcre) / tonsPerYard(p)
  const min = cfg.soil.bulkMin
  const yards = Math.max(min, Math.ceil(exactYards * 2) / 2)
  const tons = Math.max(min, Math.ceil(exactYards * tonsPerYard(p) * 2) / 2)
  const bags = Math.ceil(exactYards / yardsPerBag(p))
  const loads = Math.ceil(exactYards / truckloadYards(p, cfg))
  const options: CoverageOption[] = [
    { unit: 'bag' as const, qty: bags, cost: round2(bags * p.price.bag) },
    { unit: 'yard' as const, qty: yards, cost: round2(yards * p.price.yard) },
    { unit: 'ton' as const, qty: tons, cost: round2(tons * p.price.ton) },
    { unit: 'truckload' as const, qty: loads, cost: loads * soilUnitPrice(p, 'truckload', cfg) },
  ]
    // Hundreds of bags isn't a real option; nor is a truckload for a flower bed.
    .filter((o) => (o.unit !== 'bag' || bags <= 120) && (o.unit !== 'truckload' || exactYards >= truckloadYards(p, cfg) * 0.6))
    .sort((a, b) => a.cost - b.cost)
  // Small jobs: bags off the shelf beat a bulk pickup, even at a higher price per yard.
  const best = (exactYards <= cfg.soil.bagJobYards && options.find((o) => o.unit === 'bag')) || options[0]
  return { yards, tons, bags, options, best, note: rate.note }
}

// ---------------------------------------------------------------- Fuel

export const fuelBundles = (p: FuelProduct, unit: FuelUnit) =>
  unit === 'bundle' ? 1 : unit === 'case' ? p.bundlesPerCase : p.bundlesPerCase * p.casesPerPallet
export const fuelPerBundle = (p: FuelProduct, unit: FuelUnit) => round2(p.price[unit] / fuelBundles(p, unit))
/** Share saved per bundle vs. buying single bundles */
export const fuelSavings = (p: FuelProduct, unit: FuelUnit) => Math.max(0, Math.round((1 - fuelPerBundle(p, unit) / p.price.bundle) * 100) / 100)
export const fuelLb = (p: FuelProduct, unit: FuelUnit) => fuelBundles(p, unit) * p.bundleLb

// ---------------------------------------------------------------- Dealers

export interface DealerFilter {
  zip?: string
  kind?: Dealer['kind'] | 'all'
  carries?: SoilProductId | FuelProductId | 'all'
}

/** Dealers matching the filter, nearest first when a Colorado ZIP is given (with miles). */
export function findDealers(dealers: Dealer[], f: DealerFilter) {
  const pt = f.zip ? zipPoint(f.zip) : undefined
  return dealers
    .filter((d) => !f.kind || f.kind === 'all' || d.kind === f.kind)
    .filter((d) => !f.carries || f.carries === 'all' || d.carries.includes(f.carries))
    .map((d) => ({ dealer: d, miles: pt ? Math.round(milesBetween(pt, d)) : null }))
    .sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0) || a.dealer.city.localeCompare(b.dealer.city))
}

// ---------------------------------------------------------------- Production

/** The stages a windrow goes through, in order. */
export const COMPOST_FLOW: CompostStatus[] = ['mixing', 'composting', 'curing', 'screened', 'bagged']
export const FUEL_FLOW: FuelBatchStatus[] = ['pressed', 'drying', 'curing', 'packed']

export const COMPOST_LABEL: Record<CompostStatus, string> = {
  mixing: 'Mixing',
  composting: 'Composting',
  curing: 'Curing',
  screened: 'Screened',
  bagged: 'Bagged',
}
export const FUEL_LABEL: Record<FuelBatchStatus, string> = { pressed: 'Pressed', drying: 'Drying', curing: 'Curing', packed: 'Packed' }

const dayDiff = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)

/** How a windrow is doing against the hot-phase rule: days logged at temperature, turns, and the last reading. */
export function compostCheck(b: CompostBatch, cfg: SoilFuelConfig = soilFuelConfig) {
  const { min, max } = cfg.production.tempTarget
  const hot = [...b.temps].sort((x, y) => x.date.localeCompare(y.date))
  // Days covered by readings at or above the minimum (each reading counts until the next one)
  let hotDays = 0
  for (let i = 0; i < hot.length; i++) {
    if (hot[i].f < min) continue
    const next = hot[i + 1]?.date
    hotDays += next ? Math.max(1, dayDiff(hot[i].date, next)) : 1
  }
  const last = hot.at(-1)
  return {
    hotDays,
    turns: b.turns.length,
    last,
    tooHot: last ? last.f > max : false,
    metRule: hotDays >= cfg.production.hotDays && b.turns.length >= cfg.production.minTurns,
  }
}

/** Days since a batch started (or between two dates). */
export const daysSince = (from: string, to: string) => Math.max(0, dayDiff(from, to))

/** Latest fuel moisture and whether it's dry enough to pack. */
export function fuelCheck(b: FuelBatch, cfg: SoilFuelConfig = soilFuelConfig) {
  const last = [...b.moisture].sort((x, y) => x.date.localeCompare(y.date)).at(-1)
  return { last, dry: last ? last.pct <= cfg.production.fuelTargetMoisture : false }
}

/** Bundles a fuel batch packs into: pieces pressed ÷ pieces per bundle. */
export function bundlesFromBatch(b: FuelBatch, cfg: SoilFuelConfig = soilFuelConfig) {
  const p = fuelProduct(b.productId, cfg)
  return Math.floor(b.pressedCount / Math.max(1, p.piecesPerBundle))
}

// ---------------------------------------------------------------- Stock

/** Soil products with bags or bulk yards under the low-stock level. */
export function lowSoilStock(stock: SoilStock, cfg: SoilFuelConfig = soilFuelConfig) {
  return (Object.keys(stock) as SoilProductId[]).flatMap((id) => {
    const s = stock[id]
    const out: { id: SoilProductId; form: 'bags' | 'yards'; left: number }[] = []
    if (s.bags < cfg.lowStock.bags) out.push({ id, form: 'bags', left: s.bags })
    if (s.yards < cfg.lowStock.yards) out.push({ id, form: 'yards', left: s.yards })
    return out
  })
}

export const lowFuelStock = (stock: FuelStock, cfg: SoilFuelConfig = soilFuelConfig) =>
  (Object.keys(stock) as FuelProductId[]).filter((id) => stock[id] < cfg.lowStock.bundles).map((id) => ({ id, left: stock[id] }))
