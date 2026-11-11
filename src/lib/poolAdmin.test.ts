import { describe, expect, it } from 'vitest'
import { animals } from '@/data/animals'
import { buildSeedPools } from '@/data/pools'
import { advancePool, isFull, newPool, nextStatus, poolCandidates, scheduleHarvest } from './poolAdmin'

const now = Date.parse('2026-11-10T12:00:00Z')
const pools = buildSeedPools(animals, now)
const pool = (tag: string) => pools.find((p) => p.tagId === tag)!
const animal = (tag: string) => animals.find((a) => a.tagId === tag)!

describe('newPool', () => {
  it('opens a pool with a deadline the given days out', () => {
    const p = newPool({ tagId: 'CRW-2402', feedProgram: 'grass-finished', pricePerHangingLb: 7.25, unit: 'quarter', days: 30 }, now)
    expect(p).toMatchObject({ status: 'open', claims: [], pricePerHangingLb: 7.25 })
    expect(Date.parse(p.deadline) - now).toBe(30 * 86_400_000)
  })
})

describe('poolCandidates', () => {
  it('leaves out animals already pooled, harvested, in a lot, bred, or bulls', () => {
    const lotTags = new Set(['CRW-2411'])
    const ids = poolCandidates(animals, pools, lotTags).map((a) => a.tagId)
    expect(ids).not.toContain('CRW-2701') // open pool
    expect(ids).not.toContain('CRW-2690') // harvested
    expect(ids).not.toContain('CRW-2411') // in a lot
    expect(ids).not.toContain('CRW-2502') // bull
    expect(ids).not.toContain('CRW-2507') // bred heifer
    expect(ids).toContain('CRW-2402')
  })
})

describe('harvest and the beef journey', () => {
  it('only schedules harvest once a pool is full', () => {
    expect(scheduleHarvest(pool('CRW-2701'), '2026-11-20', now).status).toBe('open')
    const full = { ...pool('CRW-2711'), status: 'full' as const }
    expect(isFull(full)).toBe(true)
    expect(scheduleHarvest(full, '2026-11-20', now)).toMatchObject({ status: 'harvest-scheduled', harvestDate: '2026-11-20' })
  })

  it('records the hanging weight when the animal goes to dry aging', () => {
    const { pool: p, harvested } = advancePool(pool('CRW-2711'), animal('CRW-2711'), now)
    expect(p.status).toBe('dry-aging')
    expect(p.hangingWeight).toBeGreaterThan(animal('CRW-2711').estWeight * 0.6)
    expect(harvested?.hangingWeight).toBe(p.hangingWeight)
    expect(p.history.at(-1)?.status).toBe('dry-aging')
  })

  it('walks dry aging → cut & wrap → ready → shipped, then stops', () => {
    expect(nextStatus('dry-aging')).toBe('cut-wrap')
    expect(nextStatus('cut-wrap')).toBe('ready')
    expect(nextStatus('ready')).toBe('shipped')
    expect(nextStatus('shipped')).toBeUndefined()
    expect(advancePool(pool('CRW-2701'), animal('CRW-2701'), now).pool.status).toBe('open')
  })
})
