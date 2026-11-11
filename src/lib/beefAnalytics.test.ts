import { describe, expect, it } from 'vitest'
import type { Order } from '@/data/types'
import { revenueByChannel } from './beefAnalytics'

const order = (items: Order['items']): Order => ({
  id: 'o1',
  number: 'CRW-1',
  createdAt: '2026-11-08T12:00:00.000Z',
  buyer: { name: 'A', phone: '', email: '', address: '' },
  fulfillment: 'pickup',
  lotIds: [],
  items,
  subtotal: 0,
  freight: 0,
  deposit: 0,
  balance: 0,
})

describe('sales by channel', () => {
  it('counts Ranch Goods and goods boxes as their own channel, not as cuts or the Ranch Box', () => {
    const before = revenueByChannel([]).find((m) => m.month === '2026-11')!
    const after = revenueByChannel([
      order([
        { kind: 'goods', title: 'Rendered beef tallow', qty: 5, total: 45, ref: 'rendered-tallow' },
        { kind: 'subscription', title: 'Monthly Dog Chew Box, Medium dog', qty: 1, total: 36, ref: 'dog-chew-box' },
        { kind: 'subscription', title: 'Ranch Box, Medium', qty: 1, total: 239 },
        { kind: 'product', title: 'Ribeye', qty: 1, total: 50 },
      ]),
    ]).find((m) => m.month === '2026-11')!
    expect(after.goods - before.goods).toBe(81)
    expect(after.subscriptions - before.subscriptions).toBe(239)
    expect(after.cuts - before.cuts).toBe(50)
  })

  it('counts Soil and Fuel as their own channels', () => {
    const before = revenueByChannel([]).find((m) => m.month === '2026-11')!
    const after = revenueByChannel([
      order([
        { kind: 'soil', title: 'Garden Blend, by the cubic yard', qty: 2, total: 104, ref: 'garden-blend' },
        { kind: 'fuel', title: 'Pressed Fuel Logs, by the case', qty: 1, total: 92, ref: 'fuel-logs' },
      ]),
    ]).find((m) => m.month === '2026-11')!
    expect(after.soil - before.soil).toBe(104)
    expect(after.fuel - before.fuel).toBe(92)
    expect(after.cuts).toBe(before.cuts)
  })
})
