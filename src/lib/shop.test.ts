import { describe, expect, it } from 'vitest'
import { products } from '@/data/products'
import { BUNDLES, CUTS, REVIEWS } from '@/data/shop'
import type { CartItem } from '@/data/types'
import { boxPricing, bundlePricing, packPrice, ratingSummary, shortOf, stockLabel, summarizeShop } from './shop'

const byId = (id: string) => products.find((p) => p.id === id)!

describe('prices', () => {
  it('prices a pack by weight × $/lb', () => {
    expect(packPrice({ packWeightLb: 1.6, pricePerLb: 32 })).toBe(51.2)
  })

  it('discounts curated boxes off the one-by-one price, rounded to the dollar', () => {
    const grill = BUNDLES.find((b) => b.id === 'grill-master')!
    const { list, price, savings } = bundlePricing(grill, products)
    expect(list).toBeCloseTo(
      2 * packPrice(byId('ribeye-grain')) +
        2 * packPrice(byId('strip-grain')) +
        2 * packPrice(byId('sirloin-grain')) +
        packPrice(byId('patties-grain')),
      2,
    )
    expect(price).toBe(Math.round(list * 0.9))
    expect(savings).toBeGreaterThan(0)
  })

  it('gives the Build-Your-Own Box discount only once it reaches the target weight', () => {
    const light = boxPricing([{ productId: 'ground-grain', packs: 5 }], products)
    expect(light.reached).toBe(false)
    expect(light.discount).toBe(0)
    expect(light.progress).toBeCloseTo(5 / 15, 5)
    const full = boxPricing([{ productId: 'ground-2lb', packs: 8 }], products)
    expect(full.reached).toBe(true)
    expect(full.price).toBeCloseTo(full.list * 0.9, 2)
    expect(full.progress).toBe(1)
  })
})

describe('stock', () => {
  it('labels low and sold-out stock', () => {
    expect(stockLabel(0)).toBe('Sold out')
    expect(stockLabel(3)).toBe('Only 3 left')
    expect(stockLabel(20)).toBe('In stock')
  })

  it('finds the product a box is short of', () => {
    expect(shortOf([{ productId: 'filet-wagyu', packs: 99 }], products)?.id).toBe('filet-wagyu')
    expect(shortOf([{ productId: 'ground-grain', packs: 1 }], products)).toBeUndefined()
  })
})

describe('summarizeShop', () => {
  const t = '2026-11-10T00:00:00Z'
  const cart: CartItem[] = [
    { kind: 'lot', lotId: 'lot-101', addedAt: t },
    { kind: 'product', id: 'a', productId: 'ribeye-grain', qty: 2, addedAt: t },
    { kind: 'product', id: 'b', productId: 'filet-wagyu', qty: 5, addedAt: t },
    { kind: 'bundle', id: 'c', bundleId: 'grill-master', qty: 1, addedAt: t },
    {
      kind: 'gift-card',
      id: 'd',
      amount: 100,
      fromName: 'A',
      recipientName: 'B',
      recipientEmail: 'b@example.com',
      message: '',
      sendOn: '2026-12-20',
      addedAt: t,
    },
    { kind: 'subscription', id: 'e', size: 'medium', frequency: 'monthly', feedPreference: 'grass-finished', firstShip: '2026-11-20', addedAt: t },
  ]
  const s = summarizeShop(cart, products, BUNDLES)

  it('prices each shop line and skips cattle lots', () => {
    expect(s.lines).toHaveLength(5)
    expect(s.lines[0].total).toBeCloseTo(packPrice(byId('ribeye-grain')) * 2, 2)
    expect(s.lines.find((l) => l.item.kind === 'gift-card')?.total).toBe(100)
    expect(s.lines.find((l) => l.item.kind === 'subscription')?.total).toBe(239)
  })

  it('flags lines with more packs than are in stock', () => {
    expect(s.problems.map((l) => l.item.id)).toEqual(['b'])
    expect(s.problems[0].problem).toBe('Only 2 left')
  })

  it('totals weight for freezer space, leaving out gift cards', () => {
    expect(s.lb).toBeGreaterThan(15)
  })
})

describe('shop data', () => {
  it('has a product for every cut listed, and bundles that use real products', () => {
    for (const c of CUTS)
      expect(
        products.some((p) => p.cut === c.id),
        c.id,
      ).toBe(true)
    for (const b of BUNDLES) for (const i of b.items) expect(byId(i.productId), `${b.id} ${i.productId}`).toBeDefined()
  })

  it('has reviews only for real products, and summarizes ratings', () => {
    for (const r of REVIEWS) expect(byId(r.productId), r.id).toBeDefined()
    const sum = ratingSummary([{ rating: 5 }, { rating: 4 }, { rating: 4 }])
    expect(sum).toMatchObject({ avg: 4.3, count: 3 })
    expect(sum.dist.find((d) => d.stars === 4)?.count).toBe(2)
  })
})
