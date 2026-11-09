import type { ReactNode } from 'react'
import { ChevronLeft, CircleCheck, FilePen, Mail, MapPin, Megaphone, MessageSquare, Pencil, Phone } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { AnimalTable } from '@/components/lot/AnimalTable'
import { FreightEstimator } from '@/components/lot/FreightEstimator'
import { HealthSummary, VerificationBadges } from '@/components/lot/HealthSummary'
import { LotGallery } from '@/components/lot/LotGallery'
import { ShareLot } from '@/components/lot/ShareLot'
import { WeightChart } from '@/components/lot/WeightChart'
import { LotActions } from '@/components/lots/LotActions'
import { LotCard } from '@/components/lots/LotCard'
import { LotStatusBadge } from '@/components/lots/LotStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import type { Lot } from '@/data/types'
import { formatCurrency, formatCwt, formatDate, formatNumber, formatShortDate } from '@/lib/format'
import { LOT_CLASS_LABELS, priceUnit } from '@/lib/labels'
import { getLotAnimals, getLotStats, type LotStats } from '@/lib/lots'
import { usePageTitle } from '@/lib/usePageTitle'
import { useLotRows } from '@/lib/useLotRows'
import { useRanchStore } from '@/store/useRanchStore'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-5">
      <h2 id={id} className="text-3xl font-bold sm:text-4xl">
        {title}
      </h2>
      {children}
    </section>
  )
}

const PRICING_NOTE: Record<Lot['pricingMode'], string> = {
  'buy-now': 'Fixed price. Buy it now and the lot is yours.',
  offer: 'Offers only. The ranch reviews every offer and calls you back.',
  both: 'Buy it now at the asking price, or make an offer.',
}

function BuyBox({ lot, stats }: { lot: Lot; stats: LotStats }) {
  const unit = priceUnit(lot.class)
  const countLabel = lot.class === 'pairs' ? 'pairs' : 'head'
  return (
    <div className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-muted-foreground">Lot {lot.number}</span>
        <Badge variant="secondary" className="h-7 px-2.5 text-sm">
          {LOT_CLASS_LABELS[lot.class]}
        </Badge>
        {lot.draft ? (
          <Badge variant="outline" className="h-7 border-warning px-2.5 text-sm">
            Draft
          </Badge>
        ) : (
          <LotStatusBadge status={lot.status} />
        )}
      </div>

      <div>
        <h1 className="text-4xl font-bold">{lot.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {lot.breedSummary}. {stats.headCount} {countLabel}, average {formatNumber(stats.avgWeight)} lb ({formatNumber(stats.minWeight)}–
          {formatNumber(stats.maxWeight)} lb).
        </p>
      </div>

      <div className="grid gap-1 border-y py-4">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span>
            <span className="font-heading text-5xl font-bold">{formatCurrency(lot.pricePerHead)}</span>
            <span className="text-lg text-muted-foreground">/{unit}</span>
          </span>
          {lot.class !== 'pairs' && <span className="text-lg text-muted-foreground tabular-nums">{formatCwt(stats.pricePerCwt)}</span>}
        </p>
        <p className="text-lg">
          Lot total <strong className="font-semibold">{formatCurrency(stats.lotTotal)}</strong>
          <span className="text-muted-foreground">
            {' '}
            for {stats.headCount} {countLabel}
          </span>
        </p>
      </div>

      {lot.status === 'sold' ? (
        <p className="rounded-lg bg-muted p-4">This lot has sold and loaded out. Similar cattle are listed below.</p>
      ) : (
        <div className="grid gap-1.5 text-muted-foreground">
          <p>{PRICING_NOTE[lot.pricingMode]}</p>
          {lot.allowPartial && lot.pricingMode !== 'buy-now' && (
            <p>Offers on part of the lot are welcome{lot.minHead ? `, ${lot.minHead} ${countLabel} minimum` : ''}.</p>
          )}
        </div>
      )}

      {lot.draft ? (
        <p className="rounded-lg bg-muted p-4">Buying opens once the lot is published.</p>
      ) : (
        <LotActions lot={lot} stats={stats} size="lg" onLotPage />
      )}

      <dl className="grid gap-3 border-t pt-4">
        <div>
          <dt className="text-sm text-muted-foreground">Pickup window</dt>
          <dd className="font-semibold">
            {formatShortDate(lot.pickupWindow.start)} to {formatDate(lot.pickupWindow.end)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Where the cattle are</dt>
          <dd className="flex items-center gap-1.5 font-semibold">
            <MapPin className="size-4 text-primary" aria-hidden />
            {lot.location.pasture}, {lot.location.city}, {lot.location.state}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">At loading</dt>
          <dd>Loading chute and scale on site. Health papers and brand inspection arranged by the ranch.</dd>
        </div>
      </dl>
    </div>
  )
}

function SellerCard({ lot }: { lot: Lot }) {
  const digits = ranch.phone.replace(/\D/g, '')
  const subject = encodeURIComponent(`Lot ${lot.number}: ${lot.title}`)
  return (
    <div className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Questions? Call the ranch</h2>
        <p className="mt-1 text-muted-foreground">
          {ranch.owner}, {ranch.name}. {ranch.hours}.
        </p>
      </div>
      <Button asChild size="lg" className="text-lg">
        <a href={ranchPhoneHref}>
          <Phone aria-hidden />
          Call {ranch.phone}
        </a>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <a href={`sms:+1${digits}?body=${subject}`}>
            <MessageSquare aria-hidden />
            Text
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`mailto:${ranch.email}?subject=${subject}`}>
            <Mail aria-hidden />
            Email
          </a>
        </Button>
      </div>
    </div>
  )
}

/** Draft lots are only reachable by link (from the chute scan or dashboard) until published. */
function DraftNotice({ lot }: { lot: Lot }) {
  const publishLot = useRanchStore((s) => s.publishLot)
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border-2 border-dashed border-warning bg-warning/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <FilePen className="mt-1 size-6 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
        <div>
          <p className="font-heading text-2xl font-bold">Draft. Buyers can't see this lot yet.</p>
          <p className="text-muted-foreground">Check the title, price, and animals. Publishing puts it on the Browse page right away.</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild size="lg" variant="outline">
          <Link to={`/dashboard/lots/${lot.id}/edit`}>
            <Pencil aria-hidden />
            Edit lot
          </Link>
        </Button>
        <Button
          size="lg"
          onClick={() => {
            publishLot(lot.id)
            toast.success(`Lot ${lot.number} published`, { description: 'It now shows on the Browse page.' })
          }}
        >
          <Megaphone aria-hidden />
          Publish lot
        </Button>
      </div>
    </div>
  )
}

