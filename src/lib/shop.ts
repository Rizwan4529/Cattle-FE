import { beefConfig, feedProgram } from '@/config/beef'
import type { BeefProduct, BoxItem, Bundle, ProductReview, SubscriptionFrequency } from '@/data/beefTypes'
import { cutLabel, SUBSCRIPTION_PLANS } from '@/data/shop'
import type { CartItem, OrderItem, ShopCartItem } from '@/data/types'
import { formatShortDate } from './format'

/** Butcher Shop prices, boxes, and the shop part of the cart. Pure functions, tested in shop.test.ts. */

const round2 = (n: number) => Math.round(n * 100) / 100

/** Price of one pack: pack weight × $/lb */
export const packPrice = (p: Pick<BeefProduct, 'packWeightLb' | 'pricePerLb'>) => round2(p.packWeightLb * p.pricePerLb)

export const LOW_STOCK = 4

export const stockLabel = (stock: number) => (stock <= 0 ? 'Sold out' : stock <= LOW_STOCK ? `Only ${stock} left` : 'In stock')

function contents(items: BoxItem[], products: BeefProduct[]) {
  const byId = new Map(products.map((p) => [p.id, p]))
  let list = 0
  let lb = 0
  for (const { productId, packs } of items) {
    const p = byId.get(productId)
    if (!p) continue
    list += packPrice(p) * packs
    lb += p.packWeightLb * packs
  }
  return { list: round2(list), lb: Math.round(lb * 10) / 10 }
}

/** A curated box: price of the packs one by one, its price, and the savings. Prices round to the dollar. */
export function bundlePricing(bundle: Bundle, products: BeefProduct[]) {
  const { list, lb } = contents(bundle.items, products)
  const price = Math.round(list * (1 - bundle.discount))
  return { list, price, savings: round2(list - price), lb }
}

/** Build-Your-Own Box: the discount applies once the box reaches its target weight. */
export function boxPricing(items: BoxItem[], products: BeefProduct[], rules = beefConfig.box) {
  const { list, lb } = contents(items, products)
  const reached = lb >= rules.targetLb
  const discount = reached ? round2(list * rules.discount) : 0
  return { list, lb, reached, discount, price: round2(list - discount), progress: Math.min(1, lb / rules.targetLb) }
}

export const subscriptionPlan = (size: string) => SUBSCRIPTION_PLANS.find((p) => p.size === size) ?? SUBSCRIPTION_PLANS[1]

export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = { monthly: 'Every month', 'every-2-months': 'Every 2 months' }

/** Every pack a set of box items needs, for stock checks and decrements. */
export function packsNeeded(items: BoxItem[], times = 1) {
  return items.map((i) => ({ productId: i.productId, packs: i.packs * times }))
}

