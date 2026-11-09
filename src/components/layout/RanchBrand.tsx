import { Link } from 'react-router'
import { ranch, ranchPlace } from '@/config/ranch'
import { cn } from '@/lib/utils'

/**
 * The ranch's brand mark: initials over a curved "rocker" bar, the way a
 * cattle brand is burned. Drawn in the current text color.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden className={cn('h-10 w-auto', className)}>
      <text
        x="32"
        y="29"
        textAnchor="middle"
        fontFamily="var(--brand-font-heading)"
        fontWeight="800"
        fontSize="28"
        letterSpacing="-1"
        fill="currentColor"
      >
        {ranch.initials}
      </text>
      <path d="M9 37 Q32 49 55 37" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function RanchBrand({ className, showPlace = true }: { className?: string; showPlace?: boolean }) {
  return (
    <Link
      to="/"
      className={cn('group flex min-w-0 items-center gap-2.5 rounded-lg py-1 pr-2 text-foreground', className)}
      aria-label={`${ranch.name}, home`}
    >
      <BrandMark className="h-9 shrink-0 text-primary sm:h-10 transition-transform group-hover:-rotate-3" />
      <span className="flex flex-col">
        <span className="font-heading text-lg leading-tight font-bold sm:text-2xl sm:leading-none sm:whitespace-nowrap">{ranch.name}</span>
        {showPlace && <span className="mt-1 hidden text-sm leading-none text-muted-foreground sm:block">{ranchPlace}</span>}
      </span>
    </Link>
  )
}
