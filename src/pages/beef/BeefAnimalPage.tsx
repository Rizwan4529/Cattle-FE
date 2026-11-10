import { type ReactNode, useState } from 'react'
import { BadgeCheck, ChevronLeft, ClipboardList, FileText, Leaf, ShieldCheck, Snowflake, Users } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { ClaimDialog } from '@/components/beef/ClaimDialog'
import { Countdown } from '@/components/beef/Countdown'
import { FillMeter } from '@/components/beef/FillMeter'
import { NotifyMe } from '@/components/beef/NotifyMe'
import { PoolTimeline } from '@/components/beef/PoolTimeline'
import { PoundsHelper } from '@/components/beef/PoundsHelper'
import { WeightsExplainer } from '@/components/beef/WeightsExplainer'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { beefConfig, feedProgram } from '@/config/beef'
import type { ShareSize } from '@/data/beefTypes'
import { beefTitle, claimLabel, leftLabel, poolPhase, quotePool, shareNoun, useNow } from '@/lib/beef'
import { formatAge, formatCurrency, formatDate, formatNumber, formatShortDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useClaimActivity } from '@/lib/useClaimActivity'
import { availableShareSizes, openSizes, POOL_STATUS_LABELS, SHARE_LABELS, savingsVsIndividual, segmentsFor, segmentsLeft } from '@/lib/yield'
import { heldSegments, useRanchStore } from '@/store/useRanchStore'

