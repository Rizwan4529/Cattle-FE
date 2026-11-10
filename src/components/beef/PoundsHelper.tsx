import { useId, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ShareSize } from '@/data/beefTypes'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { freezerSpace, recommendShare, SHARE_LABELS, WHY_SHARES } from '@/lib/yield'

const QUICK = [100, 200, 300, 500]

/** Rough guide: a family of four eats about 200 lb of beef a year. */
const howLong = (lb: number) => {
  const months = Math.round((lb / 200) * 12)
  return months >= 12
    ? `about ${Math.round(months / 12) === 1 ? 'a year' : `${Math.round(months / 12)} years`}`
    : `about ${Math.max(1, months)} months`
}

/**
 * "I want about 300 lb of beef": recommends the closest share size with its
 * take-home range, freezer space, and why beef is sold by the share.
 */
export function PoundsHelper({
  liveLb,
  onChoose,
  chooseLabel,
  canChoose,
  className,
}: {
  /** Animal to size shares from (a typical finished steer on the browse page) */
  liveLb: number
  /** Called with the recommended size, e.g. to open the claim form or filter animals */
  onChoose?: (size: ShareSize) => void
  chooseLabel?: (size: ShareSize) => string
  /** Whether the recommended size can be chosen right now */
  canChoose?: (size: ShareSize) => boolean
  className?: string
}) {
  const id = useId()
  const [value, setValue] = useState('300')
  const target = Number(value)
  const valid = Number.isFinite(target) && target >= 20 && target <= 5000
  const rec = valid ? recommendShare(target, liveLb) : null
  const freezer = rec ? freezerSpace(rec.takeHomeLb) : null

  return (
    <section aria-labelledby={`${id}-title`} className={cn('grid gap-4 rounded-2xl border bg-card p-5 sm:p-6', className)}>
      <div className="flex items-start gap-3">
        <Calculator className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 id={`${id}-title`} className="text-2xl font-bold">
            How much beef do you want?
          </h2>
          <p className="mt-1 text-muted-foreground">Type a rough amount and we’ll match it to a share.</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-lb`}>I want about</Label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Input
              id={`${id}-lb`}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              className="w-32 pr-12 text-lg font-semibold tabular-nums"
              aria-describedby={`${id}-result`}
              aria-invalid={value !== '' && !valid}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">lb</span>
          </div>
          <span className="text-muted-foreground">of beef</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common amounts">
            {QUICK.map((q) => (
              <Button
                key={q}
                type="button"
                variant={target === q ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setValue(String(q))}
                aria-pressed={target === q}
              >
                {q} lb
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div id={`${id}-result`} aria-live="polite" className="grid gap-3 rounded-xl bg-secondary p-4 text-secondary-foreground">
        {rec && freezer ? (
          <>
            <p className="text-lg">
              Go with{' '}
              <strong className="font-heading text-2xl font-bold">
                {rec.count > 1 ? `${rec.count} whole animals` : `a ${SHARE_LABELS[rec.size].toLowerCase()}${rec.size === 'whole' ? ' animal' : ''}`}
              </strong>
              . That’s about {formatNumber(rec.range[0])}–{formatNumber(rec.range[1])} lb of beef, {howLong(rec.takeHomeLb)} for a family of four.
            </p>
            <p className="text-sm">
              Freezer space: {freezer.low}–{freezer.high} cu ft
              {freezer.suggested ? `, so a ${freezer.suggested} cu ft chest freezer holds it.` : ', more than one chest freezer.'}
            </p>
            <p className="text-sm">{WHY_SHARES}</p>
            {onChoose && rec.count === 1 && (
              <div>
                {!canChoose || canChoose(rec.size) ? (
                  <Button type="button" onClick={() => onChoose(rec.size)} className="h-auto min-h-10 py-2 whitespace-normal">
                    {chooseLabel?.(rec.size) ?? `Claim a ${rec.size}`}
                  </Button>
                ) : (
                  <>
                    <p className="mb-2 text-sm">Not enough is left on this animal for {rec.size === 'whole' ? 'a whole' : `a ${rec.size}`}.</p>
                    <Button asChild variant="outline" className="h-auto min-h-10 py-2 whitespace-normal">
                      <Link to={`/beef?share=${rec.size}`}>Find an animal with {rec.size === 'whole' ? 'a whole' : `a ${rec.size}`} open</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p>Enter an amount between 20 and 5,000 lb.</p>
        )}
      </div>
    </section>
  )
}
