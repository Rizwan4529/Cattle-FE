import { useMemo } from 'react'
import { useRanchStore } from '@/store/useRanchStore'
import { getLotStats, type LotRow } from './lots'

/**
 * Every lot with its derived stats, recalculated when lots or animals change.
 * Draft lots are left out unless asked for (the public pages never show them).
 */
export function useLotRows({ includeDrafts = false }: { includeDrafts?: boolean } = {}): LotRow[] {
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
  return useMemo(
    () => lots.filter((lot) => includeDrafts || !lot.draft).map((lot) => ({ lot, stats: getLotStats(lot, animals) })),
    [lots, animals, includeDrafts],
  )
}
