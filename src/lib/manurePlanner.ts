/**
 * Manure Revenue Planner math (SPEC-SOIL-FUEL Part 4), and the Whole Ranch
 * annual projection. Pure functions: every input comes from `PlannerSettings`
 * (the owner's numbers, defaulting to `config/manurePlanner.ts`).
 */

import { plannerSeasonality } from '@/config/manurePlanner'
import { DEMO_TODAY } from '@/data/animals'
import { salesHistory } from '@/data/market'
import type { PlannerSettings } from '@/data/soilFuelTypes'
import type { Order } from '@/data/types'
import { revenueByChannel } from './beefAnalytics'

const DAYS = 365
const LB_PER_TON = 2000

export interface CostLines {
  hay: number
  labor: number
  /** Equipment spread over its years of use */
  equipment: number
  /** Bags (compost) or bundle packaging (fuel) */
  packaging: number
  delivery: number
  /** Drying and curing space (fuel) */
  space: number
}

export interface DivisionResult {
  /** Wet manure sent to this use, tons a year */
  manureTons: number
  hayTons: number
  /** Finished, sellable product, tons a year */
  finishedTons: number
  revenue: number
  costs: CostLines
  costTotal: number
  net: number
  /** Net per ton of wet manure sent this way: the "which use pays more" number */
  perManureTon: number
  /** Up-front equipment cost */
  equipmentCost: number
  /** Years for the operating profit (before equipment) to pay for the equipment; null if it never does */
  paybackYears: number | null
}

export interface CompostResult extends DivisionResult {
  bags: number
  yards: number
  tonsSold: number
}

export interface FuelResult extends DivisionResult {
  /** Bundles pressed from the manure sent to fuel */
  bundles: number
  /** Bundles sold (capped by what the market takes) */
  sold: number
  /** Pressed but more than the market takes */
  unsold: number
}

export interface PlannerMonth {
  /** 0 = January */
  month: number
  compost: number
  fuel: number
  costs: number
  net: number
}

export interface PlannerResult {
  manure: { produced: number; collected: number; toCompost: number; toFuel: number; toPasture: number }
  compost: CompostResult
  fuel: FuelResult
  total: { revenue: number; costs: number; net: number; equipmentCost: number; paybackYears: number | null }
  months: PlannerMonth[]
}

const sum = (c: CostLines) => c.hay + c.labor + c.equipment + c.packaging + c.delivery + c.space
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

function payback(equipmentCost: number, net: number, equipmentPerYear: number) {
  const cash = net + equipmentPerYear
  if (equipmentCost <= 0) return 0
  return cash > 0 ? Math.round((equipmentCost / cash) * 10) / 10 : null
}

/** Allocation shares, kept inside 0–1 with compost + fuel ≤ 1 (the rest stays on pasture). */
export function allocation(s: Pick<PlannerSettings, 'toCompost' | 'toFuel'>) {
  const r3 = (n: number) => Math.round(n * 1000) / 1000
  const compost = r3(clamp01(s.toCompost))
  const fuel = r3(Math.min(clamp01(s.toFuel), 1 - compost))
  return { compost, fuel, pasture: r3(Math.max(0, 1 - compost - fuel)) }
}

