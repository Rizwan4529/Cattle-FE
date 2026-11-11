import type { ReactNode } from 'react'
import { Leaf, Mountain, Sprout, Users } from 'lucide-react'
import { ranch } from '@/config/ranch'
import { cn } from '@/lib/utils'

const ICONS: Record<string, typeof Users> = { family: Users, land: Mountain, natural: Leaf, fertilizer: Sprout }

/** The four parts of the About Farrell story (family, land, all natural, fertilizer), from `ranch.story`. */
export function StoryPoints({ onDark = false, headingLevel = 3, className }: { onDark?: boolean; headingLevel?: 3 | 4; className?: string }) {
  const H = `h${headingLevel}` as const
  return (
    <ul className={cn('grid gap-x-8 gap-y-6 sm:grid-cols-2', className)}>
      {ranch.story.sections.map((s) => {
        const Icon = ICONS[s.id] ?? Leaf
        return (
          <li key={s.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3">
            <span
              className={cn(
                'grid size-11 place-items-center rounded-full',
                onDark ? 'bg-leather-foreground/10 text-tag' : 'bg-primary/10 text-primary',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <H className="font-heading text-xl font-bold">{s.title}</H>
              <p className={cn('mt-1 text-lg', onDark ? 'text-leather-foreground/85' : 'text-muted-foreground')}>{s.text}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** The owner's "All Natural" value as a small badge. Hidden when switched off in config. */
export function AllNaturalBadge({ className }: { className?: string }) {
  const v = ranch.values.allNatural
  if (!v.enabled) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 font-semibold text-foreground',
        className,
      )}
    >
      <Leaf className="size-4 text-success" aria-hidden />
      {v.label}
    </span>
  )
}

/** Farrell's quote, attributed. */
export function FarrellQuote({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  return (
    <blockquote className={cn('border-l-4 pl-5 text-xl', onDark ? 'border-tag' : 'border-primary', className)}>
      “{ranch.story.quote}”
      <footer className={cn('mt-3 text-base', onDark ? 'text-leather-foreground/75' : 'text-muted-foreground')}>
        {ranch.owner}, {ranch.name}
      </footer>
    </blockquote>
  )
}

/**
 * The full "About Farrell" section: lede, the four story points, and the quote.
 * Used on the About page and the Buy Cattle home page.
 */
export function FarrellStory({ id = 'farrell', className, children }: { id?: string; className?: string; children?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={cn('grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]', className)}>
      <div className="grid content-start gap-4">
        <h2 id={`${id}-heading`} className="text-3xl font-bold sm:text-4xl">
          {ranch.story.heading}
        </h2>
        <p className="text-lg">{ranch.story.lede}</p>
        <AllNaturalBadge className="justify-self-start" />
        {children}
      </div>
      <div className="grid content-start gap-8">
        <StoryPoints />
        <FarrellQuote />
      </div>
    </section>
  )
}
