import { beefConfig } from '@/config/beef'
import { quoteShare, segmentsFor } from '@/lib/yield'
import type { PoolStatus, ShareClaim, SharePool, ShareSize, UnfilledChoice } from './beefTypes'
import type { Animal } from './types'

/**
 * Share pools for the animals raised for beef, at every stage of the journey.
 *
 * Dates are relative to `now` (when the demo data is first created), so
 * deadlines always count down from a sensible distance, however long after
 * the build the demo is opened.
 */

const DAY = 86_400_000
const HOUR = 3_600_000

/** Neighbors who claim shares, for seeded claims and the live activity toasts. */
export const CLAIMANTS: { firstName: string; city: string; state: string }[] = [
  { firstName: 'Sarah', city: 'Denver', state: 'CO' },
  { firstName: 'Mike', city: 'Cheyenne', state: 'WY' },
  { firstName: 'Jen', city: 'Colorado Springs', state: 'CO' },
  { firstName: 'Tom', city: 'Laramie', state: 'WY' },
  { firstName: 'Dale', city: 'Castle Rock', state: 'CO' },
  { firstName: 'Rosa', city: 'Pueblo', state: 'CO' },
  { firstName: 'Brian', city: 'Parker', state: 'CO' },
  { firstName: 'Amy', city: 'Fort Collins', state: 'CO' },
  { firstName: 'Carlos', city: 'Kiowa', state: 'CO' },
  { firstName: 'Karen', city: 'Elizabeth', state: 'CO' },
  { firstName: 'Greg', city: 'Monument', state: 'CO' },
  { firstName: 'Mary', city: 'Franktown', state: 'CO' },
  { firstName: 'Luke', city: 'Goodland', state: 'KS' },
  { firstName: 'Priya', city: 'Boulder', state: 'CO' },
  { firstName: 'Dan', city: 'Santa Fe', state: 'NM' },
  { firstName: 'Hannah', city: 'Scottsbluff', state: 'NE' },
  { firstName: 'Josh', city: 'Limon', state: 'CO' },
  { firstName: 'Ellen', city: 'Aurora', state: 'CO' },
  { firstName: 'Ray', city: 'Greeley', state: 'CO' },
  { firstName: 'Tasha', city: 'Lakewood', state: 'CO' },
  { firstName: 'Kyle', city: 'Sterling', state: 'CO' },
  { firstName: 'Beth', city: 'Loveland', state: 'CO' },
]

const person = (name: string) => CLAIMANTS.find((c) => c.firstName === name)!

interface PoolSeed {
  tagId: string
  status: PoolStatus
  /** [size, claimant first name, days ago claimed, if not filled] */
  claims: [ShareSize, string, number, UnfilledChoice?][]
  /** Days from now; negative = in the past */
  deadlineDays: number
  createdDaysAgo: number
  /** Days ago each later status was reached */
  history?: Partial<Record<PoolStatus, number>>
  /** Days from now (negative = past) */
  harvestInDays?: number
  agingDays?: number
  /** Actual dressing % once harvested */
  dressing?: number
  pricePerHangingLb?: number
}

