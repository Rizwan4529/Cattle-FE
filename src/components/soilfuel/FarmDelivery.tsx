import { useId } from 'react'
import { Package, Truck } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { formatCurrency } from '@/lib/format'
import type { CheckoutSummary } from '@/lib/useCheckoutSummary'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/store/usePreferences'

/** How Soil & Fuel get to the buyer: loaded at the ranch, or one trip on the ranch truck priced by distance. */
export function FarmDeliveryChoice({ summary }: { summary: CheckoutSummary }) {
  const id = useId()
  const setMethod = usePreferences((s) => s.setFarmDelivery)
  const { farmDelivery: d, farmTruckAvailable, zip } = summary
  const { delivery } = soilFuelConfig.soil
  const options = [
    {
      value: 'pickup' as const,
      icon: Package,
      label: 'Load up at the ranch',
      price: 'Free',
      note: `${ranch.location.address}, ${ranch.location.city}. We’ll call to set a time and have it ready on the loader.`,
      available: true,
    },
    {
      value: 'truck' as const,
      icon: Truck,
      label: 'Delivered on the ranch truck',
      price: summary.farmDelivery.truckCost !== null ? formatCurrency(summary.farmDelivery.truckCost) : '–',
      note: farmTruckAvailable
        ? `About ${d.miles} miles from the ranch: ${formatCurrency(delivery.base)} plus ${formatCurrency(delivery.perMile, true)} a mile, one trip for everything.`
        : /^\d{5}$/.test(zip)
          ? `We deliver Soil & Fuel within ${delivery.maxMiles} miles in Colorado. Pick up instead, or call us.`
          : 'Enter your ZIP code above to price delivery.',
      available: farmTruckAvailable,
    },
  ]
  return (
    <RadioGroup
      value={d.method}
      onValueChange={(v) => setMethod(v as 'pickup' | 'truck')}
      className="grid gap-2"
      aria-label="How your Soil & Fuel gets to you"
    >
      {options.map((o) => {
        const Icon = o.icon
        return (
          <label
            key={o.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-3',
              d.method === o.value && 'border-primary bg-primary/5',
              !o.available && 'cursor-not-allowed opacity-70',
            )}
          >
            <RadioGroupItem
              value={o.value}
              disabled={!o.available}
              aria-label={`${o.label}, ${o.price}`}
              aria-describedby={`${id}-${o.value}`}
              className="mt-1"
            />
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="flex flex-wrap justify-between gap-2 font-semibold">
                {o.label}
                <span className="tabular-nums">{o.price}</span>
              </span>
              <span id={`${id}-${o.value}`} className="text-sm text-muted-foreground">
                {o.note}
              </span>
            </span>
          </label>
        )
      })}
    </RadioGroup>
  )
}
