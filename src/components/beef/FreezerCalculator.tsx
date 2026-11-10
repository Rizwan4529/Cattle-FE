import { useId, useState } from 'react'
import { Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { beefConfig } from '@/config/beef'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { availableShareSizes, freezerSpace, SHARE_FRACTION, SHARE_LABELS, takeHomeWeight } from '@/lib/yield'

/**
 * How much freezer space a share (or a cart) needs, at 35–40 lb of packaged
 * beef per cubic foot, and which chest freezer size holds it.
 */
export function FreezerCalculator({
  initialLb,
  title = 'Will it fit in my freezer?',
  className,
}: {
  initialLb?: number
  title?: string
  className?: string
}) {
  const id = useId()
  const typical = takeHomeWeight(beefConfig.typicalLiveWeight)
  const [value, setValue] = useState(String(Math.round(initialLb ?? typical * SHARE_FRACTION.quarter)))
  const lb = Number(value)
  const valid = lb >= 1 && lb <= 3000
  const space = valid ? freezerSpace(lb) : null
  const { min, max } = beefConfig.freezer.lbsPerCuFt

  return (
    <section aria-labelledby={`${id}-title`} className={cn('grid gap-4 rounded-2xl border bg-card p-5 sm:p-6', className)}>
      <div className="flex items-start gap-3">
        <Snowflake className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 id={`${id}-title`} className="text-2xl font-bold">
            {title}
          </h2>
          <p className="mt-1 text-muted-foreground">
            Packaged beef takes about 1 cubic foot for every {min} to {max} lb.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-lb`}>Pounds of beef</Label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Input
              id={`${id}-lb`}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              className="w-28 pr-10 text-lg font-semibold tabular-nums"
              aria-describedby={`${id}-result`}
              aria-invalid={value !== '' && !valid}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">lb</span>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Typical share sizes">
            {availableShareSizes().map((s) => {
              const shareLb = Math.round(typical * SHARE_FRACTION[s])
              return (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={lb === shareLb ? 'secondary' : 'outline'}
                  aria-pressed={lb === shareLb}
                  onClick={() => setValue(String(shareLb))}
                >
                  {SHARE_LABELS[s]}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      <div id={`${id}-result`} aria-live="polite" className="grid gap-3">
        {space ? (
          <>
            <p className="text-lg">
              About{' '}
              <strong className="font-heading text-2xl font-bold">
                {space.low === space.high ? space.high : `${space.low}–${space.high}`} cu ft
              </strong>{' '}
              of freezer space for {formatNumber(lb)} lb.
            </p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Chest freezer sizes">
              {beefConfig.freezer.sizes.map((size) => {
                const fits = size >= space.high
                const best = size === space.suggested
                return (
                  <li
                    key={size}
                    className={cn(
                      'grid place-items-center rounded-lg border px-2 py-2 text-center',
                      best ? 'border-primary bg-primary text-primary-foreground' : fits ? 'bg-background' : 'bg-muted/50 text-muted-foreground',
                    )}
                  >
                    <span className="font-heading text-xl font-bold tabular-nums">{size}</span>
                    <span className="text-sm">cu ft</span>
                    <span className="text-sm font-medium">{best ? 'Best fit' : fits ? 'Fits' : 'Too small'}</span>
                  </li>
                )
              })}
            </ul>
            <p className="text-sm text-muted-foreground">
              {space.suggested
                ? `A ${space.suggested} cu ft chest freezer holds it with a little room to spare. Most kitchen freezers on top of a fridge are 4 to 6 cu ft.`
                : 'That’s more than one large chest freezer holds, so plan on two.'}
            </p>
          </>
        ) : (
          <p>Enter a weight between 1 and 3,000 lb.</p>
        )}
      </div>
    </section>
  )
}
