import { Check } from 'lucide-react'
import { beefConfig } from '@/config/beef'
import type { PoolStatus, SharePool } from '@/data/beefTypes'
import { formatShortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { agingDay, POOL_STEPS } from '@/lib/yield'

const STEP_TEXT: Record<PoolStatus, { title: string; body: string }> = {
  open: { title: 'Open for claims', body: 'Families claim their shares. Nothing is harvested until every share is spoken for.' },
  full: { title: 'Fully claimed', body: 'Every share is claimed, so harvest locks in. The ranch books the processor.' },
  'harvest-scheduled': {
    title: 'Harvest scheduled',
    body: `Taken to ${beefConfig.processor.name} (${beefConfig.processor.inspection}) on the booked date.`,
  },
  'dry-aging': {
    title: 'Dry aging',
    body: `The carcass hangs ${beefConfig.dryAgeDays.min} to ${beefConfig.dryAgeDays.max} days in a cold room, which tenderizes it and deepens the flavor.`,
  },
  'cut-wrap': { title: 'Cut & wrap', body: 'Cut to each family’s cut sheet, vacuum-sealed, labeled, and frozen.' },
  ready: {
    title: 'Ready for pickup',
    body: 'Pick up at the ranch, or we deliver or ship it frozen. The balance is due now, on the actual hanging weight.',
  },
  shipped: { title: 'Shipped', body: 'On its way, frozen on dry ice.' },
}

/** The beef journey for one animal, from open claims to pickup. */
export function PoolTimeline({ pool, now, className }: { pool: SharePool; now: number; className?: string }) {
  const current = pool.status === 'shipped' ? POOL_STEPS.length - 1 : POOL_STEPS.indexOf(pool.status)
  const reachedAt = (s: PoolStatus) => pool.history.find((h) => h.status === s)?.at

  return (
    <ol className={cn('grid gap-0', className)}>
      {POOL_STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const text = step === 'ready' && pool.status === 'shipped' ? STEP_TEXT.shipped : STEP_TEXT[step]
        const at = reachedAt(step)
        let note = at ? formatShortDate(at) : ''
        if (step === 'harvest-scheduled' && pool.harvestDate) note = `Harvest ${formatShortDate(pool.harvestDate)}`
        if (step === 'dry-aging' && active) note = `Day ${agingDay(pool, now)} of ${pool.agingDays ?? beefConfig.dryAgeDays.max}`
        return (
          <li key={step} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4" aria-current={active ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-full border-2 font-heading text-lg font-bold',
                  done && 'border-success bg-success text-success-foreground',
                  active && 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/20',
                  !done && !active && 'border-border bg-background text-muted-foreground',
                )}
              >
                {done ? <Check className="size-5" aria-hidden /> : i + 1}
              </span>
              {i < POOL_STEPS.length - 1 && <span aria-hidden className={cn('w-0.5 flex-1', done ? 'bg-success' : 'bg-border')} />}
            </div>
            <div className={cn('pb-6', i === POOL_STEPS.length - 1 && 'pb-0')}>
              <p className="flex flex-wrap items-baseline gap-x-3 pt-1.5">
                <span className={cn('text-lg font-bold', !done && !active && 'text-muted-foreground')}>{text.title}</span>
                {note && <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-muted-foreground')}>{note}</span>}
                <span className="sr-only">{done ? '(done)' : active ? '(now)' : '(coming up)'}</span>
              </p>
              {(active || !done) && <p className="mt-1 text-muted-foreground">{text.body}</p>}
              {step === 'dry-aging' && active && (
                <div className="mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(agingDay(pool, now) / (pool.agingDays ?? 21)) * 100}%` }} />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
