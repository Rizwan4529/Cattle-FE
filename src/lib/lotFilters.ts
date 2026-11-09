import type { LotClass, LotStatus } from '@/data/types'
import { LOT_CLASS_LABELS, LOT_STATUS_LABELS } from './labels'
import type { LotRow } from './lots'

/**
 * Browse-page filters. The URL query string is the single source of truth:
 * these helpers convert between URLSearchParams and a typed filter object,
 * and apply the filters to the list of lots.
 *
 *   /cattle?q=2417&class=steers&class=heifers&breed=Angus&status=available
 *          &weight=500-800&price=1500-3000&head=4&sort=price-asc&view=list
 */

export type Range = [number, number]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest listed' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'weight-asc', label: 'Weight: light to heavy' },
  { value: 'weight-desc', label: 'Weight: heavy to light' },
] as const

export type SortKey = (typeof SORT_OPTIONS)[number]['value']

/** "Head in lot" choices: any, or at least N head */
export const HEAD_OPTIONS = [0, 2, 4, 6] as const

export interface LotFilters {
  q: string
  classes: LotClass[]
  breeds: string[]
  statuses: LotStatus[]
  /** Average weight range, lb. null = no limit */
  weight: Range | null
  /** Price per head range, $. null = no limit */
  price: Range | null
  minHead: number
  sort: SortKey
  view: 'grid' | 'list'
}

const CLASSES = Object.keys(LOT_CLASS_LABELS) as LotClass[]
const STATUSES = Object.keys(LOT_STATUS_LABELS) as LotStatus[]

function parseRange(value: string | null): Range | null {
  const m = value?.match(/^(\d+)-(\d+)$/)
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  return a <= b ? [a, b] : [b, a]
}

export function parseFilters(params: URLSearchParams): LotFilters {
  const sort = params.get('sort')
  const head = Number(params.get('head'))
  return {
    q: params.get('q') ?? '',
    classes: params.getAll('class').filter((c): c is LotClass => CLASSES.includes(c as LotClass)),
    breeds: params.getAll('breed'),
    statuses: params.getAll('status').filter((s): s is LotStatus => STATUSES.includes(s as LotStatus)),
    weight: parseRange(params.get('weight')),
    price: parseRange(params.get('price')),
    minHead: (HEAD_OPTIONS as readonly number[]).includes(head) ? head : 0,
    sort: SORT_OPTIONS.find((o) => o.value === sort)?.value ?? 'newest',
    view: params.get('view') === 'list' ? 'list' : 'grid',
  }
}

/** Only non-default values are written, so a clean URL means "no filters". */
export function toSearchParams(f: LotFilters): URLSearchParams {
  const p = new URLSearchParams()
  const q = f.q.trim()
  if (q) p.set('q', q)
  for (const c of f.classes) p.append('class', c)
  for (const b of f.breeds) p.append('breed', b)
  for (const s of f.statuses) p.append('status', s)
  if (f.weight) p.set('weight', f.weight.join('-'))
  if (f.price) p.set('price', f.price.join('-'))
  if (f.minHead) p.set('head', String(f.minHead))
  if (f.sort !== 'newest') p.set('sort', f.sort)
  if (f.view !== 'grid') p.set('view', f.view)
  return p
}

export interface FilterBounds {
  weight: Range
  price: Range
  breeds: string[]
}

const floorTo = (n: number, step: number) => Math.floor(n / step) * step
const ceilTo = (n: number, step: number) => Math.ceil(n / step) * step

export const WEIGHT_STEP = 25
export const PRICE_STEP = 50

/** Slider limits and breed options, taken from the lots themselves. */
export function getFilterBounds(rows: LotRow[]): FilterBounds {
  const weights = rows.map((r) => r.stats.avgWeight)
  const prices = rows.map((r) => r.lot.pricePerHead)
  return {
    weight: rows.length ? [floorTo(Math.min(...weights), 50), ceilTo(Math.max(...weights), 50)] : [0, 2000],
    price: rows.length ? [floorTo(Math.min(...prices), 100), ceilTo(Math.max(...prices), 100)] : [0, 10000],
    breeds: [...new Set(rows.map((r) => r.lot.breedSummary))].sort(),
  }
}

/** A range that covers the full bounds is the same as no filter. */
export function normalizeRange(range: Range, bounds: Range): Range | null {
  return range[0] <= bounds[0] && range[1] >= bounds[1] ? null : range
}

export function countActiveFilters(f: LotFilters) {
  return f.classes.length + f.breeds.length + f.statuses.length + (f.weight ? 1 : 0) + (f.price ? 1 : 0) + (f.minHead ? 1 : 0)
}

export interface LotResult extends LotRow {
  /** Set when the search matched one of the lot's ear tags */
  matchedTag?: string
}

const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Search by ear tag ("2417", "HCR-2417") or by keywords. Every keyword must
 * appear somewhere in the lot's title, breed, class, description, highlights,
 * location, or lot number.
 */
function searchLot(row: LotRow, query: string): { match: boolean; matchedTag?: string } {
  const q = query.trim()
  if (!q) return { match: true }

  const needle = compact(q)
  if (needle.length >= 3) {
    const tag = row.lot.tagIds.find((t) => compact(t).includes(needle))
    if (tag) return { match: true, matchedTag: tag }
  }

  const { lot } = row
  const haystack = [
    lot.title,
    lot.breedSummary,
    LOT_CLASS_LABELS[lot.class],
    lot.description,
    lot.highlights.join(' '),
    lot.location.pasture,
    `lot ${lot.number}`,
  ]
    .join(' ')
    .toLowerCase()
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  return { match: words.every((w) => haystack.includes(w)) }
}

const SORTERS: Record<SortKey, (a: LotRow, b: LotRow) => number> = {
  newest: (a, b) => b.lot.listedAt.localeCompare(a.lot.listedAt) || b.lot.number - a.lot.number,
  'price-asc': (a, b) => a.lot.pricePerHead - b.lot.pricePerHead,
  'price-desc': (a, b) => b.lot.pricePerHead - a.lot.pricePerHead,
  'weight-asc': (a, b) => a.stats.avgWeight - b.stats.avgWeight,
  'weight-desc': (a, b) => b.stats.avgWeight - a.stats.avgWeight,
}

/** Filters and sorts lots. Sold lots always come last. */
export function applyFilters(rows: LotRow[], f: LotFilters): LotResult[] {
  const inRange = (value: number, range: Range | null) => !range || (value >= range[0] && value <= range[1])

  const results: LotResult[] = []
  for (const row of rows) {
    const { lot, stats } = row
    if (f.classes.length && !f.classes.includes(lot.class)) continue
    if (f.breeds.length && !f.breeds.includes(lot.breedSummary)) continue
    if (f.statuses.length && !f.statuses.includes(lot.status)) continue
    if (!inRange(stats.avgWeight, f.weight)) continue
    if (!inRange(lot.pricePerHead, f.price)) continue
    if (stats.headCount < f.minHead) continue
    const search = searchLot(row, f.q)
    if (!search.match) continue
    results.push({ ...row, matchedTag: search.matchedTag })
  }

  const soldLast = (a: LotRow, b: LotRow) => Number(a.lot.status === 'sold') - Number(b.lot.status === 'sold')
  return results.sort((a, b) => soldLast(a, b) || SORTERS[f.sort](a, b) || a.lot.number - b.lot.number)
}
