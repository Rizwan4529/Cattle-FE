import { type FormEvent, useId, useState } from 'react'
import { CalendarPlus, ChevronDown, Lock, Plus, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Countdown } from '@/components/beef/Countdown'
import { FillMeter } from '@/components/beef/FillMeter'
import { EarTag } from '@/components/cattle/EarTag'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId, PoolUnit, SharePool } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { beefTitle, poolPhase, useNow } from '@/lib/beef'
import { indexLots } from '@/lib/dashboard'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { poolCandidates } from '@/lib/poolAdmin'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { POOL_STATUS_LABELS, poolSegments, quoteShare, SHARE_LABELS, segmentsClaimed } from '@/lib/yield'
import { useRanchStore } from '@/store/useRanchStore'

function NewPoolDialog() {
  const id = useId()
  const animals = useRanchStore((s) => s.animals)
  const pools = useRanchStore((s) => s.pools)
  const lots = useRanchStore((s) => s.lots)
  const createPool = useRanchStore((s) => s.createPool)
  const [open, setOpen] = useState(false)
  const candidates = poolCandidates(animals, pools, new Set(indexLots(lots).keys())).sort((a, b) => b.estWeight - a.estWeight)
  const [tag, setTag] = useState('')
  const [program, setProgram] = useState<FeedProgramId>('grain-finished')
  const [price, setPrice] = useState(String(beefConfig.pricePerHangingLb))
  const [unit, setUnit] = useState<PoolUnit>(beefConfig.defaultPoolUnit)
  const [days, setDays] = useState('30')
  const [error, setError] = useState('')
  const animal = candidates.find((a) => a.tagId === tag)
  const base = Number(price)
  const quarter =
    animal && base > 0
      ? quoteShare({ liveLb: animal.estWeight, size: 'quarter', feedProgram: program, breed: animal.breed, basePricePerHangingLb: base })
      : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!animal) return setError('Choose an animal.')
    if (!(base >= 1 && base <= 30)) return setError('Enter a price per hanging lb between $1 and $30.')
    createPool({ tagId: animal.tagId, feedProgram: program, pricePerHangingLb: base, unit, days: Number(days) })
    toast.success(`Pool open for ${animal.tagId}`, { description: `${days} days to fill. It’s live on the Claim Your Beef page.` })
    setOpen(false)
    setTag('')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus aria-hidden />
          Open a new pool
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Open a share pool</DialogTitle>
          <DialogDescription className="text-base">
            Families claim shares of this animal. It’s harvested only once every share is claimed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-animal`}>Animal</Label>
            <Select
              value={tag}
              onValueChange={(v) => {
                setTag(v)
                setError('')
                const a = candidates.find((x) => x.tagId === v)
                if (a?.feedProgram) setProgram(a.feedProgram)
              }}
            >
              <SelectTrigger id={`${id}-animal`} className="w-full" aria-invalid={Boolean(error && !animal)}>
                <SelectValue placeholder="Choose from the herd" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((a: Animal) => (
                  <SelectItem key={a.tagId} value={a.tagId}>
                    {a.tagId}: {a.breed} {a.sex}, {formatNumber(a.estWeight)} lb
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {animal && animal.estWeight < 1000 && (
              <p className="flex items-start gap-2 text-sm text-warning-foreground dark:text-warning">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {animal.tagId} is {formatNumber(animal.estWeight)} lb, light for harvest. Most finish at 1,100 lb or more.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-program`}>Feed program</Label>
              <Select value={program} onValueChange={(v) => setProgram(v as FeedProgramId)}>
                <SelectTrigger id={`${id}-program`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {beefConfig.feedPrograms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.short}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-price`}>Price per hanging lb</Label>
              <Input id={`${id}-price`} type="number" step={0.05} min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-days`}>Days to fill</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger id={`${id}-days`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['14', '21', '30', '45'].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium">Smallest share</legend>
              <RadioGroup value={unit} onValueChange={(v) => setUnit(v as PoolUnit)} className="flex gap-4">
                {(['quarter', 'eighth'] as PoolUnit[]).map((u) => (
                  <Label key={u} htmlFor={`${id}-unit-${u}`} className="flex cursor-pointer items-center gap-2 font-normal">
                    <RadioGroupItem id={`${id}-unit-${u}`} value={u} disabled={u === 'eighth' && !beefConfig.shareSizes.eighth} />
                    {SHARE_LABELS[u]}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>
          </div>
          {!beefConfig.shareSizes.eighth && (
            <p className="rounded-lg bg-muted px-4 py-3 text-sm">
              Eighths are off (src/config/beef.ts). <strong className="font-semibold">Before turning them on:</strong> {beefConfig.eighthWarning}
            </p>
          )}
          {quarter && (
            <p className="rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">
              A quarter would be about {formatNumber(quarter.takeHomeLb)} lb of beef for {formatCurrency(quarter.total)} (
              {formatCurrency(quarter.perTakeHomeLb, true)}
              /lb take-home), with a {formatCurrency(quarter.deposit)} deposit.
            </p>
          )}
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="lg">
              Open pool
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PoolRow({ pool, animal, now }: { pool: SharePool; animal: Animal; now: number }) {
  const extendPool = useRanchStore((s) => s.extendPool)
  const closePool = useRanchStore((s) => s.closePool)
  const [showBuyers, setShowBuyers] = useState(false)
  const phase = poolPhase(pool, now)
  const pct = Math.round((segmentsClaimed(pool) / poolSegments(pool)) * 100)

  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start gap-4">
        <EarTag tagId={pool.tagId} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold">
            <Link to={`/beef/${pool.tagId}`} className="underline-offset-4 hover:underline">
              {beefTitle(animal)}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(pool.pricePerHangingLb, true)}/hanging lb base, opened {formatDate(pool.createdAt)}
          </p>
        </div>
        <Badge variant={phase === 'closed' ? 'secondary' : 'default'} className="h-7 px-2.5 text-sm">
          {phase === 'closed' ? 'Closed, didn’t fill' : POOL_STATUS_LABELS[pool.status]}
        </Badge>
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-semibold">{pct}% claimed</p>
          {phase === 'open' && <Countdown deadline={pool.deadline} />}
        </div>
        <FillMeter pool={pool} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowBuyers((v) => !v)} aria-expanded={showBuyers}>
          <ChevronDown className={cn('transition-transform', showBuyers && 'rotate-180')} aria-hidden />
          {pool.claims.length} {pool.claims.length === 1 ? 'buyer' : 'buyers'}
        </Button>
        {(phase === 'open' || phase === 'closed') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              extendPool(pool.id, 7)
              toast.success(`${pool.tagId} extended a week`)
            }}
          >
            <CalendarPlus aria-hidden />
            {phase === 'closed' ? 'Reopen for 7 days' : 'Extend 7 days'}
          </Button>
        )}
        {phase === 'open' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Lock aria-hidden />
                Close pool
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-2xl">Close {pool.tagId}’s pool now?</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  It stops taking claims. The {pool.claims.length} {pool.claims.length === 1 ? 'family' : 'families'} who claimed roll over to the
                  next animal or get their deposit back, as each chose.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel size="lg">Keep it open</AlertDialogCancel>
                <AlertDialogAction
                  size="lg"
                  variant="destructive"
                  onClick={() => {
                    closePool(pool.id)
                    toast(`${pool.tagId}’s pool closed`)
                  }}
                >
                  Close pool
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {pool.status === 'full' && (
          <Button asChild size="sm">
            <Link to="/dashboard/harvest">Book harvest</Link>
          </Button>
        )}
      </div>
      {showBuyers && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[34rem] text-left text-sm tabular-nums">
            <caption className="sr-only">Buyers of {pool.tagId}</caption>
            <thead className="bg-muted">
              <tr className="[&_th]:px-3 [&_th]:py-2">
                <th scope="col">Buyer</th>
                <th scope="col">Share</th>
                <th scope="col">Claimed</th>
                <th scope="col">Deposit</th>
                <th scope="col">If it doesn’t fill</th>
              </tr>
            </thead>
            <tbody>
              {pool.claims.length ? (
                pool.claims.map((c) => (
                  <tr key={c.id} className="border-t [&_td]:px-3 [&_td]:py-2">
                    <td className="font-medium">
                      {c.firstName}, {c.city} {c.state}
                      {c.fromThisDevice && ' (site order)'}
                    </td>
                    <td>{SHARE_LABELS[c.size]}</td>
                    <td>{formatDate(c.claimedAt)}</td>
                    <td>{formatCurrency(c.deposit, true)}</td>
                    <td>{c.ifUnfilled === 'refund' ? 'Refund' : 'Roll over'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-muted-foreground">
                    No claims yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </li>
  )
}

/** Share Pool Manager: open pools from the herd, watch them fill, and extend or close them. */
export default function PoolsPage() {
  usePageTitle('Share pools')
  const now = useNow(30_000)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const rows = pools.flatMap((p) => {
    const a = animals.find((x) => x.tagId === p.tagId)
    return a ? [{ pool: p, animal: a }] : []
  })
  const open = rows.filter((r) => poolPhase(r.pool, now) !== 'in-progress')
  const filled = rows.filter((r) => poolPhase(r.pool, now) === 'in-progress')
  const deposits = pools.flatMap((p) => p.claims).reduce((n, c) => n + c.deposit, 0)

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Share pools</h1>
          <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
            Each pool is one animal sold by the share. {open.filter((r) => poolPhase(r.pool, now) === 'open').length} open now,{' '}
            {formatCurrency(deposits)} in deposits taken.
          </p>
        </div>
        <NewPoolDialog />
      </div>

      <section aria-labelledby="p-open" className="grid gap-4">
        <h2 id="p-open" className="text-2xl font-bold">
          Taking claims ({open.length})
        </h2>
        {open.length ? (
          <ul className="grid gap-4 2xl:grid-cols-2">
            {open.map((r) => (
              <PoolRow key={r.pool.id} {...r} now={now} />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed bg-card p-5 text-muted-foreground">No pools open. Open one for a finished animal.</p>
        )}
      </section>

      <section aria-labelledby="p-full" className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="p-full" className="text-2xl font-bold">
            Fully claimed ({filled.length})
          </h2>
          <Button asChild variant="link" className="px-0 text-base">
            <Link to="/dashboard/harvest">Harvest schedule</Link>
          </Button>
        </div>
        <ul className="grid gap-4 2xl:grid-cols-2">
          {filled.map((r) => (
            <PoolRow key={r.pool.id} {...r} now={now} />
          ))}
        </ul>
      </section>
    </div>
  )
}
