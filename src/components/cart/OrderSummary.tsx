import { type FormEvent, type ReactNode, useId, useState } from 'react'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ranch } from '@/config/ranch'
import { stateForZip } from '@/data/geo'
import { type CartSummary, depositPercent } from '@/lib/checkout'
import { formatCurrency, formatNumber } from '@/lib/format'
import { type Fulfillment, usePreferences } from '@/store/usePreferences'

/** Where to haul to, by ZIP. Saved per device and shared with the lot page's freight estimator. */
export function DestinationZip({ compact }: { compact?: boolean }) {
  const id = useId()
  const saved = usePreferences((s) => s.freightDestination)
  const setDestination = usePreferences((s) => s.setFreightDestination)
  const [zip, setZip] = useState(saved?.zip ?? '')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{5}$/.test(zip)) return setError('Enter a 5-digit ZIP code.')
    const state = stateForZip(zip)
    if (!state) return setError('Delivery covers the lower 48 states. Call the ranch for anywhere else.')
    setError('')
    setDestination({ state: state.abbr, zip })
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-1.5">
      <Label htmlFor={`${id}-zip`} className={compact ? 'text-sm' : undefined}>
        Deliver to ZIP code
      </Label>
      <div className="flex gap-2">
        <Input
          id={`${id}-zip`}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          inputMode="numeric"
          autoComplete="postal-code"
          className="max-w-36"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-zip-error` : undefined}
        />
        <Button type="submit" variant="outline">
          {saved?.zip === zip && zip ? 'Updated' : 'Estimate'}
        </Button>
      </div>
      {error && (
        <p id={`${id}-zip-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

export function FulfillmentChoice({ value, onChange }: { value: Fulfillment; onChange: (v: Fulfillment) => void }) {
  const id = useId()
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as Fulfillment)} className="grid gap-2" aria-label="Pickup or delivery">
      {[
        { v: 'pickup', label: 'I’ll pick them up', hint: `At the ranch near ${ranch.location.city}. Loading chute and scale on site.` },
        { v: 'delivery', label: 'Deliver them to me', hint: 'The ranch books a hauler. Freight is added to the balance.' },
      ].map((o) => (
        <Label
          key={o.v}
          htmlFor={`${id}-${o.v}`}
          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
        >
          <RadioGroupItem id={`${id}-${o.v}`} value={o.v} className="mt-0.5" />
          <span>
            <span className="block font-semibold">{o.label}</span>
            <span className="text-sm text-muted-foreground">{o.hint}</span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  )
}

function Row({ label, value, note, strong }: { label: ReactNode; value: string; note?: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? 'font-semibold' : 'text-muted-foreground'}>
        {label}
        {note && <span className="block text-sm font-normal text-muted-foreground">{note}</span>}
      </dt>
      <dd className={strong ? 'font-heading text-2xl font-bold tabular-nums' : 'font-semibold tabular-nums'}>{value}</dd>
    </div>
  )
}

/** Money breakdown shared by the cart and checkout. */
export function OrderTotals({ summary, fulfillment }: { summary: CartSummary; fulfillment: Fulfillment }) {
  const destination = usePreferences((s) => s.freightDestination)
  const f = summary.freight
  return (
    <div className="grid gap-3">
      <dl className="grid gap-3">
        <Row label={`Cattle (${summary.head} head)`} value={formatCurrency(summary.subtotal)} />
        {fulfillment === 'pickup' ? (
          <Row label="Freight" value={formatCurrency(0)} note="You haul them home" />
        ) : f ? (
          <Row
            label={
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-4" aria-hidden />
                Estimated freight
              </span>
            }
            value={formatCurrency(f.cost)}
            note={`${formatNumber(f.miles)} miles to ${destination?.zip ?? destination?.state}, ${f.loads > 1 ? `${f.loads} loads, ` : ''}${f.trailer.toLowerCase()}`}
          />
        ) : (
          <Row label="Estimated freight" value="–" note="Enter a ZIP code to estimate" />
        )}
      </dl>
      <dl className="border-t pt-3">
        <Row label="Order total" value={formatCurrency(summary.total)} strong />
      </dl>
      <dl className="grid gap-2 rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">
        <Row label={`Deposit due now (${depositPercent})`} value={formatCurrency(summary.deposit)} strong />
        <Row
          label={`Balance due at ${fulfillment === 'pickup' ? 'pickup' : 'delivery'}`}
          value={formatCurrency(summary.balance)}
          note="After you've seen the cattle and they load"
        />
      </dl>
    </div>
  )
}
