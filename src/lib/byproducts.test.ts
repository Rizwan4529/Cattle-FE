import { describe, expect, it } from 'vitest'
import { byproductsConfig as config } from '@/config/byproducts'
import { animals } from '@/data/animals'
import { byproductRecoveries, goods } from '@/data/goods'
import {
  animalByproductValue,
  complianceFor,
  expectedRaw,
  filterGoods,
  fullRecoveryRates,
  isListed,
  lineTotal,
  maxQty,
  partById,
  recoveryReport,
  tierFor,
  unitPrice,
  valueOfRaw,
  visibleCategories,
} from './byproducts'

const byTag = new Map(animals.map((a) => [a.tagId, a]))
const product = (id: string) => goods.find((g) => g.id === id)!

describe('ranch goods catalog', () => {
  it('has unique ids and every mockup category', () => {
    expect(new Set(goods.map((g) => g.id)).size).toBe(goods.length)
    for (const c of config.categories) expect(goods.some((g) => g.category === c.id)).toBe(true)
  })

  it('only names harvested animals as sources', () => {
    for (const g of goods) for (const tag of g.sourceTagIds) expect(byTag.get(tag)?.harvest, `${g.id} → ${tag}`).toBeDefined()
  })

  it('makes one-of-a-kind items quantity 1 from a single animal', () => {
    const unique = goods.filter((g) => g.unique)
    expect(unique.length).toBeGreaterThanOrEqual(6)
    for (const g of unique) {
      expect(g.stock).toBe(1)
      expect(g.sourceTagIds).toHaveLength(1)
      expect(['hide', 'horns']).toContain(g.part)
    }
  })

  it('only takes horns from horned animals', () => {
    for (const g of goods.filter((x) => x.part === 'horns')) for (const tag of g.sourceTagIds) expect(byTag.get(tag)?.horned).toBe(true)
  })

  it('matches each hide rug to its animal’s coat', () => {
    for (const g of goods.filter((x) => x.art === 'hide-rug' || x.art === 'raw-hide')) {
      expect(g.coat).toBe(byTag.get(g.sourceTagIds[0])?.coatColor)
    }
  })

  it('has a recovery record for every harvested animal it sources from', () => {
    const recorded = new Set(byproductRecoveries.map((r) => r.tagId))
    for (const g of goods) for (const tag of g.sourceTagIds) expect(recorded.has(tag)).toBe(true)
  })
})

describe('compliance', () => {
  it('uses the category flags, with product overrides', () => {
    expect(complianceFor(product('rendered-tallow'), config).requiresInspection).toBe(true)
    expect(complianceFor(product('tallow-soap'), config).requiresInspection).toBe(false)
    expect(complianceFor(product('cow-ear'), config).requiresFeedRegistration).toBe(true)
    expect(complianceFor(product('bone-meal'), config).requiresFertilizerRegistration).toBe(true)
  })

  it('hides disabled categories, and everything when Ranch Goods is off', () => {
    const noGarden = { ...config, categories: config.categories.map((c) => (c.id === 'garden' ? { ...c, enabled: false } : c)) }
    expect(visibleCategories(noGarden).map((c) => c.id)).not.toContain('garden')
    expect(isListed(product('bone-meal'), noGarden)).toBe(false)
    expect(isListed(product('rendered-tallow'), noGarden)).toBe(true)
    expect(visibleCategories({ ...config, enabled: false })).toHaveLength(0)
  })
})

