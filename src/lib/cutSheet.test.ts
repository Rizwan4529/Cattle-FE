import { describe, expect, it } from 'vitest'
import { applyPreset, cutSheetCsv, cutSheetRows, estimateCuts, newCutSheet, PRESETS, presetById, PRIMALS, TRIM_SHARE } from './cutSheet'

const quarter = () => newCutSheet('quarter', { tagId: 'HCR-2708', claimId: 'c1' })

describe('primals', () => {
  it('cover the nine primals in the spec', () => {
    expect(PRIMALS.map((p) => p.id).sort()).toEqual(['brisket', 'chuck', 'flank', 'loin', 'plate', 'rib', 'round', 'shank', 'sirloin'])
  })

  it('split the carcass with a little trim left for ground beef', () => {
    expect(TRIM_SHARE).toBeGreaterThan(0)
    expect(TRIM_SHARE).toBeLessThan(0.15)
  })

  it('have yields that add up to 100% for every style', () => {
    for (const p of PRIMALS) {
      for (const s of Object.values(p.styles)) expect(Object.values(s!.yields).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
    }
  })

  it('only use styles each primal offers in every preset', () => {
    for (const preset of PRESETS) for (const p of PRIMALS) expect(p.styles[preset.primals[p.id]], `${preset.id} ${p.id}`).toBeDefined()
  })
})

describe('new sheets and presets', () => {
  it('start as Butcher’s Choice, named after the animal', () => {
    const s = quarter()
    expect(s.preset).toBe('butchers-choice')
    expect(s.name).toBe('Quarter of HCR-2708')
    expect(s.claimId).toBe('c1')
  })

  it('keep the name, link, and notes when a preset is applied', () => {
    const s = { ...quarter(), notes: 'Extra thick ribeyes' }
    const next = applyPreset(s, presetById('smoker-pack')!)
    expect(next.name).toBe(s.name)
    expect(next.notes).toBe('Extra thick ribeyes')
    expect(next.primals.brisket.style).toBe('roasts')
    expect(next.extras.shortRibs).toBe(true)
  })
})

describe('estimateCuts', () => {
  it('accounts for all the take-home beef when no extras are kept', () => {
    const s = applyPreset(quarter(), presetById('butchers-choice')!)
    const plain = { ...s, extras: { soupBones: false, shortRibs: false, organs: false, fat: false } }
    expect(estimateCuts(plain, 130).total).toBeGreaterThanOrEqual(128)
    expect(estimateCuts(plain, 130).total).toBeLessThanOrEqual(132)
  })

  it('gives Steak Lover more steak and Family Freezer more ground', () => {
    const steak = estimateCuts(applyPreset(quarter(), presetById('steak-lover')!), 130)
    const family = estimateCuts(applyPreset(quarter(), presetById('family-freezer')!), 130)
    expect(steak.lb.steak).toBeGreaterThan(family.lb.steak)
    expect(family.lb.ground).toBeGreaterThan(steak.lb.ground)
  })

  it('updates when one primal changes', () => {
    const s = quarter()
    const before = estimateCuts(s, 260)
    const ground = estimateCuts({ ...s, primals: { ...s.primals, round: { ...s.primals.round, style: 'ground' } } }, 260)
    expect(ground.lb.roast).toBeLessThan(before.lb.roast)
    expect(ground.lb.ground).toBeGreaterThan(before.lb.ground)
  })

  it('adds bones, organs, and fat as extra pounds, and moves short ribs out of the ground', () => {
    const s = { ...quarter(), extras: { soupBones: false, shortRibs: false, organs: false, fat: false } }
    const none = estimateCuts(s, 130)
    const all = estimateCuts({ ...s, extras: { soupBones: true, shortRibs: true, organs: true, fat: true } }, 130)
    expect(all.lb.other).toBeGreaterThan(none.lb.other)
    expect(all.lb.ground).toBeLessThan(none.lb.ground)
  })

  it('scales with the share size', () => {
    const s = quarter()
    expect(estimateCuts(s, 520).lb.steak).toBeCloseTo(estimateCuts(s, 130).lb.steak * 4, -1)
  })

  it('counts more packages when steaks are packed one at a time', () => {
    const s = applyPreset(quarter(), presetById('steak-lover')!)
    const singles = {
      ...s,
      primals: Object.fromEntries(Object.entries(s.primals).map(([k, v]) => [k, { ...v, steaksPerPack: 1 }])) as typeof s.primals,
    }
    expect(estimateCuts(singles, 130).packages.steak).toBeGreaterThan(estimateCuts(s, 130).packages.steak)
  })

  it('turns about a third of the ground into patties when asked', () => {
    const e = estimateCuts({ ...quarter(), patties: true }, 130)
    expect(e.pattyLb).toBe(Math.round(e.lb.ground * 0.3))
    expect(estimateCuts({ ...quarter(), patties: false }, 130).pattyLb).toBe(0)
  })
})

describe('processor export', () => {
  it('writes one instruction per primal plus ground beef and extras', () => {
    const rows = cutSheetRows(quarter())
    expect(rows.find((r) => r.section === 'Rib')?.instructions).toMatch(/Ribeye steaks.*1" thick, 2 per pack/)
    expect(rows.find((r) => r.section === 'Plate')?.instructions).toBe('Grind.')
    expect(rows.find((r) => r.section === 'Flank')?.instructions).toBe('Flank steak, left whole.')
    expect(rows.find((r) => r.section === 'Ground beef')?.instructions).toBe('1 lb packs.')
  })

  it('includes the owner and special instructions in the CSV', () => {
    const csv = cutSheetCsv({ ...quarter(), notes: 'No tenderizing' }, 'Sarah, Kansas City')
    expect(csv).toContain('Owner,"Sarah, Kansas City"')
    expect(csv).toContain('Special instructions,No tenderizing')
  })
})
