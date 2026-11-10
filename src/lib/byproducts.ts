import type { ByproductPart, ByproductsConfig, GoodsCategory, PriceTier } from '@/config/byproducts'
import type { ByproductPartId, ByproductRecovery, ComplianceFlags, GoodsCategoryId, GoodsProduct } from '@/data/goodsTypes'
import type { Animal } from '@/data/types'

/**
 * Ranch Goods math: tier prices, compliance, and what each part of an animal
 * is worth. Pure functions that take the config as an argument, so the
 * dashboard can pass the owner's edited numbers.
 */

const round2 = (n: number) => Math.round(n * 100) / 100

// ---------------------------------------------------------------------------
// Categories & compliance
// ---------------------------------------------------------------------------

export function categoryById(config: ByproductsConfig, id: GoodsCategoryId): GoodsCategory | undefined {
  return config.categories.find((c) => c.id === id)
}

/** Categories shown in the storefront: none at all when Ranch Goods is switched off. */
export function visibleCategories(config: ByproductsConfig): GoodsCategory[] {
  return config.enabled ? config.categories.filter((c) => c.enabled) : []
}

/** A product is listed when its category is on. Sold-out and sold items stay listed (marked "Sold"). */
export function isListed(product: GoodsProduct, config: ByproductsConfig) {
  return visibleCategories(config).some((c) => c.id === product.category)
}

/** The category's legal flags, with the product's own overrides applied. */
export function complianceFor(product: GoodsProduct, config: ByproductsConfig): ComplianceFlags {
  const cat = categoryById(config, product.category)
  return {
    requiresInspection: product.compliance?.requiresInspection ?? cat?.requiresInspection ?? false,
    requiresFeedRegistration: product.compliance?.requiresFeedRegistration ?? cat?.requiresFeedRegistration ?? false,
    requiresFertilizerRegistration: product.compliance?.requiresFertilizerRegistration ?? cat?.requiresFertilizerRegistration ?? false,
  }
}

/** Plain-English list of what a category needs before it can be sold (owner-only). */
export function complianceNeeds(flags: ComplianceFlags): string[] {
  const needs: string[] = []
  if (flags.requiresInspection) needs.push('Edible: USDA- or state-inspected processing and labels')
  if (flags.requiresFeedRegistration) needs.push('Pet treats: state commercial feed registration and labels')
  if (flags.requiresFertilizerRegistration) needs.push('Fertilizer: state registration and guaranteed analysis on the bag')
  return needs
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

export function tierFor(qty: number, tiers: PriceTier[]): PriceTier {
  return tiers.find((t) => qty >= t.min && (t.max === undefined || qty <= t.max)) ?? tiers[0]
}

/** Price of one unit at this quantity: bulk items get the volume discount. */
export function unitPrice(product: GoodsProduct, qty: number, config: ByproductsConfig) {
  if (!product.bulk) return product.price
  return round2(product.price * (1 - tierFor(qty, config.priceTiers).off))
}

export function lineTotal(product: GoodsProduct, qty: number, config: ByproductsConfig) {
  return round2(unitPrice(product, qty, config) * qty)
}

/** Most a shopper can buy: one of a kind is always 1. */
export function maxQty(product: GoodsProduct) {
  return product.unique ? Math.min(1, product.stock) : product.stock
}

// ---------------------------------------------------------------------------
// Value per animal
// ---------------------------------------------------------------------------

export function partById(config: ByproductsConfig, id: ByproductPartId): ByproductPart | undefined {
  return config.parts.find((p) => p.id === id)
}

/** Raw amount of a part one animal has: no horns on polled animals, no pizzle on heifers and cows. */
export function expectedRaw(part: ByproductPart, animal?: Pick<Animal, 'horned' | 'sex'>) {
  if (!animal) return part.rawPerAnimal
  if (part.hornedOnly && !animal.horned) return 0
  if (part.malesOnly && (animal.sex === 'heifer' || animal.sex === 'cow')) return 0
  return part.rawPerAnimal
}

export interface PartValue {
  part: ByproductPartId
  /** Raw amount counted (after recovery rate) */
  raw: number
  /** Sellable units it makes */
  units: number
  /** Retail value of those units */
  gross: number
  /** Cost to make them sellable */
  cost: number
  net: number
}

/** What `raw` of a part is worth once made sellable. */
export function valueOfRaw(part: ByproductPart, raw: number): PartValue {
  const units = raw * part.sellableRatio
  const gross = round2(units * part.price)
  const cost = round2(units * part.cost)
  return { part: part.id, raw, units: round2(units), gross, cost, net: round2(gross - cost) }
}

/**
 * What one animal's byproducts are worth. Uses each part's recovery rate unless
 * `rates` overrides it (1 = everything comes back from the processor).
 */
export function animalByproductValue(
  config: ByproductsConfig,
  { animal, rates }: { animal?: Pick<Animal, 'horned' | 'sex'>; rates?: Partial<Record<ByproductPartId, number>> } = {},
) {
  const parts = config.parts.map((p) => valueOfRaw(p, expectedRaw(p, animal) * (rates?.[p.id] ?? p.recoveryRate)))
  return {
    parts,
    gross: round2(parts.reduce((s, p) => s + p.gross, 0)),
    cost: round2(parts.reduce((s, p) => s + p.cost, 0)),
    net: round2(parts.reduce((s, p) => s + p.net, 0)),
  }
}

/** Every part at 100% recovery: the most one animal's byproducts could bring. */
export const fullRecoveryRates = (config: ByproductsConfig) =>
  Object.fromEntries(config.parts.map((p) => [p.id, 1])) as Record<ByproductPartId, number>

export interface PartRecovery {
  part: ByproductPartId
  expected: number
  recovered: number
  /** Raw amount left with the processor */
  lost: number
  /** Net value of what was left */
  lostValue: number
}

/** For one harvested animal: what came back, what didn't, and what the missing part was worth. */
export function recoveryReport(config: ByproductsConfig, record: ByproductRecovery, animal?: Pick<Animal, 'horned' | 'sex'>) {
  const parts: PartRecovery[] = config.parts.map((p) => {
    const expected = expectedRaw(p, animal)
    const recovered = Math.min(expected, record.recovered[p.id] ?? 0)
    const lost = round2(Math.max(0, expected - recovered))
    return { part: p.id, expected, recovered, lost, lostValue: valueOfRaw(p, lost).net }
  })
  return { parts, lostValue: round2(parts.reduce((s, p) => s + p.lostValue, 0)) }
}
