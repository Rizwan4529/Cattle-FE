import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { BeefFilterPanel } from '@/components/beef/BeefFilterPanel'
import { FeedProgramCards } from '@/components/beef/FeedProgramCards'
import { NotifyMe } from '@/components/beef/NotifyMe'
import { PoolCard } from '@/components/beef/PoolCard'
import { PoundsHelper } from '@/components/beef/PoundsHelper'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId } from '@/data/beefTypes'
import { poolPhase, poolRows, useNow } from '@/lib/beef'
import { applyPoolFilters, countPoolFilters, monthLabel, POOL_SORTS, type PoolSort, usePoolFilters } from '@/lib/poolFilters'
import { useClaimActivity } from '@/lib/useClaimActivity'
import { usePageTitle } from '@/lib/usePageTitle'
import { SHARE_LABELS } from '@/lib/yield'
import { heldSegments, useRanchStore } from '@/store/useRanchStore'

const STEPS = [
  { title: 'Pick your animal', body: 'Choose by feed program and breed. Every one has an ear tag and a full record you can read.' },
  { title: 'Claim a share', body: 'A whole, half, or quarter. Pay a deposit today and your name goes on its fill meter.' },
  { title: 'We harvest when it’s full', body: 'Nothing happens until every share is claimed. Then the ranch books the processor.' },
  {
    title: 'Dry-aged, cut your way, delivered',
    body: `Aged ${beefConfig.dryAgeDays.min}–${beefConfig.dryAgeDays.max} days, cut to your cut sheet, and frozen. Pick it up or have it delivered.`,
  },
]

export default function BeefBrowsePage() {
  usePageTitle('Claim your beef')
  useClaimActivity()
  const now = useNow(15_000)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const cart = useRanchStore((s) => s.cart)
  const { filters, update, clear } = usePoolFilters()
  const [sheetOpen, setSheetOpen] = useState(false)

  const held = heldSegments(cart, pools)
  const rows = poolRows(pools, animals, now, held)
  const open = rows.filter((r) => poolPhase(r.pool, now) === 'open')
  const onTheWay = rows.filter((r) => poolPhase(r.pool, now) !== 'open')
  const results = applyPoolFilters(open, filters, held)
  const active = countPoolFilters(filters)

  const toggleProgram = (id: FeedProgramId) =>
    update({ programs: filters.programs.includes(id) ? filters.programs.filter((p) => p !== id) : [...filters.programs, id] })

  const panel = <BeefFilterPanel filters={filters} rows={open} onChange={update} />

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Claim your beef"
        description="Pick the animal your beef comes from. Every one carries our ear tag and a full record, and we harvest only when all its shares are claimed."
      />

      <section aria-labelledby="programs-heading" className="grid gap-4">
        <div>
          <h2 id="programs-heading" className="text-2xl font-bold sm:text-3xl">
            Choose how it was raised
          </h2>
          <p className="mt-1 text-muted-foreground">Tap a feed program to see only those animals.</p>
        </div>
        <FeedProgramCards selected={filters.programs} onToggle={toggleProgram} />
      </section>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <section aria-labelledby="steps-heading" className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id="steps-heading" className="text-2xl font-bold">
            How claiming works
          </h2>
          <ol className="grid gap-5 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <EarTag tagId={String(i + 1)} srLabel="Step" className="w-10" />
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <PoundsHelper
          liveLb={beefConfig.typicalLiveWeight}
          chooseLabel={(size) => `Show animals with ${size === 'whole' ? 'a whole animal' : `a ${size}`} open`}
          onChoose={(share) => {
            update({ share })
            document.getElementById('animals-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      </div>

      <div className="mt-12 lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto pr-3 pb-6 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
            {panel}
          </div>
        </aside>

        <section aria-labelledby="animals-heading" className="min-w-0 scroll-mt-28">
          <div className="flex flex-wrap items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal aria-hidden />
                  Filters
                  {active > 0 && (
                    <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-sm text-primary-foreground">{active}</span>
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
                  <Button variant="outline" size="lg" onClick={clear} disabled={!active}>
                    Clear all
                  </Button>
                  <Button size="lg" className="flex-1" onClick={() => setSheetOpen(false)}>
                    Show {results.length} {results.length === 1 ? 'animal' : 'animals'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <h2 id="animals-heading" className="mr-auto text-xl font-bold sm:text-2xl" aria-live="polite">
              {results.length} {results.length === 1 ? 'animal' : 'animals'} open for claims
            </h2>

            <Select value={filters.sort} onValueChange={(v) => update({ sort: v as PoolSort })}>
              <SelectTrigger aria-label="Sort animals" className="min-w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {POOL_SORTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {active > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {filters.programs.map((p) => (
                <FilterChip key={p} label={beefConfig.feedPrograms.find((f) => f.id === p)!.short} onRemove={() => toggleProgram(p)} />
              ))}
              {filters.breeds.map((b) => (
                <FilterChip key={b} label={b} onRemove={() => update({ breeds: filters.breeds.filter((x) => x !== b) })} />
              ))}
              {filters.finish && <FilterChip label={`Finishing ${monthLabel(filters.finish)}`} onRemove={() => update({ finish: '' })} />}
              {filters.share && <FilterChip label={`${SHARE_LABELS[filters.share]} open`} onRemove={() => update({ share: '' })} />}
              <Button variant="link" onClick={clear} className="px-1">
                Clear all
              </Button>
            </div>
          )}

          <div className="mt-6">
            {results.length === 0 ? (
              <div className="grid items-center gap-6 rounded-xl border border-dashed bg-card p-6 sm:grid-cols-[12rem_1fr] sm:p-8">
                <div className="aspect-4/3 overflow-hidden rounded-lg">
                  <CattleImage coat="hereford" sex="steer" pose="grazing" seed="beef-empty" alt="" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">No open animals match</h3>
                  <p className="mt-2 text-muted-foreground">
                    {open.length
                      ? 'Try removing a filter, or ask us to tell you when a new animal opens.'
                      : 'Every animal is claimed right now. New ones open every few weeks.'}
                  </p>
                  {active > 0 && (
                    <Button onClick={clear} className="mt-5">
                      Clear all filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,414px))] 2xl:grid-cols-[repeat(3,minmax(0,414px))]">
                {results.map((row) => (
                  <li key={row.pool.id} className="grid">
                    <PoolCard row={row} now={now} held={held.get(row.pool.id) ?? 0} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {onTheWay.length > 0 && (
        <section aria-labelledby="on-the-way-heading" className="mt-16 grid gap-5">
          <div>
            <h2 id="on-the-way-heading" className="text-3xl font-bold">
              Already claimed, on the way
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">These animals filled up. Follow each one from harvest to the freezer.</p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {onTheWay.map((row) => (
              <li key={row.pool.id} className="grid">
                <PoolCard row={row} now={now} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <NotifyMe className="mt-16" defaultProgram={filters.programs[0] ?? 'grass-finished'} />
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Button variant="secondary" size="sm" onClick={onRemove} aria-label={`Remove filter: ${label}`} className="rounded-full">
      {label}
      <span aria-hidden>×</span>
    </Button>
  )
}