/** Whether there's stock for these packs. Returns the first product short, if any. */
export function shortOf(needs: BoxItem[], products: BeefProduct[]) {
  for (const n of needs) {
    const p = products.find((x) => x.id === n.productId)
    if (!p || p.stock < n.packs) return p ?? null
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface ShopLine {
  item: ShopCartItem
  title: string
  detail: string
  qty: number
  unitPrice: number
  total: number
  /** Packaged beef weight, lb (for freezer space and shipping) */
  lb: number
  packs: BoxItem[]
  /** Why it can't be bought right now, if it can't */
  problem?: string
  /** Product, bundle, or page to link the line to */
  href: string
}

export interface ShopSummary {
  lines: ShopLine[]
  subtotal: number
  lb: number
  /** Lines that can't be bought (sold out, too few left) */
  problems: ShopLine[]
}

export function summarizeShop(cart: CartItem[], products: BeefProduct[], bundles: Bundle[]): ShopSummary {
  const byId = new Map(products.map((p) => [p.id, p]))
  const lines: ShopLine[] = []
  for (const item of cart) {
    if (item.kind === 'product') {
      const p = byId.get(item.productId)
      if (!p) continue
      const unit = packPrice(p)
      lines.push({
        item,
        title: p.name,
        detail: `${p.packNote}, ${p.packWeightLb} lb pack. From ${p.sourceTagId}.`,
        qty: item.qty,
        unitPrice: unit,
        total: round2(unit * item.qty),
        lb: p.packWeightLb * item.qty,
        packs: [{ productId: p.id, packs: item.qty }],
        problem: p.stock <= 0 ? 'Sold out' : p.stock < item.qty ? `Only ${p.stock} left` : undefined,
        href: `/shop/${p.id}`,
      })
    } else if (item.kind === 'bundle') {
      const b = bundles.find((x) => x.id === item.bundleId)
      if (!b) continue
      const { price, lb } = bundlePricing(b, products)
      const packs = packsNeeded(b.items, item.qty)
      const short = shortOf(packs, products)
      lines.push({
        item,
        title: b.name,
        detail: b.items.map((i) => `${i.packs}× ${byId.get(i.productId)?.name ?? i.productId}`).join(', '),
        qty: item.qty,
        unitPrice: price,
        total: round2(price * item.qty),
        lb: lb * item.qty,
        packs,
        problem: short !== undefined ? `${short?.name ?? 'Part of this box'} is running low` : undefined,
        href: b.gift ? '/gifts' : '/shop/boxes',
      })
    } else if (item.kind === 'box') {
      const box = boxPricing(item.items, products)
      const short = shortOf(item.items, products)
      lines.push({
        item,
        title: box.reached ? `Your Build-Your-Own Box, ${Math.round(beefConfig.box.discount * 100)}% off` : 'Your Build-Your-Own Box',
        detail: item.items.map((i) => `${i.packs}× ${byId.get(i.productId)?.name ?? i.productId}`).join(', '),
        qty: 1,
        unitPrice: box.price,
        total: box.price,
        lb: box.lb,
        packs: item.items,
        problem: short !== undefined ? `${short?.name ?? 'Part of this box'} is running low` : undefined,
        href: '/shop/build-a-box',
      })
    } else if (item.kind === 'subscription') {
      const plan = subscriptionPlan(item.size)
      lines.push({
        item,
        title: `Ranch Box, ${plan.label}`,
        detail: `${FREQUENCY_LABELS[item.frequency]}, about ${plan.lb} lb, ${item.feedPreference === 'any' ? 'any feed program' : feedProgram(item.feedPreference).short.toLowerCase()}. First box ships ${formatShortDate(item.firstShip)}.`,
        qty: 1,
        unitPrice: plan.price,
        total: plan.price,
        lb: plan.lb,
        packs: [],
        href: '/shop/ranch-box',
      })
    } else if (item.kind === 'gift-card') {
      lines.push({
        item,
        title: `Gift card for ${item.recipientName}`,
        detail: `Emailed to ${item.recipientEmail} on ${formatShortDate(item.sendOn)}.`,
        qty: 1,
        unitPrice: item.amount,
        total: item.amount,
        lb: 0,
        packs: [],
        href: '/gifts',
      })
    }
  }
  return {
    lines,
    subtotal: round2(lines.reduce((n, l) => n + l.total, 0)),
    lb: Math.round(lines.reduce((n, l) => n + l.lb, 0)),
    problems: lines.filter((l) => l.problem),
  }
}

export const toOrderItems = (lines: ShopLine[]): OrderItem[] =>
  lines.map((l) => ({
    kind: l.item.kind,
    title: l.title,
    detail: l.detail,
    qty: l.qty,
    total: l.total,
    packs: l.packs.length ? l.packs : undefined,
    ref: l.item.kind === 'product' ? l.item.productId : l.item.kind === 'bundle' ? l.item.bundleId : undefined,
  }))

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function ratingSummary(reviews: Pick<ProductReview, 'rating'>[]) {
  const count = reviews.length
  const avg = count ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / count) * 10) / 10 : 0
  const dist = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }))
  return { avg, count, dist }
}

/** "Ribeye from HCR-2692" */
export const productShortName = (p: Pick<BeefProduct, 'cut' | 'sourceTagId'>) => `${cutLabel(p.cut)} from ${p.sourceTagId}`
