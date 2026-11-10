import { describe, expect, it } from 'vitest'
import type { GiftCard } from '@/data/beefTypes'
import { applyCode, deliveryOptions, pickupDates, shippingCost, zoneForZip } from './delivery'

const option = (zip: string, subtotal: number, lb: number, method: string) => deliveryOptions(zip, subtotal, lb).find((o) => o.method === method)!

describe('delivery zones', () => {
  it('matches ZIPs to local zones by their first three digits', () => {
    expect(zoneForZip('65613')?.id).toBe('bolivar')
    expect(zoneForZip('65804')?.id).toBe('springfield')
    expect(zoneForZip('64111')?.id).toBe('joplin-kc')
    expect(zoneForZip('10001')).toBeUndefined()
    expect(zoneForZip('656')).toBeUndefined()
  })

  it('makes local delivery free over the zone threshold', () => {
    expect(option('65804', 100, 10, 'local').cost).toBe(15)
    expect(option('65804', 150, 10, 'local').cost).toBe(0)
    expect(option('65613', 20, 2, 'local').cost).toBe(0)
  })

  it('only offers local delivery inside a zone', () => {
    expect(option('10001', 100, 10, 'local').available).toBe(false)
    expect(option('', 100, 10, 'local').reason).toMatch(/ZIP/)
  })
})

describe('shipping', () => {
  it('prices by box weight, free over the threshold', () => {
    expect(shippingCost(8)).toBe(24)
    expect(shippingCost(20)).toBe(39)
    expect(shippingCost(60)).toBe(89)
    expect(option('10001', 120, 20, 'ship').cost).toBe(39)
    expect(option('10001', 199, 20, 'ship').cost).toBe(0)
  })

  it('ships only to the lower 48', () => {
    expect(option('10001', 50, 5, 'ship').available).toBe(true)
    expect(option('99501', 50, 5, 'ship').available).toBe(false)
  })

  it('always offers free ranch pickup', () => {
    expect(option('', 0, 0, 'pickup')).toMatchObject({ available: true, cost: 0 })
  })
})

describe('pickupDates', () => {
  it('lists upcoming Thursdays, Fridays, and Saturdays after today', () => {
    // Tuesday, Nov 10 2026
    expect(pickupDates(new Date(2026, 10, 10, 9), 4)).toEqual(['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-19'])
  })
})

describe('applyCode', () => {
  const card: GiftCard = {
    id: 'g',
    code: 'HCR-ABCD-1234',
    amount: 100,
    balance: 60,
    fromName: 'A',
    recipientName: 'B',
    recipientEmail: 'b@example.com',
    message: '',
    sendOn: '2026-11-10',
    createdAt: '2026-11-10',
  }

  it('takes 10% off Butcher Shop beef with WELCOME10, any case', () => {
    expect(applyCode(' welcome10 ', { beefSubtotal: 200, payToday: 200 })).toMatchObject({ ok: true, discount: 20 })
  })

  it('checks the minimum on RANCH25', () => {
    expect(applyCode('RANCH25', { beefSubtotal: 100, payToday: 100 }).ok).toBe(false)
    expect(applyCode('RANCH25', { beefSubtotal: 150, payToday: 150 })).toMatchObject({ ok: true, discount: 25 })
  })

  it('gives free shipping with FREESHIP', () => {
    expect(applyCode('FREESHIP', { beefSubtotal: 10, payToday: 10 })).toMatchObject({ ok: true, freeShipping: true, discount: 0 })
  })

  it('needs shop beef for a discount code', () => {
    expect(applyCode('WELCOME10', { beefSubtotal: 0, payToday: 400 }).ok).toBe(false)
  })

  it('applies a gift card balance, up to what’s due today', () => {
    expect(applyCode('hcr-abcd-1234', { beefSubtotal: 0, payToday: 400, giftCards: [card] })).toMatchObject({
      ok: true,
      kind: 'gift-card',
      discount: 60,
    })
    expect(applyCode('HCR-ABCD-1234', { beefSubtotal: 0, payToday: 40, giftCards: [card] })).toMatchObject({ discount: 40 })
    expect(applyCode('HCR-ABCD-1234', { beefSubtotal: 0, payToday: 40, giftCards: [{ ...card, balance: 0 }] }).ok).toBe(false)
  })

  it('rejects unknown codes', () => {
    expect(applyCode('NOPE', { beefSubtotal: 100, payToday: 100 }).ok).toBe(false)
  })
})
