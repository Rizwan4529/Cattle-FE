import { ranch } from '@/config/ranch'
import { US_STATES } from '@/data/geo'
import type { Animal, CartItem, Lot } from '@/data/types'
import type { FreightDestination, Fulfillment } from '@/store/usePreferences'
import { estimateFreight, type FreightEstimate } from './freight'
import { getLotAnimals, getLotStats, type LotStats } from './lots'

/**
 * Cart math: what's still for sale, the subtotal, one combined haul for
 * delivery, the deposit due now, and the balance due when the cattle load.
 */

export interface CartLine {
  lot: Lot
  stats: LotStats
}

export interface CartSummary {
  lines: CartLine[]
  /** Lots in the cart that sold to someone else or were taken down */
  unavailable: { lotId: string; lot?: Lot }[]
  head: number
  subtotal: number
  freight: FreightEstimate | null
  /** Delivery chosen but no destination entered yet */
  needsDestination: boolean
  total: number
  deposit: number
  balance: number
}

export function summarizeCart(
  cart: CartItem[],
  lots: Lot[],
  animals: Animal[],
  fulfillment: Fulfillment,
  destination: FreightDestination | null,
): CartSummary {
  const byId = new Map(lots.map((l) => [l.id, l]))
  const lines: CartLine[] = []
  const unavailable: CartSummary['unavailable'] = []
  for (const item of cart) {
    if (item.kind !== 'lot') continue
    const lot = byId.get(item.lotId)
    if (!lot || lot.status === 'sold' || lot.draft || lot.pricingMode === 'offer') unavailable.push({ lotId: item.lotId, lot })
    else lines.push({ lot, stats: getLotStats(lot, animals) })
  }
  const head = lines.reduce((n, l) => n + l.stats.headCount, 0)
  const subtotal = lines.reduce((n, l) => n + l.stats.lotTotal, 0)
  const weight = lines.reduce((n, l) => n + getLotAnimals(l.lot, animals).reduce((w, a) => w + a.estWeight + (a.calfAtSide?.estWeight ?? 0), 0), 0)
  const dest = destination ? US_STATES.find((s) => s.abbr === destination.state) : undefined
  // Everything rides on one haul, so freight is figured on the whole order.
  const freight = fulfillment === 'delivery' && dest && head ? estimateFreight(dest, head, weight) : null
  const total = subtotal + (freight?.cost ?? 0)
  const deposit = Math.round(subtotal * ranch.commerce.depositRate)
  return {
    lines,
    unavailable,
    head,
    subtotal,
    freight,
    needsDestination: fulfillment === 'delivery' && !dest,
    total,
    deposit,
    balance: total - deposit,
  }
}

export const depositPercent = `${Math.round(ranch.commerce.depositRate * 100)}%`

// ---------------------------------------------------------------------------
// Card checks (demo only: nothing is sent anywhere)
// ---------------------------------------------------------------------------

/** Luhn checksum, the same check a real card form runs before sending. */
export function luhnValid(digits: string) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return digits.length >= 13 && sum % 10 === 0
}

export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Discover' | null

export function cardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  if (/^6(011|5)/.test(digits)) return 'Discover'
  return null
}

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 19)
  if (cardBrand(digits) === 'American Express')
    return digits.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** "0429" → "04 / 29" as the buyer types. */
export function formatExpiry(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d
}

export function expiryValid(value: string, now = new Date()) {
  const m = value.match(/^(\d{2}) \/ (\d{2})$/)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  // Cards are good through the last day of the expiry month.
  return new Date(year, month, 1) > now
}

/** Readable order number, e.g. HCR-10482. */
export const newOrderNumber = () => `${ranch.tagPrefix}-${Math.floor(10_000 + Math.random() * 89_999)}`
