import { type FormEvent, useId, useState } from 'react'
import { CalendarClock, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { beefConfig, feedProgram } from '@/config/beef'
import type { SharePool, ShareSize, UnfilledChoice } from '@/data/beefTypes'
import { US_STATES } from '@/data/geo'
import type { Animal } from '@/data/types'
import { beefTitle, quotePool, shareNoun } from '@/lib/beef'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SHARE_LABELS } from '@/lib/yield'
import { usePreferences } from '@/store/usePreferences'
import { useRanchStore } from '@/store/useRanchStore'

const pct = (n: number) => `${Math.round(n * 100)}%`
const deadlineText = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

type Field = 'firstName' | 'city' | 'state'

/**
 * Claiming a share: pick a size, see exactly what's paid today and what's
 * paid later, choose what happens if the animal doesn't fill, and choose
 * how your name shows on the fill meter. Adds the share to the cart.
 */
export function ClaimDialog({
  pool,
  animal,
  sizes,
  initialSize,
  open,
  onOpenChange,
}: {
  pool: SharePool
  animal: Animal
  /** Sizes that still fit */
  sizes: ShareSize[]
  initialSize?: ShareSize
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const id = useId()
  const navigate = useNavigate()
  const addShareToCart = useRanchStore((s) => s.addShareToCart)
  const saved = usePreferences((s) => s.claimant)
  const setClaimant = usePreferences((s) => s.setClaimant)

  const [size, setSize] = useState<ShareSize>(initialSize && sizes.includes(initialSize) ? initialSize : (sizes.at(-1) ?? 'quarter'))
  const [firstName, setFirstName] = useState(saved?.firstName ?? '')
  const [city, setCity] = useState(saved?.city ?? '')
  const [state, setState] = useState(saved?.state ?? 'MO')
  const [ifUnfilled, setIfUnfilled] = useState<UnfilledChoice>('roll-over')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})

  const quote = quotePool(pool, animal, size)
  const program = feedProgram(pool.feedProgram)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Partial<Record<Field, string>> = {}
    if (!firstName.trim()) found.firstName = 'Enter your first name. It shows on the fill meter.'
    if (!city.trim()) found.city = 'Enter your town.'
    if (!state) found.state = 'Choose a state.'
    setErrors(found)
    const first = (['firstName', 'city', 'state'] as Field[]).find((f) => found[f])
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const who = { firstName: firstName.trim().split(/\s+/)[0], city: city.trim(), state }
    addShareToCart({ poolId: pool.id, size, ifUnfilled, ...who })
    setClaimant(who)
    onOpenChange(false)
    toast.success(`${SHARE_LABELS[size]} of ${animal.tagId} added to your cart`, {
      description: `${formatCurrency(quote.deposit, true)} deposit at checkout. It’s yours once you check out.`,
      action: { label: 'Check out', onClick: () => navigate('/cart') },
    })
  }

  const err = (f: Field) =>
    errors[f] && (
      <p id={`${id}-${f}-error`} className="text-sm font-medium text-destructive">
        {errors[f]}
      </p>
    )
  const describedBy = (f: Field) => (errors[f] ? `${id}-${f}-error` : undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Claim a share of {animal.tagId}</DialogTitle>
          <DialogDescription className="text-base">
            {beefTitle(animal)}. {formatCurrency(quote.pricePerHangingLb, true)} per hanging lb, locked in today.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="grid gap-6">
          <fieldset className="grid gap-3">
            <legend className="mb-2 text-base font-semibold">How much beef?</legend>
            <RadioGroup value={size} onValueChange={(v) => setSize(v as ShareSize)} className="grid gap-2 sm:grid-cols-3">
              {sizes.map((s) => {
                const q = quotePool(pool, animal, s)
                return (
                  <Label
                    key={s}
                    htmlFor={`${id}-size-${s}`}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                  >
                    <RadioGroupItem id={`${id}-size-${s}`} value={s} className="mt-1" />
                    <span>
                      <span className="block text-lg font-semibold">{SHARE_LABELS[s]}</span>
                      <span className="block text-sm text-muted-foreground tabular-nums">~{formatNumber(q.takeHomeLb)} lb beef</span>
                      <span className="block font-semibold tabular-nums">{formatCurrency(q.total)}</span>
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>
          </fieldset>

          <div className="grid gap-2 rounded-xl border bg-muted/50 p-4 tabular-nums">
            <dl className="grid gap-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Hanging weight, est.</dt>
                <dd className="font-semibold">{formatNumber(quote.hangingLb)} lb</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Take-home beef, est.</dt>
                <dd className="font-semibold">
                  {formatNumber(quote.takeHomeLow)}–{formatNumber(quote.takeHomeHigh)} lb
                </dd>
              </div>
              {quote.processingIncluded ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Beef, processing included</dt>
                  <dd className="font-semibold">{formatCurrency(quote.total, true)}</dd>
                </div>
              ) : (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Beef</dt>
                    <dd className="font-semibold">{formatCurrency(quote.beef, true)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Cut, wrap & freeze</dt>
                    <dd className="font-semibold">{formatCurrency(quote.processing, true)}</dd>
                  </div>
                </>
              )}
              <div className="mt-1 flex justify-between gap-4 border-t pt-3">
                <dt className="font-semibold">Pay today ({pct(beefConfig.depositRate)} deposit)</dt>
                <dd className="font-heading text-2xl font-bold">{formatCurrency(quote.deposit, true)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Due at pickup, est.</dt>
                <dd className="font-semibold">{formatCurrency(quote.balance, true)}</dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">
              The balance is figured on the <strong className="font-semibold text-foreground">actual hanging weight</strong> once the processor weighs
              the carcass, so you pay for exactly what your share weighs, no more. That’s about {formatCurrency(quote.perTakeHomeLb, true)} per pound
              of beef you take home.
            </p>
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-base font-semibold">Your name on the fill meter</legend>
            <p className="-mt-1 text-sm text-muted-foreground">Neighbors see your first name and town, like “Sarah · Kansas City.” Nothing else.</p>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_6.5rem]">
              <div className="grid content-start gap-2">
                <Label htmlFor={`${id}-firstName`}>First name</Label>
                <Input
                  id={`${id}-firstName`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={describedBy('firstName')}
                />
                {err('firstName')}
              </div>
              <div className="grid content-start gap-2">
                <Label htmlFor={`${id}-city`}>Town</Label>
                <Input
                  id={`${id}-city`}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={describedBy('city')}
                />
                {err('city')}
              </div>
              <div className="grid content-start gap-2">
                <Label htmlFor={`${id}-state`}>State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id={`${id}-state`} className="w-full" aria-invalid={Boolean(errors.state)} aria-describedby={describedBy('state')}>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.abbr} value={s.abbr}>
                        {s.abbr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err('state')}
              </div>
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="mb-1 flex items-center gap-2 text-base font-semibold">
              <CalendarClock className="size-5 text-primary" aria-hidden />
              If it doesn’t fill by {deadlineText(pool.deadline)}
            </legend>
            <p className="-mt-1 text-sm text-muted-foreground">
              We only harvest when every share is claimed. If this animal isn’t full by its deadline, you choose what happens to your deposit:
            </p>
            <RadioGroup value={ifUnfilled} onValueChange={(v) => setIfUnfilled(v as UnfilledChoice)} className="grid gap-2">
              {[
                {
                  v: 'roll-over',
                  label: `Roll it over to the next ${program.short.toLowerCase()} animal`,
                  hint: 'Your deposit and price per pound carry over.',
                },
                { v: 'refund', label: 'Refund my full deposit', hint: 'Back on your card within 5 business days. No fees.' },
              ].map((o) => (
                <Label
                  key={o.v}
                  htmlFor={`${id}-unfilled-${o.v}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal',
                    'has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5',
                  )}
                >
                  <RadioGroupItem id={`${id}-unfilled-${o.v}`} value={o.v} className="mt-0.5" />
                  <span>
                    <span className="block font-semibold">{o.label}</span>
                    <span className="text-sm text-muted-foreground">{o.hint}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="text-lg">
              <ShoppingCart aria-hidden />
              Add {shareNoun(size)} to cart
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
