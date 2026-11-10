import type { SharePool } from '@/data/beefTypes'
import type { Animal, CartItem, ShareCartItem } from '@/data/types'
import { quotePool } from './beef'
import { canClaim, segmentsFor, type ShareQuote } from './yield'

/**
 * Beef shares in the cart: each line's price, the deposit due today, and the
 * estimated balance due at pickup. A share whose animal filled up, closed,
 * or was taken down while it sat in the cart is listed as unavailable.
 */

export interface ShareLine {
  item: ShareCartItem
  pool: SharePool
  animal: Animal
  quote: ShareQuote
}

export interface ShareSummary {
  lines: ShareLine[]
  unavailable: { item: ShareCartItem; pool?: SharePool }[]
  deposit: number
  estimatedTotal: number
  estimatedBalance: number
  takeHomeLb: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function summarizeShares(cart: CartItem[], pools: SharePool[], animals: Animal[], now: number): ShareSummary {
  const lines: ShareLine[] = []
  const unavailable: ShareSummary['unavailable'] = []
  // Segments taken by earlier lines in this cart, per pool
  const used = new Map<string, number>()
  for (const item of cart) {
    if (item.kind !== 'share') continue
    const pool = pools.find((p) => p.id === item.poolId)
    const animal = pool && animals.find((a) => a.tagId === pool.tagId)
    if (!pool || !animal || !canClaim(pool, item.size, now, used.get(pool.id) ?? 0)) {
      unavailable.push({ item, pool })
      continue
    }
    const quote = quotePool(pool, animal, item.size)
    used.set(pool.id, (used.get(pool.id) ?? 0) + segmentsFor(item.size, pool.unit))
    lines.push({ item, pool, animal, quote })
  }
  const sum = (f: (l: ShareLine) => number) => round2(lines.reduce((n, l) => n + f(l), 0))
  return {
    lines,
    unavailable,
    deposit: sum((l) => l.quote.deposit),
    estimatedTotal: sum((l) => l.quote.total),
    estimatedBalance: sum((l) => l.quote.balance),
    takeHomeLb: lines.reduce((n, l) => n + l.quote.takeHomeLb, 0),
  }
}
