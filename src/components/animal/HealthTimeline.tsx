import { useState } from 'react'
import { Baby, Camera, ClipboardCheck, type LucideIcon, Pill, Scale, Scissors, Sprout, Stethoscope, Syringe, Wheat } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Animal } from '@/data/types'
import { buildTimeline, type TimelineKind } from '@/lib/animalTimeline'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const ICONS: Record<TimelineKind, LucideIcon> = {
  birth: Sprout,
  'weigh-in': Scale,
  scan: Camera,
  vaccination: Syringe,
  deworming: Pill,
  treatment: Stethoscope,
  castration: Scissors,
  weaning: Wheat,
  'pregnancy-check': Baby,
  exam: ClipboardCheck,
}

type Filter = 'all' | 'health' | 'weights'

/** Vertical record of everything done to the animal, newest first. */
export function HealthTimeline({ animal }: { animal: Animal }) {
  const [filter, setFilter] = useState<Filter>('all')
  const entries = buildTimeline(animal).filter((e) => filter === 'all' || e.group === filter)

  return (
    <div className="grid gap-5">
      <ToggleGroup
        type="single"
        variant="outline"
        value={filter}
        onValueChange={(v) => v && setFilter(v as Filter)}
        aria-label="Show"
        className="w-full sm:w-fit print:hidden"
      >
        {[
          { value: 'all', short: 'All', label: 'Everything' },
          { value: 'health', short: 'Health', label: 'Health' },
          { value: 'weights', short: 'Weights', label: 'Weights and scans' },
        ].map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            aria-label={o.label}
            className="h-11 flex-1 px-4 text-base sm:flex-none data-[state=on]:bg-secondary data-[state=on]:font-semibold"
          >
            <span className="sm:hidden">{o.short}</span>
            <span className="hidden sm:inline">{o.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ol className="relative grid gap-0" aria-label="Timeline, newest first">
        {entries.map((e, i) => {
          const Icon = ICONS[e.kind]
          const treatment = e.kind === 'treatment'
          return (
            <li key={e.id} className="relative grid grid-cols-[2.75rem_1fr] gap-4 pb-6 last:pb-0 print:break-inside-avoid">
              {/* Connector to the next entry */}
              {i < entries.length - 1 && <span aria-hidden className="absolute top-11 bottom-0 left-[1.33rem] w-0.5 bg-border" />}
              <span
                className={cn(
                  'relative z-10 grid size-11 place-items-center rounded-full border-2 bg-card',
                  e.group === 'health' ? 'border-primary/40 text-primary' : 'border-border text-muted-foreground',
                  treatment && 'border-warning bg-warning/15 text-warning-foreground dark:text-warning',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="pt-1">
                <p className="text-sm text-muted-foreground">
                  <time dateTime={e.date}>{formatDate(e.date)}</time>
                </p>
                <p className="font-heading text-xl font-bold">
                  {e.title}
                  {e.product && <span className="font-sans text-base font-semibold text-primary"> {e.product}</span>}
                </p>
                {e.detail && <p className="mt-0.5">{e.detail}</p>}
                {e.by && <p className="text-sm text-muted-foreground">By {e.by}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
