import { MapPin, Share2 } from 'lucide-react'
import { Link } from 'react-router'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Lot } from '@/data/types'
import { formatCurrency, formatCwt, formatNumber } from '@/lib/format'
import { LOT_CLASS_LABELS, priceUnit } from '@/lib/labels'
import { lotIllustration, type LotStats } from '@/lib/lots'
import { shareLot } from '@/lib/share'
import { cn } from '@/lib/utils'
import { LotActions } from './LotActions'
import { LotStatusBadge } from './LotStatusBadge'

interface LotCardProps {
  lot: Lot
  stats: LotStats
  layout?: 'grid' | 'list'
  /** Ear tag that matched the visitor's search */
  matchedTag?: string
  className?: string
}

function Specs({ lot, stats }: { lot: Lot; stats: LotStats }) {
  const items = [
    { label: lot.class === 'pairs' ? 'Pairs' : 'Head', value: String(stats.headCount) },
    { label: 'Avg weight', value: `${formatNumber(stats.avgWeight)} lb` },
    { label: 'Range', value: `${formatNumber(stats.minWeight)}–${formatNumber(stats.maxWeight)}` },
  ]
  return (
    <dl className="grid grid-cols-3 divide-x rounded-lg border bg-background/60">
      {items.map((i) => (
        <div key={i.label} className="px-3 py-2">
          <dt className="text-sm text-muted-foreground">{i.label}</dt>
          <dd className="font-heading text-lg leading-tight font-bold tabular-nums">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Price({ lot, stats }: { lot: Lot; stats: LotStats }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p>
        <span className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(lot.pricePerHead)}</span>
        <span className="text-muted-foreground">/{priceUnit(lot.class)}</span>
      </p>
      {lot.class !== 'pairs' && <p className="text-muted-foreground tabular-nums">{formatCwt(stats.pricePerCwt)}</p>}
      <p className="w-full text-sm text-muted-foreground">Lot total {formatCurrency(stats.lotTotal)}</p>
    </div>
  )
}

/** A lot for sale: illustration, specs, price, and buy/offer actions. */
export function LotCard({ lot, stats, layout = 'grid', matchedTag, className }: LotCardProps) {
  const url = `/lots/${lot.id}`
  const list = layout === 'list'

  return (
    <article
      className={cn(
        // The title link stretches over the whole card (see its ::after), so clicking anywhere opens the lot.
        'group/card relative flex overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-colors hover:border-primary/40',
        list ? 'flex-col md:flex-row' : 'flex-col',
        className,
      )}
    >
      <div
        className={cn(
          'relative block aspect-4/3 shrink-0 overflow-hidden bg-muted',
          // List view: a framed photo beside the details instead of a full-height strip that crops the animal
          list && 'md:m-5 md:mr-0 md:w-64 md:self-start md:rounded-lg xl:w-80',
        )}
      >
        {/* Sold lots fade the picture only, so the text keeps full contrast. */}
        <CattleImage
          {...lotIllustration(lot, stats)}
          className={cn('transition-transform duration-500 group-hover/card:scale-[1.03]', lot.status === 'sold' && 'opacity-60 grayscale')}
        />
        <LotStatusBadge status={lot.status} className="absolute top-3 left-3" />
        {matchedTag && <EarTag tagId={matchedTag} size="sm" className="absolute bottom-3 left-3" />}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => shareLot(lot)}
          aria-label={`Share Lot ${lot.number}`}
          title="Share this lot"
          className="absolute top-3 right-3 z-10 size-10 rounded-full border bg-card/90 shadow-sm backdrop-blur-sm hover:bg-card"
        >
          <Share2 className="size-5" aria-hidden />
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-muted-foreground">Lot {lot.number}</span>
            <Badge variant="secondary" className="h-6 px-2 text-sm">
              {LOT_CLASS_LABELS[lot.class]}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold">
            <Link
              to={url}
              className="underline-offset-4 group-hover/card:underline after:absolute after:inset-0 focus-visible:underline focus-visible:outline-none after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {lot.title}
            </Link>
          </h3>
          {matchedTag && (
            <p className="text-sm">
              Includes ear tag <strong>{matchedTag}</strong>
            </p>
          )}
          <Specs lot={lot} stats={stats} />
          {list && <p className="line-clamp-2 text-muted-foreground">{lot.description}</p>}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {lot.location.pasture}, {lot.location.city}, {lot.location.state}
          </p>
        </div>

        <div className={cn('mt-auto flex flex-col gap-4', list && 'xl:flex-row xl:items-end xl:justify-between')}>
          <Price lot={lot} stats={stats} />
          {/* Above the stretched link so the buttons keep their own clicks */}
          <LotActions lot={lot} stats={stats} className={cn('relative z-10', list && 'xl:w-80')} />
        </div>
      </div>
    </article>
  )
}
