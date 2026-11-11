import { describe, expect, it } from 'vitest'
import { soilFuelConfig } from '@/config/soilFuel'
import { dealers } from '@/data/dealers'
import { seedCompostBatches, seedFuelStock, seedSoilFuelEnabled, seedSoilStock, seedTruckloadQuotes } from '@/data/soilFuel'
import {
  bagLb,
  coverage,
  deliveredQuote,
  findDealers,
  fuelBundles,
  fuelPerBundle,
  fuelProduct,
  fuelSavings,
  lowFuelStock,
  lowSoilStock,
  pricePerYard,
  proPrice,
  proTierFor,
  roadMiles,
  soilProduct,
  soilUnitPrice,
  truckloadTons,
  unitAmount,
} from './soilFuel'

const garden = soilProduct('garden-blend')
const ag = soilProduct('ag-bulk')

describe('soil units', () => {
  it('converts bags, yards, and tons by the product’s density', () => {
    expect(unitAmount(garden, 'yard')).toEqual({ yards: 1, tons: 0.55 })
    expect(unitAmount(garden, 'bag').yards).toBeCloseTo(1.5 / 27, 2)
    expect(bagLb(garden)).toBe(61)
    expect(unitAmount(ag, 'ton').yards).toBeCloseTo(2000 / 1200, 2)
  })

  it('caps a truckload at the scale limit', () => {
    // 25 yd × 0.6 t/yd = 15 t, right at the cap; 25 yd × 0.55 = 13.75 t
    expect(truckloadTons(ag)).toBe(15)
    expect(truckloadTons(garden)).toBe(13.75)
  })

  it('prices a truckload from the ton price less the discount', () => {
    expect(soilUnitPrice(ag, 'truckload')).toBe(Math.round(48 * 15 * 0.88))
    expect(pricePerYard(ag, 'truckload')).toBeLessThan(pricePerYard(ag, 'yard'))
  })
})

describe('pro tiers', () => {
  it('picks the tier by yards a year', () => {
    expect(proTierFor(0).id).toBe('retail')
    expect(proTierFor(20).id).toBe('pro')
    expect(proTierFor(399).id).toBe('contractor')
    expect(proTierFor(5000).id).toBe('wholesale')
    expect(proPrice(garden, 'yard', proTierFor(100))).toBeCloseTo(52 * 0.82)
  })
})

describe('delivery', () => {
  it('estimates road miles from the ranch to Colorado ZIPs only', () => {
    expect(roadMiles('80117')).toBe(1)
    expect(roadMiles('80202')).toBeLessThan(60)
    expect(roadMiles('81501')).toBeGreaterThan(250)
    expect(roadMiles('10001')).toBeNull()
    expect(roadMiles('801')).toBeNull()
  })

  it('adds base + per-mile delivery for each load', () => {
    const q = deliveredQuote(ag, '80202', 2)
    const d = soilFuelConfig.soil.delivery
    expect(q.available).toBe(true)
    expect(q.delivery).toBe(Math.round((d.base + d.perMile * q.miles!) * 2))
    expect(q.total).toBe(q.product + q.delivery)
  })

  it('declines bad ZIPs, other states, and loads too far out', () => {
    expect(deliveredQuote(ag, '8011', 1).reason).toMatch(/5-digit/)
    expect(deliveredQuote(ag, '10001', 1).reason).toMatch(/Colorado/)
    expect(deliveredQuote(ag, '81301', 1).available).toBe(false)
  })
})

describe('coverage calculator', () => {
  it('works out a quarter-inch topdress on a 5,000 sq ft lawn', () => {
    const c = coverage(soilProduct('lawn-topdress'), 5000, 'sqft', 'topdress')!
    // 5,000 × 0.25 / 12 / 27 = 3.86 yd → 4 yd
    expect(c.yards).toBe(4)
    expect(c.bags).toBe(105)
    expect(c.best.unit).toBe('yard')
  })

  it('uses tons per acre for fields and offers truckloads for big jobs', () => {
    const c = coverage(ag, 10, 'acres', 'field')!
    expect(c.tons).toBe(80)
    expect(c.options.some((o) => o.unit === 'truckload')).toBe(true)
    expect(c.options.some((o) => o.unit === 'bag')).toBe(false)
    expect(c.best.unit).toBe('truckload')
  })

  it('suggests bags for a small bed', () => {
    const c = coverage(soilProduct('potting-mix'), 16, 'sqft', 'garden-bed')!
    expect(c.best.unit).toBe('bag')
    expect(c.options.some((o) => o.unit === 'truckload')).toBe(false)
  })

  it('returns nothing for no area', () => {
    expect(coverage(garden, 0, 'sqft', 'topdress')).toBeNull()
  })
})

describe('fuel units', () => {
  it('counts bundles per case and pallet and the savings', () => {
    const logs = fuelProduct('fuel-logs')
    expect(fuelBundles(logs, 'pallet')).toBe(320)
    expect(fuelPerBundle(logs, 'case')).toBe(11.5)
    expect(fuelSavings(logs, 'pallet')).toBeGreaterThan(fuelSavings(logs, 'case'))
  })

  it('makes every case and pallet cheaper per bundle than a single bundle', () => {
    for (const p of soilFuelConfig.fuel.products) {
      expect(fuelPerBundle(p, 'case')).toBeLessThan(p.price.bundle)
      expect(fuelPerBundle(p, 'pallet')).toBeLessThan(fuelPerBundle(p, 'case'))
    }
  })
})

describe('dealers and stock', () => {
  it('sorts dealers nearest first and filters by what they carry', () => {
    const near = findDealers(dealers, { zip: '80107' })
    expect(near[0].dealer.city).toBe('Elizabeth')
    expect(findDealers(dealers, { carries: 'cow-chip-gift' }).every((r) => r.dealer.carries.includes('cow-chip-gift'))).toBe(true)
    expect(findDealers(dealers, { kind: 'nursery' }).every((r) => r.dealer.kind === 'nursery')).toBe(true)
  })

  it('flags low stock', () => {
    expect(lowSoilStock(seedSoilStock).map((l) => `${l.id}:${l.form}`)).toEqual(['ag-bulk:bags', 'potting-mix:bags', 'potting-mix:yards'])
    expect(lowFuelStock(seedFuelStock).map((l) => l.id)).toEqual(['campfire-bundle'])
  })
})

describe('seed data', () => {
  it('has a switch for every product and estimates on every quote', () => {
    expect(Object.keys(seedSoilFuelEnabled)).toHaveLength(8)
    expect(seedTruckloadQuotes.every((q) => q.miles > 0 && q.estimate > 0)).toBe(true)
  })

  it('logs hot windrows inside the target band', () => {
    const { min } = soilFuelConfig.production.tempTarget
    const hot = seedCompostBatches.find((b) => b.status === 'composting')!
    expect(hot.temps.filter((t) => t.f >= min).length).toBeGreaterThan(5)
  })
})
