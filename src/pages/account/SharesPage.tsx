import { ClipboardList } from 'lucide-react'
import { Link } from 'react-router'
import { Countdown } from '@/components/beef/Countdown'
import { FillMeter } from '@/components/beef/FillMeter'
import { PoolTimeline } from '@/components/beef/PoolTimeline'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { myClaims } from '@/lib/account'
import { beefTitle, quotePool, useNow } from '@/lib/beef'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { adjustedPricePerHangingLb, balanceDue, POOL_STATUS_LABELS, SHARE_LABELS } from '@/lib/yield'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

/** Claimed shares with live status timelines and, once the carcass is weighed, the real balance. */
export default function SharesPage() {
  usePageTitle('My shares')
  const now = useNow(60_000)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const orders = useRanchStore((s) => s.orders)
  const cutSheets = useRanchStore((s) => s.cutSheets)
  const claims = myClaims(pools, animals, orders)

  return (
    <>
      <AccountHeader title="My shares" description="Follow each animal from open claims to your freezer." />
      {claims.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <p className="text-lg">You haven’t claimed a share yet.</p>
          <Button asChild>
            <Link to="/beef">See animals open now</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-6">
          {claims.map(({ claim, pool, animal }) => {
            const estimate = quotePool(pool, animal, claim.size)
            const actual = pool.hangingWeight
              ? balanceDue({
                  actualHangingLb: pool.hangingWeight,
                  size: claim.size,
                  pricePerHangingLb: adjustedPricePerHangingLb(pool.pricePerHangingLb, pool.feedProgram, animal.breed),
                  depositPaid: claim.deposit,
                })
              : null
            const sheet = cutSheets.find((c) => c.claimId === claim.id)
            return (
              <li key={claim.id} className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
                <div className="grid min-w-0 content-start gap-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="aspect-4/3 w-36 shrink-0 overflow-hidden rounded-lg border">
                      <CattleImage coat={animal.coatColor} sex={animal.sex} seed={animal.tagId} alt="" />
                    </div>
                    <div className="grid min-w-[12rem] flex-1 gap-2">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {SHARE_LABELS[claim.size]} share, claimed {formatDate(claim.claimedAt)}
                      </p>
                      <h2 className="text-2xl font-bold">
                        <Link to={`/beef/${animal.tagId}`} className="underline-offset-4 hover:underline">
                          {beefTitle(animal)}
                        </Link>
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <EarTag tagId={animal.tagId} size="sm" />
                        <Badge variant="outline" className="h-7 px-2.5 text-sm">
                          {POOL_STATUS_LABELS[pool.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <FillMeter pool={pool} size="lg" />
                  {pool.status === 'open' && <Countdown deadline={pool.deadline} variant="blocks" />}
                  <dl className="grid gap-2 rounded-xl bg-muted/60 p-4 tabular-nums sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Deposit paid</dt>
                      <dd className="font-semibold">{formatCurrency(claim.deposit, true)}</dd>
                    </div>
                    {actual ? (
                      <>
                        <div>
                          <dt className="text-sm text-muted-foreground">Actual hanging weight</dt>
                          <dd className="font-semibold">
                            {formatNumber(actual.hangingLb)} lb (whole carcass {formatNumber(pool.hangingWeight!)} lb)
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm text-muted-foreground">Balance due at pickup</dt>
                          <dd className="font-heading text-2xl font-bold">{formatCurrency(actual.balance, true)}</dd>
                          <dd className="text-sm text-muted-foreground">
                            {formatCurrency(actual.beef, true)} beef + {formatCurrency(actual.processing, true)} processing, less your deposit. We
                            estimated {formatCurrency(estimate.balance, true)}.
                          </dd>
                        </div>
                      </>
                    ) : (
                      <div>
                        <dt className="text-sm text-muted-foreground">Balance at pickup, estimated</dt>
                        <dd className="font-semibold">{formatCurrency(estimate.balance, true)}</dd>
                        <dd className="text-sm text-muted-foreground">Final amount uses the real hanging weight.</dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link to={sheet ? `/beef/cut-sheet/${sheet.id}` : `/beef/cut-sheet?claim=${claim.id}`}>
                        <ClipboardList aria-hidden />
                        {sheet ? 'Edit cut sheet' : 'Fill out cut sheet'}
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to={`/animal/${animal.tagId}`}>{animal.tagId}’s record</Link>
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <PoolTimeline pool={pool} now={now} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
