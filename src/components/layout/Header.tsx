import { Gauge, Phone, ShoppingCart } from 'lucide-react'
import { Link, NavLink, useNavigation } from 'react-router'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'
import { MobileMenu } from './MobileMenu'
import { primaryNav } from './nav'
import { RanchBrand } from './RanchBrand'
import { ThemeToggle } from './ThemeToggle'

function CartButton({ className }: { className?: string }) {
  const count = useRanchStore((s) => s.cart.length)
  return (
    <Button asChild variant="ghost" size="icon" className={cn('relative', className)}>
      <Link to="/cart" aria-label={count ? `Cart, ${count} lot${count === 1 ? '' : 's'}` : 'Cart, empty'}>
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span className="absolute top-1 right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs leading-5 font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </Link>
    </Button>
  )
}

export function Header() {
  const navigation = useNavigation()

  return (
    <header className="sticky top-0 z-40 border-b print:hidden bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
      {/* Page-load progress */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 h-0.5 origin-left bg-primary transition-transform duration-500',
          navigation.state === 'loading' ? 'scale-x-75' : 'scale-x-0 duration-0',
        )}
      />
      <div className="container-page flex h-16 items-center gap-2 lg:h-20">
        <RanchBrand />

        <nav aria-label="Main" className="ml-6 hidden items-center gap-0.5 xl:flex 2xl:ml-10">
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative rounded-md px-3 py-2 text-[0.95rem] whitespace-nowrap font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground',
                  isActive &&
                    'text-foreground after:absolute after:inset-x-3 after:-bottom-[1.05rem] after:h-[3px] after:rounded-full after:bg-primary',
                )
              }
            >
              {item.short ?? item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <a href={ranchPhoneHref}>
              <Phone className="size-4" />
              <span className="hidden 2xl:inline">{ranch.phone}</span>
              <span className="2xl:hidden">Call</span>
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <a href={ranchPhoneHref} aria-label={`Call ${ranch.phone}`}>
              <Phone className="size-5" />
            </a>
          </Button>
          {/* On phones these live in the menu and the bottom tab bar */}
          <div className="hidden items-center gap-1 sm:flex">
            <ThemeToggle />
          </div>
          <CartButton className="hidden lg:inline-flex" />
          <Button asChild variant="secondary" className="ml-1 hidden xl:inline-flex">
            <Link to="/dashboard">
              <Gauge className="size-4" />
              Owner
            </Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
