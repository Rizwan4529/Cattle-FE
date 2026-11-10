import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { SharePool } from '@/data/beefTypes'
import { claimLabel } from '@/lib/beef'
import { cn } from '@/lib/utils'
import { poolSegments, segmentsClaimed } from '@/lib/yield'

/**
 * Shares claimed vs. available, as one bar split into segments (4 for
 * quarters). Each claim fills the segments it bought and is labeled with
 * the buyer's first name and town. A new claim slides in as it arrives.
 */
export function FillMeter({
  pool,
  size = 'sm',
  held = 0,
  className,
}: {
  pool: SharePool
  /** "lg" labels every claim inside the bar; "sm" lists names below it */
  size?: 'sm' | 'lg'
  /** Segments held in this visitor's cart */
  held?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  // Claims already there on first render don't animate; new ones do.
  const [known] = useState(() => new Set(pool.claims.map((c) => c.id)))
  const total = poolSegments(pool)
  const claimed = segmentsClaimed(pool)
  const open = Math.max(0, total - claimed - held)
  const unit = pool.unit
  const lg = size === 'lg'

  const names = pool.claims.map((c) => `${c.fromThisDevice ? 'you' : `${c.firstName} from ${c.city}`} (${c.size})`).join(', ')
  const summary = `${claimed} of ${total} ${unit}s claimed${names ? ` by ${names}` : ''}${held ? `, ${held} in your cart` : ''}${open ? `, ${open} open` : ''}.`

  return (
    <div className={cn('grid gap-2', className)}>
      <p className="sr-only">{summary}</p>
      <div
        aria-hidden
        className={cn('grid gap-1 rounded-lg', lg ? 'min-h-12 sm:min-h-20' : 'h-3')}
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {pool.claims.map((c) => (
          <motion.div
            key={c.id}
            initial={known.has(c.id) || reduce ? false : { scaleX: 0, opacity: 0.4 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ gridColumn: `span ${c.segments} / span ${c.segments}`, originX: 0 }}
            className={cn(
              'min-w-0 rounded-md bg-primary text-primary-foreground',
              lg && 'content-center px-3 py-2 sm:grid',
              c.fromThisDevice && 'ring-2 ring-tag ring-offset-2 ring-offset-card',
            )}
          >
            {lg && (
              <>
                <span className="hidden truncate font-semibold sm:block">{c.fromThisDevice ? 'You' : c.firstName}</span>
                <span className="hidden truncate text-sm text-primary-foreground/80 sm:block">
                  {c.city}
                  {c.segments > 1 && ` · ${c.size}`}
                </span>
              </>
            )}
          </motion.div>
        ))}
        {Array.from({ length: held }, (_, i) => (
          <div
            key={`held-${i}`}
            className={cn('min-w-0 rounded-md border-2 border-primary bg-primary/15', lg && 'grid content-center px-3 py-2 text-sm font-semibold')}
          >
            {lg && i === 0 && <span className="truncate">In your cart</span>}
          </div>
        ))}
        {Array.from({ length: open }, (_, i) => (
          <div
            key={`open-${i}`}
            className={cn(
              'min-w-0 rounded-md border-2 border-dashed border-muted-foreground/40 bg-background/60',
              lg && 'grid place-items-center text-sm font-medium text-muted-foreground',
            )}
          >
            {lg && 'Open'}
          </div>
        ))}
      </div>
      {lg && pool.claims.length > 0 && (
        <ul className="grid gap-1 text-sm sm:hidden" aria-hidden>
          {pool.claims.map((c) => (
            <li key={c.id}>
              <span className="font-semibold">{c.fromThisDevice ? 'You' : claimLabel(c)}</span>
              {c.segments > 1 && <span className="text-muted-foreground">, {c.size}</span>}
            </li>
          ))}
        </ul>
      )}
      {!lg && pool.claims.length > 0 && (
        <p className="truncate text-sm text-muted-foreground" aria-hidden>
          {pool.claims
            .slice(0, 2)
            .map((c) => claimLabel(c))
            .join(', ')}
          {pool.claims.length > 2 && ` +${pool.claims.length - 2} more`}
        </p>
      )}
    </div>
  )
}
