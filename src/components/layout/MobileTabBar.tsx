import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'
import { tabNav } from './nav'

/** Thumb-reachable tab bar on phones. Hidden on large screens. */
export function MobileTabBar() {
  const cartCount = useRanchStore((s) => s.cart.length)

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabNav.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground transition-colors',
                  isActive && 'text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden className="absolute top-0 h-[3px] w-10 rounded-b-full bg-primary" />}
                  <span className="relative">
                    <Icon className="size-6" aria-hidden />
                    {to === '/cart' && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs leading-5 font-bold text-primary-foreground">
                        {cartCount}
                      </span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
