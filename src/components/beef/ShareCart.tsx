import { CalendarClock, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { CattleImage } from '@/components/cattle/CattleImage'
import { Button } from '@/components/ui/button'
import { beefConfig } from '@/config/beef'
import { beefTitle, claimLabel } from '@/lib/beef'
import type { ShareLine, ShareSummary } from '@/lib/beefCart'
import { formatCurrency, formatNumber } from '@/lib/format'
import { SHARE_LABELS } from '@/lib/yield'

const depositPct = `${Math.round(beefConfig.depositRate * 100)}%`
const deadlineText = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** A share of beef in the cart. */
export function ShareCartLine({ line, onRemove }: { line: ShareLine; onRemove?: () => void }) {
  const { item, pool, animal, quote } = line
  const url = `/beef/${animal.tagId}`
  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:p-5">
      <Link to={url} tabIndex={-1} aria-hidden className="block aspect-4/3 overflow-hidden rounded-lg border">
        <CattleImage coat={animal.coatColor} sex={animal.sex} seed={animal.tagId} alt="" />
      </Link>
      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted-foreground">
              {SHARE_LABELS[item.size]} share of {animal.tagId}
            </p>
            <h3 className="text-2xl font-bold">
              <Link to={url} className="underline-offset-4 hover:underline">
                {beefTitle(animal)}
              </Link>
            </h3>
          </div>
          <p className="text-right">
            <span className="block font-heading text-2xl font-bold tabular-nums">{formatCurrency(quote.deposit, true)}</span>
            <span className="text-sm text-muted-foreground">{depositPct} deposit today</span>
          </p>
        </div>
        <p className="text-muted-foreground tabular-nums">
          About {formatNumber(quote.takeHomeLow)}–{formatNumber(quote.takeHomeHigh)} lb of beef. Estimated {formatCurrency(quote.total)} in all (
          {formatCurrency(quote.perTakeHomeLb, true)}/lb), so about {formatCurrency(quote.balance)} at pickup.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span>
            On the meter as <strong className="font-semibold">{claimLabel(item)}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            Fills by {deadlineText(pool.deadline)}, or {item.ifUnfilled === 'refund' ? 'full refund' : 'roll over'}
          </span>
        </div>
        {onRemove && (
          <div>
            <Button variant="ghost" size="sm" onClick={onRemove} className="-ml-2 text-destructive hover:text-destructive">
              <Trash2 aria-hidden />
              Remove
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}

/** A share that can't be bought any more (the animal filled up or closed while it sat in the cart). */
export function UnavailableShare({ entry, onRemove }: { entry: ShareSummary['unavailable'][number]; onRemove: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-warning/60 bg-warning/10 p-4">
      <TriangleAlert className="size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
      <p className="min-w-0 flex-1">
        <strong className="font-semibold">
          {SHARE_LABELS[entry.item.size]} of {entry.pool?.tagId ?? 'an animal'}
        </strong>{' '}
        is no longer available. {entry.pool ? 'Someone else claimed the last shares, or its deadline passed.' : ''}
      </p>
      {entry.pool && (
        <Button asChild variant="outline">
          <Link to="/beef">Find another animal</Link>
        </Button>
      )}
      <Button variant="outline" onClick={onRemove}>
        Remove
      </Button>
    </div>
  )
}

/** Money for the beef shares: pay today vs. due later. */
export function ShareTotals({ summary }: { summary: ShareSummary }) {
  return (
    <dl className="grid gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground">
          Beef shares, estimated
          <span className="block text-sm">About {formatNumber(summary.takeHomeLb)} lb of beef</span>
        </dt>
        <dd className="font-semibold tabular-nums">{formatCurrency(summary.estimatedTotal, true)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="font-semibold">Share deposits today ({depositPct})</dt>
        <dd className="font-semibold tabular-nums">{formatCurrency(summary.deposit, true)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground">
          Due at pickup, estimated
          <span className="block text-sm">Figured on the actual hanging weight</span>
        </dt>
        <dd className="font-semibold tabular-nums">{formatCurrency(summary.estimatedBalance, true)}</dd>
      </div>
    </dl>
  )
}
