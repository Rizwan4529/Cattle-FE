import { describe, expect, it } from 'vitest'
import { byproductsConfig as config } from '@/config/byproducts'
import { animals } from '@/data/animals'
import { byproductRecoveries, goods, RECIPES, seedBatches } from '@/data/goods'
import {
  animalByproductValue,
  batchUnits,
  defaultSettings,
  herdProjection,
  isEstimate,
  rawOnHand,
  withSettings,
  complianceFor,
  expectedRaw,
  filterGoods,
  fullRecoveryRates,
  isListed,
  lineTotal,
  maxQty,
  partById,
  ranchYield,
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
    expect(maxQty(product('hide-rug-crw-2672'))).toBe(1)
    expect(maxQty({ ...product('hide-rug-crw-2672'), stock: 0 })).toBe(0)
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
    const r2695 = byproductRecoveries.find((r) => r.tagId === 'CRW-2695')!
    const report = recoveryReport(config, r2695, byTag.get('CRW-2695'))
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
    expect(filterGoods(goods, { q: 'crw-2678' }).every((g) => g.sourceTagIds.includes('CRW-2678'))).toBe(true)
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

describe('cut-sheet extras', () => {
  const steer = { sex: 'steer' as const }
  const claims = [
    { id: 'c1', size: 'half' as const },
    { id: 'c2', size: 'quarter' as const },
    { id: 'c3', size: 'quarter' as const },
  ]
  const sheet = (claimId: string, extras: Partial<Record<'soupBones' | 'shortRibs' | 'organs' | 'fat', boolean>>) => ({
    claimId,
    extras: { soupBones: false, shortRibs: false, organs: false, fat: false, ...extras },
  })

  it('takes each buyer’s share of the parts they asked for out of the ranch’s yield', () => {
    const y = ranchYield(config, steer, claims, [sheet('c1', { soupBones: true }), sheet('c2', { organs: true, fat: true })])
    const part = (id: string) => y.find((p) => p.part === id)!
    expect(part('bones')).toMatchObject({ expected: 35, toBuyers: 17.5, toRanch: 17.5 })
    expect(part('organs')).toMatchObject({ toBuyers: 3.75, toRanch: 11.25 })
    expect(part('tail')).toMatchObject({ toBuyers: 0.63, toRanch: 1.87 })
    expect(part('fat')).toMatchObject({ toBuyers: 12.5, toRanch: 37.5 })
    // Not on any cut sheet: all the ranch's
    expect(part('hide')).toMatchObject({ toBuyers: 0, toRanch: 1 })
  })

  it('keeps everything for the ranch when no one asked for extras', () => {
    for (const p of ranchYield(config, steer, claims, [])) expect(p.toRanch).toBe(p.expected)
  })
})

describe('owner numbers and inventory', () => {
  it('starts from the placeholder estimates and applies the owner’s edits', () => {
    const settings = defaultSettings(config)
    expect(isEstimate(config, settings, 'fat', 'price')).toBe(true)
    settings.parts.fat = { ...settings.parts.fat, price: 12 }
    expect(isEstimate(config, settings, 'fat', 'price')).toBe(false)
    expect(partById(withSettings(config, settings), 'fat')!.price).toBe(12)
  })

  it('counts raw byproducts on hand: recovered less what batches used', () => {
    const onHand = rawOnHand(config, byproductRecoveries, seedBatches, goods)
    // 45 + 52 lb fat recovered, 92 lb rendered or packed
    expect(onHand.fat).toBe(5)
    expect(onHand.bones).toBe(37)
    expect(onHand.pizzle).toBe(3)
    // 6 hides: 3 rugs, 1 raw salted hide, 1 made into rawhide; CRW-2695's is still at the tannery
    expect(onHand.hide).toBe(1)
    // 4 horns, all listed one of a kind
    expect(onHand.horns).toBe(0)
    for (const v of Object.values(onHand)) expect(v).toBeGreaterThanOrEqual(0)
  })

  it('makes whole units from a batch', () => {
    expect(batchUnits(40, 0.75)).toBe(30)
    expect(batchUnits(13, 0.75)).toBe(9)
    expect(batchUnits(3, 0.15)).toBe(0)
  })

  it('has a recipe for real products and parts', () => {
    for (const r of RECIPES) {
      expect(
        goods.some((g) => g.id === r.goodsId),
        r.id,
      ).toBe(true)
      expect(partById(config, r.part), r.id).toBeDefined()
    }
  })

  it('projects money left on the table across the herd', () => {
    const p = herdProjection(config, 24, 1)
    expect(p.leftOnTable).toBeGreaterThan(0)
    expect(p.gain).toBe(p.leftOnTable)
    expect(p.months).toHaveLength(12)
    expect(p.months[11].target).toBe(p.yearTarget)
    expect(herdProjection(config, 24, 0.5).gain).toBeLessThan(p.gain)
  })
})
