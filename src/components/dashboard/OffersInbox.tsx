import { type FormEvent, useId, useState } from 'react'
import { CircleCheck, CircleX, Clock, Mail, MessageSquare, Phone, Reply } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Lot, Offer, OfferStatus } from '@/data/types'
import { isOpenOffer } from '@/lib/dashboard'
import { formatCurrency, formatCwt, pricePerCwt } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import { getLotStats } from '@/lib/lots'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

type Filter = 'open' | 'accepted' | 'declined' | 'all'

const STATUS: Record<OfferStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: 'Waiting on you', icon: Clock, className: 'bg-warning text-warning-foreground' },
  countered: { label: 'Countered, waiting on buyer', icon: Reply, className: 'border-warning bg-transparent text-foreground' },
  accepted: { label: 'Accepted', icon: CircleCheck, className: 'bg-success text-success-foreground' },
  declined: { label: 'Declined', icon: CircleX, className: 'bg-muted text-muted-foreground' },
}

const received = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** What the owner is being asked to confirm. */
type Pending = { kind: 'accept' | 'decline'; offer: Offer }

function OfferCard({ offer, lot, onAsk }: { offer: Offer; lot?: Lot; onAsk: (p: Pending) => void }) {
  const id = useId()
  const counterOffer = useRanchStore((s) => s.counterOffer)
  const animals = useRanchStore((s) => s.animals)
  const [countering, setCountering] = useState(false)
  const midpoint = lot ? Math.round((offer.pricePerHead + lot.pricePerHead) / 2 / 25) * 25 : offer.pricePerHead
  const [counter, setCounter] = useState(String(midpoint))
  const [counterError, setCounterError] = useState('')

  const stats = lot ? getLotStats(lot, animals) : null
  const unit = lot ? priceUnit(lot.class) : 'head'
  const percent = lot ? Math.round((offer.pricePerHead / lot.pricePerHead) * 100) : null
  const status = STATUS[offer.status]
  const StatusIcon = status.icon
  const digits = offer.phone.replace(/\D/g, '')
  const closedAt = offer.acceptedPricePerHead ?? offer.pricePerHead

  const sendCounter = (e: FormEvent) => {
    e.preventDefault()
    const price = Number(counter)
    if (!Number.isFinite(price) || price <= offer.pricePerHead) {
      setCounterError(`Counter above the buyer's ${formatCurrency(offer.pricePerHead)}/${unit}, or accept their offer as is.`)
      document.getElementById(`${id}-counter`)?.focus()
      return
    }
    counterOffer(offer.id, Math.round(price))
    setCountering(false)
    toast.success('Counter sent', {
      description: `${offer.buyerName}: ${formatCurrency(price)}/${unit}. Call ${offer.phone} to talk it over.`,
    })
  }

  return (
    <li className={cn('grid gap-4 rounded-2xl border bg-card p-5 sm:p-6', offer.status === 'pending' && 'border-warning/60 shadow-sm')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-2xl font-bold">{offer.buyerName}</p>
          <p className="text-muted-foreground">
            {offer.operation ? `${offer.operation.replace(/\.$/, '')}. ` : ''}Received {received(offer.createdAt)}
          </p>
        </div>
        <Badge className={cn('h-7 gap-1.5 px-2.5 text-sm font-semibold', status.className)}>
          <StatusIcon aria-hidden />
          {status.label}
        </Badge>
      </div>

      <p>
        {lot ? (
          <Link to={`/lots/${lot.id}`} className="font-semibold text-primary underline-offset-4 hover:underline">
            Lot {lot.number}: {lot.title}
          </Link>
        ) : (
          <span className="text-muted-foreground">This lot is no longer listed.</span>
        )}
        {lot && (
          <span className="text-muted-foreground">
            . Asking {formatCurrency(lot.pricePerHead)}/{unit}.
          </span>
        )}
      </p>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-muted/60 p-4 sm:grid-cols-4">
        <div>
          <dt className="text-sm text-muted-foreground">Offer</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">
            {formatCurrency(offer.pricePerHead)}
            <span className="font-sans text-base font-normal text-muted-foreground">/{unit}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Of asking</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">{percent ? `${percent}%` : 'n/a'}</dd>
          {stats && lot && (lot.class === 'steers' || lot.class === 'heifers') && stats.avgWeight > 0 && (
            <dd className="text-sm text-muted-foreground tabular-nums">{formatCwt(pricePerCwt(offer.pricePerHead, stats.avgWeight))}</dd>
          )}
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Head</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">
            {offer.headCount}
            {stats && offer.headCount < stats.headCount && (
              <span className="font-sans text-base font-normal text-muted-foreground"> of {stats.headCount}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Total</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(offer.pricePerHead * offer.headCount)}</dd>
        </div>
      </dl>

      {offer.message && (
        <blockquote className="border-l-4 border-primary/40 pl-4 text-lg">
          {offer.message}
          <footer className="mt-1 text-sm text-muted-foreground">From {offer.buyerName.split(' ')[0]}</footer>
        </blockquote>
      )}

      {offer.status === 'countered' && offer.counterPricePerHead && (
        <p className="rounded-lg border border-warning/60 px-4 py-3">
          You countered at{' '}
          <strong className="font-semibold">
            {formatCurrency(offer.counterPricePerHead)}/{unit}
          </strong>{' '}
          ({formatCurrency(offer.counterPricePerHead * offer.headCount)} total). Mark it accepted once the buyer agrees.
        </p>
      )}
      {offer.status === 'accepted' && (
        <p className="rounded-lg bg-success/10 px-4 py-3">
          Sold at{' '}
          <strong className="font-semibold">
            {formatCurrency(closedAt)}/{unit}
          </strong>
          , {formatCurrency(closedAt * offer.headCount)} for {offer.headCount} head. Call {offer.buyerName.split(' ')[0]} to set the pickup date.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={`tel:+1${digits}`}>
            <Phone aria-hidden />
            Call {offer.phone}
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`sms:+1${digits}`}>
            <MessageSquare aria-hidden />
            Text
          </a>
        </Button>
        {offer.email && (
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${offer.email}?subject=${encodeURIComponent(lot ? `Your offer on Lot ${lot.number}` : 'Your offer')}`}>
              <Mail aria-hidden />
              Email
            </a>
          </Button>
        )}
      </div>

      {isOpenOffer(offer) && lot && (
        <div className="grid gap-3 border-t pt-4">
          {countering ? (
            <form onSubmit={sendCounter} noValidate className="grid gap-3 sm:grid-cols-[14rem_auto] sm:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-counter`}>Your counter ($/{unit})</Label>
                <Input
                  id={`${id}-counter`}
                  type="number"
                  inputMode="numeric"
                  step={25}
                  value={counter}
                  onChange={(e) => {
                    setCounter(e.target.value)
                    setCounterError('')
                  }}
                  aria-invalid={Boolean(counterError)}
                  aria-describedby={`${id}-counter-note`}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Send counter</Button>
                <Button type="button" variant="ghost" onClick={() => setCountering(false)}>
                  Cancel
                </Button>
              </div>
              <p
                id={`${id}-counter-note`}
                className={cn('text-sm sm:col-span-2', counterError ? 'font-medium text-destructive' : 'text-muted-foreground')}
              >
                {counterError ||
                  `${formatCurrency((Number(counter) || 0) * offer.headCount)} for ${offer.headCount} head. Halfway between the offer and your asking price is ${formatCurrency(midpoint)}.`}
              </p>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => onAsk({ kind: 'accept', offer })}>
                <CircleCheck aria-hidden />
                {offer.status === 'countered' ? 'Buyer accepted the counter' : 'Accept offer'}
              </Button>
              {offer.status === 'pending' && (
                <Button size="lg" variant="outline" onClick={() => setCountering(true)}>
                  <Reply aria-hidden />
                  Counter
                </Button>
              )}
              <Button size="lg" variant="ghost" onClick={() => onAsk({ kind: 'decline', offer })} className="text-destructive hover:text-destructive">
                <CircleX aria-hidden />
                Decline
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

/** Offers from buyers, newest first. Open ones (waiting on the owner or the buyer) show by default. */
export function OffersInbox() {
  const offers = useRanchStore((s) => s.offers)
  const lots = useRanchStore((s) => s.lots)
  const acceptOffer = useRanchStore((s) => s.acceptOffer)
  const declineOffer = useRanchStore((s) => s.declineOffer)
  const [filter, setFilter] = useState<Filter>('open')
  const [confirm, setConfirm] = useState<Pending | null>(null)

  const lotById = new Map(lots.map((l) => [l.id, l]))
  const counts: Record<Filter, number> = {
    open: offers.filter(isOpenOffer).length,
    accepted: offers.filter((o) => o.status === 'accepted').length,
    declined: offers.filter((o) => o.status === 'declined').length,
    all: offers.length,
  }
  const shown = offers
    .filter((o) => filter === 'all' || (filter === 'open' ? isOpenOffer(o) : o.status === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const target = confirm?.offer
  const targetLot = target ? lotById.get(target.lotId) : undefined
  const targetPrice = target ? (target.status === 'countered' ? (target.counterPricePerHead ?? target.pricePerHead) : target.pricePerHead) : 0
  const others = target ? offers.filter((o) => o.id !== target.id && o.lotId === target.lotId && isOpenOffer(o)).length : 0
  const lotHead = targetLot ? targetLot.tagIds.length : 0

  const confirmAction = () => {
    if (!confirm || !target) return
    const lotName = targetLot ? `Lot ${targetLot.number}` : 'The lot'
    if (confirm.kind === 'accept') {
      acceptOffer(target.id)
      toast.success('Offer accepted', { description: `${lotName} is marked sold. Call ${target.buyerName} at ${target.phone} to set up pickup.` })
    } else {
      declineOffer(target.id)
      toast('Offer declined', { description: `${target.buyerName}'s offer on ${lotName}.` })
    }
    setConfirm(null)
  }

  const LABELS: Record<Filter, string> = { open: 'Open', accepted: 'Accepted', declined: 'Declined', all: 'All' }

  return (
    <section aria-labelledby="offers-heading" className="grid gap-5">
      <div>
        <h2 id="offers-heading" className="text-3xl font-bold">
          Offers
        </h2>
        <p className="mt-1 text-muted-foreground">Accept, counter, or decline. Accepting marks the lot sold everywhere on the site.</p>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        value={filter}
        onValueChange={(v) => v && setFilter(v as Filter)}
        aria-label="Show offers"
        className="grid w-full grid-cols-2 sm:flex sm:w-fit"
      >
        {(Object.keys(LABELS) as Filter[]).map((f) => (
          <ToggleGroupItem
            key={f}
            value={f}
            className="h-11 flex-1 gap-1.5 px-3 text-base sm:flex-none sm:px-4 data-[state=on]:bg-secondary data-[state=on]:font-semibold"
          >
            {LABELS[f]}
            <span className="text-muted-foreground tabular-nums">{counts[f]}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {shown.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <p className="text-lg">
            {filter === 'open' ? 'No offers waiting. New offers from buyers show up here.' : `No ${LABELS[filter].toLowerCase()} offers.`}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {shown.map((o) => (
            <OfferCard key={o.id} offer={o} lot={lotById.get(o.lotId)} onAsk={setConfirm} />
          ))}
        </ul>
      )}

      <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          {target && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-2xl">
                  {confirm?.kind === 'accept' ? `Accept ${target.buyerName}'s offer?` : `Decline ${target.buyerName}'s offer?`}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="grid gap-2 text-base">
                    {confirm?.kind === 'accept' ? (
                      <>
                        <p>
                          {targetLot ? `Lot ${targetLot.number}` : 'The lot'} will be marked sold at {formatCurrency(targetPrice)}/
                          {targetLot ? priceUnit(targetLot.class) : 'head'}, {formatCurrency(targetPrice * target.headCount)} for {target.headCount}{' '}
                          head.
                        </p>
                        {target.headCount < lotHead && (
                          <p>
                            The offer is for {target.headCount} of {lotHead} head. The whole lot is marked sold; list the other{' '}
                            {lotHead - target.headCount} again from the herd table.
                          </p>
                        )}
                        {others > 0 && (
                          <p>{others === 1 ? 'The other open offer' : `The other ${others} open offers`} on this lot will be declined.</p>
                        )}
                      </>
                    ) : (
                      <p>
                        {target.buyerName} offered {formatCurrency(target.pricePerHead)} for {target.headCount} head. If no other offers are open,{' '}
                        {targetLot ? `Lot ${targetLot.number}` : 'the lot'} goes back to available.
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel size="lg">Keep it open</AlertDialogCancel>
                <AlertDialogAction size="lg" variant={confirm?.kind === 'decline' ? 'destructive' : 'default'} onClick={confirmAction}>
                  {confirm?.kind === 'accept' ? 'Accept offer' : 'Decline offer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
