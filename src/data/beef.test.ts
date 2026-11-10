import { describe, expect, it } from 'vitest'
import { poolSegments, segmentsClaimed, segmentsFor } from '@/lib/yield'
import { animals } from './animals'
import { buildSeedPools } from './pools'
import { products } from './products'

const byTag = new Map(animals.map((a) => [a.tagId, a]))
const now = Date.parse('2026-11-10T12:00:00Z')
const pools = buildSeedPools(animals, now)

describe('beef animals', () => {
  it('keeps the original 44 head and adds 12 raised for beef', () => {
    expect(animals).toHaveLength(56)
    expect(animals.filter((a) => a.feedProgram)).toHaveLength(12)
  })

  it('has unique ear tags', () => {
    expect(new Set(animals.map((a) => a.tagId)).size).toBe(animals.length)
  })

  it('only has finished-weight animals in the beef program', () => {
    for (const a of animals.filter((x) => x.feedProgram)) expect(a.estWeight).toBeGreaterThanOrEqual(1100)
  })
})

describe('share pools', () => {
  it('belong to animals raised for beef, with matching feed programs', () => {
    for (const p of pools) {
      const a = byTag.get(p.tagId)
      expect(a?.feedProgram).toBe(p.feedProgram)
      expect(a?.harvest).toBeUndefined()
    }
  })

  it('are never over-claimed, and claims use whole segments', () => {
    for (const p of pools) {
      expect(segmentsClaimed(p)).toBeLessThanOrEqual(poolSegments(p))
      for (const c of p.claims) expect(c.segments).toBe(segmentsFor(c.size, p.unit))
    }
  })

  it('are full once past "open", and open pools have room left', () => {
    for (const p of pools) {
      if (p.status === 'open') expect(segmentsClaimed(p)).toBeLessThan(poolSegments(p))
      else expect(segmentsClaimed(p)).toBe(poolSegments(p))
    }
  })

  it('cover a spread of fill levels and every stage of the journey', () => {
    const open = pools.filter((p) => p.status === 'open').map((p) => segmentsClaimed(p))
    expect(new Set(open)).toEqual(new Set([0, 1, 2, 3]))
    expect(new Set(pools.map((p) => p.status))).toEqual(new Set(['open', 'harvest-scheduled', 'dry-aging', 'cut-wrap', 'ready']))
  })

  it('count deadlines from when the data is created', () => {
    for (const p of pools.filter((x) => x.status === 'open')) expect(Date.parse(p.deadline)).toBeGreaterThan(now)
  })

  it('record a hanging weight once harvested', () => {
    for (const p of pools.filter((x) => ['dry-aging', 'cut-wrap', 'ready'].includes(x.status))) expect(p.hangingWeight).toBeGreaterThan(600)
  })
})

describe('butcher shop products', () => {
  it('come from harvested animals', () => {
    for (const p of products) expect(byTag.get(p.sourceTagId)?.harvest, p.id).toBeDefined()
  })

  it('cover every cut in the spec', () => {
    const cuts = new Set(products.map((p) => p.cut))
    for (const c of [
      'ribeye',
      'ny-strip',
      'filet',
      'sirloin',
      't-bone',
      'flat-iron',
      'brisket',
      'short-ribs',
      'roast',
      'ground',
      'patties',
      'stew',
      'bones',
    ])
      expect(cuts.has(c as never), c).toBe(true)
  })

  it('have unique ids and valid "pairs well with" links', () => {
    const ids = new Set(products.map((p) => p.id))
    expect(ids.size).toBe(products.length)
    for (const p of products) for (const id of p.pairsWith) expect(ids.has(id), `${p.id} → ${id}`).toBe(true)
  })

  it('were packed after the animal’s harvest and dry aging', () => {
    for (const p of products) {
      const h = byTag.get(p.sourceTagId)!.harvest!
      expect(p.packDate > h.date).toBe(true)
      expect(p.agedDays).toBe(h.agedDays)
    }
  })
})
