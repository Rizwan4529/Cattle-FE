import type { Animal, CoatColor, Lot } from '@/data/types'
import { pricePerCwt } from './format'

export interface LotStats {
  headCount: number
  avgWeight: number
  minWeight: number
  maxWeight: number
  pricePerCwt: number
  lotTotal: number
  /** Most common coat color in the lot, for the illustration */
  coat: CoatColor
}

export function getLotAnimals(lot: Lot, animals: Animal[]): Animal[] {
  const byTag = new Map(animals.map((a) => [a.tagId, a]))
  return lot.tagIds.flatMap((tag) => byTag.get(tag) ?? [])
}

/** Numbers shown on every listing, derived from the animals in the lot. */
export function getLotStats(lot: Lot, animals: Animal[]): LotStats {
  const members = getLotAnimals(lot, animals)
  const weights = members.map((a) => a.estWeight)
  const headCount = members.length
  const avgWeight = headCount ? Math.round(weights.reduce((s, w) => s + w, 0) / headCount) : 0

  const coatCounts = new Map<CoatColor, number>()
  for (const a of members) coatCounts.set(a.coatColor, (coatCounts.get(a.coatColor) ?? 0) + 1)
  const coat = [...coatCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'black'

  return {
    headCount,
    avgWeight,
    minWeight: headCount ? Math.min(...weights) : 0,
    maxWeight: headCount ? Math.max(...weights) : 0,
    pricePerCwt: pricePerCwt(lot.pricePerHead, avgWeight),
    lotTotal: lot.pricePerHead * headCount,
    coat,
  }
}

export interface LotRow {
  lot: Lot
  stats: LotStats
}

const SEX_FOR_CLASS = { steers: 'steer', heifers: 'heifer', bred: 'heifer', pairs: 'cow', bulls: 'bull' } as const

/** Props for <CattleImage> that represent a whole lot. */
export function lotIllustration(lot: Lot, stats: LotStats) {
  return {
    coat: stats.coat,
    sex: SEX_FOR_CLASS[lot.class],
    withCalf: lot.class === 'pairs',
    seed: lot.id,
    alt: `Illustration of ${lot.title}`,
  }
}