const SEEDS: PoolSeed[] = [
  { tagId: 'CRW-2701', status: 'open', claims: [], deadlineDays: 27.2, createdDaysAgo: 2 },
  { tagId: 'CRW-2703', status: 'open', claims: [['quarter', 'Sarah', 5]], deadlineDays: 19.4, createdDaysAgo: 9 },
  { tagId: 'CRW-2706', status: 'open', claims: [['half', 'Dale', 8, 'roll-over']], deadlineDays: 12.6, createdDaysAgo: 14 },
  {
    tagId: 'CRW-2708',
    status: 'open',
    claims: [
      ['quarter', 'Mike', 12],
      ['quarter', 'Jen', 9, 'roll-over'],
      ['quarter', 'Tom', 2],
    ],
    deadlineDays: 3.26,
    createdDaysAgo: 22,
  },
  { tagId: 'CRW-2709', status: 'open', claims: [['quarter', 'Rosa', 20, 'roll-over']], deadlineDays: 1.8, createdDaysAgo: 28 },
  {
    tagId: 'CRW-2711',
    status: 'harvest-scheduled',
    claims: [
      ['half', 'Brian', 26],
      ['quarter', 'Amy', 15],
      ['quarter', 'Carlos', 6],
    ],
    deadlineDays: -6,
    createdDaysAgo: 30,
    history: { full: 6, 'harvest-scheduled': 5 },
    harvestInDays: 8,
    agingDays: 21,
  },
  {
    tagId: 'CRW-2712',
    status: 'dry-aging',
    claims: [['whole', 'Karen', 21]],
    deadlineDays: -21,
    createdDaysAgo: 44,
    history: { full: 21, 'harvest-scheduled': 20, 'dry-aging': 8 },
    harvestInDays: -9,
    agingDays: 21,
    dressing: 0.618,
  },
  {
    tagId: 'CRW-2714',
    status: 'cut-wrap',
    claims: [
      ['half', 'Greg', 40],
      ['half', 'Mary', 33],
    ],
    deadlineDays: -33,
    createdDaysAgo: 52,
    history: { full: 33, 'harvest-scheduled': 32, 'dry-aging': 22, 'cut-wrap': 3 },
    harvestInDays: -23,
    agingDays: 18,
    dressing: 0.626,
  },
  {
    tagId: 'CRW-2715',
    status: 'ready',
    claims: [
      ['quarter', 'Luke', 50],
      ['quarter', 'Priya', 47],
      ['quarter', 'Josh', 44],
      ['quarter', 'Ellen', 41],
    ],
    deadlineDays: -41,
    createdDaysAgo: 58,
    history: { full: 41, 'harvest-scheduled': 40, 'dry-aging': 31, 'cut-wrap': 9, ready: 2 },
    harvestInDays: -32,
    agingDays: 21,
    dressing: 0.612,
    pricePerHangingLb: 6.95,
  },
]

const iso = (ms: number) => new Date(ms).toISOString()
const isoDate = (ms: number) => iso(ms).slice(0, 10)

export function buildSeedPools(animals: Animal[], now = Date.now()): SharePool[] {
  const byTag = new Map(animals.map((a) => [a.tagId, a]))
  return SEEDS.map((seed) => {
    const animal = byTag.get(seed.tagId)!
    const unit = beefConfig.defaultPoolUnit
    const base = seed.pricePerHangingLb ?? beefConfig.pricePerHangingLb
    const claims: ShareClaim[] = seed.claims.map(([size, name, daysAgo, ifUnfilled = 'refund'], i) => {
      const quote = quoteShare({ liveLb: animal.estWeight, size, feedProgram: animal.feedProgram!, breed: animal.breed, basePricePerHangingLb: base })
      return {
        id: `claim-${seed.tagId.toLowerCase()}-${i + 1}`,
        size,
        segments: segmentsFor(size, unit),
        ...person(name),
        // Spread claims through the day so the times look real
        claimedAt: iso(now - daysAgo * DAY - (i * 5 + 3) * HOUR),
        ifUnfilled,
        deposit: quote.deposit,
      }
    })
    const created = now - seed.createdDaysAgo * DAY
    const history = [
      { status: 'open' as const, at: iso(created) },
      ...Object.entries(seed.history ?? {}).map(([status, daysAgo]) => ({ status: status as PoolStatus, at: iso(now - daysAgo * DAY) })),
    ]
    return {
      id: `pool-${seed.tagId.toLowerCase()}`,
      tagId: seed.tagId,
      feedProgram: animal.feedProgram!,
      pricePerHangingLb: base,
      unit,
      claims,
      deadline: iso(now + seed.deadlineDays * DAY),
      status: seed.status,
      history,
      harvestDate: seed.harvestInDays === undefined ? undefined : isoDate(now + seed.harvestInDays * DAY),
      agingDays: seed.agingDays,
      hangingWeight: seed.dressing ? Math.round(animal.estWeight * seed.dressing) : undefined,
      createdAt: iso(created),
    }
  })
}
