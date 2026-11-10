import { beefConfig } from '@/config/beef'
import type { FeedProgramId, PoolStatus, PoolUnit, SharePool } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { poolSegments, segmentsClaimed } from './yield'

/**
 * The owner's side of share pools: opening a pool, booking harvest, and
 * moving each animal along (dry aging → cut & wrap → ready). Pure functions
 * used by the store, tested in poolAdmin.test.ts.
 */

const DAY = 86_400_000

export interface NewPoolInput {
  tagId: string
  feedProgram: FeedProgramId
  pricePerHangingLb: number
  unit: PoolUnit
  /** Days the pool stays open */
  days: number
}

export function newPool(input: NewPoolInput, now: number): SharePool {
  const at = new Date(now).toISOString()
  return {
    id: `pool-${input.tagId.toLowerCase()}-${now.toString(36)}`,
    tagId: input.tagId,
    feedProgram: input.feedProgram,
    pricePerHangingLb: input.pricePerHangingLb,
    unit: input.unit,
    claims: [],
    deadline: new Date(now + input.days * DAY).toISOString(),
    status: 'open',
    history: [{ status: 'open', at }],
    createdAt: at,
  }
}

/** Animals that can get a new pool: in the herd, not harvested, not in a cattle lot, and without an active pool. */
export function poolCandidates(animals: Animal[], pools: SharePool[], lotTags: Set<string>) {
  const pooled = new Set(pools.filter((p) => p.status !== 'shipped' && p.status !== 'ready').map((p) => p.tagId))
  return animals.filter((a) => !a.harvest && !pooled.has(a.tagId) && !lotTags.has(a.tagId) && a.sex !== 'bull' && !a.pregnancy && !a.calfAtSide)
}

export const isFull = (p: SharePool) => segmentsClaimed(p) >= poolSegments(p)

/** Books the processor for a fully claimed pool. */
export function scheduleHarvest(pool: SharePool, date: string, now: number): SharePool {
  if (pool.status !== 'full' && pool.status !== 'harvest-scheduled') return pool
  const at = new Date(now).toISOString()
  return {
    ...pool,
    status: 'harvest-scheduled',
    harvestDate: date,
    history: [...pool.history.filter((h) => h.status !== 'harvest-scheduled'), { status: 'harvest-scheduled', at }],
  }
}

const NEXT: Partial<Record<PoolStatus, PoolStatus>> = {
  'harvest-scheduled': 'dry-aging',
  'dry-aging': 'cut-wrap',
  'cut-wrap': 'ready',
  ready: 'shipped',
}

export const nextStatus = (s: PoolStatus) => NEXT[s]

/**
 * Moves a pool one step along. Going into dry aging means the animal was
 * harvested, so the processor's hanging weight is recorded (about 62% of live,
 * varied a little per animal).
 */
export function advancePool(pool: SharePool, animal: Animal | undefined, now: number): { pool: SharePool; harvested?: Animal['harvest'] } {
  const to = NEXT[pool.status]
  if (!to) return { pool }
  const at = new Date(now).toISOString()
  const next: SharePool = { ...pool, status: to, history: [...pool.history, { status: to, at }] }
  if (to === 'dry-aging' && animal) {
    const wiggle = ((animal.tagId.charCodeAt(animal.tagId.length - 1) % 7) - 3) / 1000
    const hangingWeight = Math.round(animal.estWeight * (beefConfig.dressingPercent + wiggle))
    const harvestDate = pool.harvestDate && pool.harvestDate <= at.slice(0, 10) ? pool.harvestDate : at.slice(0, 10)
    next.hangingWeight = hangingWeight
    next.harvestDate = harvestDate
    next.agingDays = pool.agingDays ?? beefConfig.dryAgeDays.max
    return { pool: next, harvested: { date: harvestDate, hangingWeight, agedDays: next.agingDays, processor: beefConfig.processor.name } }
  }
  return { pool: next }
}
