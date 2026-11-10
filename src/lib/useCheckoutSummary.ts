import { BUNDLES } from '@/data/shop'
import { usePreferences } from '@/store/usePreferences'
import { useRanchStore } from '@/store/useRanchStore'
import { useNow } from './beef'
import { summarizeShares } from './beefCart'
import { summarizeCart } from './checkout'
import { applyCode, deliveryOptions, zoneForZip } from './delivery'
import { summarizeShop } from './shop'

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Everything the cart and checkout show about money, for a cart that can mix
 * cattle lots (deposit), beef shares (deposit, balance on hanging weight),
 * and Butcher Shop items (paid in full, plus delivery). `code` is a promo
 * code or gift card typed at checkout.
 */
export function useCheckoutSummary(code = '') {
  const now = useNow(30_000)
  const cart = useRanchStore((s) => s.cart)
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
  const pools = useRanchStore((s) => s.pools)
  const products = useRanchStore((s) => s.products)
  const giftCards = useRanchStore((s) => s.giftCards)
  const fulfillment = usePreferences((s) => s.fulfillment)
  const destination = usePreferences((s) => s.freightDestination)
  const zip = usePreferences((s) => s.beefZip)
  const method = usePreferences((s) => s.beefDelivery)

  const cattle = summarizeCart(cart, lots, animals, fulfillment, destination)
  const shares = summarizeShares(cart, pools, animals, now)
  const shop = summarizeShop(cart, products, BUNDLES)

  // Beef that physically travels (not gift cards; subscriptions ship on their own schedule, shipping included)
  const shopBeef = shop.lines.filter((l) => l.item.kind === 'product' || l.item.kind === 'bundle' || l.item.kind === 'box')
  const beefSubtotal = round2(shopBeef.reduce((n, l) => n + l.total, 0))
  const beefLb = Math.round(shopBeef.reduce((n, l) => n + l.lb, 0))
  const options = deliveryOptions(zip, beefSubtotal, beefLb)
  const chosen = options.find((o) => o.method === method && o.available) ?? options[0]

  const beforeCodes = round2(cattle.deposit + shares.deposit + shop.subtotal)
  const promo = code ? applyCode(code, { beefSubtotal, payToday: beforeCodes + (shopBeef.length ? chosen.cost : 0), giftCards }) : null
  const deliveryCost = shopBeef.length && !(promo?.ok && promo.freeShipping) ? chosen.cost : 0
  const promoDiscount = promo?.ok && promo.kind === 'promo' ? promo.discount : 0
  const subtotalToday = round2(beforeCodes + deliveryCost - promoDiscount)
  const giftCardAmount = promo?.ok && promo.kind === 'gift-card' ? Math.min(promo.discount, subtotalToday) : 0

  return {
    cattle,
    shares,
    shop,
    shopBeef,
    beefSubtotal,
    beefLb,
    zip,
    zone: zoneForZip(zip),
    options,
    delivery: chosen,
    deliveryCost,
    promo,
    promoDiscount,
    giftCardAmount,
    payToday: round2(subtotalToday - giftCardAmount),
    dueLater: round2(cattle.balance + shares.estimatedBalance),
    hasLots: cattle.lines.length > 0,
    hasShares: shares.lines.length > 0,
    hasShop: shop.lines.length > 0,
    hasShopBeef: shopBeef.length > 0,
  }
}

export type CheckoutSummary = ReturnType<typeof useCheckoutSummary>
