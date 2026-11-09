import { useState } from 'react'
import { LayoutGrid, List, Phone, SlidersHorizontal } from 'lucide-react'
import { ActiveFilters } from '@/components/browse/ActiveFilters'
import { FilterPanel } from '@/components/browse/FilterPanel'
import { SearchBox } from '@/components/browse/SearchBox'
import { CattleImage } from '@/components/cattle/CattleImage'
import { LotCard } from '@/components/lots/LotCard'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { applyFilters, countActiveFilters, getFilterBounds, SORT_OPTIONS, type SortKey } from '@/lib/lotFilters'
import { usePageTitle } from '@/lib/usePageTitle'
import { useLotFilters } from '@/lib/useLotFilters'
import { useLotRows } from '@/lib/useLotRows'
import { cn } from '@/lib/utils'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="grid items-center gap-6 rounded-xl border border-dashed bg-card p-6 sm:grid-cols-[14rem_1fr] sm:p-8">
      <div className="aspect-4/3 overflow-hidden rounded-lg">
        <CattleImage coat="red" sex="heifer" pose="grazing" seed="empty" alt="" />
      </div>
      <div>
        <h3 className="text-2xl font-bold">No lots match these filters</h3>
        <p className="mt-2 text-muted-foreground">
          Try removing a filter or two. {ranch.owner} often has cattle that aren't listed yet, so it's worth a call.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onClear}>Clear all filters</Button>
          <Button asChild variant="outline">
            <a href={ranchPhoneHref}>
              <Phone aria-hidden />
              Call {ranch.phone}
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  usePageTitle('Browse cattle')
  const rows = useLotRows()
  const { filters, update, clear } = useLotFilters()
  const [sheetOpen, setSheetOpen] = useState(false)

  const bounds = getFilterBounds(rows)
  const results = applyFilters(rows, filters)
  const activeCount = countActiveFilters(filters)
  const listed = rows.filter((r) => r.lot.status !== 'sold')
  const listedHead = listed.reduce((sum, r) => sum + r.stats.headCount, 0)
  const resultHead = results.reduce((sum, r) => sum + r.stats.headCount, 0)

  const panel = <FilterPanel filters={filters} bounds={bounds} rows={rows} onChange={update} />

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Browse cattle"
        description={`${plural(listed.length, 'lot')} and ${listedHead} head for sale right now. Every animal carries our ear tag and a full record.`}
      />

      <SearchBox value={filters.q} onChange={(q) => update({ q })} />

      <div className="mt-8 lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto pr-3 pb-6 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
            {panel}
          </div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal aria-hidden />
                  Filters
                  {activeCount > 0 && (
                    <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-sm text-primary-foreground">
                      {activeCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[88svh] gap-0 rounded-t-2xl p-0">
                <SheetHeader className="border-b px-5 py-4 pr-14">
                  <SheetTitle className="font-heading text-2xl">Filters</SheetTitle>
                  <SheetDescription>Results update as you choose.</SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto px-5 py-5">{panel}</div>
                <div className="flex gap-2 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button variant="outline" size="lg" onClick={clear} disabled={!activeCount && !filters.q}>
                    Clear all
                  </Button>
                  <Button size="lg" className="flex-1" onClick={() => setSheetOpen(false)}>
                    Show {plural(results.length, 'lot')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <h2 id="results-heading" className="mr-auto text-xl font-bold sm:text-2xl" aria-live="polite">
              {plural(results.length, 'lot')}
              <span className="ml-2 font-sans text-base font-normal text-muted-foreground">{resultHead} head</span>
            </h2>

            <Select value={filters.sort} onValueChange={(v) => update({ sort: v as SortKey })}>
              <SelectTrigger aria-label="Sort lots" className="min-w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              variant="outline"
              value={filters.view}
              onValueChange={(v) => v && update({ view: v as 'grid' | 'list' })}
              aria-label="Layout"
              className="hidden sm:flex"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view" className="size-11">
                <LayoutGrid className="size-5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="size-11">
                <List className="size-5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="mt-4 empty:hidden">
            <ActiveFilters filters={filters} onChange={update} onClear={clear} />
          </div>

          <div className="mt-6">
            {results.length === 0 ? (
              <EmptyResults onClear={clear} />
            ) : (
              <ul className={cn('grid gap-6', filters.view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,414px))]' : 'grid-cols-1')}>
                {results.map(({ lot, stats, matchedTag }) => (
                  <li key={lot.id} className="grid">
                    <LotCard lot={lot} stats={stats} matchedTag={matchedTag} layout={filters.view} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
