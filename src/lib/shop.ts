import { beefConfig, feedProgram } from '@/config/beef'
import { byproductsConfig } from '@/config/byproducts'
import type { BeefProduct, BoxItem, Bundle, ProductReview, SubscriptionFrequency, SubscriptionSize } from '@/data/beefTypes'
import { GOODS_BOXES } from '@/data/goods'
import type { GoodsBoxId, GoodsProduct } from '@/data/goodsTypes'
import { cutLabel, SUBSCRIPTION_PLANS } from '@/data/shop'
import type { CartItem, FarmLine, OrderItem, ShopCartItem } from '@/data/types'
import { goodsDetail, goodsLb, unitPrice } from './byproducts'
import { bagLb, fuelBundles, soilUnitPrice, tonsPerYard, unitAmount } from './soilFuel'
import { soilFuelConfig } from '@/config/soilFuel'
import type { FuelStock, SoilStock } from '@/data/soilFuelTypes'
import { formatNumber, formatShortDate } from './format'

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

export const goodsBox = (id: GoodsBoxId) => GOODS_BOXES.find((b) => b.id === id) ?? GOODS_BOXES[0]

/**
 * Name, price, and contents of any subscription: a beef Ranch Box, or a Ranch
 * Goods box (dog chews, bone broth) that rides on the same system.
 */
export function subscriptionInfo(sub: { size: SubscriptionSize; box?: GoodsBoxId }) {
  if (sub.box) {
    const box = goodsBox(sub.box)
    const size = box.sizes[sub.size]
    return { name: box.name, title: `${box.name}, ${size.label}`, price: size.price, lb: 0, contents: size.contents, href: '/ranch-goods/boxes' }
  }
  const plan = subscriptionPlan(sub.size)
  return { name: 'Ranch Box', title: `Ranch Box, ${plan.label}`, price: plan.price, lb: plan.lb, contents: plan.contents, href: '/shop/ranch-box' }
}

/** The next few Tuesdays at least 3 days out (boxes ship early in the week so they never sit over a weekend). */
export function shipDates(count = 4) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + 3)
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1)
  return Array.from({ length: count }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() + i * 7)
    return x.toISOString().slice(0, 10)
  })
}

export const shipDateLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

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
  /** Ranch Goods units it takes from stock */
  goods: { goodsId: string; qty: number }[]
  /** Soil or Fuel it takes from stock */
  farm?: FarmLine
}

export interface ShopSummary {
  lines: ShopLine[]
  subtotal: number
  lb: number
  /** Lines that can't be bought (sold out, too few left) */
  problems: ShopLine[]
}

/** Soil and Fuel stock (and the owner's on/off switches) for cart checks */
export interface FarmStock {
  soil: SoilStock
  fuel: FuelStock
  enabled?: Partial<Record<string, boolean>>
}