function Section({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-labelledby={id} className={cn('grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5', className)}>
      <div>
        <h2 id={id} className="text-3xl font-bold">
          {title}
        </h2>
        {description && <p className="mt-1 text-lg text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function NotFound({ tagId, harvested }: { tagId: string; harvested?: boolean }) {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-4xl font-bold">{harvested ? `${tagId}’s beef was sold by the cut` : `No beef share for ${tagId || 'that tag'}`}</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {harvested
          ? 'This animal was harvested for the Butcher Shop, so there are no shares to claim.'
          : 'Check the ear tag number, or pick from the animals open for claims now.'}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/beef">See animals open now</Link>
        </Button>
        {harvested && (
          <Button asChild size="lg" variant="outline">
            <Link to={`/animal/${tagId}`}>See its record</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export default function BeefAnimalPage() {
  const { tagId = '' } = useParams()
  const tag = tagId.toUpperCase()
  const animal = useRanchStore((s) => s.animals.find((a) => a.tagId === tag))
  const pool = useRanchStore((s) => s.pools.find((p) => p.tagId === tag))
  const cart = useRanchStore((s) => s.cart)
  const pools = useRanchStore((s) => s.pools)
  const products = useRanchStore((s) => s.products)
  const cutSheets = useRanchStore((s) => s.cutSheets)
  const now = useNow(1000)
  const [claimSize, setClaimSize] = useState<ShareSize | null>(null)
  usePageTitle(animal ? `${beefTitle(animal)}, ${animal.tagId}` : 'Beef share not found')
  useClaimActivity()

  if (!animal || !pool) return <NotFound tagId={tag} harvested={Boolean(animal?.harvest && !pool)} />

  const program = feedProgram(pool.feedProgram)
  const held = heldSegments(cart, pools).get(pool.id) ?? 0
  const phase = poolPhase(pool, now)
  const sizes = openSizes(pool, now, beefConfig, held)
  const left = segmentsLeft(pool, held)
  const inCart = cart.filter((i) => i.kind === 'share' && i.poolId === pool.id)
  const mine = pool.claims.filter((c) => c.fromThisDevice)
  const quotes = availableShareSizes().map((size) => ({ size, quote: quotePool(pool, animal, size) }))

  const trust = [
    { icon: BadgeCheck, text: `Ear tag ${animal.tagId}, born and raised here` },
    { icon: Leaf, text: program.name },
    beefConfig.claims.noAddedHormones && { icon: ShieldCheck, text: 'No added hormones' },
    beefConfig.claims.noRoutineAntibiotics && { icon: ShieldCheck, text: 'No routine antibiotics' },
    beefConfig.claims.dryAged && {
      icon: Snowflake,
      text: `Dry-aged ${pool.agingDays ?? `${beefConfig.dryAgeDays.min}–${beefConfig.dryAgeDays.max}`} days`,
    },
    { icon: FileText, text: `${beefConfig.processor.inspection} processing, ${beefConfig.processor.name}` },
  ].filter((t): t is { icon: typeof BadgeCheck; text: string } => Boolean(t))

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link to="/beef" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          All animals
        </Link>
      </div>

      {/* Phones: animal, then the claim box, then the details. Large screens: claim box in its own column. */}
      <div className="grid gap-8 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6">
        <div className="grid min-w-0 content-start gap-6 lg:col-start-1">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl border bg-muted sm:aspect-video">
            <CattleImage
              coat={animal.coatColor}
              sex={animal.sex}
              seed={animal.tagId}
              photos={animal.photos}
              alt={`${beefTitle(animal)}, ear tag ${animal.tagId}`}
            />
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <EarTag tagId={animal.tagId} size="lg" />
            <div className="min-w-[15rem] flex-1">
              <h1 className="text-4xl font-bold sm:text-5xl">{beefTitle(animal)}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="h-7 px-2.5 text-sm">{program.short}</Badge>
                <Badge variant="secondary" className="h-7 px-2.5 text-sm">
                  {animal.breed}
                </Badge>
                <Badge variant="outline" className="h-7 px-2.5 text-sm">
                  {POOL_STATUS_LABELS[pool.status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <aside
          aria-labelledby="claim-heading"
          className="grid min-w-0 content-start gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <div>
            <h2 id="claim-heading" className="text-2xl font-bold">
              {phase === 'open' ? 'Claim a share' : phase === 'closed' ? 'Claims are closed' : 'Every share is claimed'}
            </h2>
            {phase === 'open' && (
              <p className={cn('mt-1 text-lg font-semibold', left === 1 && 'text-primary')}>
                {left > 0
                  ? `Harvest locks in when this animal fills: ${leftLabel(pool, held)}!`
                  : 'Every open share is in carts right now, yours included.'}
              </p>
            )}
            {phase === 'closed' && (
              <p className="mt-1 text-muted-foreground">
                It didn’t fill by its deadline. Each claimant rolled over to the next animal or got a full refund, as they chose.
              </p>
            )}
            {phase === 'in-progress' && <p className="mt-1 text-muted-foreground">{POOL_STATUS_LABELS[pool.status]}. Follow along below.</p>}
          </div>

          <FillMeter pool={pool} size="lg" held={held} />

          {mine.length > 0 && (
            <div className="grid gap-3 rounded-lg bg-tag/25 px-4 py-3">
              <p className="font-medium">You claimed {mine.map((c) => shareNoun(c.size)).join(' and ')} of this animal.</p>
              <div className="flex flex-wrap gap-2">
                {mine.map((c) => (
                  <Button key={c.id} asChild variant="secondary" className="bg-card hover:bg-card/80">
                    <Link to={`/beef/cut-sheet?claim=${c.id}`}>
                      <ClipboardList aria-hidden />
                      {cutSheets.some((sh) => sh.claimId === c.id) ? 'Edit' : 'Fill out'} your {mine.length > 1 ? `${c.size} ` : ''}cut sheet
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {phase === 'open' && <Countdown deadline={pool.deadline} variant="blocks" />}

          {phase === 'open' && (
            <ul className="grid gap-2">
              {quotes.map(({ size, quote }) => {
                const ok = sizes.includes(size)
                const need = segmentsFor(size, pool.unit)
                return (
                  <li key={size} className={cn('flex flex-wrap items-center gap-3 rounded-xl border p-3', !ok && 'bg-muted/40')}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {SHARE_LABELS[size]}
                        <span className="font-normal text-muted-foreground">, about {formatNumber(quote.takeHomeLb)} lb of beef</span>
                      </p>
                      <p className="tabular-nums">
                        <span className="font-heading text-xl font-bold">{formatCurrency(quote.total)}</span>{' '}
                        <span className="text-sm whitespace-nowrap text-muted-foreground">
                          {formatCurrency(quote.perTakeHomeLb, true)}/lb take-home
                        </span>
                      </p>
                    </div>
                    {ok ? (
                      <Button onClick={() => setClaimSize(size)} aria-label={`Claim ${shareNoun(size)} of ${animal.tagId}`}>
                        Claim
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">{need > left ? 'Not enough left' : 'Not offered'}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {inCart.length > 0 && (
            <Button asChild variant="secondary" size="lg">
              <Link to="/cart">{inCart.length === 1 ? 'Your share is in your cart' : `${inCart.length} shares in your cart`}: check out</Link>
            </Button>
          )}

          {phase === 'open' ? (
            <p className="text-sm text-muted-foreground">
              Pay a {Math.round(beefConfig.depositRate * 100)}% deposit today. The rest is due at pickup, figured on the actual hanging weight. If the
              animal doesn’t fill by the deadline, you choose: roll over to the next animal, or a full refund.
            </p>
          ) : (
            <Button asChild size="lg">
              <Link to="/beef">See animals open now</Link>
            </Button>
          )}
        </aside>

        <div className="grid min-w-0 content-start gap-6 lg:col-start-1 lg:row-start-2">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border bg-card p-5 sm:grid-cols-4">
            {[
              ['Age', formatAge(animal.birthDate)],
              ['Live weight', `${formatNumber(animal.estWeight)} lb`],
              ['Finishes', animal.finishDate ? formatShortDate(animal.finishDate) : '–'],
              ['Sire', animal.sire ?? '–'],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-heading text-xl font-bold break-words">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 rounded-2xl border bg-card p-5">
            <h2 className="text-2xl font-bold">Know your animal</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {trust.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">{program.flavor}</p>
            <div>
              <Button asChild variant="outline">
                <Link to={`/animal/${animal.tagId}`}>
                  <FileText aria-hidden />
                  See {animal.tagId}’s full record
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <Section id="weights-heading" title="What you get" description="Estimates for the whole animal. Your share gets its part of each.">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <WeightsExplainer liveLb={animal.estWeight} />
          </div>
        </Section>

        <Section
          id="prices-heading"
          title="Price by share"
          description="Figured on hanging weight, the way butchers price it, with processing shown separately."
        >
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[34rem] text-left tabular-nums">
              <caption className="sr-only">Estimated weight and price for each share size</caption>
              <thead className="bg-muted/60 text-sm text-muted-foreground">
                <tr className="[&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
                  <th scope="col">Share</th>
                  <th scope="col">Hanging</th>
                  <th scope="col">Take-home</th>
                  <th scope="col">Price</th>
                  <th scope="col">Per lb</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(({ size, quote }) => (
                  <tr key={size} className="border-t [&_td]:px-4 [&_td]:py-3">
                    <th scope="row" className="px-4 py-3 font-semibold">
                      {SHARE_LABELS[size]}
                    </th>
                    <td>{formatNumber(quote.hangingLb)} lb</td>
                    <td className="whitespace-nowrap">
                      {formatNumber(quote.takeHomeLow)}–{formatNumber(quote.takeHomeHigh)} lb
                    </td>
                    <td>
                      <span className="font-semibold">{formatCurrency(quote.total)}</span>
                      <span className="block text-sm text-muted-foreground">
                        {formatCurrency(quote.beef)} beef + {formatCurrency(quote.processing)} processing
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold">{formatCurrency(quote.perTakeHomeLb, true)}</span>
                      <span className="block text-sm text-success">Save {formatCurrency(savingsVsIndividual(quote, products))}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">
            “Save” compares the same beef bought cut by cut at our Butcher Shop prices. Processing is{' '}
            {formatCurrency(beefConfig.processing.perHangingLb, true)} per hanging lb plus a {formatCurrency(beefConfig.processing.killFee)} harvest
            fee split across the shares.
          </p>
        </Section>
      </div>

      {phase === 'open' && (
        <PoundsHelper
          className="mt-14"
          liveLb={animal.estWeight}
          canChoose={(size) => sizes.includes(size)}
          chooseLabel={(size) => `Claim ${shareNoun(size)} of ${animal.tagId}`}
          onChoose={(size) => setClaimSize(size)}
        />
      )}

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10">
        <Section id="journey-heading" title="Where this beef is now" description="Every share follows the same path. You get updates at each step.">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <PoolTimeline pool={pool} now={now} />
          </div>
        </Section>

        <Section id="claims-heading" title="Who’s in">
          {pool.claims.length ? (
            <ul className="grid gap-2 rounded-2xl border bg-card p-3">
              {pool.claims.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 font-heading text-lg font-bold text-primary"
                  >
                    {c.firstName[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {claimLabel(c)}
                      {c.fromThisDevice && ' (you)'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {SHARE_LABELS[c.size]}, claimed {formatDate(c.claimedAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-5">
              <Users className="size-8 text-muted-foreground" aria-hidden />
              <p>No one has claimed a share yet. Be the first; your name goes at the front of the meter.</p>
            </div>
          )}
        </Section>
      </div>

      {phase !== 'open' && (
        <NotifyMe className="mt-14" defaultProgram={pool.feedProgram} title={`Want the next ${program.short.toLowerCase()} animal?`} />
      )}

      {claimSize && (
        <ClaimDialog
          key={claimSize}
          pool={pool}
          animal={animal}
          sizes={sizes}
          initialSize={claimSize}
          open
          onOpenChange={(o) => !o && setClaimSize(null)}
        />
      )}
    </div>
  )
}
