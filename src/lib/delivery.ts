import { type BeefConfig, beefConfig, type DeliveryZone, type PromoCode } from '@/config/beef'
import { stateForZip } from '@/data/geo'
import type { GiftCard } from '@/data/beefTypes'

/**
 * Getting beef to the customer: ranch pickup (with time slots), local
 * delivery by ZIP zone, or frozen shipping by weight, plus promo codes and
 * gift cards at checkout. Pure functions, tested in delivery.test.ts.
 */

export type BeefDeliveryMethod = 'pickup' | 'local' | 'ship'

const round2 = (n: number) => Math.round(n * 100) / 100

export const zoneForZip = (zip: string, zones: DeliveryZone[] = beefConfig.delivery.localZones) =>
  /^\d{5}$/.test(zip) ? zones.find((z) => z.zipPrefixes.includes(zip.slice(0, 3))) : undefined

export interface DeliveryOption {
  method: BeefDeliveryMethod
  label: string
  /** What it costs for this order (0 when free) */
  cost: number
  /** e.g. "Free over $150" or "Fridays" */
  note: string
  available: boolean
  /** Why it isn't available, if it isn't */
  reason?: string
}

/** Shipping cost by box weight, before any free-shipping threshold. */
export function shippingCost(lb: number, cfg: Pick<BeefConfig, 'delivery'> = beefConfig) {
  return cfg.delivery.shipping.tiers.find((t) => lb <= t.maxLb)?.cost ?? cfg.delivery.shipping.tiers.at(-1)!.cost
}

/** The three ways to get Butcher Shop beef, priced for this ZIP, subtotal, and weight. */
export function deliveryOptions(zip: string, subtotal: number, lb: number, cfg: Pick<BeefConfig, 'delivery'> = beefConfig): DeliveryOption[] {
  const validZip = /^\d{5}$/.test(zip)
  const zone = zoneForZip(zip, cfg.delivery.localZones)
  const ship = cfg.delivery.shipping
  const shipFree = subtotal >= ship.freeOver
  const inLower48 = validZip && Boolean(stateForZip(zip))
  return [
    { method: 'pickup', label: 'Pick up at the ranch', cost: 0, note: `${cfg.delivery.pickup.days.join(', ')}. Free.`, available: true },
    {
      method: 'local',
      label: zone ? `Local delivery, ${zone.name}` : 'Local delivery',
      cost: zone ? (zone.fee === 0 || (zone.freeOver > 0 && subtotal >= zone.freeOver) ? 0 : zone.fee) : 0,
      note: zone
        ? `${zone.days}.${zone.fee ? ` Free over $${zone.freeOver}.` : ' Always free.'}`
        : 'Around Kiowa, Denver, Colorado Springs, and the northern Front Range.',
      available: Boolean(zone),
      reason: !validZip
        ? 'Enter your ZIP code to check.'
        : zone
          ? undefined
          : 'We don’t deliver to that ZIP yet. Shipping works anywhere in the lower 48.',
    },
    {
      method: 'ship',
      label: 'Ship it frozen',
      cost: shipFree ? 0 : shippingCost(lb, cfg),
      note: `On dry ice, 2-day. Free over $${ship.freeOver}.`,
      available: inLower48,
      reason: !validZip ? 'Enter your ZIP code to check.' : inLower48 ? undefined : 'We ship to the lower 48 states.',
    },
  ]
}

/** Upcoming pickup days (the configured weekdays), starting the day after `from`. */
export function pickupDates(from: Date, count = 6, days: string[] = beefConfig.delivery.pickup.days) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const out: string[] = []
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  for (let i = 1; out.length < count && i < 60; i++) {
    d.setDate(d.getDate() + 1)
    if (days.includes(names[d.getDay()]))
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return out
}

// ---------------------------------------------------------------------------
// Promo codes and gift cards
// ---------------------------------------------------------------------------

export type PromoResult =
  | { ok: true; kind: 'promo'; code: string; discount: number; freeShipping: boolean; message: string }
  | { ok: true; kind: 'gift-card'; code: string; discount: number; freeShipping: false; message: string }
  | { ok: false; code: string; message: string }

/**
 * Checks a code typed at checkout: a promo code from config, or a gift card
 * bought on this site. Discounts apply to Butcher Shop beef (not share
 * deposits, gift cards, or cattle); gift cards can pay for anything due today.
 */
export function applyCode(
  raw: string,
  { beefSubtotal, payToday, giftCards = [] }: { beefSubtotal: number; payToday: number; giftCards?: GiftCard[] },
  promos: PromoCode[] = beefConfig.promoCodes,
): PromoResult {
  const code = raw.trim().toUpperCase()
  if (!code) return { ok: false, code, message: 'Enter a code.' }
  const promo = promos.find((p) => p.code === code)
  if (promo) {
    if (promo.minSubtotal && beefSubtotal < promo.minSubtotal)
      return { ok: false, code, message: `${code} needs $${promo.minSubtotal} of Butcher Shop beef. You have $${beefSubtotal.toFixed(2)}.` }
    if (promo.kind === 'free-shipping') return { ok: true, kind: 'promo', code, discount: 0, freeShipping: true, message: promo.description }
    if (!beefSubtotal) return { ok: false, code, message: `${code} works on Butcher Shop beef. Add a steak or a box to use it.` }
    const discount = promo.kind === 'percent' ? round2(beefSubtotal * promo.value) : Math.min(promo.value, beefSubtotal)
    return { ok: true, kind: 'promo', code, discount, freeShipping: false, message: promo.description }
  }
  const card = giftCards.find((g) => g.code.toUpperCase() === code)
  if (card) {
    if (card.balance <= 0) return { ok: false, code, message: 'That gift card has been used up.' }
    const discount = round2(Math.min(card.balance, payToday))
    return {
      ok: true,
      kind: 'gift-card',
      code: card.code,
      discount,
      freeShipping: false,
      message: `Gift card: $${card.balance.toFixed(2)} available`,
    }
  }
  return { ok: false, code, message: 'That code isn’t valid. Check the spelling, or try WELCOME10.' }
}
