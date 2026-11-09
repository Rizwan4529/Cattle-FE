import type { ReactNode } from 'react'
import type { Overview } from '@/lib/dashboard'
import { formatCurrency, formatCwt, formatNumber } from '@/lib/format'

function Stat({ label, value, note }: { label: string; value: string; note: ReactNode }) {
  return (
    <div className="min-w-0 bg-card px-5 py-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-heading text-[1.75rem] font-bold tabular-nums sm:text-4xl">{value}</dd>
      <dd className="text-sm text-muted-foreground">{note}</dd>
    </div>
  )
}

/** The six numbers the owner checks first, in one ruled panel. */
export function OverviewStats({ overview, onOpenOffers }: { overview: Overview; onOpenOffers: () => void }) {
  const o = overview
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3 2xl:grid-cols-6">
      <Stat label="Total head" value={formatNumber(o.totalHead)} note="On the ranch now" />
      <Stat
        label="Head listed"
        value={formatNumber(o.headListed)}
        note={o.totalHead ? `${Math.round((o.headListed / o.totalHead) * 100)}% of the herd` : 'None listed'}
      />
      <Stat label="Head sold" value={formatNumber(o.headSold)} note="Last 12 months" />
      <Stat label="Revenue" value={formatCurrency(o.revenue)} note="Last 12 months (sample)" />
      <Stat
        label="Open offers"
        value={formatNumber(o.openOffers)}
        note={
          o.openOffers ? (
            <button
              type="button"
              onClick={onOpenOffers}
              className="-my-2 inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
            >
              Review offers
            </button>
          ) : (
            'Nothing waiting'
          )
        }
      />
      <Stat label="Average $/cwt" value={o.avgCwt ? formatCwt(o.avgCwt).replace('/cwt', '') : 'n/a'} note="Listed feeder cattle" />
    </dl>
  )
}
