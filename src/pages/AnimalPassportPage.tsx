import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Copy, Phone, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { HealthTimeline } from '@/components/animal/HealthTimeline'
import { PassportCard } from '@/components/animal/PassportCard'
import { ScanHistory } from '@/components/animal/ScanHistory'
import { WeightGainChart } from '@/components/animal/WeightGainChart'
import { EarTag } from '@/components/cattle/EarTag'
import { LotStatusBadge } from '@/components/lots/LotStatusBadge'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import type { Animal, Lot } from '@/data/types'
import { formatCurrency, formatDate, formatNumber, formatToday } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-5 print:break-inside-avoid-page">
      <div>
        <h2 id={id} className="text-3xl font-bold sm:text-4xl print:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Where this animal stands: for sale in a lot, sold, kept in the herd, or raised for beef. */
function SaleStatus({ animal, lot }: { animal: Animal; lot?: Lot }) {
  if (animal.feedProgram) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong className="font-semibold">
            {animal.harvest ? `Harvested for beef on ${formatDate(animal.harvest.date)}.` : `${animal.tagId} is raised for beef.`}
          </strong>{' '}
          <span className="text-muted-foreground">
            {animal.harvest
              ? `Hanging weight ${formatNumber(animal.harvest.hangingWeight)} lb, dry-aged ${animal.harvest.agedDays} days at ${animal.harvest.processor}.`
              : 'Families claim shares of its beef before harvest.'}
          </span>
        </p>
        <Button asChild className="print:hidden">
          <Link to={`/beef/${animal.tagId}`}>{animal.harvest ? 'See its beef page' : 'Claim a share'}</Link>
        </Button>
      </div>
    )
  }
  if (!lot) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong className="font-semibold">{animal.tagId} isn't listed for sale.</strong>{' '}
          <span className="text-muted-foreground">It's part of the ranch's herd. Call if you're interested.</span>
        </p>
        <Button asChild variant="outline" className="print:hidden">
          <a href={ranchPhoneHref}>
            <Phone aria-hidden />
            Call {ranch.phone}
          </a>
        </Button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">
            {lot.draft ? 'In draft' : lot.status === 'sold' ? 'Sold in' : 'For sale in'} Lot {lot.number}
          </span>
          {lot.draft ? <span className="text-muted-foreground">(not listed yet)</span> : <LotStatusBadge status={lot.status} />}
        </div>
        <p className="text-muted-foreground">
          {lot.title}. {formatCurrency(lot.pricePerHead)}/{priceUnit(lot.class)}.
        </p>
      </div>
      <Button asChild className="print:hidden">
        <Link to={`/lots/${lot.id}`}>{lot.status === 'sold' ? `See Lot ${lot.number}` : `View Lot ${lot.number}`}</Link>
      </Button>
    </div>
  )
}

function AnimalNotFound({ tagId }: { tagId: string }) {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-4xl font-bold">No record for {tagId || 'that tag'}</h1>
      <p className="mt-3 text-lg text-muted-foreground">Check the number on the ear tag. Tags on this ranch look like {ranch.tagPrefix}-2417.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to={`/cattle?q=${encodeURIComponent(tagId)}`}>Search the lots</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/cattle">Browse cattle</Link>
        </Button>
      </div>
    </div>
  )
}

export default function AnimalPassportPage() {
  const { tagId = '' } = useParams()
  const id = tagId.toUpperCase()
  const animals = useRanchStore((s) => s.animals)
  const lots = useRanchStore((s) => s.lots)
  const animal = animals.find((a) => a.tagId === id)
  usePageTitle(animal ? `${animal.tagId} animal record` : 'Animal not found')

  if (!animal) return <AnimalNotFound tagId={id} />

  const lot = lots.find((l) => l.tagIds.includes(animal.tagId))
  const position = lot ? lot.tagIds.indexOf(animal.tagId) : -1
  const prevTag = lot && position > 0 ? lot.tagIds[position - 1] : undefined
  const nextTag = lot && position < lot.tagIds.length - 1 ? lot.tagIds[position + 1] : undefined
  const damExists = Boolean(animal.dam && animals.some((a) => a.tagId === animal.dam))
  const url = `${window.location.origin}/animal/${animal.tagId}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied', { description: url })
    } catch {
      toast.error("Couldn't copy the link", { description: `Copy it by hand: ${url}` })
    }
  }

  return (
    <div className="container-page pb-16 print:max-w-none print:px-0 print:pb-0">
      {/* Printed page heading */}
      <p className="hidden pb-3 text-sm print:block">
        Printed {formatToday()} from {url}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 py-4 print:hidden">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
            <li>
              <Link to="/cattle" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                <ChevronLeft className="size-4" aria-hidden />
                Browse cattle
              </Link>
            </li>
            {lot && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    to={`/lots/${lot.id}`}
                    className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Lot {lot.number}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden>/</li>
            <li aria-current="page">{animal.tagId}</li>
          </ol>
        </nav>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copy}>
            <Copy aria-hidden />
            Copy link
          </Button>
          <Button onClick={() => window.print()}>
            <Printer aria-hidden />
            Print record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 print:gap-8">
        <div className="grid grid-cols-1 gap-4">
          <PassportCard animal={animal} lot={lot} damExists={damExists} />

          {lot && (
            <nav aria-label={`Other animals in Lot ${lot.number}`} className="flex items-center justify-between gap-2 print:hidden">
              {prevTag ? (
                <Link to={`/animal/${prevTag}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-muted">
                  <ChevronLeft className="size-5" aria-hidden />
                  <span className="sr-only">Previous animal: </span>
                  <EarTag tagId={prevTag} size="sm" />
                </Link>
              ) : (
                <span />
              )}
              <span className="text-center text-muted-foreground">
                {position + 1} of {lot.tagIds.length} in Lot {lot.number}
              </span>
              {nextTag ? (
                <Link to={`/animal/${nextTag}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-muted">
                  <span className="sr-only">Next animal: </span>
                  <EarTag tagId={nextTag} size="sm" />
                  <ChevronRight className="size-5" aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          <SaleStatus animal={animal} lot={lot} />
        </div>

        <Section
          id="weight-heading"
          title="Weight gain"
          description="Scale weights and camera estimates since birth, or over the last year for grown cattle."
        >
          <div className="rounded-xl border bg-card p-5 sm:p-6">
            <WeightGainChart animal={animal} />
          </div>
        </Section>

        <Section id="timeline-heading" title="Health timeline" description="Every shot, treatment, weigh-in, and scan on record, newest first.">
          <HealthTimeline animal={animal} />
        </Section>

        <Section
          id="scans-heading"
          title="Camera scans"
          description="Each pass through the chute camera tunnel, with how sure the camera was of its readings."
        >
          <ScanHistory animal={animal} />
        </Section>
      </div>

      {/* Printed page footer */}
      <footer className="mt-8 hidden border-t pt-3 text-sm print:block">
        {ranch.name}, {ranch.location.address}, {ranch.location.city}, {ranch.location.state} {ranch.location.zip}. {ranch.phone}. Weights marked as
        camera estimates come from the chute scanner; scale weights and health records are kept by the ranch.
      </footer>
    </div>
  )
}
