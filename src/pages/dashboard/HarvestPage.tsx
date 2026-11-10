import { useId, useState } from 'react'
import { CalendarCheck, Download, FastForward, Printer, StepForward } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ProcessorSheet } from '@/components/dashboard/ProcessorSheet'
import { EarTag } from '@/components/cattle/EarTag'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { beefConfig } from '@/config/beef'
import type { SharePool } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { beefTitle, claimLabel, useNow } from '@/lib/beef'
import { downloadText } from '@/lib/chuteScan'
import { formatDate, formatNumber } from '@/lib/format'
import { nextStatus } from '@/lib/poolAdmin'
import { processorCsv, processorFileName } from '@/lib/processorExport'
import { usePageTitle } from '@/lib/usePageTitle'
import { agingDay, POOL_STATUS_LABELS, SHARE_LABELS } from '@/lib/yield'
import { useRanchStore } from '@/store/useRanchStore'

const IN_PROCESS = ['harvest-scheduled', 'dry-aging', 'cut-wrap', 'ready'] as const
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

function BookHarvest({ pool, animal }: { pool: SharePool; animal: Animal }) {
  const id = useId()
  const schedule = useRanchStore((s) => s.scheduleHarvest)
  const [today] = useState(() => isoDay(Date.now()))
  const [date, setDate] = useState(() => isoDay(Date.now() + 7 * 86_400_000))
  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <EarTag tagId={pool.tagId} />
          <h3 className="text-xl font-bold">{beefTitle(animal)}</h3>
        </div>
        <p className="text-muted-foreground">
          Fully claimed by {pool.claims.map((c) => `${claimLabel(c)} (${SHARE_LABELS[c.size].toLowerCase()})`).join(', ')}.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!date || date < today) return toast.error('Pick today or a later date.')
          schedule(pool.id, date)
          toast.success(`Harvest booked for ${pool.tagId}`, {
            description: `${formatDate(date)} at ${beefConfig.processor.name}. Claimants get an email.`,
          })
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-date`}>Processor date</Label>
          <Input id={`${id}-date`} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button type="submit">
          <CalendarCheck aria-hidden />
          Book harvest
        </Button>
      </form>
    </li>
  )
}

/** Harvest Scheduler: book full pools with the processor, move animals along, and export cut sheets for the processor. */
export default function HarvestPage() {
  usePageTitle('Harvest schedule')
  const now = useNow(60_000)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const cutSheets = useRanchStore((s) => s.cutSheets)
  const advance = useRanchStore((s) => s.advancePool)
  const simulateWeek = useRanchStore((s) => s.simulateWeek)
  const [printing, setPrinting] = useState<{ pool: SharePool; animal: Animal }[]>([])

  const withAnimal = (p: SharePool) => {
    const animal = animals.find((a) => a.tagId === p.tagId)
    return animal ? [{ pool: p, animal }] : []
  }
  const full = pools.filter((p) => p.status === 'full').flatMap(withAnimal)
  const inProcess = pools
    .filter((p) => (IN_PROCESS as readonly string[]).includes(p.status))
    .sort((a, b) => IN_PROCESS.indexOf(a.status as never) - IN_PROCESS.indexOf(b.status as never))
    .flatMap(withAnimal)
  const shipped = pools.filter((p) => p.status === 'shipped').flatMap(withAnimal)
  const exportable = inProcess.filter(({ pool }) => pool.status === 'harvest-scheduled' || pool.status === 'dry-aging')

  const print = (entries: { pool: SharePool; animal: Animal }[]) => {
    setPrinting(entries)
    // Let the print sheet render first.
    window.setTimeout(() => window.print(), 50)
  }
  const download = (entries: { pool: SharePool; animal: Animal }[], tag?: string) => {
    downloadText(processorFileName(tag), processorCsv(entries, cutSheets))
    toast.success('Processor file downloaded', { description: processorFileName(tag) })
  }

  return (
    <>
      <div className="grid gap-8 print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Harvest schedule</h1>
            <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
              Animals harvest only once every share is claimed. Book the processor, then move each one along as it ages, gets cut, and is ready for
              pickup.
            </p>
          </div>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              const n = simulateWeek()
              toast.success(n ? `A week passed: ${n} ${n === 1 ? 'animal' : 'animals'} moved ahead` : 'A week passed. Nothing was waiting to move.', {
                description: 'Demo only. Claimants’ pages and timelines update too.',
              })
            }}
          >
            <FastForward aria-hidden />
            Simulate a week passing
          </Button>
        </div>

        <section aria-labelledby="h-full" className="grid gap-4">
          <h2 id="h-full" className="text-2xl font-bold">
            Ready to book ({full.length})
          </h2>
          {full.length ? (
            <ul className="grid gap-3">
              {full.map(({ pool, animal }) => (
                <BookHarvest key={pool.id} pool={pool} animal={animal} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed bg-card p-5 text-muted-foreground">
              No animal is fully claimed and waiting for a date. Watch the{' '}
              <Link to="/dashboard/pools" className="font-medium text-primary underline underline-offset-4">
                share pools
              </Link>
              .
            </p>
          )}
        </section>

        <section aria-labelledby="h-process" className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="h-process" className="text-2xl font-bold">
              In process ({inProcess.length})
            </h2>
            {exportable.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => download(exportable)}>
                  <Download aria-hidden />
                  Processor CSV, all {exportable.length}
                </Button>
                <Button variant="outline" onClick={() => print(exportable)}>
                  <Printer aria-hidden />
                  Print all for the processor
                </Button>
              </div>
            )}
          </div>
          {inProcess.length ? (
            <ul className="grid gap-3">
              {inProcess.map(({ pool, animal }) => {
                const to = nextStatus(pool.status)
                return (
                  <li key={pool.id} className="grid gap-4 rounded-2xl border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <EarTag tagId={pool.tagId} />
                        <h3 className="text-xl font-bold">{beefTitle(animal)}</h3>
                        <Badge className="h-7 px-2.5 text-sm">{POOL_STATUS_LABELS[pool.status]}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {pool.status === 'harvest-scheduled' && `Harvest ${pool.harvestDate ? formatDate(pool.harvestDate) : 'date not set'}. `}
                        {pool.status === 'dry-aging' && `Day ${agingDay(pool, now)} of ${pool.agingDays ?? beefConfig.dryAgeDays.max} dry aging. `}
                        {pool.hangingWeight && `Hanging weight ${formatNumber(pool.hangingWeight)} lb. `}
                        {pool.claims.length} {pool.claims.length === 1 ? 'owner' : 'owners'}:{' '}
                        {pool.claims.map((c) => `${claimLabel(c)} (${SHARE_LABELS[c.size].toLowerCase()})`).join(', ')}.
                      </p>
                      <p className="text-sm">
                        Cut sheets in: {pool.claims.filter((c) => cutSheets.some((s) => s.claimId === c.id)).length} of {pool.claims.length}. Owners
                        without one get Butcher’s Choice.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => download([{ pool, animal }], pool.tagId)}>
                        <Download aria-hidden />
                        CSV
                      </Button>
                      <Button variant="outline" onClick={() => print([{ pool, animal }])}>
                        <Printer aria-hidden />
                        Print
                      </Button>
                      {to && (
                        <Button
                          onClick={() => {
                            advance(pool.id)
                            toast.success(`${pool.tagId}: ${POOL_STATUS_LABELS[to]}`, {
                              description: to === 'dry-aging' ? 'Harvested. Hanging weight recorded; balances are now final.' : undefined,
                            })
                          }}
                        >
                          <StepForward aria-hidden />
                          Mark {POOL_STATUS_LABELS[to].toLowerCase()}
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed bg-card p-5 text-muted-foreground">Nothing at the processor right now.</p>
          )}
        </section>

        {shipped.length > 0 && (
          <section aria-labelledby="h-done" className="grid gap-3">
            <h2 id="h-done" className="text-2xl font-bold">
              Done ({shipped.length})
            </h2>
            <ul className="grid gap-2">
              {shipped.map(({ pool, animal }) => (
                <li key={pool.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
                  <EarTag tagId={pool.tagId} size="sm" />
                  <span className="font-semibold">{beefTitle(animal)}</span>
                  <span className="text-muted-foreground">picked up or shipped to {pool.claims.length} families</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <ProcessorSheet entries={printing} sheets={cutSheets} />
    </>
  )
}
