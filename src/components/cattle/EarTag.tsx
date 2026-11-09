import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'min-h-7 px-2.5 pt-2 pb-1 text-sm',
  md: 'min-h-9 px-3 pt-2.5 pb-1.5 text-base',
  lg: 'min-h-16 px-5 pt-5 pb-3 text-3xl sm:text-4xl',
} as const

/**
 * A tag ID drawn like a yellow livestock ear tag: rounded top with a
 * punch hole, square-ish bottom. Used everywhere a tag ID appears.
 */
export function EarTag({
  tagId,
  size = 'md',
  srLabel = 'Ear tag',
  className,
}: {
  /** Text on the tag: a tag ID, or a short label such as a step number */
  tagId: string
  size?: keyof typeof SIZES
  /** Read before the text by screen readers */
  srLabel?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative inline-flex items-end justify-center rounded-t-[1.4em] rounded-b-[0.4em] bg-tag font-heading leading-none font-bold tracking-wide text-tag-foreground tabular-nums shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]',
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden className="absolute top-[0.3em] left-1/2 size-[0.32em] min-h-1 min-w-1 -translate-x-1/2 rounded-full bg-tag-foreground/35" />
      <span className="sr-only">{srLabel} </span>
      {tagId}
    </span>
  )
}
