import { Megaphone, PackagePlus, Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { LotStatusBadge } from '@/components/lots/LotStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isOpenOffer } from '@/lib/dashboard'
import { formatCurrency, formatNumber } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import { useLotRows } from '@/lib/useLotRows'
import { useRanchStore } from '@/store/useRanchStore'

const ORDER = { draft: 0, pending: 1, available: 2, sold: 3 } as const

/** Every lot, drafts first (they need the owner), then pending, available, and sold. */
export function LotsOverview({ onOpenOffers }: { onOpenOffers: () => void }) {
  const rows = useLotRows({ includeDrafts: true })
  const offers = useRanchStore((s) => s.offers)
  const publishLot = useRanchStore((s) => s.publishLot)
  const sorted = [...rows].sort(
    (a, b) => ORDER[a.lot.draft ? 'draft' : a.lot.status] - ORDER[b.lot.draft ? 'draft' : b.lot.status] || a.lot.number - b.lot.number,
  )

  return (
    <section aria-labelledby="lots-heading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="lots-heading" className="text-3xl font-bold">
            Your lots
          </h2>
          <p className="mt-1 text-muted-foreground">
            {rows.filter((r) => !r.lot.draft && r.lot.status !== 'sold').length} for sale, {rows.filter((r) => r.lot.draft).length} in draft,{' '}
            {rows.filter((r) => r.lot.status === 'sold').length} sold.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/dashboard/lots/new">
            <PackagePlus aria-hidden />
            Build a new lot
          </Link>
        </Button>
      </div>
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
        {sorted.map(({ lot, stats }) => {
          const open = offers.filter((o) => o.lotId === lot.id && isOpenOffer(o)).length
          return (
            <li key={lot.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Lot {lot.number}</span>
                  {lot.draft ? (
                    <Badge variant="outline" className="h-7 border-warning px-2.5 text-sm">
                      Draft
                    </Badge>
                  ) : (
                    <LotStatusBadge status={lot.status} />
                  )}
                </div>
                <Link to={`/lots/${lot.id}`} className="mt-1 block font-heading text-xl font-bold underline-offset-4 hover:underline">
                  {lot.title}
                </Link>
                <p className="text-muted-foreground tabular-nums">
                  {stats.headCount} head, {formatNumber(stats.avgWeight)} lb average, {formatCurrency(lot.pricePerHead)}/{priceUnit(lot.class)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {open > 0 && (
                  <Button variant="outline" onClick={onOpenOffers}>
                    {open} open {open === 1 ? 'offer' : 'offers'}
                  </Button>
                )}
                {lot.draft && (
                  <Button
                    onClick={() => {
                      publishLot(lot.id)
                      toast.success(`Lot ${lot.number} published`, { description: 'It now shows on the Browse page.' })
                    }}
                  >
                    <Megaphone aria-hidden />
                    Publish
                  </Button>
                )}
                {lot.status !== 'sold' && (
                  <Button asChild variant="outline">
                    <Link to={`/dashboard/lots/${lot.id}/edit`} aria-label={`Edit Lot ${lot.number}`}>
                      <Pencil aria-hidden />
                      Edit
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost">
                  <Link to={`/lots/${lot.id}`}>View listing</Link>
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
