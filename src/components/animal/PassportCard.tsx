import { type ReactNode, useState } from 'react'
import { BadgeCheck, Camera } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router'
import { CattleImage, type CattleImageProps } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { BrandMark } from '@/components/layout/RanchBrand'
import { ranch } from '@/config/ranch'
import type { Animal, Lot } from '@/data/types'
import { formatEid } from '@/lib/animalTimeline'
import { daysSince, formatAge, formatDate, formatNumber, formatShortDate } from '@/lib/format'
import { COAT_LABELS, SEX_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0 border-t pt-2', wide && 'col-span-2')}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  )
}

/**
 * The animal's ID record. Styled like an official card: leather header band,
 * the ranch brand, the ear tag front and center, and a QR code back to this page.
 */
export function PassportCard({ animal, lot, damExists }: { animal: Animal; lot?: Lot; damExists: boolean }) {
  const sexLabel = SEX_LABELS[animal.sex]
  const views: CattleImageProps[] = [
    {
      coat: animal.coatColor,
      sex: animal.sex,
      withCalf: Boolean(animal.calfAtSide),
      photos: animal.photos,
      photoIndex: 0,
      seed: `${animal.tagId}-a`,
      pose: 'standing',
      alt: `${animal.tagId}, standing`,
    },
    {
      coat: animal.coatColor,
      sex: animal.sex,
      withCalf: Boolean(animal.calfAtSide),
      photos: animal.photos,
      photoIndex: 1,
      seed: `${animal.tagId}-b`,
      pose: animal.sex === 'bull' ? 'standing' : 'grazing',
      alt: `${animal.tagId}, second view`,
    },
    {
      coat: animal.coatColor,
      sex: animal.sex,
      withCalf: Boolean(animal.calfAtSide),
      photos: animal.photos,
      photoIndex: 2,
      seed: `${animal.tagId}-c`,
      pose: 'standing',
      alt: `${animal.tagId}, third view`,
    },
  ]
  const [view, setView] = useState(0)
  const url = `${window.location.origin}/animal/${animal.tagId}`

  return (
    <article
      aria-labelledby="passport-title"
      className="overflow-hidden rounded-2xl border-2 border-leather/25 bg-card shadow-sm print:break-inside-avoid print:rounded-none print:shadow-none"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 bg-leather px-5 py-3 text-leather-foreground print:border-b-2 print:border-leather">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 text-tag" />
          <div>
            <p className="font-heading text-lg leading-tight font-bold">{ranch.name}</p>
            <p className="text-sm text-leather-foreground/75">Animal record</p>
          </div>
        </div>
        <p className="text-sm text-leather-foreground/75">Updated {formatDate(animal.weighIns.at(-1)?.date ?? animal.scanDate)}</p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] print:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-3 border-b p-5 md:border-r md:border-b-0 print:border-r print:border-b-0">
          <div className="relative aspect-4/3 overflow-hidden rounded-lg border">
            <CattleImage {...views[view]} />
            {animal.scans.length > 0 && (
              <div className="absolute right-3 bottom-3 -rotate-6 rounded-md border-2 border-success bg-card/90 px-2.5 py-1 text-success shadow-sm">
                <p className="flex items-center gap-1 text-sm font-bold">
                  <Camera className="size-4" aria-hidden />
                  Camera verified
                </p>
                <p className="text-xs font-semibold tabular-nums">
                  {formatShortDate(animal.scanDate)}, {animal.scanConfidence}%
                </p>
              </div>
            )}
          </div>
          <ul className="grid grid-cols-3 gap-2 print:hidden">
            {views.map((v, i) => (
              <li key={v.seed}>
                <button
                  type="button"
                  onClick={() => setView(i)}
                  aria-current={i === view}
                  aria-label={`Show view ${i + 1}`}
                  className={cn(
                    'block aspect-4/3 w-full overflow-hidden rounded-md border-2 border-transparent opacity-70 transition hover:opacity-100',
                    i === view && 'border-primary opacity-100',
                  )}
                >
                  <CattleImage {...v} alt="" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid content-start gap-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 id="passport-title">
                <span className="sr-only">Animal record for </span>
                <EarTag tagId={animal.tagId} size="lg" />
              </h1>
              <p className="mt-3 font-heading text-2xl font-bold">
                {animal.breed} {sexLabel.toLowerCase()}
              </p>
              {animal.eid && (
                <p className="mt-1 text-muted-foreground">
                  Electronic ID <span className="font-semibold text-foreground tabular-nums">{formatEid(animal.eid)}</span>
                </p>
              )}
            </div>
            <div className="hidden shrink-0 rounded-md bg-white p-1.5 sm:block print:block">
              <QRCodeSVG value={url} size={92} level="M" bgColor="#FFFFFF" fgColor="#1F1A16" title={`QR code for ${animal.tagId}`} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Field label="Born">
              {formatDate(animal.birthDate)} <span className="font-normal text-muted-foreground">({formatAge(animal.birthDate)})</span>
            </Field>
            <Field label="Sex">{sexLabel}</Field>
            <Field label="Coat">{COAT_LABELS[animal.coatColor]}</Field>
            <Field label="Est. weight">{formatNumber(animal.estWeight)} lb</Field>
            <Field label="Frame score">{animal.frameScore} of 9</Field>
            <Field label="Body condition">{animal.bcs} of 9</Field>
            {animal.sire && <Field label="Sire">{animal.sire}</Field>}
            {animal.dam && (
              <Field label="Dam">
                {damExists ? (
                  <Link to={`/animal/${animal.dam}`} className="text-primary underline-offset-4 hover:underline">
                    {animal.dam}
                  </Link>
                ) : (
                  animal.dam
                )}
              </Field>
            )}
            {animal.registration && <Field label="Registration">{animal.registration}</Field>}
            <Field label="Weaned">
              {animal.weanDate ? (
                <>
                  {formatShortDate(animal.weanDate)} <span className="font-normal text-muted-foreground">({daysSince(animal.weanDate)} days)</span>
                </>
              ) : !animal.weaned ? (
                'Not yet'
              ) : daysSince(animal.birthDate) > 540 ? (
                'Yes, grown'
              ) : (
                'Yes'
              )}
            </Field>
            {/* Preconditioning is a weaned-calf program; it doesn't apply to grown cattle. */}
            {animal.weanDate && <Field label="Preconditioned">{animal.preconditioned ? 'Yes, VAC-45' : 'Not yet'}</Field>}
            <Field label="Age and source">{animal.ageSourceVerified ? 'Verified' : 'Not verified'}</Field>
            {animal.pregnancy && (
              <Field label="Pregnancy" wide>
                {animal.pregnancy.status === 'bred' ? `Bred to ${animal.pregnancy.bredTo}. Due ${formatDate(animal.pregnancy.dueDate!)}.` : 'Open'}
              </Field>
            )}
            {animal.calfAtSide && (
              <Field label="Calf at side" wide>
                {animal.calfAtSide.tagId}, {animal.calfAtSide.sex} born {formatShortDate(animal.calfAtSide.birthDate)},{' '}
                {formatNumber(animal.calfAtSide.estWeight)} lb
              </Field>
            )}
            {lot && (
              <Field label="Lot">
                <Link to={`/lots/${lot.id}`} className="text-primary underline-offset-4 hover:underline">
                  Lot {lot.number}
                </Link>
              </Field>
            )}
          </dl>

          {animal.notes && (
            <p className="rounded-lg bg-secondary/60 px-4 py-3">
              <span className="font-semibold">Ranch notes: </span>
              {animal.notes}
            </p>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t bg-muted/40 px-5 py-3 text-sm">
        {[
          animal.ageSourceVerified && 'Age and source verified',
          animal.eid && 'RFID tagged',
          'BQA certified ranch',
          animal.health.length > 0 && `${animal.health.length} health records`,
        ]
          .filter(Boolean)
          .map((t) => (
            <span key={t as string} className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-success" aria-hidden />
              {t}
            </span>
          ))}
      </footer>
    </article>
  )
}