export function summarizeShop(
  cart: CartItem[],
  products: BeefProduct[],
  bundles: Bundle[],
  goods: GoodsProduct[] = [],
  farm?: FarmStock,
): ShopSummary {
  const byId = new Map(products.map((p) => [p.id, p]))
  const goodsById = new Map(goods.map((g) => [g.id, g]))
  const lines: ShopLine[] = []
  const push = (line: Omit<ShopLine, 'goods'> & { goods?: ShopLine['goods'] }) => lines.push({ goods: [], ...line })
  for (const item of cart) {
    if (item.kind === 'product') {
      const p = byId.get(item.productId)
      if (!p) continue
      const unit = packPrice(p)
      push({
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
      push({
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
      push({
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
      const info = subscriptionInfo(item)
      const what = item.box
        ? info.contents.charAt(0).toLowerCase() + info.contents.slice(1)
        : `about ${info.lb} lb, ${item.feedPreference === 'any' ? 'any feed program' : feedProgram(item.feedPreference).short.toLowerCase()}`
      push({
        item,
        title: info.title,
        detail: `${FREQUENCY_LABELS[item.frequency]}, ${what}. First box ships ${formatShortDate(item.firstShip)}.`,
        qty: 1,
        unitPrice: info.price,
        total: info.price,
        lb: info.lb,
        packs: [],
        href: info.href,
      })
    } else if (item.kind === 'goods') {
      const g = goodsById.get(item.goodsId)
      if (!g) continue
      const unit = unitPrice(g, item.qty, byproductsConfig)
      push({
        item,
        title: g.name,
        detail: goodsDetail(g, item.qty, byproductsConfig),
        qty: item.qty,
        unitPrice: unit,
        total: round2(unit * item.qty),
        lb: goodsLb(g, item.qty),
        packs: [],
        goods: [{ goodsId: g.id, qty: item.qty }],
        problem: g.stock <= 0 ? (g.unique ? 'Already sold' : 'Sold out') : g.stock < item.qty ? `Only ${g.stock} left` : undefined,
        href: `/ranch-goods/${g.id}`,
      })
    } else if (item.kind === 'soil') {
      const p = soilFuelConfig.soil.products.find((x) => x.id === item.productId)
      if (!p) continue
      const unit = soilUnitPrice(p, item.unit)
      const amount = unitAmount(p, item.unit)
      const stock = farm?.soil[p.id]
      const have = !stock ? Infinity : item.unit === 'bag' ? stock.bags : item.unit === 'yard' ? stock.yards : stock.yards * tonsPerYard(p)
      const off = farm?.enabled && farm.enabled[p.id] === false
      const u = soilFuelConfig.soil.units[item.unit]
      push({
        item,
        title: `${p.name}, by the ${u.label.toLowerCase()}`,
        detail:
          item.unit === 'bag'
            ? `${p.bagCuFt} cu ft bags, about ${bagLb(p)} lb each.`
            : `${formatNumber(Math.round(amount.yards * item.qty * 10) / 10)} cubic yards, about ${formatNumber(Math.round(amount.tons * item.qty * 10) / 10)} tons. Loaded at the ranch or delivered.`,
        qty: item.qty,
        unitPrice: unit,
        total: round2(unit * item.qty),
        lb: 0,
        packs: [],
        farm: { division: 'soil', productId: p.id, unit: item.unit, qty: item.qty },
        problem: off
          ? 'Not for sale right now'
          : have <= 0
            ? 'Sold out'
            : have < item.qty
              ? `Only ${Math.floor(have)} ${have === 1 ? item.unit : u.plural} left`
              : undefined,
        href: `/soil/${p.id}`,
      })
    } else if (item.kind === 'fuel') {
      const p = soilFuelConfig.fuel.products.find((x) => x.id === item.productId)
      if (!p) continue
      const bundles = fuelBundles(p, item.unit)
      const have = farm ? farm.fuel[p.id] : Infinity
      const off = farm?.enabled && farm.enabled[p.id] === false
      const u = soilFuelConfig.fuel.units[item.unit]
      const units = Math.floor(have / bundles)
      push({
        item,
        title: `${p.name}, by the ${u.label.toLowerCase()}`,
        detail:
          item.unit === 'bundle' ? `${p.bundleContents}. Outdoor use only.` : `${bundles} bundles (${p.bundleContents} each). Outdoor use only.`,
        qty: item.qty,
        unitPrice: p.price[item.unit],
        total: round2(p.price[item.unit] * item.qty),
        lb: 0,
        packs: [],
        farm: { division: 'fuel', productId: p.id, unit: item.unit, qty: item.qty },
        problem: off
          ? 'Not for sale right now'
          : units <= 0
            ? 'Sold out'
            : units < item.qty
              ? `Only ${units} ${units === 1 ? item.unit : u.plural} left`
              : undefined,
        href: `/fuel/${p.id}`,
      })
    } else if (item.kind === 'gift-card') {
      push({
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
    goods: l.goods.length ? l.goods : undefined,
    farm: l.farm,
    ref:
      l.item.kind === 'product'
        ? l.item.productId
        : l.item.kind === 'bundle'
          ? l.item.bundleId
          : l.item.kind === 'goods'
            ? l.item.goodsId
            : l.item.kind === 'soil' || l.item.kind === 'fuel'
              ? l.item.productId
              : // A Ranch Goods box subscription carries its box id (sales by channel)
                l.item.kind === 'subscription'
                ? l.item.box
                : undefined,
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

/** "Ribeye from CRW-2692" */
export const productShortName = (p: Pick<BeefProduct, 'cut' | 'sourceTagId'>) => `${cutLabel(p.cut)} from ${p.sourceTagId}`
