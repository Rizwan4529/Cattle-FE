import { type FormEvent, type ReactNode, useId, useState } from 'react'
import { ArrowRightLeft, ChevronLeft, Megaphone, Save, Search, Sparkles, Trash2, TriangleAlert } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { LotCard } from '@/components/lots/LotCard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ranch } from '@/config/ranch'
import { DEMO_TODAY } from '@/data/animals'
import type { Animal, Lot, LotClass, PricingMode } from '@/data/types'
import { HERD_CLASSES, type HerdClassId, indexLots } from '@/lib/dashboard'
import { formatCurrency, formatCwt, formatNumber } from '@/lib/format'
import { LOT_CLASS_LABELS, priceUnit, SEX_LABELS } from '@/lib/labels'
import { addDays, breedSummaryOf, buildDraftLot, describeLot, highlightsFor, inferLotClass, suggestLot } from '@/lib/lotDraft'
import { getLotStats } from '@/lib/lots'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const PRICING: { value: PricingMode; label: string; hint: string }[] = [
  { value: 'both', label: 'Buy now or make an offer', hint: 'Most buyers like having both.' },
  { value: 'buy-now', label: 'Buy now only', hint: 'Fixed price, first come first served.' },
  { value: 'offer', label: 'Offers only', hint: 'You review every offer.' },
]

type Field = 'animals' | 'title' | 'price' | 'minHead' | 'pickupEnd' | 'pasture'
type Errors = Partial<Record<Field, string>>
type Show = 'free' | 'all' | 'selected'

/**
 * Form state. A `null` means "follow the suggestion", so the title, price,
 * class, and description keep up with the animals picked until the owner
 * types their own.
 */
interface FormState {
  selected: Set<string>
  title: string | null
  lotClass: LotClass | null
  breedSummary: string | null
  description: string | null
  highlights: string[] | null
  price: string | null
  pricingMode: PricingMode
  allowPartial: boolean
  minHead: string
  pasture: string
  pickupStart: string
  pickupEnd: string
  featured: boolean
}

function initialState(lot: Lot | undefined, tags: string[]): FormState {
  if (lot) {
    return {
      selected: new Set(lot.tagIds),
      title: lot.title,
      lotClass: lot.class,
      breedSummary: lot.breedSummary,
      description: lot.description,
      highlights: [...lot.highlights, '', '', '', ''].slice(0, 4),
      price: String(lot.pricePerHead),
      pricingMode: lot.pricingMode,
      allowPartial: lot.allowPartial,
      minHead: String(lot.minHead ?? 2),
      pasture: lot.location.pasture,
      pickupStart: lot.pickupWindow.start,
      pickupEnd: lot.pickupWindow.end,
      featured: lot.featured,
    }
  }
  return {
    selected: new Set(tags),
    title: null,
    lotClass: null,
    breedSummary: null,
    description: null,
    highlights: null,
    price: null,
    pricingMode: 'both',
    allowPartial: true,
    minHead: '2',
    pasture: 'Home pasture',
    pickupStart: addDays(DEMO_TODAY, 7),
    pickupEnd: addDays(DEMO_TODAY, 35),
    featured: false,
  }
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div>
        <h2 id={id} className="text-2xl font-bold">
          {title}
        </h2>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="text-sm font-medium text-destructive">
      {error}
    </p>
  ) : null
}

function SuggestionButton({ onClick, children = 'Use the suggestion' }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
      <Sparkles className="size-3.5" aria-hidden />
      {children}
    </button>
  )
}

