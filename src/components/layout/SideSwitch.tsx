import { Link, useMatch } from 'react-router'
import { useSide } from '@/lib/useSide'
import { cn } from '@/lib/utils'
import { type Side, SIDES } from './nav'

/**
 * "Buy Beef | Buy Cattle": the top-level split of the site, drawn as two
 * folder tabs on a leather strip above the header. The active tab runs into
 * the header below it.
 */
export function SideSwitch() {
  const side = useSide()
  const ownerArea = Boolean(useMatch('/dashboard/*'))

  return (
    <div className="bg-leather text-leather-foreground print:hidden">
      <div className={cn(ownerArea ? 'container-wide' : 'container-page', 'flex items-end justify-between gap-4 pt-1.5')}>
        <nav aria-label="Shop for" className="flex gap-1">
          {(Object.keys(SIDES) as Side[]).map((s) => {
            const active = s === side
            return (
              <Link
                key={s}
                to={SIDES[s].to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'grid min-h-10 place-items-center rounded-t-lg px-4 font-semibold whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none sm:px-5',
                  active ? 'bg-background text-foreground' : 'text-leather-foreground/85 hover:bg-white/10 hover:text-leather-foreground',
                )}
              >
                {SIDES[s].label}
              </Link>
            )
          })}
        </nav>
        {/* A tagline that repeats the tab names; hidden from screen readers so it doesn't sit outside a landmark */}
        <p aria-hidden className="hidden pb-2.5 text-sm text-leather-foreground/80 md:block">
          {SIDES[side].description}
        </p>
      </div>
    </div>
  )
}
