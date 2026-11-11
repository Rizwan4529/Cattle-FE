import { describe, expect, it } from 'vitest'
import { plannerDefaults, plannerSeasonality } from '@/config/manurePlanner'
import type { PlannerSettings } from '@/data/soilFuelTypes'
import { allocation, planManure, wholeRanch } from './manurePlanner'

const plan = (patch: Partial<PlannerSettings> = {}) => planManure({ ...plannerDefaults, ...patch })

describe('manure planner', () => {
  it('works out manure produced, collected, and where it goes', () => {
    const r = plan({ headCount: 100, lbPerHeadDay: 60, collectionRate: 0.5, toCompost: 0.6, toFuel: 0.2 })
    expect(r.manure.produced).toBeCloseTo(1095)
    expect(r.manure.collected).toBeCloseTo(547.5)
    expect(r.manure.toCompost).toBeCloseTo(328.5)
    expect(r.manure.toFuel).toBeCloseTo(109.5)
    expect(r.manure.toPasture).toBeCloseTo(1095 - 438)
  })

  it('keeps compost + fuel inside 100%', () => {
    expect(allocation({ toCompost: 0.8, toFuel: 0.5 })).toEqual({ compost: 0.8, fuel: 0.2, pasture: 0 })
    expect(allocation({ toCompost: -1, toFuel: 2 })).toEqual({ compost: 0, fuel: 1, pasture: 0 })
  })

  it('turns finished compost into bags, yards, and tons by the sales mix', () => {
    const r = plan({ compostMix: { bag: 1, yard: 0, ton: 0 } })
    expect(r.compost.yards).toBe(0)
    expect(r.compost.bags).toBe(Math.floor((r.compost.finishedTons * 2000) / plannerDefaults.compostBagLb))
    expect(r.compost.revenue).toBeCloseTo(r.compost.bags * plannerDefaults.compostPrice.bag)
  })

  it('nets revenue less every cost line', () => {
    const { compost, fuel, total } = plan()
    const lines = (c: typeof compost.costs) => c.hay + c.labor + c.equipment + c.packaging + c.delivery + c.space
    expect(compost.net).toBeCloseTo(compost.revenue - lines(compost.costs))
    expect(fuel.net).toBeCloseTo(fuel.revenue - lines(fuel.costs))
    expect(total.net).toBeCloseTo(compost.net + fuel.net)
  })

  it('caps fuel sales at what the market takes', () => {
    const r = plan({ toCompost: 0, toFuel: 1, fuelMaxBundles: 1000 })
    expect(r.fuel.sold).toBe(1000)
    expect(r.fuel.unsold).toBe(r.fuel.bundles - 1000)
    expect(r.fuel.revenue).toBeCloseTo(1000 * plannerDefaults.fuelPricePerBundle)
  })

  it('has no compost or fuel numbers when nothing is sent there', () => {
    const r = plan({ toCompost: 0, toFuel: 0 })
    expect(r.total.revenue).toBe(0)
    expect(r.total.costs).toBe(0)
    expect(r.compost.paybackYears).toBeNull()
  })

  it('pays back equipment from profit before equipment', () => {
    const r = plan()
    const cash = r.compost.net + r.compost.costs.equipment
    expect(r.compost.paybackYears).toBeCloseTo(r.compost.equipmentCost / cash, 1)
    expect(plan({ compostPrice: { bag: 0, yard: 0, ton: 0 } }).compost.paybackYears).toBeNull()
  })

  it('spreads the year by season, or flat, and the months add up to the year', () => {
    const seasonal = plan({ seasonal: true })
    const flat = plan({ seasonal: false })
    const total = (r: ReturnType<typeof plan>) => r.months.reduce((n, m) => n + m.net, 0)
    expect(total(seasonal)).toBeCloseTo(seasonal.total.net, -1)
    expect(total(flat)).toBeCloseTo(flat.total.net, -1)
    const april = plannerSeasonality.compost[3]
    expect(seasonal.months[3].compost).toBe(Math.round(seasonal.compost.revenue * april))
    expect(flat.months[0].compost).toBe(flat.months[6].compost)
  })
})

describe('whole ranch', () => {
  it('adds soil and fuel from the planner to the other divisions', () => {
    const p = plan()
    const w = wholeRanch([], p)
    expect(w.basis).toEqual(['2026-08', '2026-09', '2026-10'])
    expect(w.annual.goods).toBe(Math.round(((420 + 1180 + 1960) / 3) * 12))
    expect(w.annual.soil).toBe(Math.round(p.compost.revenue))
    expect(w.annual.live).toBe(424_070)
    expect(w.total).toBe(Object.values(w.annual).reduce((n, v) => n + v, 0))
    expect(w.addedBySoilFuel).toBe(w.annual.soil + w.annual.fuel)
  })
})