function LotBuilderForm({ existing, initialTags }: { existing?: Lot; initialTags: string[] }) {
  const id = useId()
  const navigate = useNavigate()
  const animals = useRanchStore((s) => s.animals)
  const lots = useRanchStore((s) => s.lots)
  const saveLot = useRanchStore((s) => s.saveLot)
  const deleteLot = useRanchStore((s) => s.deleteLot)
  const index = indexLots(lots)

  const [form, setForm] = useState<FormState>(() => initialState(existing, initialTags))
  const [errors, setErrors] = useState<Errors>({})
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState<HerdClassId | 'all'>('all')
  const [show, setShow] = useState<Show>(existing || initialTags.length ? 'all' : 'free')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    const field = key === 'selected' ? 'animals' : key === 'pickupStart' ? 'pickupEnd' : key
    if (field in errors) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  // Animals that can go in this lot: anything not sold in another lot.
  const isOwn = (tag: string) => existing?.tagIds.includes(tag) ?? false
  const available = animals.filter((a) => isOwn(a.tagId) || index.get(a.tagId)?.status !== 'sold')
  const chosen = available.filter((a) => form.selected.has(a.tagId))
  const moving = chosen.filter((a) => index.has(a.tagId) && !isOwn(a.tagId))
  const q = query
    .trim()
    .toLowerCase()
    .replace(/^hcr-?/, '')
  const classMatch = HERD_CLASSES.find((c) => c.id === classFilter)?.match
  const listed = available
    .filter((a) => show !== 'selected' || form.selected.has(a.tagId))
    .filter((a) => show !== 'free' || !index.has(a.tagId) || isOwn(a.tagId) || form.selected.has(a.tagId))
    .filter((a) => !classMatch || classMatch(a))
    .filter((a) => !q || a.tagId.toLowerCase().includes(q) || a.breed.toLowerCase().includes(q))
    .sort((a, b) => Number(form.selected.has(b.tagId)) - Number(form.selected.has(a.tagId)) || a.tagId.localeCompare(b.tagId))

  // Suggestions, recomputed from the animals picked
  const suggestion = suggestLot(
    chosen,
    lots.filter((l) => l.id !== existing?.id),
  )
  const inferred = inferLotClass(chosen)
  const lotClass = form.lotClass ?? suggestion.lotClass
  const title = form.title ?? suggestion.title
  const price = form.price ?? (chosen.length ? String(suggestion.pricePerHead) : '')
  const priceNumber = Math.round(Number(price)) || 0
  const breedSummary = form.breedSummary ?? (chosen.length ? breedSummaryOf(chosen) : '')
  const description = form.description ?? (chosen.length ? describeLot(chosen, lotClass, 'herd') : '')
  const highlights = form.highlights ?? [...highlightsFor(chosen, lotClass), '', '', '', ''].slice(0, 4)
  const unit = priceUnit(lotClass)
  const byPound = lotClass === 'steers' || lotClass === 'heifers'

  const nextNumber = Math.max(100, ...lots.map((l) => l.number)) + 1
  const number = existing?.number ?? nextNumber

  const buildLot = (publish: boolean): Lot => {
    const base =
      existing ??
      buildDraftLot({
        animals: chosen,
        number,
        title,
        pricePerHead: priceNumber,
        pricingMode: form.pricingMode,
        lotClass,
        source: 'herd',
        pasture: form.pasture,
      })
    const partial = form.allowPartial && form.pricingMode !== 'buy-now' && chosen.length > 1
    return {
      ...base,
      title: title.trim(),
      class: lotClass,
      breedSummary: breedSummary.trim() || breedSummaryOf(chosen),
      description: description.trim(),
      tagIds: chosen.map((a) => a.tagId),
      pricePerHead: priceNumber,
      pricingMode: form.pricingMode,
      allowPartial: partial,
      minHead: partial ? Number(form.minHead) : undefined,
      location: { pasture: form.pasture.trim(), city: ranch.location.city, state: ranch.location.state },
      pickupWindow: { start: form.pickupStart, end: form.pickupEnd },
      highlights: highlights.map((h) => h.trim()).filter(Boolean),
      featured: form.featured,
      draft: publish ? false : (existing?.draft ?? true),
      listedAt: publish && (existing?.draft ?? true) ? DEMO_TODAY : base.listedAt,
    }
  }

  const preview = buildLot(false)
  const stats = getLotStats(preview, animals)

  const validate = (): Errors => {
    const e: Errors = {}
    if (chosen.length === 0) e.animals = 'Pick at least one animal for the lot.'
    if (!title.trim()) e.title = 'Give the lot a title buyers will see.'
    if (!(priceNumber > 0)) e.price = `Enter an asking price per ${unit}.`
    if (form.allowPartial && form.pricingMode !== 'buy-now' && chosen.length > 1) {
      const m = Number(form.minHead)
      if (!Number.isInteger(m) || m < 1 || m > chosen.length) e.minHead = `Choose between 1 and ${chosen.length} head.`
    }
    if (!form.pasture.trim()) e.pasture = 'Say where the cattle are, like "North pasture".'
    if (!form.pickupStart || !form.pickupEnd || form.pickupEnd < form.pickupStart) e.pickupEnd = 'The last pickup day must be on or after the first.'
    return e
  }

  const submit = (publish: boolean) => (e?: FormEvent) => {
    e?.preventDefault()
    const found = validate()
    setErrors(found)
    const first = (['animals', 'title', 'price', 'minHead', 'pasture', 'pickupEnd'] as Field[]).find((f) => found[f])
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      toast.error('Check the highlighted fields', { description: found[first] })
      return
    }
    const lot = buildLot(publish)
    saveLot(lot)
    const wasDraft = existing?.draft ?? true
    toast.success(publish && wasDraft ? `Lot ${lot.number} published` : existing ? `Lot ${lot.number} saved` : `Draft Lot ${lot.number} saved`, {
      description:
        publish && wasDraft
          ? 'It now shows on the Browse page.'
          : lot.draft
            ? 'Buyers will see it once you publish it.'
            : 'Buyers see the changes right away.',
    })
    navigate(`/lots/${lot.id}`)
  }

  const err = (f: Field) => (errors[f] ? `${id}-${f}-error` : undefined)
  const toggle = (a: Animal, on: boolean) => {
    const next = new Set(form.selected)
    if (on) next.add(a.tagId)
    else next.delete(a.tagId)
    set('selected', next)
  }

  return (
    // Pressing Enter in a field saves without changing whether the lot is public.
    <form onSubmit={submit(Boolean(existing && !existing.draft))} noValidate className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="@container grid min-w-0 gap-6">
        {/* Animals */}
        <Section
          id={`${id}-animals-heading`}
          title="1. Pick the animals"
          description="Head count, weights, and totals are worked out from the animals you pick."
        >
          <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_12rem_12rem]">
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-q`}>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id={`${id}-q`}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                  placeholder="Tag or breed"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-class-filter`}>Class</Label>
              <Select value={classFilter} onValueChange={(v) => setClassFilter(v as HerdClassId | 'all')}>
                <SelectTrigger id={`${id}-class-filter`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {HERD_CLASSES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-show`}>Show</Label>
              <Select value={show} onValueChange={(v) => setShow(v as Show)}>
                <SelectTrigger id={`${id}-show`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Not in another lot</SelectItem>
                  <SelectItem value="all">All unsold animals</SelectItem>
                  <SelectItem value="selected">Picked only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-muted/60 p-4 tabular-nums @xl:grid-cols-4" aria-live="polite">
            {[
              { label: 'Head', value: String(chosen.length) },
              { label: 'Average weight', value: chosen.length ? `${formatNumber(stats.avgWeight)} lb` : '–' },
              { label: 'Range', value: chosen.length ? `${formatNumber(stats.minWeight)}–${formatNumber(stats.maxWeight)} lb` : '–' },
              { label: 'Total weight', value: chosen.length ? `${formatNumber(chosen.reduce((n, a) => n + a.estWeight, 0))} lb` : '–' },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="font-heading text-2xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>

          {(moving.length > 0 || inferred.mixed) && (
            <div className="grid gap-1 text-sm">
              {moving.length > 0 && (
                <p className="flex items-start gap-1.5">
                  <ArrowRightLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {moving.map((a) => a.tagId).join(', ')} {moving.length === 1 ? 'moves' : 'move'} out of {moving.length === 1 ? 'its' : 'their'}{' '}
                  current lot when you save. A lot left with no animals is taken down.
                </p>
              )}
              {inferred.mixed && (
                <p className="flex items-start gap-1.5 font-medium text-warning-foreground dark:text-warning">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  These animals span more than one class. Buyers expect one class per lot.
                </p>
              )}
            </div>
          )}

          <FieldError id={`${id}-animals-error`} error={errors.animals} />
          <div
            id={`${id}-animals`}
            tabIndex={-1}
            className={cn('max-h-[26rem] overflow-y-auto rounded-xl border', errors.animals && 'border-destructive')}
            aria-describedby={err('animals')}
          >
            {listed.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                {show === 'free' ? 'Every animal is already in a lot. Choose "All unsold animals" to move some.' : 'No animals match.'}
              </p>
            ) : (
              <ul className="divide-y">
                {listed.map((a) => {
                  const current = index.get(a.tagId)
                  const checkId = `${id}-pick-${a.tagId}`
                  const on = form.selected.has(a.tagId)
                  return (
                    <li key={a.tagId}>
                      <label
                        htmlFor={checkId}
                        className={cn('flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted', on && 'bg-primary/5')}
                      >
                        <Checkbox id={checkId} checked={on} onCheckedChange={(v) => toggle(a, v === true)} />
                        <span className="w-24 shrink-0 font-heading text-lg font-bold">{a.tagId}</span>
                        <span className="min-w-0 flex-1">
                          {a.breed} {SEX_LABELS[a.sex].toLowerCase()}
                          {current && !isOwn(a.tagId) && (
                            <span className="block text-sm text-muted-foreground">
                              In Lot {current.number}
                              {current.draft ? ' (draft)' : ''}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-right font-semibold tabular-nums">{formatNumber(a.estWeight)} lb</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Section>

        {/* Listing details */}
        <Section id={`${id}-details-heading`} title="2. Describe the lot" description="Suggested from the animals. Change anything.">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-title`}>Title</Label>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(e) => set('title', e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={[err('title'), `${id}-title-hint`].filter(Boolean).join(' ')}
            />
            <FieldError id={`${id}-title-error`} error={errors.title} />
            {(!errors.title || (form.title !== null && suggestion.title)) && (
              <p id={`${id}-title-hint`} className="text-sm text-muted-foreground">
                {form.title === null ? (
                  'Suggested from the animals; it updates as you pick.'
                ) : suggestion.title && suggestion.title !== title ? (
                  <>
                    Suggested: {suggestion.title}. <SuggestionButton onClick={() => set('title', null)} />
                  </>
                ) : (
                  'Shown on Browse and at the top of the listing.'
                )}
              </p>
            )}
          </div>

          <div className="grid gap-5 @xl:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-class`}>Class</Label>
              <Select value={lotClass} onValueChange={(v) => set('lotClass', v as LotClass)}>
                <SelectTrigger id={`${id}-class`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LOT_CLASS_LABELS) as LotClass[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {LOT_CLASS_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.lotClass !== null && form.lotClass !== inferred.lotClass && chosen.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  The animals look like {LOT_CLASS_LABELS[inferred.lotClass].toLowerCase()}.{' '}
                  <SuggestionButton onClick={() => set('lotClass', null)}>Use {LOT_CLASS_LABELS[inferred.lotClass].toLowerCase()}</SuggestionButton>
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-breed`}>Breed</Label>
              <Input id={`${id}-breed`} value={breedSummary} onChange={(e) => set('breedSummary', e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${id}-description`}>Description</Label>
            <Textarea id={`${id}-description`} rows={4} value={description} onChange={(e) => set('description', e.target.value)} />
            {form.description !== null && chosen.length > 0 && (
              <p className="text-sm">
                <SuggestionButton onClick={() => set('description', null)}>Write it for me again</SuggestionButton>
              </p>
            )}
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-base font-medium">Highlights (up to 4)</legend>
            <div className="grid gap-2 @xl:grid-cols-2">
              {highlights.map((h, i) => (
                <Input
                  key={i}
                  value={h}
                  aria-label={`Highlight ${i + 1}`}
                  placeholder={i === 0 ? 'Weaned 60+ days' : ''}
                  onChange={(e) =>
                    set(
                      'highlights',
                      highlights.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                />
              ))}
            </div>
            {form.highlights !== null && chosen.length > 0 && (
              <p className="text-sm">
                <SuggestionButton onClick={() => set('highlights', null)}>Suggest highlights from the records</SuggestionButton>
              </p>
            )}
          </fieldset>
        </Section>

        {/* Price */}
        <Section id={`${id}-price-heading`} title="3. Set the price">
          <div className="grid gap-5 @xl:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-price`}>Asking price ($/{unit})</Label>
              <Input
                id={`${id}-price`}
                type="number"
                inputMode="numeric"
                min={1}
                step={25}
                value={price}
                onChange={(e) => set('price', e.target.value)}
                aria-invalid={Boolean(errors.price)}
                aria-describedby={err('price') ?? `${id}-price-hint`}
              />
              <FieldError id={`${id}-price-error`} error={errors.price} />
              {!errors.price && chosen.length > 0 && (
                <p id={`${id}-price-hint`} className="text-sm text-muted-foreground">
                  Suggested {formatCurrency(suggestion.pricePerHead)}, from{' '}
                  {byPound && suggestion.cwt ? `${formatCwt(suggestion.cwt)} (${suggestion.basis})` : suggestion.basis}.{' '}
                  {form.price !== null && Number(form.price) !== suggestion.pricePerHead && <SuggestionButton onClick={() => set('price', null)} />}
                </p>
              )}
            </div>
            <dl className="grid content-start gap-3 rounded-xl bg-secondary px-4 py-3 text-secondary-foreground tabular-nums">
              <div>
                <dt className="text-sm">Lot total</dt>
                <dd className="font-heading text-3xl font-bold">{formatCurrency(stats.lotTotal)}</dd>
              </div>
              {byPound && stats.avgWeight > 0 && priceNumber > 0 && (
                <div>
                  <dt className="text-sm">Price per hundredweight</dt>
                  <dd className="font-heading text-xl font-bold">{formatCwt(stats.pricePerCwt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-3 text-base font-medium">How buyers can buy</legend>
            <RadioGroup value={form.pricingMode} onValueChange={(v) => set('pricingMode', v as PricingMode)} className="grid gap-2 @2xl:grid-cols-3">
              {PRICING.map((p) => (
                <Label
                  key={p.value}
                  htmlFor={`${id}-mode-${p.value}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                >
                  <RadioGroupItem id={`${id}-mode-${p.value}`} value={p.value} className="mt-0.5" />
                  <span>
                    <span className="block font-semibold">{p.label}</span>
                    <span className="text-sm text-muted-foreground">{p.hint}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          {form.pricingMode !== 'buy-now' && chosen.length > 1 && (
            <div className="grid gap-3 @xl:grid-cols-[auto_10rem] @xl:items-end @xl:gap-6">
              <Label htmlFor={`${id}-partial`} className="flex min-h-11 cursor-pointer items-center gap-3 font-normal">
                <Switch id={`${id}-partial`} checked={form.allowPartial} onCheckedChange={(v) => set('allowPartial', v)} />
                Take offers on part of the lot
              </Label>
              {form.allowPartial && (
                <div className="grid gap-1.5">
                  <Label htmlFor={`${id}-minHead`}>Fewest head</Label>
                  <Input
                    id={`${id}-minHead`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={chosen.length}
                    value={form.minHead}
                    onChange={(e) => set('minHead', e.target.value)}
                    aria-invalid={Boolean(errors.minHead)}
                    aria-describedby={err('minHead')}
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <FieldError id={`${id}-minHead-error`} error={errors.minHead} />
              </div>
            </div>
          )}
        </Section>

        {/* Pickup */}
        <Section id={`${id}-pickup-heading`} title="4. Pickup" description="Cattle stay on the ranch until the buyer picks them up.">
          <div className="grid gap-5 @xl:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-pasture`}>Where they are</Label>
              <Input
                id={`${id}-pasture`}
                value={form.pasture}
                onChange={(e) => set('pasture', e.target.value)}
                aria-invalid={Boolean(errors.pasture)}
                aria-describedby={err('pasture')}
              />
              <FieldError id={`${id}-pasture-error`} error={errors.pasture} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-pickupStart`}>First pickup day</Label>
              <Input id={`${id}-pickupStart`} type="date" value={form.pickupStart} onChange={(e) => set('pickupStart', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-pickupEnd`}>Last pickup day</Label>
              <Input
                id={`${id}-pickupEnd`}
                type="date"
                value={form.pickupEnd}
                min={form.pickupStart}
                onChange={(e) => set('pickupEnd', e.target.value)}
                aria-invalid={Boolean(errors.pickupEnd)}
                aria-describedby={err('pickupEnd')}
              />
              <FieldError id={`${id}-pickupEnd-error`} error={errors.pickupEnd} />
            </div>
          </div>
          <Label htmlFor={`${id}-featured`} className="flex min-h-11 cursor-pointer items-center gap-3 font-normal">
            <Switch id={`${id}-featured`} checked={form.featured} onCheckedChange={(v) => set('featured', v)} />
            Feature on the home page
          </Label>
        </Section>
      </div>

      {/* Preview and save */}
      <aside aria-label="Preview and save" className="grid content-start gap-5 xl:sticky xl:top-28 xl:self-start">
        <div className="grid gap-3">
          <h2 className="text-2xl font-bold">How buyers will see it</h2>
          {chosen.length ? (
            // The preview is a picture of the card, not a working one.
            <div inert className="select-none">
              <LotCard lot={preview} stats={stats} />
            </div>
          ) : (
            <p className="rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground">Pick animals to see the listing.</p>
          )}
        </div>

        <div className="grid gap-2 rounded-2xl border bg-card p-5">
          {existing && !existing.draft ? (
            <Button type="button" size="lg" onClick={() => submit(true)()}>
              <Save aria-hidden />
              Save changes
            </Button>
          ) : (
            <>
              <Button type="button" size="lg" onClick={() => submit(true)()}>
                <Megaphone aria-hidden />
                {existing ? 'Save and publish' : 'Publish lot'}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => submit(false)()}>
                <Save aria-hidden />
                {existing ? 'Save draft' : 'Save as draft'}
              </Button>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            {existing && !existing.draft ? 'Changes show on the listing right away.' : 'Drafts are only visible to you until published.'}
          </p>
          {existing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="mt-2 justify-self-start text-destructive hover:text-destructive">
                  <Trash2 aria-hidden />
                  Take down this lot
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-heading text-2xl">Take down Lot {existing.number}?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    The listing is removed from the site. The animals stay in your herd, and offers on it stay in your inbox.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel size="lg">Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    size="lg"
                    variant="destructive"
                    onClick={() => {
                      deleteLot(existing.id)
                      toast(`Lot ${existing.number} taken down`, { description: 'The animals are back in your herd as unlisted.' })
                      navigate('/dashboard/lots')
                    }}
                  >
                    Take it down
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </aside>
    </form>
  )
}

export default function LotBuilderPage() {
  const { lotId } = useParams()
  const [params] = useSearchParams()
  const lot = useRanchStore((s) => (lotId ? s.lots.find((l) => l.id === lotId) : undefined))
  const editing = Boolean(lotId)
  usePageTitle(editing ? (lot ? `Edit Lot ${lot.number}` : 'Lot not found') : 'New lot')
  const initialTags = (params.get('tags') ?? '').split(',').filter(Boolean)

  const back = (
    <Link to="/dashboard/lots" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
      <ChevronLeft className="size-4" aria-hidden />
      Your lots
    </Link>
  )

  if (editing && !lot) {
    return (
      <div className="max-w-2xl">
        {back}
        <h1 className="mt-4 text-4xl font-bold">That lot isn't here</h1>
        <p className="mt-3 text-lg text-muted-foreground">It may have been taken down. Pick another from your lots.</p>
      </div>
    )
  }

  if (lot?.status === 'sold') {
    return (
      <div className="max-w-2xl">
        {back}
        <h1 className="mt-4 text-4xl font-bold">Lot {lot.number} has sold</h1>
        <p className="mt-3 text-lg text-muted-foreground">Sold lots are kept as they were sold, so they can't be changed.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to={`/lots/${lot.id}`}>See the listing</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      {back}
      <div className="pt-2 pb-8">
        <h1 className="text-4xl font-bold">{lot ? `Edit Lot ${lot.number}` : 'Build a new lot'}</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          {lot
            ? `${lot.draft ? 'A draft' : 'Listed for sale'}. Change the animals, wording, or price; the preview updates as you go.`
            : 'Pick the animals, check the wording and price, and see the listing before buyers do.'}
        </p>
      </div>
      <LotBuilderForm key={lot?.id ?? 'new'} existing={lot} initialTags={initialTags} />
    </div>
  )
}