/** Everything the planner shows, from the owner's inputs. */
export function planManure(s: PlannerSettings): PlannerResult {
  const produced = (Math.max(0, s.headCount) * Math.max(0, s.lbPerHeadDay) * DAYS) / LB_PER_TON
  const collected = produced * clamp01(s.collectionRate)
  const a = allocation(s)
  const toCompost = collected * a.compost
  const toFuel = collected * a.fuel

  // ---- Compost
  const cHay = toCompost * s.hayPerTon
  const finished = (toCompost + cHay) * (1 - clamp01(s.compostLoss))
  const mixTotal = s.compostMix.bag + s.compostMix.yard + s.compostMix.ton || 1
  const bagTons = (finished * s.compostMix.bag) / mixTotal
  const yardTons = (finished * s.compostMix.yard) / mixTotal
  const tonTons = (finished * s.compostMix.ton) / mixTotal
  const bags = s.compostBagLb > 0 ? Math.floor((bagTons * LB_PER_TON) / s.compostBagLb) : 0
  const yards = s.compostLbPerYard > 0 ? Math.floor((yardTons * LB_PER_TON) / s.compostLbPerYard) : 0
  const tonsSold = Math.floor(tonTons * 10) / 10
  const cRevenue = bags * s.compostPrice.bag + yards * s.compostPrice.yard + tonsSold * s.compostPrice.ton
  const cEquipCost = s.equipment.turner + s.equipment.bagger
  const years = Math.max(1, s.equipmentYears)
  const cCosts: CostLines = {
    hay: cHay * s.hayCostPerTon,
    labor: toCompost * s.laborHoursPerTonCompost * s.laborRate,
    equipment: toCompost > 0 ? cEquipCost / years : 0,
    packaging: bags * s.bagCost,
    delivery: finished * clamp01(s.deliveredShare) * s.deliveryCostPerTon,
    space: 0,
  }
  const cCostTotal = sum(cCosts)
  const cNet = cRevenue - cCostTotal

  // ---- Fuel
  const fHay = toFuel * s.hayPerTon
  const fFinished = (toFuel + fHay) * (1 - clamp01(s.fuelLoss))
  const bundles = s.fuelLbPerBundle > 0 ? Math.floor((fFinished * LB_PER_TON) / s.fuelLbPerBundle) : 0
  const sold = Math.min(bundles, Math.max(0, s.fuelMaxBundles))
  const fRevenue = sold * s.fuelPricePerBundle
  const fEquipCost = s.equipment.press
  const fCosts: CostLines = {
    hay: fHay * s.hayCostPerTon,
    labor: toFuel * s.laborHoursPerTonFuel * s.laborRate,
    equipment: toFuel > 0 ? fEquipCost / years : 0,
    packaging: sold * s.fuelPackCost,
    delivery: 0,
    space: toFuel > 0 ? s.dryingSpacePerYear : 0,
  }
  const fCostTotal = sum(fCosts)
  const fNet = fRevenue - fCostTotal

  const compost: CompostResult = {
    manureTons: toCompost,
    hayTons: cHay,
    finishedTons: finished,
    revenue: cRevenue,
    costs: cCosts,
    costTotal: cCostTotal,
    net: cNet,
    perManureTon: toCompost > 0 ? cNet / toCompost : 0,
    equipmentCost: toCompost > 0 ? cEquipCost : 0,
    paybackYears: toCompost > 0 ? payback(cEquipCost, cNet, cCosts.equipment) : null,
    bags,
    yards,
    tonsSold,
  }
  const fuel: FuelResult = {
    manureTons: toFuel,
    hayTons: fHay,
    finishedTons: fFinished,
    revenue: fRevenue,
    costs: fCosts,
    costTotal: fCostTotal,
    net: fNet,
    perManureTon: toFuel > 0 ? fNet / toFuel : 0,
    equipmentCost: toFuel > 0 ? fEquipCost : 0,
    paybackYears: toFuel > 0 ? payback(fEquipCost, fNet, fCosts.equipment) : null,
    bundles,
    sold,
    unsold: bundles - sold,
  }

  const equipmentCost = compost.equipmentCost + fuel.equipmentCost
  const totalNet = cNet + fNet
  const total = {
    revenue: cRevenue + fRevenue,
    costs: cCostTotal + fCostTotal,
    net: totalNet,
    equipmentCost,
    paybackYears: equipmentCost > 0 ? payback(equipmentCost, totalNet, cCosts.equipment + fCosts.equipment) : null,
  }

  // ---- 12 months: sales (and the costs that follow them) by season; fixed costs spread evenly
  const flat = Array<number>(12).fill(1 / 12)
  const cSeason = s.seasonal ? plannerSeasonality.compost : flat
  const fSeason = s.seasonal ? plannerSeasonality.fuel : flat
  const cFixed = cCosts.equipment
  const fFixed = fCosts.equipment + fCosts.space
  const months: PlannerMonth[] = cSeason.map((cw, m) => {
    const fw = fSeason[m]
    const c = cRevenue * cw
    const f = fRevenue * fw
    const costs = (cCostTotal - cFixed) * cw + cFixed / 12 + (fCostTotal - fFixed) * fw + fFixed / 12
    return { month: m, compost: Math.round(c), fuel: Math.round(f), costs: Math.round(costs), net: Math.round(c + f - costs) }
  })

  return { manure: { produced, collected, toCompost, toFuel, toPasture: produced - toCompost - toFuel }, compost, fuel, total, months }
}

// ---------------------------------------------------------------- Whole Ranch

export type RanchDivision = 'beef' | 'goods' | 'soil' | 'fuel' | 'live'

/** Divisions in chart order, with the validated chart colors (see the Whole Ranch card). */
export const DIVISIONS: { key: RanchDivision; label: string }[] = [
  { key: 'beef', label: 'Beef' },
  { key: 'goods', label: 'Ranch Goods' },
  { key: 'soil', label: 'Soil' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'live', label: 'Live cattle' },
]

export interface WholeRanch {
  annual: Record<RanchDivision, number>
  total: number
  /** What Soil and Fuel add to the rest */
  addedBySoilFuel: number
  soilFuelNet: number
  /** Months the beef and Ranch Goods run rate is based on */
  basis: string[]
}

/**
 * Annual projection by division. Beef and Ranch Goods: the average of the
 * last three full months × 12 (they only started in June). Live cattle: the
 * last 12 months of sale records plus lots bought on the site. Soil and Fuel: the planner's first-year revenue.
 */
export function wholeRanch(orders: Order[], planner: PlannerResult, today = DEMO_TODAY): WholeRanch {
  const current = today.slice(0, 7)
  const rows = revenueByChannel(orders)
  const full = rows.filter((r) => r.month < current)
  const recent = full.slice(-3)
  const avg = (f: (r: (typeof rows)[number]) => number) => (recent.length ? recent.reduce((n, r) => n + f(r), 0) / recent.length : 0)
  // Live cattle: the 12 months of sale records, plus lots bought on the site in that window.
  const window = salesHistory.filter((m) => m.month <= current).slice(-12)
  const from = window[0]?.month ?? current
  const liveSales =
    window.reduce((n, m) => n + m.revenue, 0) + orders.filter((o) => o.createdAt.slice(0, 7) >= from).reduce((n, o) => n + o.subtotal, 0)
  const annual: Record<RanchDivision, number> = {
    beef: Math.round(avg((r) => r.shares + r.cuts + r.subscriptions) * 12),
    goods: Math.round(avg((r) => r.goods) * 12),
    soil: Math.round(planner.compost.revenue),
    fuel: Math.round(planner.fuel.revenue),
    live: Math.round(liveSales),
  }
  const total = Object.values(annual).reduce((n, v) => n + v, 0)
  return { annual, total, addedBySoilFuel: annual.soil + annual.fuel, soilFuelNet: Math.round(planner.total.net), basis: recent.map((r) => r.month) }
}
