import { Link } from 'react-router'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { Badge } from '@/components/ui/badge'
import { feedProgram } from '@/config/beef'
import { beefTitle, leftLabel, type PoolRow, poolPhase } from '@/lib/beef'
import { formatAge, formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { hangingWeight, POOL_STATUS_LABELS, takeHomeWeight } from '@/lib/yield'
import { Countdown } from './Countdown'
import { FillMeter } from './FillMeter'

/** One animal you can claim beef from, on the browse page. The whole card opens its beef page. */
export function PoolCard({ row, now, held = 0, className }: { row: PoolRow; now: number; held?: number; className?: string }) {
  const { pool, animal, fromQuote, sizes } = row
  const phase = poolPhase(pool, now)
  const program = feedProgram(pool.feedProgram)
  const url = `/beef/${animal.tagId}`
  const left = sizes.length ? leftLabel(pool, held) : ''

  return (
    <article
      className={cn(
        'group/card relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/40',
        className,
      )}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <CattleImage
          coat={animal.coatColor}
          sex={animal.sex}
          seed={animal.tagId}
          photos={animal.photos}
          alt={`${beefTitle(animal)}, ear tag ${animal.tagId}`}
          className="transition-transform duration-500 group-hover/card:scale-[1.03]"
        />
        <EarTag tagId={animal.tagId} size="sm" className="absolute top-3 left-3" />
        <Badge className="absolute top-3 right-3 h-7 border-transparent bg-card/95 px-2.5 text-sm text-foreground shadow-sm">{program.short}</Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-2xl font-bold">
            <Link
              to={url}
              className="underline-offset-4 group-hover/card:underline after:absolute after:inset-0 after:rounded-xl focus-visible:underline focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {beefTitle(animal)}
            </Link>
          </h3>
          <p className="mt-1 text-muted-foreground">
            {formatAge(animal.birthDate)} old, {formatNumber(animal.estWeight)} lb live
          </p>
        </div>

        <dl className="grid grid-cols-2 divide-x rounded-lg border bg-background/60">
          <div className="px-3 py-2">
            <dt className="text-sm text-muted-foreground">Hanging</dt>
            <dd className="font-heading text-lg font-bold tabular-nums">~{formatNumber(hangingWeight(animal.estWeight))} lb</dd>
          </div>
          <div className="px-3 py-2">
            <dt className="text-sm text-muted-foreground">Take-home</dt>
            <dd className="font-heading text-lg font-bold tabular-nums">~{formatNumber(takeHomeWeight(animal.estWeight))} lb</dd>
          </div>
        </dl>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="font-semibold">
              {phase === 'open' ? left || 'All claimed' : phase === 'closed' ? 'Closed' : POOL_STATUS_LABELS[pool.status]}
            </p>
            {phase === 'open' && <Countdown deadline={pool.deadline} />}
          </div>
          <FillMeter pool={pool} held={held} />
        </div>

        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t pt-4">
          {phase === 'open' ? (
            <>
              <p>
                <span className="text-sm text-muted-foreground">{fromQuote.size === 'whole' ? 'Whole animal' : `A ${fromQuote.size} from`} </span>
                <span className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(fromQuote.total)}</span>
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">{formatCurrency(fromQuote.perTakeHomeLb, true)}/lb take-home</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {phase === 'closed'
                ? 'Didn’t fill by its deadline. Claimants rolled over or were refunded.'
                : 'Every share is claimed. Follow along on its page.'}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
