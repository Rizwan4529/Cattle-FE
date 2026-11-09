import { type FormEvent, useId, useState } from 'react'
import { ArrowRightLeft, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Animal, Lot, PricingMode } from '@/data/types'
import { RESCAN_BELOW } from '@/lib/chuteScan'
import { formatCurrency, formatCwt, formatNumber, pricePerCwt } from '@/lib/format'
import { COAT_LABELS, LOT_CLASS_LABELS, SEX_LABELS } from '@/lib/labels'
import { buildDraftLot, suggestLot } from '@/lib/lotDraft'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const PRICING: { value: PricingMode; label: string; hint: string }[] = [
  { value: 'both', label: 'Buy now or make an offer', hint: 'Most buyers like having both.' },
  { value: 'buy-now', label: 'Buy now only', hint: 'Fixed price, first come first served.' },
  { value: 'offer', label: 'Offers only', hint: 'You review every offer.' },
]

type Field = 'title' | 'price' | 'animals'

/**
 * Turns a set of animals (a chute scan, or rows picked in the herd table)
 * into a draft lot. Title and price are suggested and stay in step with the
 * selection until edited. Animals already in another unsold lot can be moved;
 * sold animals can't be picked.
 */
export function CreateLotDialog({
  open,
  onOpenChange,
  animals,
  source,
  pasture,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  animals: Animal[]
  source: 'scan' | 'herd'
  /** Where the cattle are kept; shown on the listing */
  pasture: string
  onCreated: (lot: Lot) => void
}) {
  const id = useId()
  const saveLot = useRanchStore((s) => s.saveLot)
  const lots = useRanchStore((s) => s.lots)
  const nextNumber = Math.max(100, ...lots.map((l) => l.number)) + 1
  const lotOf = new Map(lots.flatMap((l) => l.tagIds.map((t) => [t, l] as const)))
  const isSold = (a: Animal) => lotOf.get(a.tagId)?.status === 'sold'

  const [selected, setSelected] = useState(() => new Set(animals.filter((a) => !isSold(a)).map((a) => a.tagId)))
  const [title, setTitle] = useState<string | null>(null)
  const [price, setPrice] = useState<string | null>(null)
  const [pricingMode, setPricingMode] = useState<PricingMode>('both')
  const [error, setError] = useState<{ field: Field; message: string } | null>(null)

  const pickable = animals.filter((a) => !isSold(a))
  const chosen = pickable.filter((a) => selected.has(a.tagId))
  const suggestion = suggestLot(chosen, lots)
  const titleValue = title ?? suggestion.title
  const priceValue = price ?? String(suggestion.pricePerHead)
  const priceNumber = Number(priceValue) || 0
  const byPound = suggestion.lotClass === 'steers' || suggestion.lotClass === 'heifers'
  const lowCount = pickable.filter((a) => a.scanConfidence < RESCAN_BELOW).length
  const moving = chosen.filter((a) => lotOf.has(a.tagId))

  const toggle = (tag: string, on: boolean) => {
    setSelected((s) => {
      const next = new Set(s)
      if (on) next.add(tag)
      else next.delete(tag)
      return next
    })
    if (error?.field === 'animals') setError(null)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const problem: { field: Field; message: string } | null = !titleValue.trim()
      ? { field: 'title', message: 'Give the lot a title buyers will see.' }
      : !(priceNumber > 0)
        ? { field: 'price', message: 'Enter an asking price per head.' }
        : chosen.length === 0
          ? { field: 'animals', message: 'Choose at least one animal for the lot.' }
          : null
    setError(problem)
    if (problem) {
      document.getElementById(`${id}-${problem.field}`)?.focus()
      return
    }
    const lot = buildDraftLot({
      animals: chosen,
      number: nextNumber,
      title: titleValue,
      pricePerHead: Math.round(priceNumber),
      pricingMode,
      lotClass: suggestion.lotClass,
      source,
      pasture,
    })
    saveLot(lot, source === 'scan' ? chosen : [])
    onCreated(lot)
  }

  const describe = (field: Field, hint?: boolean) => (error?.field === field ? `${id}-${field}-error` : hint ? `${id}-${field}-hint` : undefined)
  const errorText = (field: Field) =>
    error?.field === field ? (
      <p id={`${id}-${field}-error`} className="text-sm font-medium text-destructive">
        {error.message}
      </p>
    ) : null
  const suggestionLink = (reset: () => void) => (
    <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={reset}>
      Use the suggestion
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            Create Lot {nextNumber} from {source === 'scan' ? 'this scan' : 'your selection'}
          </DialogTitle>
          <DialogDescription className="text-base">The lot is saved as a draft. Buyers won't see it until you publish it.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-title`}>Lot title</Label>
            <Input
              id={`${id}-title`}
              value={titleValue}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error?.field === 'title') setError(null)
              }}
              aria-invalid={error?.field === 'title'}
              aria-describedby={describe('title', true)}
            />
            {errorText('title') ?? (
              <p id={`${id}-title-hint`} className="text-sm text-muted-foreground">
                {title === null ? (
                  `Suggested from the animals. Listed as ${LOT_CLASS_LABELS[suggestion.lotClass].toLowerCase()}.`
                ) : (
                  <>Your title. {suggestionLink(() => setTitle(null))}</>
                )}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${id}-price`}>Asking price ($/{suggestion.lotClass === 'pairs' ? 'pair' : 'head'})</Label>
            <Input
              id={`${id}-price`}
              type="number"
              inputMode="numeric"
              min={1}
              step={25}
              value={priceValue}
              onChange={(e) => {
                setPrice(e.target.value)
                if (error?.field === 'price') setError(null)
              }}
              aria-invalid={error?.field === 'price'}
              aria-describedby={describe('price', true)}
              className="max-w-48"
            />
            {errorText('price') ?? (
              <p id={`${id}-price-hint`} className="text-sm text-muted-foreground">
                {price === null ? (
                  byPound && suggestion.cwt ? (
                    `Suggested at ${formatCwt(suggestion.cwt)} (${suggestion.basis}) on a ${formatNumber(suggestion.avgWeight)} lb average.`
                  ) : (
                    `Suggested from ${suggestion.basis}.`
                  )
                ) : (
                  <>
                    {byPound &&
                      `About ${formatCwt(pricePerCwt(priceNumber, suggestion.avgWeight))} on a ${formatNumber(suggestion.avgWeight)} lb average. `}
                    {suggestionLink(() => setPrice(null))}
                  </>
                )}
              </p>
            )}
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-3 text-base font-medium">How buyers can buy</legend>
            <RadioGroup value={pricingMode} onValueChange={(v) => setPricingMode(v as PricingMode)} className="grid gap-2">
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

          <fieldset className="grid gap-3" aria-describedby={describe('animals', true)}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <legend className="text-base font-medium">
                Animals in the lot ({chosen.length} of {pickable.length})
              </legend>
              <button
                type="button"
                id={`${id}-animals`}
                className="min-h-11 font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setSelected(chosen.length === pickable.length ? new Set() : new Set(pickable.map((a) => a.tagId)))}
              >
                {chosen.length === pickable.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            {errorText('animals') ?? (
              <div id={`${id}-animals-hint`} className="grid gap-1 text-sm text-muted-foreground">
                {suggestion.mixed && (
                  <p className="flex items-start gap-1.5 font-medium text-warning-foreground dark:text-warning">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    These animals span more than one class. Buyers expect one class per lot; this one will list as{' '}
                    {LOT_CLASS_LABELS[suggestion.lotClass].toLowerCase()}.
                  </p>
                )}
                {moving.length > 0 && (
                  <p>
                    {moving.length === 1 ? 'One animal moves' : `${moving.length} animals move`} out of {moving.length === 1 ? 'its' : 'their'}{' '}
                    current lot. A lot left with no animals is taken down.
                  </p>
                )}
                {lowCount > 0 && source === 'scan' && (
                  <p>
                    {lowCount === 1 ? 'One animal' : `${lowCount} animals`} read below {RESCAN_BELOW}% confidence. You can leave{' '}
                    {lowCount === 1 ? 'it' : 'them'} out and rescan later.
                  </p>
                )}
              </div>
            )}
            <ul className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border p-1.5">
              {animals.map((a) => {
                const low = source === 'scan' && a.scanConfidence < RESCAN_BELOW
                const current = lotOf.get(a.tagId)
                const sold = current?.status === 'sold'
                const checkId = `${id}-pick-${a.tagId}`
                return (
                  <li key={a.tagId}>
                    <label
                      htmlFor={checkId}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-md px-2.5 py-1.5',
                        sold ? 'opacity-60' : 'cursor-pointer hover:bg-muted',
                        low && 'bg-warning/10',
                      )}
                    >
                      <Checkbox
                        id={checkId}
                        disabled={sold}
                        checked={!sold && selected.has(a.tagId)}
                        onCheckedChange={(v) => toggle(a.tagId, v === true)}
                      />
                      <span className="w-24 shrink-0 font-heading text-lg font-bold">{a.tagId}</span>
                      <span className="min-w-0 flex-1 text-muted-foreground">
                        {source === 'scan' ? COAT_LABELS[a.coatColor] : SEX_LABELS[a.sex]}
                        {current && (
                          <span className="flex items-center gap-1 text-sm">
                            {sold ? (
                              `Sold in Lot ${current.number}`
                            ) : (
                              <>
                                <ArrowRightLeft className="size-3.5" aria-hidden />
                                Moves from Lot {current.number}
                              </>
                            )}
                          </span>
                        )}
                      </span>
                      {low && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning-foreground dark:text-warning">
                          <TriangleAlert className="size-4" aria-hidden />
                          {a.scanConfidence}%
                        </span>
                      )}
                      <span className="w-20 shrink-0 text-right font-semibold tabular-nums">{formatNumber(a.estWeight)} lb</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>

          <div className="grid grid-cols-3 gap-3 rounded-lg bg-secondary px-4 py-3 text-secondary-foreground" aria-live="polite">
            <div>
              <p className="text-sm">Head</p>
              <p className="font-heading text-2xl font-bold tabular-nums">{chosen.length}</p>
            </div>
            <div>
              <p className="text-sm">Average</p>
              <p className="font-heading text-2xl font-bold tabular-nums">{formatNumber(suggestion.avgWeight)} lb</p>
            </div>
            <div>
              <p className="text-sm">Lot total</p>
              <p className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(priceNumber * chosen.length)}</p>
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 gap-2 px-6 py-4">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="lg">
              Create draft lot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
