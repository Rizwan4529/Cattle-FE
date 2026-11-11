import { useId, useState } from 'react'
import { MapPin, Package, Snowflake, Truck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { beefConfig } from '@/config/beef'
import { stateForZip } from '@/data/geo'
import { type BeefDeliveryMethod, pickupDates } from '@/lib/delivery'
import { formatCurrency } from '@/lib/format'
import type { CheckoutSummary } from '@/lib/useCheckoutSummary'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/store/usePreferences'

const ICONS: Record<BeefDeliveryMethod, typeof Truck> = { pickup: Package, local: Truck, ship: Snowflake }
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

/** ZIP check: what's possible for this ZIP. */
export function ZipChecker({ summary, compact }: { summary: CheckoutSummary; compact?: boolean }) {
  const id = useId()
  const zip = usePreferences((s) => s.beefZip)
  const setZip = usePreferences((s) => s.setBeefZip)
  const [value, setValue] = useState(zip)
  const state = /^\d{5}$/.test(zip) ? stateForZip(zip) : undefined

  return (
    <div className="grid gap-2">
      <Label htmlFor={`${id}-zip`} className={compact ? 'text-sm' : undefined}>
        Your ZIP code
      </Label>
      <Input
        id={`${id}-zip`}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 5)
          setValue(v)
          if (v.length === 5 || v === '') setZip(v)
        }}
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="e.g. 80205"
        className="max-w-40"
        aria-describedby={`${id}-zip-result`}
      />
      <p id={`${id}-zip-result`} aria-live="polite" className="flex items-start gap-1.5 text-sm">
        {zip.length === 5 && (
          <>
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {summary.zone
              ? `${zip} is in our ${summary.zone.name} delivery zone. Deliveries run ${summary.zone.days}.`
              : state
                ? `We ship frozen to ${state.name}. Local delivery doesn’t reach ${zip} yet.`
                : 'We ship to the lower 48 states only. Pickup at the ranch is always open.'}
          </>
        )}
        {zip.length !== 5 && <span className="text-muted-foreground">Check local delivery and shipping for your ZIP.</span>}
      </p>
    </div>
  )
}

/** How Butcher Shop beef gets to you, with prices for this order, and pickup day and time. */
export function BeefDeliveryChoice({ summary }: { summary: CheckoutSummary }) {
  const id = useId()
  const setMethod = usePreferences((s) => s.setBeefDelivery)
  const slot = usePreferences((s) => s.pickupSlot)
  const setSlot = usePreferences((s) => s.setPickupSlot)
  const [dates] = useState(() => pickupDates(new Date()))
  const chosen = summary.delivery.method
  const date = slot && dates.includes(slot.date) ? slot.date : ''

  return (
    <div className="grid gap-4">
      <RadioGroup
        value={chosen}
        onValueChange={(v) => setMethod(v as BeefDeliveryMethod)}
        className="grid gap-2"
        aria-label="How your shop order gets to you"
      >
        {summary.options.map((o) => {
          const Icon = ICONS[o.method]
          return (
            <Label
              key={o.method}
              htmlFor={`${id}-${o.method}`}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 font-normal',
                o.available ? 'cursor-pointer has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5' : 'opacity-70',
              )}
            >
              <RadioGroupItem id={`${id}-${o.method}`} value={o.method} disabled={!o.available} className="mt-0.5" />
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap justify-between gap-x-3">
                  <span className="font-semibold">{o.label}</span>
                  {o.available && <span className="font-semibold tabular-nums">{o.cost ? formatCurrency(o.cost, true) : 'Free'}</span>}
                </span>
                <span className="block text-sm text-muted-foreground">{o.available ? o.note : o.reason}</span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>

      {chosen === 'pickup' && (
        <fieldset className="grid gap-3 rounded-lg bg-muted/60 p-4">
          <legend className="sr-only">Pickup time</legend>
          <p className="text-sm">At {beefConfig.delivery.pickup.place}. Bring a cooler.</p>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-day`}>Pickup day</Label>
            <Select value={date} onValueChange={(d) => setSlot({ date: d, slot: slot?.slot ?? beefConfig.delivery.pickup.slots[0] })}>
              <SelectTrigger id={`${id}-day`} className="w-full sm:max-w-64">
                <SelectValue placeholder="Choose a day" />
              </SelectTrigger>
              <SelectContent>
                {dates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {dayLabel(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {date && (
            <RadioGroup
              value={slot?.slot ?? ''}
              onValueChange={(t) => setSlot({ date, slot: t })}
              aria-label="Pickup time"
              className="flex flex-wrap gap-2"
            >
              {beefConfig.delivery.pickup.slots.map((t) => (
                <Label
                  key={t}
                  htmlFor={`${id}-slot-${t}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 py-2 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                >
                  <RadioGroupItem id={`${id}-slot-${t}`} value={t} />
                  {t}
                </Label>
              ))}
            </RadioGroup>
          )}
        </fieldset>
      )}
      {chosen === 'ship' && <p className="text-sm text-muted-foreground">{beefConfig.delivery.shipping.note}</p>}
    </div>
  )
}

/** How claimed shares are handed over once the beef is cut and wrapped. */
export function ShareHandoffChoice({ summary }: { summary: CheckoutSummary }) {
  const id = useId()
  const value = usePreferences((s) => s.shareHandoff)
  const setValue = usePreferences((s) => s.setShareHandoff)
  const canDeliver = Boolean(summary.zone)
  const current = value === 'local' && !canDeliver ? 'pickup' : value

  return (
    <RadioGroup value={current} onValueChange={(v) => setValue(v as 'pickup' | 'local')} className="grid gap-2" aria-label="How you get your share">
      {[
        {
          v: 'pickup',
          label: 'Pick it up at the ranch',
          hint: 'We call when it’s ready to set a day. Bring coolers; a quarter fills about four.',
          ok: true,
        },
        {
          v: 'local',
          label: 'Deliver it when it’s ready',
          hint: canDeliver ? `Free in the ${summary.zone!.name} area, on a day we set together.` : 'Enter a ZIP in our delivery area to choose this.',
          ok: canDeliver,
        },
      ].map((o) => (
        <Label
          key={o.v}
          htmlFor={`${id}-${o.v}`}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3 font-normal',
            o.ok ? 'cursor-pointer has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5' : 'opacity-70',
          )}
        >
          <RadioGroupItem id={`${id}-${o.v}`} value={o.v} disabled={!o.ok} className="mt-0.5" />
          <span>
            <span className="block font-semibold">{o.label}</span>
            <span className="text-sm text-muted-foreground">{o.hint}</span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  )
}
