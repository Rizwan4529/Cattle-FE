import { useEffect, useState } from 'react'
import { beefConfig, feedProgram } from '@/config/beef'
import type { FeedProgramId, ShareClaim, SharePool, ShareSize } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { SEX_LABELS } from './labels'
import { isClaimable, isPastDeadline, openSizes, quoteShare, type ShareQuote, segmentsLeft, SHARE_LABELS } from './yield'

/** Helpers shared by the Buy Beef pages. */

/** "Grain-finished Angus steer" */
export const beefTitle = (animal: Pick<Animal, 'breed' | 'sex' | 'feedProgram'>) =>
  `${animal.feedProgram ? `${feedProgram(animal.feedProgram).short} ` : ''}${animal.breed} ${SEX_LABELS[animal.sex].toLowerCase()}`

/** "Sarah · Kansas City", as shown on the fill meter */
export const claimLabel = (c: Pick<ShareClaim, 'firstName' | 'city'>) => `${c.firstName} · ${c.city}`

/** "a quarter", "a half", "the whole animal" */
export const shareNoun = (size: ShareSize) => (size === 'whole' ? 'the whole animal' : `${size === 'eighth' ? 'an' : 'a'} ${size}`)

/** "1 quarter left", "2 quarters left" */
export function leftLabel(pool: Pick<SharePool, 'unit' | 'claims'>, held = 0) {
  const n = segmentsLeft(pool, held)
  return `${n} ${pool.unit}${n === 1 ? '' : 's'} left`
}

/** Open, closed because the deadline passed unfilled, or a later stage. */
export type PoolPhase = 'open' | 'closed' | 'in-progress'

export function poolPhase(pool: SharePool, now: number): PoolPhase {
  if (pool.status !== 'open') return 'in-progress'
  return isPastDeadline(pool, now) ? 'closed' : 'open'
}

export interface PoolRow {
  pool: SharePool
  animal: Animal
  /** Smallest share on offer, for "from $X" */
  fromQuote: ShareQuote
  sizes: ShareSize[]
}

/** Joins each pool to its animal, with the price of the smallest share and the sizes still open. */
export function poolRows(pools: SharePool[], animals: Animal[], now: number, held?: Map<string, number>): PoolRow[] {
  const byTag = new Map(animals.map((a) => [a.tagId, a]))
  return pools.flatMap((pool) => {
    const animal = byTag.get(pool.tagId)
    if (!animal) return []
    const sizes = openSizes(pool, now, beefConfig, held?.get(pool.id) ?? 0)
    const fromSize: ShareSize = sizes.at(-1) ?? (pool.unit === 'eighth' ? 'eighth' : 'quarter')
    return [{ pool, animal, sizes, fromQuote: quotePool(pool, animal, fromSize) }]
  })
}

/** Price of a share of this pool's animal at the pool's locked price. */
export const quotePool = (pool: SharePool, animal: Animal, size: ShareSize) =>
  quoteShare({ liveLb: animal.estWeight, size, feedProgram: pool.feedProgram, breed: animal.breed, basePricePerHangingLb: pool.pricePerHangingLb })

export const isOpenPool = (pool: SharePool, now: number) => isClaimable(pool, now)

export const sizeLabel = (size: ShareSize) => SHARE_LABELS[size]

export const programName = (id: FeedProgramId) => feedProgram(id).name

/** The current time, updated every `intervalMs` (for countdowns and aging days). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}
