import type { CSSProperties, ReactNode } from 'react'
import { type LucideIcon, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoopStep {
  label: string
  detail?: string
  icon: LucideIcon
}

/**
 * A closed loop of steps drawn as a circle with arrows (pasture → cattle → …
 * → back to pasture). An optional branch sits in the middle, tied by a dashed
 * line to the step it comes off. On phones it's a plain numbered list.
 * Screen readers get the list either way.
 */
export function LoopGraphic({
  steps,
  branch,
  center,
  label,
  className,
}: {
  steps: LoopStep[]
  /** A side path off one step (e.g. manure → fuel logs) */
  branch?: LoopStep & { from: number }
  /** Shown in the middle when there's no branch */
  center?: ReactNode
  /** What the loop shows, for screen readers */
  label: string
  className?: string
}) {
  const n = steps.length
  const R = 38
  const angle = (i: number) => ((-90 + (i * 360) / n) * Math.PI) / 180
  const at = (i: number, r = R) => ({ x: 50 + r * Math.cos(angle(i)), y: 50 + r * Math.sin(angle(i)) })

  return (
    <figure className={cn('mx-auto w-full max-w-xl', className)}>
      <div className="relative sm:aspect-square">
        {/* The ring and its arrows (tablet and up) */}
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 hidden size-full sm:block">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--primary)" strokeOpacity="0.35" strokeWidth="0.8" />
          {steps.map((_, i) => {
            const mid = ((-90 + ((i + 0.5) * 360) / n) * Math.PI) / 180
            const x = 50 + R * Math.cos(mid)
            const y = 50 + R * Math.sin(mid)
            const deg = (mid * 180) / Math.PI + 90
            return <path key={i} d="M -2 -1.6 L 2 0 L -2 1.6 Z" fill="var(--primary)" transform={`translate(${x} ${y}) rotate(${deg})`} />
          })}
          {branch && (
            <line
              x1={at(branch.from, R - 6).x}
              y1={at(branch.from, R - 6).y}
              x2="50"
              y2="50"
              stroke="var(--primary)"
              strokeOpacity="0.6"
              strokeWidth="0.7"
              strokeDasharray="2 1.5"
            />
          )}
        </svg>

        <ol aria-label={label} className="grid gap-3 sm:block">
          {steps.map((s, i) => {
            const p = at(i)
            const Icon = s.icon
            return (
              <li
                key={s.label}
                style={{ '--x': `${p.x}%`, '--y': `${p.y}%` } as CSSProperties}
                className="flex items-center gap-3 rounded-2xl border bg-card px-3 py-2 shadow-sm sm:absolute sm:top-(--y) sm:left-(--x) sm:w-36 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:flex-col sm:gap-1 sm:text-center"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block leading-tight font-semibold">
                    <span className="sr-only">{i + 1}. </span>
                    {s.label}
                  </span>
                  {s.detail && <span className="block text-sm leading-snug text-muted-foreground">{s.detail}</span>}
                </span>
              </li>
            )
          })}
        </ol>
        {/* On phones the ring is a list; say where it loops back to */}
        <p aria-hidden className="mt-2 flex items-center gap-2 pl-4 text-sm font-medium text-muted-foreground sm:hidden">
          <RotateCcw className="size-4 text-primary" />
          Back to {steps[0].label.toLowerCase()}
        </p>

        {(branch || center) && (
          <div className="mt-3 sm:absolute sm:top-1/2 sm:left-1/2 sm:mt-0 sm:w-40 sm:-translate-x-1/2 sm:-translate-y-1/2">
            {branch ? (
              <p className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 bg-background px-3 py-2 sm:flex-col sm:gap-1 sm:text-center">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <branch.icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block leading-tight font-semibold">{branch.label}</span>
                  <span className="block text-sm leading-snug text-muted-foreground">
                    {branch.detail ?? `Branches off ${steps[branch.from].label.toLowerCase()}`}
                  </span>
                </span>
              </p>
            ) : (
              <div className="text-center">{center}</div>
            )}
          </div>
        )}
      </div>
    </figure>
  )
}
