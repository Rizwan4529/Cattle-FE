import type { ByproductPart, ByproductsConfig, GoodsCategory, PriceTier } from '@/config/byproducts'
import type {
  ByproductBatch,
  ByproductPartId,
  ByproductRecovery,
  ByproductSettings,
  ComplianceFlags,
  GoodsCategoryId,
  GoodsProduct,
} from '@/data/goodsTypes'
import type { CutSheet, ShareClaim } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { beefConfig } from '@/config/beef'
import { formatCurrency } from './format'
import { quoteShare } from './yield'

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
export const LOW_STOCK_GOODS = 4

export const goodsUrl = (g: Pick<GoodsProduct, 'id'>) => `/ranch-goods/${g.id}`

/** "Sold", "Sold out", "Only 3 left", or nothing. */
export function goodsStockLabel(g: GoodsProduct) {
  if (g.stock <= 0) return g.unique ? 'Sold' : 'Sold out'
  if (!g.unique && g.stock <= LOW_STOCK_GOODS) return `Only ${g.stock} left`
  return ''
}

/** Most a shopper can buy: one of a kind is always 1. */
export function maxQty(product: GoodsProduct) {
  return product.unique ? Math.min(1, product.stock) : product.stock
}

/** "From CRW-2672" / "From CRW-2690, CRW-2692 and 1 more" / "" */
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
export function recoveryReport(
  config: ByproductsConfig,
  record: Pick<ByproductRecovery, 'recovered'>,
  animal?: Pick<Animal, 'horned' | 'sex'>,
  /** What the ranch should get once share buyers' extras are taken out (from `ranchYield`) */
  ranchShare?: Partial<Record<ByproductPartId, number>>,
) {
  const parts: PartRecovery[] = config.parts.map((p) => {
    const expected = ranchShare?.[p.id] ?? expectedRaw(p, animal)
    const recovered = Math.min(expected, record.recovered[p.id] ?? 0)
    const lost = round2(Math.max(0, expected - recovered))
    return { part: p.id, expected, recovered, lost, lostValue: valueOfRaw(p, lost).net }
  })
  return { parts, lostValue: round2(parts.reduce((s, p) => s + p.lostValue, 0)) }
}

// ---------------------------------------------------------------------------
// Share buyers' cut-sheet extras
// ---------------------------------------------------------------------------

const FRACTION: Record<ShareClaim['size'], number> = { whole: 1, half: 0.5, quarter: 0.25, eighth: 0.125 }

export interface RanchYieldPart {
  part: ByproductPartId
  /** Raw amount the animal has */
  expected: number
  /** Raw amount share buyers asked for on their cut sheets */
  toBuyers: number
  /** What's left for the ranch to sell as Ranch Goods */
  toRanch: number
}

/**
 * What one animal's byproducts split into: the extras share buyers asked for on
 * their cut sheets (soup bones, organ meats, fat) come out of the ranch's
 * yield, in proportion to each buyer's share. Everything else stays with the ranch.
 */
export function ranchYield(
  config: ByproductsConfig,
  animal: Pick<Animal, 'horned' | 'sex'> | undefined,
  claims: Pick<ShareClaim, 'id' | 'size'>[],
  sheets: Pick<CutSheet, 'claimId' | 'extras'>[],
): RanchYieldPart[] {
  return config.parts.map((p) => {
    const expected = expectedRaw(p, animal)
    let toBuyers = 0
    if (p.cutSheetExtra) {
      for (const c of claims) {
        const sheet = sheets.find((s) => s.claimId === c.id)
        if (sheet?.extras[p.cutSheetExtra]) toBuyers += expected * FRACTION[c.size]
      }
    }
    toBuyers = round2(Math.min(expected, toBuyers))
    return { part: p.id, expected, toBuyers, toRanch: round2(expected - toBuyers) }
  })
}

