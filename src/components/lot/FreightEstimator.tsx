import { type FormEvent, useId, useState } from 'react'
import { Info, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ranch } from '@/config/ranch'
import { stateForZip, US_STATES } from '@/data/geo'
import type { Animal } from '@/data/types'
import { estimateFreight } from '@/lib/freight'
import { formatCurrency, formatNumber } from '@/lib/format'
import { usePreferences } from '@/store/usePreferences'

/** Mock haul estimate from the ranch to the buyer's ZIP or state. */
export function FreightEstimator({ animals, unit }: { animals: Animal[]; unit: 'head' | 'pair' }) {
  const id = useId()
  const saved = usePreferences((s) => s.freightDestination)
  const setDestination = usePreferences((s) => s.setFreightDestination)
  const [mode, setMode] = useState<'zip' | 'state'>(saved && !saved.zip ? 'state' : 'zip')
  const [zip, setZip] = useState(saved?.zip ?? '')
  const [error, setError] = useState('')

  const dest = US_STATES.find((s) => s.abbr === saved?.state)
  const totalWeight = animals.reduce((sum, a) => sum + a.estWeight + (a.calfAtSide?.estWeight ?? 0), 0)
  const estimate = dest ? estimateFreight(dest, animals.length, totalWeight) : null

  const submitZip = (e: FormEvent) => {
    e.preventDefault()
    const clean = zip.trim()
    if (!/^\d{5}$/.test(clean)) {
      setError('Enter a 5-digit ZIP code.')
      return
    }
    const state = stateForZip(clean)
    if (!state) {
      setError('Freight estimates cover the lower 48 states. Call the ranch for anywhere else.')
      return
    }
    setError('')
    setDestination({ state: state.abbr, zip: clean })
  }

  return (
    <div className="grid gap-5 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h3 className="flex items-center gap-2 text-2xl font-bold">
          <Truck className="size-6 text-primary" aria-hidden />
          Freight estimate
        </h3>
        <p className="mt-1 text-muted-foreground">
          See roughly what it costs to haul this lot from {ranch.location.city}, {ranch.location.state} to you.
        </p>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        value={mode}
        onValueChange={(v) => v && setMode(v as 'zip' | 'state')}
        aria-label="Enter your location by"
        className="w-full sm:w-fit"
      >
        <ToggleGroupItem value="zip" className="h-11 flex-1 px-4 text-base data-[state=on]:bg-secondary data-[state=on]:font-semibold">
          ZIP code
        </ToggleGroupItem>
        <ToggleGroupItem value="state" className="h-11 flex-1 px-4 text-base data-[state=on]:bg-secondary data-[state=on]:font-semibold">
          State
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === 'zip' ? (
        <form onSubmit={submitZip} noValidate className="grid gap-2">
          <Label htmlFor={`${id}-zip`}>Your ZIP code</Label>
          <div className="flex gap-2">
            <Input
              id={`${id}-zip`}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              inputMode="numeric"
              autoComplete="postal-code"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-zip-error` : undefined}
              className="max-w-40 text-lg tabular-nums"
            />
            <Button type="submit">Estimate</Button>
          </div>
          {error && (
            <p id={`${id}-zip-error`} className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-state`}>Your state</Label>
          <Select value={saved?.state ?? ''} onValueChange={(v) => setDestination({ state: v })}>
            <SelectTrigger id={`${id}-state`} className="w-full sm:w-72">
              <SelectValue placeholder="Choose a state" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {US_STATES.map((s) => (
                <SelectItem key={s.abbr} value={s.abbr}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div aria-live="polite">
        {estimate && dest && (
          <div className="grid gap-4 rounded-lg bg-secondary/60 p-4">
            <p className="text-muted-foreground">
              To {saved?.zip ? `${saved.zip}, ` : 'central '}
              {dest.name}
            </p>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-muted-foreground">Distance</dt>
                <dd className="font-heading text-2xl font-bold">~{formatNumber(estimate.miles)} mi</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">On the road</dt>
                <dd className="font-heading text-2xl font-bold">~{estimate.hours} hr</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Haul cost</dt>
                <dd className="font-heading text-2xl font-bold">{formatCurrency(estimate.cost)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Per {unit}</dt>
                <dd className="font-heading text-2xl font-bold">{formatCurrency(estimate.perHead)}</dd>
              </div>
            </dl>
            <p className="text-sm">
              {estimate.loads > 1 ? `${estimate.loads} loads on a ${estimate.trailer.toLowerCase()}` : `One ${estimate.trailer.toLowerCase()}`}, about{' '}
              {formatCurrency(estimate.perCwt, true)}/cwt on {formatNumber(totalWeight)} lb of cattle.
            </p>
            <p className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                <strong>Plan for shrink.</strong> Cattle lose weight on the truck. Expect about{' '}
                {Math.round(estimate.shrink * 1000) / 10}% on a haul this long, roughly {formatNumber(estimate.shrinkLb)} lb across the
                lot. Loading them full and calm, and hauling early in the day, keeps shrink down.
              </span>
            </p>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        A rough estimate from straight-line distance. Your hauler sets the final price. Picking up at the ranch costs nothing.
      </p>
    </div>
  )
}
