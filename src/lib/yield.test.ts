import { describe, expect, it } from 'vitest'
import { beefConfig } from '@/config/beef'
import type { SharePool } from '@/data/beefTypes'
import {
  adjustedPricePerHangingLb,
  agingDay,
  availableShareSizes,
  balanceDue,
  canClaim,
  cutMixEstimate,
  dressingPercent,
  freezerSpace,
  hangingWeight,
  openSizes,
  quoteShare,
  recommendShare,
  retailValuePerTakeHomeLb,
  savingsVsIndividual,
  segmentsFor,
  segmentsLeft,
  takeHomeRange,
  takeHomeWeight,
  timeLeft,
} from './yield'

const cfg = beefConfig
const withEighths = { ...cfg, shareSizes: { ...cfg.shareSizes, eighth: true } }

describe('weights', () => {
  it('uses 62% dressing and 40% take-home of live weight by default', () => {
    expect(hangingWeight(1300)).toBe(806)
    expect(takeHomeWeight(1300)).toBe(520)
  })

  it('figures take-home from live weight, not hanging weight', () => {
    expect(takeHomeWeight(1000)).toBe(400)
    expect(takeHomeWeight(1000)).not.toBe(Math.round(hangingWeight(1000) * 0.4))
  })

  it('keeps config percentages inside their allowed ranges', () => {
    expect(dressingPercent({ ...cfg, dressingPercent: 0.7 })).toBe(0.65)
    expect(dressingPercent({ ...cfg, dressingPercent: 0.5 })).toBe(0.6)
    expect(takeHomeWeight(1000, { ...cfg, takeHomePercent: 0.5 })).toBe(430)
    expect(hangingWeight(1000, { ...cfg, dressingPercent: 0.63 })).toBe(630)
  })

  it('gives a take-home range from the 38–43% band, scaled by share', () => {
    expect(takeHomeRange(1300)).toEqual([494, 559])
    expect(takeHomeRange(1300, cfg, 0.25)).toEqual([124, 140])
  })
})

describe('share sizes', () => {
  it('sells whole, half, and quarter by default, with eighths off', () => {
    expect(availableShareSizes()).toEqual(['whole', 'half', 'quarter'])
    expect(availableShareSizes(withEighths)).toEqual(['whole', 'half', 'quarter', 'eighth'])
  })

  it('maps share sizes to fill-meter segments', () => {
    expect(segmentsFor('whole', 'quarter')).toBe(4)
    expect(segmentsFor('half', 'quarter')).toBe(2)
    expect(segmentsFor('quarter', 'quarter')).toBe(1)
    expect(segmentsFor('eighth', 'quarter')).toBe(0)
    expect(segmentsFor('quarter', 'eighth')).toBe(2)
    expect(segmentsFor('whole', 'eighth')).toBe(8)
  })
})