/** "the hide, 4 hooves, about 38 lb of fat & suet…": what the processor sends back to the ranch. */
export function ranchKeepsText(config: ByproductsConfig, parts: RanchYieldPart[]) {
  const out: string[] = []
  for (const y of parts) {
    const p = partById(config, y.part)
    if (!p || y.toRanch <= 0) continue
    const name = p.name.toLowerCase()
    if (p.rawUnit === 'lb') out.push(`about ${Math.round(y.toRanch)} lb of ${name}`)
    else if (y.toRanch === 1) out.push(`the ${name.replace(/s$/, '')}`)
    else out.push(`${Math.round(y.toRanch)} ${name}`)
  }
  return out.length ? out.join(', ') : 'nothing'
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

// ---------------------------------------------------------------------------
// One animal: beef + ranch goods
// ---------------------------------------------------------------------------

/** "One animal = $X beef + $Y in ranch goods" for a typical finished steer, at retail. */
export function wholeAnimalValue(config: ByproductsConfig, beef: typeof beefConfig = beefConfig) {
  const quote = quoteShare({ liveLb: beef.typicalLiveWeight, size: 'whole', feedProgram: 'grain-finished', breed: 'Angus' }, beef)
  const goods = animalByproductValue(config, { rates: fullRecoveryRates(config) })
  return { beef: Math.round(quote.beef), goods: Math.round(goods.gross), goodsNet: Math.round(goods.net) }
}

// ---------------------------------------------------------------------------
// The owner's numbers, raw on hand, and the herd projection
// ---------------------------------------------------------------------------

/** Settings that start from the config's placeholder estimates. */
export function defaultSettings(config: ByproductsConfig): ByproductSettings {
  return {
    parts: Object.fromEntries(
      config.parts.map((p) => [p.id, { rawPerAnimal: p.rawPerAnimal, price: p.price, cost: p.cost, recoveryRate: p.recoveryRate }]),
    ) as ByproductSettings['parts'],
    headPerYear: 24,
  }
}

/** The config with the owner's own yields, prices, costs, and recovery rates. */
export function withSettings(config: ByproductsConfig, settings: ByproductSettings): ByproductsConfig {
  return { ...config, parts: config.parts.map((p) => ({ ...p, ...(settings.parts[p.id] ?? {}) })) }
}

/** Which of the owner's numbers still match the placeholder estimates (so they keep the "Estimate" label). */
export function isEstimate(
  config: ByproductsConfig,
  settings: ByproductSettings,
  part: ByproductPartId,
  field: keyof ByproductSettings['parts'][ByproductPartId],
) {
  if (config.estimatesConfirmed) return false
  const base = partById(config, part)
  return base ? base[field] === settings.parts[part]?.[field] : false
}

/**
 * Raw byproducts recovered and not yet turned into stock, per part. Each
 * one-of-a-kind listing (a rug, a horn) used up one hide or horn.
 */
export function rawOnHand(
  config: ByproductsConfig,
  recoveries: Pick<ByproductRecovery, 'recovered'>[],
  batches: Pick<ByproductBatch, 'part' | 'rawUsed'>[],
  goods: Pick<GoodsProduct, 'unique' | 'part'>[] = [],
) {
  const out = Object.fromEntries(config.parts.map((p) => [p.id, 0])) as Record<ByproductPartId, number>
  for (const r of recoveries) for (const [part, n] of Object.entries(r.recovered) as [ByproductPartId, number][]) out[part] += n ?? 0
  for (const b of batches) out[b.part] -= b.rawUsed
  for (const g of goods) if (g.unique && g.part) out[g.part] -= 1
  for (const k of Object.keys(out) as ByproductPartId[]) out[k] = round2(Math.max(0, out[k]))
  return out
}

/** Stock a batch adds: raw × yield, rounded down to whole units. */
export const batchUnits = (rawUsed: number, ratio: number) => Math.max(0, Math.floor(rawUsed * ratio + 1e-9))

export interface ProjectionMonth {
  month: number
  /** Cumulative net from byproducts at today's recovery rates */
  today: number
  /** Cumulative net at the chosen recovery rate */
  target: number
}

/**
 * Herd projection: head harvested a year × byproduct net per animal. "Left on
 * the table" is what full recovery would add over today's rates.
 */
export function herdProjection(config: ByproductsConfig, headPerYear: number, targetRate: number) {
  const today = animalByproductValue(config).net
  const target = animalByproductValue(config, {
    rates: Object.fromEntries(config.parts.map((p) => [p.id, Math.max(p.recoveryRate, targetRate)])) as Record<ByproductPartId, number>,
  }).net
  const full = animalByproductValue(config, { rates: fullRecoveryRates(config) }).net
  const perMonth = headPerYear / 12
  const months: ProjectionMonth[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    today: Math.round(today * perMonth * (i + 1)),
    target: Math.round(target * perMonth * (i + 1)),
  }))
  return {
    perAnimal: { today, target, full },
    yearToday: Math.round(today * headPerYear),
    yearTarget: Math.round(target * headPerYear),
    /** Each year, what's left with the processor at today's rates */
    leftOnTable: Math.round((full - today) * headPerYear),
    /** What reaching the target rate adds each year */
    gain: Math.round((target - today) * headPerYear),
    months,
  }
}