describe('tier pricing', () => {
  it('picks the tier for a quantity', () => {
    expect(tierFor(1, config.priceTiers).off).toBe(0)
    expect(tierFor(4, config.priceTiers).off).toBe(0)
    expect(tierFor(5, config.priceTiers).off).toBe(0.1)
    expect(tierFor(19, config.priceTiers).off).toBe(0.1)
    expect(tierFor(20, config.priceTiers).off).toBe(0.2)
    expect(tierFor(500, config.priceTiers).off).toBe(0.2)
  })

  it('discounts bulk items only', () => {
    expect(unitPrice(product('rendered-tallow'), 20, config)).toBe(8)
    expect(lineTotal(product('rendered-tallow'), 5, config)).toBe(45)
    expect(unitPrice(product('oxtail'), 20, config)).toBe(11)
  })

  it('caps one-of-a-kind items at 1', () => {
    expect(maxQty(product('hide-rug-hcr-2672'))).toBe(1)
    expect(maxQty({ ...product('hide-rug-hcr-2672'), stock: 0 })).toBe(0)
    expect(maxQty(product('soup-bones'))).toBe(30)
  })
})

describe('value per animal', () => {
  const fat = partById(config, 'fat')!

  it('renders fat to tallow and subtracts the rendering cost', () => {
    // 40 lb raw → 30 lb tallow at $10 less $1.50 rendering
    expect(valueOfRaw(fat, 40)).toEqual({ part: 'fat', raw: 40, units: 30, gross: 300, cost: 45, net: 255 })
  })

  it('gives polled animals no horns and heifers no pizzle', () => {
    const horns = partById(config, 'horns')!
    const pizzle = partById(config, 'pizzle')!
    expect(expectedRaw(horns, { horned: undefined, sex: 'steer' })).toBe(0)
    expect(expectedRaw(horns, { horned: true, sex: 'steer' })).toBe(2)
    expect(expectedRaw(pizzle, { sex: 'heifer' })).toBe(0)
    expect(expectedRaw(pizzle, { sex: 'steer' })).toBe(1)
  })

  it('is worth more at full recovery than at today’s rates, and net is gross less cost', () => {
    const today = animalByproductValue(config)
    const full = animalByproductValue(config, { rates: fullRecoveryRates(config) })
    expect(full.net).toBeGreaterThan(today.net)
    expect(full.net).toBeCloseTo(full.gross - full.cost, 2)
    // Placeholder numbers land around $650 net / $930 gross for a typical animal.
    expect(full.gross).toBeGreaterThan(800)
    expect(full.net).toBeGreaterThan(500)
  })

  it('values what each harvested animal left with the processor', () => {
    const r2695 = byproductRecoveries.find((r) => r.tagId === 'HCR-2695')!
    const report = recoveryReport(config, r2695, byTag.get('HCR-2695'))
    const fatLine = report.parts.find((p) => p.part === 'fat')!
    expect(fatLine.lost).toBe(50)
    expect(fatLine.lostValue).toBe(valueOfRaw(fat, 50).net)
    // Polled: no horns expected, so none lost.
    expect(report.parts.find((p) => p.part === 'horns')!.expected).toBe(0)
    expect(report.lostValue).toBeGreaterThan(0)
  })
})

describe('storefront filters', () => {
  it('searches by name and ear tag', () => {
    expect(filterGoods(goods, { q: 'bully' }).map((g) => g.id)).toEqual(['bully-stick-12', 'bully-stick-6'])
    expect(filterGoods(goods, { q: 'hcr-2678' }).every((g) => g.sourceTagIds.includes('HCR-2678'))).toBe(true)
  })

  it('filters by category, use, and price', () => {
    expect(filterGoods(goods, { category: 'garden' })).toHaveLength(3)
    expect(filterGoods(goods, { use: 'pets' }).every((g) => g.uses.includes('pets'))).toBe(true)
    expect(filterGoods(goods, { price: 'over-50' }).every((g) => g.price > 50)).toBe(true)
  })

  it('sorts by price and keeps sold items last', () => {
    const asc = filterGoods(goods, { sort: 'price-asc' }).map((g) => g.price)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    const withSold = goods.map((g) => (g.id === 'oxtail' ? { ...g, stock: 0 } : g))
    expect(filterGoods(withSold, {}).at(-1)?.id).toBe('oxtail')
  })
})
