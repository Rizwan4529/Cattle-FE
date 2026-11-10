import Papa from 'papaparse'
import type { CutSheet, SharePool } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { cutSheetRows, newCutSheet, presetById } from './cutSheet'
import { hangingWeight, SHARE_FRACTION, SHARE_LABELS } from './yield'

/**
 * What the processor needs per carcass: who owns each share, how big it is,
 * and that owner's cut sheet. Owners who haven't sent a sheet get the
 * Butcher's Choice default (noted as such).
 */

export interface CarcassShare {
  owner: string
  size: string
  hangingLb: number
  sheetName: string
  defaulted: boolean
  rows: { section: string; instructions: string }[]
}

export function carcassShares(pool: SharePool, animal: Animal, sheets: CutSheet[]): CarcassShare[] {
  const carcass = pool.hangingWeight ?? hangingWeight(animal.estWeight)
  return pool.claims.map((c) => {
    const own = sheets.find((s) => s.claimId === c.id)
    const sheet = own ?? newCutSheet(c.size, { claimId: c.id, tagId: pool.tagId })
    return {
      owner: `${c.firstName} (${c.city}, ${c.state})`,
      size: SHARE_LABELS[c.size],
      hangingLb: Math.round(carcass * SHARE_FRACTION[c.size]),
      sheetName: own ? ((own.preset ? presetById(own.preset)?.name : own.name) ?? own.name) : 'Butcher’s Choice (default, no sheet sent)',
      defaulted: !own,
      rows: cutSheetRows(sheet),
    }
  })
}

export function processorCsv(entries: { pool: SharePool; animal: Animal }[], sheets: CutSheet[]) {
  const rows = entries.flatMap(({ pool, animal }) =>
    carcassShares(pool, animal, sheets).flatMap((s) =>
      s.rows.map((r) => ({
        ear_tag: pool.tagId,
        harvest_date: pool.harvestDate ?? '',
        owner: s.owner,
        share: s.size,
        share_hanging_lb_est: s.hangingLb,
        cut_sheet: s.sheetName,
        section: r.section,
        instructions: r.instructions,
      })),
    ),
  )
  return Papa.unparse(rows)
}

export const processorFileName = (tag?: string) => `processor-cut-sheets-${tag ? tag.toLowerCase() : 'all'}.csv`
