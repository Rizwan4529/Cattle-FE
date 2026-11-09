import { useSearchParams } from 'react-router'
import { type LotFilters, parseFilters, toSearchParams } from './lotFilters'

/**
 * Reads the browse filters from the URL and writes changes back to it.
 * Filter changes replace the current history entry (so Back leaves the page
 * instead of undoing each checkbox) and keep the scroll position.
 */
export function useLotFilters() {
  const [params, setParams] = useSearchParams()
  const filters = parseFilters(params)

  const update = (patch: Partial<LotFilters>) => {
    setParams(toSearchParams({ ...filters, ...patch }), { replace: true, preventScrollReset: true })
  }

  const clear = () => {
    setParams(toSearchParams({ ...parseFilters(new URLSearchParams()), sort: filters.sort, view: filters.view }), {
      replace: true,
      preventScrollReset: true,
    })
  }

  return { filters, update, clear }
}
