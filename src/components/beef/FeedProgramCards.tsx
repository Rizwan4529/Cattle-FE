import { Check } from 'lucide-react'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId } from '@/data/beefTypes'
import { cn } from '@/lib/utils'

/** Marbling, 1–5, as five small bars. */
function Marbling({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Marbling</span>
      <span aria-hidden className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn('h-3 w-4 rounded-sm', i < value ? 'bg-primary' : 'bg-muted-foreground/20')} />
        ))}
      </span>
      <span className="sr-only">{value} out of 5</span>
    </span>
  )
}

/**
 * The three feed programs with what each tastes like. With `selected` and
 * `onToggle`, each card filters the animals below it.
 */
export function FeedProgramCards({
  selected,
  onToggle,
  className,
}: {
  selected?: FeedProgramId[]
  onToggle?: (id: FeedProgramId) => void
  className?: string
}) {
  return (
    <ul className={cn('grid gap-4 md:grid-cols-3', className)}>
      {beefConfig.feedPrograms.map((p) => {
        const on = selected?.includes(p.id) ?? false
        const body = (
          <>
            <span className="flex items-start justify-between gap-3">
              <span className="font-heading text-xl font-bold">{p.name}</span>
              {onToggle && (
                <span
                  aria-hidden
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-md border-2',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                  )}
                >
                  {on && <Check className="size-4" />}
                </span>
              )}
            </span>
            <span className="block text-muted-foreground">{p.description}</span>
            <span className="block">{p.flavor}</span>
            <span className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
              <Marbling value={p.marbling} />
              <span className="text-sm text-muted-foreground">Harvested at {p.finishAge}</span>
            </span>
          </>
        )
        return (
          <li key={p.id} className="grid">
            {onToggle ? (
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(p.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  on && 'border-primary bg-primary/5',
                )}
              >
                {body}
              </button>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