function LotNotFound() {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-4xl font-bold">We couldn't find that lot</h1>
      <p className="mt-3 text-lg text-muted-foreground">It may have sold and been taken down, or the link may be mistyped.</p>
      <Button asChild size="lg" className="mt-6">
        <Link to="/cattle">Browse cattle for sale</Link>
      </Button>
    </div>
  )
}

export default function LotDetailPage() {
  const { lotId } = useParams()
  const lot = useRanchStore((s) => s.lots.find((l) => l.id === lotId))
  const allAnimals = useRanchStore((s) => s.animals)
  const rows = useLotRows()
  usePageTitle(lot ? `Lot ${lot.number}: ${lot.title}` : 'Lot not found')

  if (!lot) return <LotNotFound />

  const animals = getLotAnimals(lot, allAnimals)
  const stats = getLotStats(lot, allAnimals)
  const related = rows
    .filter((r) => r.lot.id !== lot.id && r.lot.status !== 'sold')
    .sort((a, b) => Number(b.lot.class === lot.class) - Number(a.lot.class === lot.class))
    .slice(0, 3)

  return (
    <div className="container-page pb-16">
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex items-center gap-1 text-muted-foreground">
          <li>
            <Link to="/cattle" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
              <ChevronLeft className="size-4" aria-hidden />
              Browse cattle
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page">Lot {lot.number}</li>
        </ol>
      </nav>

      {lot.draft && <DraftNotice lot={lot} />}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem] xl:gap-12">
        <div className="lg:col-start-1">
          <LotGallery lot={lot} stats={stats} animals={animals} />
        </div>

        <aside aria-label="Price and purchase" className="grid gap-6 self-start lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <BuyBox lot={lot} stats={stats} />
          <SellerCard lot={lot} />
        </aside>

        <div className="grid min-w-0 gap-14 lg:col-start-1">
          <Section id="about-heading" title="About this lot">
            <p className="max-w-[68ch] text-lg">{lot.description}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {lot.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5">
                  <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="verified-heading" title="Verified on our records">
            <VerificationBadges animals={animals} />
          </Section>

          <Section id="animals-heading" title={`Every animal in the lot (${animals.length})`}>
            <p className="-mt-2 text-muted-foreground">Each ear tag has its own record with photos, weights, and shots. Select a row to open it.</p>
            {animals.length > 1 && (
              <div className="rounded-xl border bg-card p-5 sm:p-6">
                <WeightChart animals={animals} avgWeight={stats.avgWeight} />
              </div>
            )}
            <AnimalTable lot={lot} animals={animals} />
          </Section>

          <Section id="health-heading" title="Health and vaccinations">
            <HealthSummary animals={animals} />
          </Section>

          <Section id="shipping-heading" title="Getting them home">
            <FreightEstimator animals={animals} unit={priceUnit(lot.class)} />
            <ShareLot lot={lot} />
          </Section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-20">
          <h2 id="related-heading" className="text-3xl font-bold sm:text-4xl">
            More cattle on the ranch
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map(({ lot: l, stats: s }) => (
              <li key={l.id} className="grid">
                <LotCard lot={l} stats={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
