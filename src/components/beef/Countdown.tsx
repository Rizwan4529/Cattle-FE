import { Clock } from 'lucide-react'
import { useNow } from '@/lib/beef'
import { cn } from '@/lib/utils'
import { timeLeft } from '@/lib/yield'

const deadlineText = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/**
 * Time left before a pool's deadline, ticking every second.
 */
export function Countdown({ deadline, variant = 'inline', className }: { deadline: string; variant?: 'inline' | 'blocks'; className?: string }) {
  const now = useNow(1000)
  const t = timeLeft(deadline, now)
  const urgent = !t.expired && t.days < 2

  if (t.expired) {
    return <p className={cn('font-semibold text-muted-foreground', className)}>Deadline passed {deadlineText(deadline)}</p>
  }

  if (variant === 'blocks') {
    const parts =
      t.days >= 1
        ? ([
            [t.days, 'days'],
            [t.hours, 'hours'],
            [t.minutes, 'min'],
          ] as const)
        : ([
            [t.hours, 'hours'],
            [t.minutes, 'min'],
            [t.seconds, 'sec'],
          ] as const)
    return (
      <div className={cn('grid gap-2', className)}>
        <p className="text-sm text-muted-foreground">Claim by {deadlineText(deadline)}</p>
        <div role="timer" aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes left`} className="flex gap-2">
          {parts.map(([value, label]) => (
            <div
              key={label}
              className={cn('grid min-w-18 place-items-center rounded-lg border bg-background px-3 py-2', urgent && 'border-warning bg-warning/10')}
            >
              <span className="font-heading text-3xl leading-none font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
              <span className="mt-1 text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const text = t.days >= 1 ? `${t.days}d ${t.hours}h left` : t.hours >= 1 ? `${t.hours}h ${t.minutes}m left` : `${t.minutes}m ${t.seconds}s left`
  return (
    <p
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        urgent ? 'text-warning-foreground dark:text-warning' : 'text-muted-foreground',
        className,
      )}
    >
      <Clock className="size-4 shrink-0" aria-hidden />
      <span>
        <span className="sr-only">Claim deadline: </span>
        {text}
      </span>
    </p>
  )
}