describe('pricing', () => {
  it('adjusts the hanging-lb price for feed program and breed', () => {
    expect(adjustedPricePerHangingLb(7.1, 'grain-finished', 'Angus')).toBe(7.1)
    expect(adjustedPricePerHangingLb(7.1, 'grass-finished', 'Angus')).toBe(7.81)
    expect(adjustedPricePerHangingLb(8, 'grain-finished', 'Wagyu cross')).toBe(10)
  })

  it('quotes a quarter of a 1,300 lb grain-finished Angus steer', () => {
    const q = quoteShare({ liveLb: 1300, size: 'quarter', feedProgram: 'grain-finished', breed: 'Angus' })
    expect(q.hangingLb).toBe(202)
    expect(q.takeHomeLb).toBe(130)
    expect([q.takeHomeLow, q.takeHomeHigh]).toEqual([124, 140])
    expect(q.beef).toBe(1434.2)
    expect(q.killFeeShare).toBe(23.75)
    expect(q.processing).toBe(225.75)
    expect(q.total).toBe(1659.95)
    expect(q.deposit).toBe(414.99)
    expect(q.balance).toBe(1244.96)
    expect(q.perTakeHomeLb).toBe(12.77)
  })

  it('charges the whole kill fee on a whole animal and splits it across shares', () => {
    const whole = quoteShare({ liveLb: 1300, size: 'whole', feedProgram: 'grain-finished', breed: 'Angus' })
    const half = quoteShare({ liveLb: 1300, size: 'half', feedProgram: 'grain-finished', breed: 'Angus' })
    expect(whole.killFeeShare).toBe(95)
    expect(half.killFeeShare).toBe(47.5)
    expect(whole.total).toBe(6623.6)
  })

  it('$7.10 per hanging lb works out to about $11 per take-home lb before processing', () => {
    const q = quoteShare({ liveLb: 1300, size: 'whole', feedProgram: 'grain-finished', breed: 'Angus' })
    expect(q.beef / q.takeHomeLb).toBeCloseTo(11, 0)
  })

  it('uses the pool’s locked price when given', () => {
    const q = quoteShare({ liveLb: 1300, size: 'quarter', feedProgram: 'grain-finished', breed: 'Angus', basePricePerHangingLb: 6.5 })
    expect(q.pricePerHangingLb).toBe(6.5)
    expect(q.beef).toBe(1313)
  })

  it('keeps the same total whether processing is itemized or included', () => {
    const input = { liveLb: 1250, size: 'half' as const, feedProgram: 'forage-grain' as const, breed: 'Hereford' }
    const itemized = quoteShare(input)
    const included = quoteShare(input, { ...cfg, processing: { ...cfg.processing, mode: 'included' } })
    expect(included.total).toBe(itemized.total)
    expect(included.processingIncluded).toBe(true)
    expect(itemized.processingIncluded).toBe(false)
  })

  it('takes the deposit rate from config', () => {
    const q = quoteShare({ liveLb: 1300, size: 'quarter', feedProgram: 'grain-finished', breed: 'Angus' }, { ...cfg, depositRate: 0.5 })
    expect(q.deposit).toBeCloseTo(q.total / 2, 2)
  })
})

describe('balance due', () => {
  it('is figured on the actual hanging weight, at the locked price, less the deposit', () => {
    const b = balanceDue({ actualHangingLb: 830, size: 'quarter', pricePerHangingLb: 7.1, depositPaid: 414.99 })
    expect(b.hangingLb).toBe(208)
    expect(b.beef).toBe(1476.8)
    expect(b.processing).toBe(231.75)
    expect(b.total).toBe(1708.55)
    expect(b.balance).toBe(1293.56)
  })

  it('goes down when the carcass hangs lighter than estimated', () => {
    const est = quoteShare({ liveLb: 1300, size: 'quarter', feedProgram: 'grain-finished', breed: 'Angus' })
    const light = balanceDue({ actualHangingLb: 780, size: 'quarter', pricePerHangingLb: 7.1, depositPaid: est.deposit })
    expect(light.balance).toBeLessThan(est.balance)
  })
})

describe('individual cuts comparison', () => {
  const products = [
    { category: 'steak' as const, pricePerLb: 30 },
    { category: 'steak' as const, pricePerLb: 26 },
    { category: 'roast' as const, pricePerLb: 14 },
    { category: 'ground' as const, pricePerLb: 9 },
    { category: 'other' as const, pricePerLb: 8 },
  ]

  it('weights shop prices by the standard cut mix', () => {
    // 28×.25 + 14×.2 + 9×.45 + 8×.1
    expect(retailValuePerTakeHomeLb(products)).toBe(14.65)
  })

  it('falls back to typical prices for empty categories', () => {
    expect(retailValuePerTakeHomeLb([])).toBe(14.35)
  })

  it('shows the savings, never a negative number', () => {
    expect(savingsVsIndividual({ takeHomeLb: 130, total: 1659.95 }, products)).toBe(245)
    expect(savingsVsIndividual({ takeHomeLb: 10, total: 5000 }, products)).toBe(0)
  })

  it('splits take-home weight by category', () => {
    expect(cutMixEstimate(200)).toEqual({ steak: 50, roast: 40, ground: 90, other: 20 })
  })
})

