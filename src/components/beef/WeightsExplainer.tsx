import { useId, useState } from 'react'
import { ChevronDown, CircleHelp } from 'lucide-react'
import { beefConfig } from '@/config/beef'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dressingPercent, hangingWeight, takeHomePercent, takeHomeRange, takeHomeWeight } from '@/lib/yield'

const pct = (n: number) => `${Math.round(n * 100)}%`

/**
 * Live, hanging, and take-home weight side by side, drawn to scale, with a
 * plain-language "What do these mean?" panel. Hanging weight is never
 * called meat.
 */
export function WeightsExplainer({
  liveLb,
  fraction = 1,
  label,
  className,
}: {
  liveLb: number
  fraction?: number
  label?: string
  className?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const live = Math.round(liveLb * fraction)
  const hanging = Math.round(hangingWeight(liveLb) * fraction)
  const takeHome = Math.round(takeHomeWeight(liveLb) * fraction)
  const [lo, hi] = takeHomeRange(liveLb, beefConfig, fraction)

  const rows = [
    { name: 'Live weight', value: live, note: 'On the scale', width: 1, tone: 'bg-muted-foreground/35' },
    { name: 'Hanging weight', value: hanging, note: `About ${pct(dressingPercent())} of live`, width: hanging / live, tone: 'bg-chart-3' },
    {
      name: 'Take-home beef',
      value: takeHome,
      note: `${formatNumber(lo)}–${formatNumber(hi)} lb, wrapped and frozen`,
      width: takeHome / live,
      tone: 'bg-primary',
    },
  ]

  return (
    <div className={cn('grid gap-4', className)}>
      {label && <p className="font-semibold">{label}</p>}
      <dl className="grid gap-3">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5">
            <dt className="font-semibold">{r.name}</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">{formatNumber(r.value)} lb</dd>
            <dd className="col-span-2 h-3 rounded-full bg-muted" aria-hidden>
              <div className={cn('h-full rounded-full', r.tone)} style={{ width: `${r.width * 100}%` }} />
            </dd>
            <dd className="col-span-2 text-sm text-muted-foreground">{r.note}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl border bg-background/60">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-12 w-full items-center gap-2 rounded-xl px-4 text-left font-semibold hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <CircleHelp className="size-5 text-primary" aria-hidden />
          What do these mean?
          <ChevronDown className={cn('ml-auto size-5 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
        <div id={`${id}-panel`} hidden={!open} className="grid gap-3 px-4 pb-4">
          <p>
            <strong className="font-semibold">Live weight</strong> is the animal on the scale, on the hoof.
          </p>
          <p>
            <strong className="font-semibold">Hanging weight</strong> is the carcass after harvest, before it’s cut. It still has bone, fat, and
            moisture, so it isn’t the beef you take home. Share prices are figured on hanging weight, the way butchers have always priced it.
          </p>
          <p>
            <strong className="font-semibold">Take-home beef</strong> is what goes in your freezer: steaks, roasts, and ground beef, wrapped and
            labeled. It’s usually {pct(beefConfig.takeHomeRange[0])} to {pct(beefConfig.takeHomeRange[1])} of live weight (about{' '}
            {pct(takeHomePercent())} here). Boneless cuts and dry aging give a little less; bone-in cuts give a little more.
          </p>
        </div>
      </div>
    </div>
  )
}
