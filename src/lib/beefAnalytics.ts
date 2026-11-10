import { type BeefMonth, beefSalesHistory, cutsSold, pastPools } from '@/data/beefSales'
import type { BeefProduct, SharePool } from '@/data/beefTypes'
import { feedProgram } from '@/config/beef'
import { salesHistory } from '@/data/market'
import type { Order } from '@/data/types'

/** Numbers behind the owner's beef analytics: sample history plus orders placed on the site. */

export interface ChannelMonth extends BeefMonth {
  live: number
}

const month = (iso: string) => iso.slice(0, 7)

/** Revenue by channel per month: beef shares, cuts, subscriptions, and live cattle. */
export function revenueByChannel(orders: Order[]): ChannelMonth[] {
  const rows: ChannelMonth[] = beefSalesHistory.map((m) => ({ ...m, live: salesHistory.find((s) => s.month === m.month)?.revenue ?? 0 }))
  for (const o of orders) {
    const m = month(o.createdAt)
    let row = rows.find((r) => r.month === m)
    if (!row) {
      row = { month: m, shares: 0, cuts: 0, subscriptions: 0, live: 0 }
      rows.push(row)
    }
    row.shares += (o.shares ?? []).reduce((n, s) => n + s.estimatedTotal, 0)
    for (const i of o.items ?? []) {
      if (i.kind === 'subscription') row.subscriptions += i.total
      else if (i.kind !== 'gift-card') row.cuts += i.total
    }
    row.live += o.subtotal
  }
  return rows
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({
      ...r,
      shares: Math.round(r.shares),
      cuts: Math.round(r.cuts),
      subscriptions: Math.round(r.subscriptions),
      live: Math.round(r.live),
    }))
}

/** Sales channels, in chart order. Colors live with the chart (BeefAnalyticsPage). */
export const CHANNELS = [
  { key: 'shares', label: 'Beef shares' },
  { key: 'cuts', label: 'Butcher Shop cuts' },
  { key: 'subscriptions', label: 'Ranch Box' },
  { key: 'live', label: 'Live cattle' },
] as const

/** Packs sold per cut, sample plus site orders, most first. */
export function topCuts(orders: Order[], products: BeefProduct[]) {
  const counts = new Map(Object.entries(cutsSold))
  for (const o of orders)
    for (const i of o.items ?? [])
      for (const p of i.packs ?? []) {
        const cut = products.find((x) => x.id === p.productId)?.cut
        if (cut) counts.set(cut, (counts.get(cut) ?? 0) + p.packs)
      }
  return [...counts.entries()].map(([cut, packs]) => ({ cut, packs })).sort((a, b) => b.packs - a.packs)
}

/** Days each pool took to fill: earlier pools (sample) and this season's that have filled. */
export function poolFillSpeed(pools: SharePool[]) {
  const current = pools.flatMap((p) => {
    const full = p.history.find((h) => h.status === 'full')?.at
    if (!full) return []
    const days = Math.max(1, Math.round((Date.parse(full) - Date.parse(p.createdAt)) / 86_400_000))
    return [{ tagId: p.tagId, program: feedProgram(p.feedProgram).short, days }]
  })
  const all = [...pastPools, ...current]
  const avg = all.length ? Math.round(all.reduce((n, p) => n + p.days, 0) / all.length) : 0
  return { pools: all, avg }
}
