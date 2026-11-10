import type { ByproductPart, ByproductsConfig, GoodsCategory, PriceTier } from '@/config/byproducts'
import type { ByproductPartId, ByproductRecovery, ComplianceFlags, GoodsCategoryId, GoodsProduct } from '@/data/goodsTypes'
import type { Animal } from '@/data/types'
import { formatCurrency } from './format'

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

/** How many count as "only a few left" */
const LOW_STOCK = 4

export const goodsUrl = (g: Pick<GoodsProduct, 'id'>) => `/ranch-goods/${g.id}`

/** "Sold", "Sold out", "Only 3 left", or nothing. */
export function goodsStockLabel(g: GoodsProduct) {
  if (g.stock <= 0) return g.unique ? 'Sold' : 'Sold out'
  if (!g.unique && g.stock <= LOW_STOCK) return `Only ${g.stock} left`
  return ''
}

/** Most a shopper can buy: one of a kind is always 1. */
export function maxQty(product: GoodsProduct) {
  return product.unique ? Math.min(1, product.stock) : product.stock
}

/** "From HCR-2672" / "From HCR-2690, HCR-2692 and 1 more" / "" */
export function sourceLabel(product: Pick<GoodsProduct, 'sourceTagIds'>) {
  const tags = product.sourceTagIds
  if (!tags.length) return ''
  if (tags.length <= 2) return `From ${tags.join(' and ')}`
  return `From ${tags.slice(0, 2).join(', ')} and ${tags.length - 2} more`
}

/** Cart line detail: unit price, volume discount, and where it came from. */
export function goodsDetail(product: GoodsProduct, qty: number, config: ByproductsConfig) {
  const parts = [`${formatCurrency(product.price, true)} / ${product.unit}`]
  if (product.bulk) {
    const off = tierFor(qty, config.priceTiers).off
    if (off) parts.push(`${Math.round(off * 100)}% volume discount`)
  }
  if (product.unique) parts.push('one of a kind')
  const src = sourceLabel(product)
  return `${parts.join(', ')}.${src ? ` ${src}.` : ''}`
}

/** Frozen weight that needs freezer space (bones and organ meat sold by the lb). Hides, chews, and tallow don't. */
export function goodsLb(product: GoodsProduct, qty: number) {
  return product.category === 'bones' && product.unit === 'lb' ? qty : 0
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

// ---------------------------------------------------------------------------
// Storefront search, filter, and sort
// ---------------------------------------------------------------------------

export const PRICE_BUCKETS = [
  { value: 'under-10', label: 'Under $10', min: 0, max: 9.99 },
  { value: '10-50', label: '$10 to $50', min: 10, max: 50 },
  { value: 'over-50', label: 'Over $50', min: 50.01, max: Infinity },
] as const
export type PriceBucket = (typeof PRICE_BUCKETS)[number]['value']

export const GOODS_SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name, A to Z' },
] as const
export type GoodsSort = (typeof GOODS_SORTS)[number]['value']

export interface GoodsFilters {
  q?: string
  category?: GoodsCategoryId
  use?: GoodsProduct['uses'][number]
  price?: PriceBucket
  sort?: GoodsSort
}

/** Search (name, description, ear tag), filter, and sort the catalog. Sold items sink to the bottom. */
export function filterGoods(goods: GoodsProduct[], { q = '', category, use, price, sort = 'featured' }: GoodsFilters) {
  const needle = q.trim().toLowerCase()
  const bucket = PRICE_BUCKETS.find((b) => b.value === price)
  return goods
    .filter((g) => !category || g.category === category)
    .filter((g) => !use || g.uses.includes(use))
    .filter((g) => !bucket || (g.price >= bucket.min && g.price <= bucket.max))
    .filter((g) => !needle || `${g.name} ${g.description} ${g.sourceTagIds.join(' ')} ${(g.details ?? []).join(' ')}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      const sold = Number(a.stock <= 0) - Number(b.stock <= 0)
      if (sold) return sold
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    })
}
