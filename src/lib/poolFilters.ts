import { useSearchParams } from 'react-router'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId, ShareSize } from '@/data/beefTypes'
import type { PoolRow } from './beef'
import { segmentsLeft } from './yield'

/**
 * Filters for the Claim Your Beef page, kept in the URL:
 *
 *   /beef?program=grass-finished&breed=Angus&finish=2026-11&share=half&sort=price
 */

export const POOL_SORTS = [
  { value: 'deadline', label: 'Closing soonest' },
  { value: 'filling', label: 'Closest to full' },
  { value: 'price', label: 'Price per lb: low to high' },
] as const

export type PoolSort = (typeof POOL_SORTS)[number]['value']

export interface PoolFilters {
  programs: FeedProgramId[]
  breeds: string[]
  /** Finish month, yyyy-mm, or '' for any */
  finish: string
  /** Only animals with this share size still open */
  share: ShareSize | ''
  sort: PoolSort
}

const PROGRAMS = beefConfig.feedPrograms.map((p) => p.id)
const SIZES: ShareSize[] = ['whole', 'half', 'quarter', 'eighth']

export function parsePoolFilters(params: URLSearchParams): PoolFilters {
  const share = params.get('share') as ShareSize
  const sort = params.get('sort')
  return {
    programs: params.getAll('program').filter((p): p is FeedProgramId => PROGRAMS.includes(p as FeedProgramId)),
    breeds: params.getAll('breed'),
    finish: /^\d{4}-\d{2}$/.test(params.get('finish') ?? '') ? params.get('finish')! : '',
    share: SIZES.includes(share) ? share : '',
    sort: POOL_SORTS.find((s) => s.value === sort)?.value ?? 'deadline',
  }
}

export function poolFiltersToParams(f: PoolFilters) {
  const p = new URLSearchParams()
  for (const x of f.programs) p.append('program', x)
  for (const b of f.breeds) p.append('breed', b)
  if (f.finish) p.set('finish', f.finish)
  if (f.share) p.set('share', f.share)
  if (f.sort !== 'deadline') p.set('sort', f.sort)
  return p
}

export const countPoolFilters = (f: PoolFilters) => f.programs.length + f.breeds.length + (f.finish ? 1 : 0) + (f.share ? 1 : 0)

export function applyPoolFilters(rows: PoolRow[], f: PoolFilters, held?: Map<string, number>) {
  return rows
    .filter((r) => !f.programs.length || f.programs.includes(r.pool.feedProgram))
    .filter((r) => !f.breeds.length || f.breeds.includes(r.animal.breed))
    .filter((r) => !f.finish || r.animal.finishDate?.startsWith(f.finish))
    .filter((r) => !f.share || r.sizes.includes(f.share))
    .sort((a, b) => {
      if (f.sort === 'price') return a.fromQuote.perTakeHomeLb - b.fromQuote.perTakeHomeLb
      if (f.sort === 'filling') return segmentsLeft(a.pool, held?.get(a.pool.id)) - segmentsLeft(b.pool, held?.get(b.pool.id))
      return a.pool.deadline.localeCompare(b.pool.deadline)
    })
}

/** "November 2026" */
export const monthLabel = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export function usePoolFilters() {
  const [params, setParams] = useSearchParams()
  const filters = parsePoolFilters(params)
  const update = (patch: Partial<PoolFilters>) =>
    setParams(poolFiltersToParams({ ...filters, ...patch }), { replace: true, preventScrollReset: true })
  const clear = () =>
    setParams(poolFiltersToParams({ programs: [], breeds: [], finish: '', share: '', sort: filters.sort }), {
      replace: true,
      preventScrollReset: true,
    })
  return { filters, update, clear }
}