describe('recommendShare', () => {
  it('recommends a half for about 300 lb from a 1,300 lb steer', () => {
    expect(recommendShare(300, 1300)).toEqual({ size: 'half', count: 1, takeHomeLb: 260, range: [247, 280] })
  })

  it('picks the closest size, and the larger one on a tie', () => {
    expect(recommendShare(130, 1300).size).toBe('quarter')
    expect(recommendShare(195, 1300).size).toBe('half')
    expect(recommendShare(500, 1300).size).toBe('whole')
  })

  it('only suggests eighths when they are switched on', () => {
    expect(recommendShare(65, 1300).size).toBe('quarter')
    expect(recommendShare(65, 1300, withEighths).size).toBe('eighth')
  })

  it('suggests more than one animal for very large orders', () => {
    const r = recommendShare(1100, 1300)
    expect(r.size).toBe('whole')
    expect(r.count).toBe(2)
    expect(r.takeHomeLb).toBe(1040)
  })
})

describe('freezerSpace', () => {
  it('needs about 1 cu ft per 35–40 lb and suggests a freezer that fits', () => {
    expect(freezerSpace(130)).toEqual({ low: 3.5, high: 4, suggested: 5 })
    expect(freezerSpace(520)).toEqual({ low: 13, high: 15, suggested: 15 })
  })

  it('returns no suggestion when nothing is big enough', () => {
    expect(freezerSpace(5000).suggested).toBeNull()
  })
})

describe('share pools', () => {
  const now = Date.parse('2026-11-10T12:00:00Z')
  const pool = (claimed: number, overrides: Partial<SharePool> = {}): SharePool => ({
    id: 'p',
    tagId: 'CRW-1',
    feedProgram: 'grain-finished',
    pricePerHangingLb: 7.1,
    unit: 'quarter',
    claims: Array.from({ length: claimed }, (_, i) => ({
      id: `c${i}`,
      size: 'quarter' as const,
      segments: 1,
      firstName: 'A',
      city: 'B',
      state: 'CO',
      claimedAt: '2026-11-01T00:00:00Z',
      ifUnfilled: 'refund' as const,
      deposit: 100,
    })),
    deadline: '2026-11-20T00:00:00Z',
    status: 'open',
    history: [],
    createdAt: '2026-11-01T00:00:00Z',
    ...overrides,
  })

  it('counts open segments, less any held in the cart', () => {
    expect(segmentsLeft(pool(3))).toBe(1)
    expect(segmentsLeft(pool(1), 2)).toBe(1)
    expect(segmentsLeft(pool(4), 1)).toBe(0)
  })

  it('only lets a share be claimed when it fits', () => {
    expect(canClaim(pool(0), 'whole', now)).toBe(true)
    expect(canClaim(pool(1), 'whole', now)).toBe(false)
    expect(canClaim(pool(2), 'half', now)).toBe(true)
    expect(canClaim(pool(3), 'half', now)).toBe(false)
    expect(openSizes(pool(3), now)).toEqual(['quarter'])
  })

  it('stops claims after the deadline or once the pool is full', () => {
    expect(canClaim(pool(1, { deadline: '2026-11-09T00:00:00Z' }), 'quarter', now)).toBe(false)
    expect(canClaim(pool(4, { status: 'full' }), 'quarter', now)).toBe(false)
  })

  it('counts down to the deadline', () => {
    const t = timeLeft('2026-11-12T15:30:45Z', now)
    expect(t).toMatchObject({ expired: false, days: 2, hours: 3, minutes: 30, seconds: 45 })
    expect(timeLeft('2026-11-01T00:00:00Z', now).expired).toBe(true)
  })

  it('counts dry-aging days from when aging started, up to the planned days', () => {
    const p = { agingDays: 21, history: [{ status: 'dry-aging' as const, at: '2026-11-02T12:00:00Z' }] }
    expect(agingDay(p, now)).toBe(9)
    expect(agingDay(p, Date.parse('2026-12-30T00:00:00Z'))).toBe(21)
    expect(agingDay({ history: [] }, now)).toBe(0)
  })
})
