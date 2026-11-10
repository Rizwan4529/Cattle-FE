import { useState } from 'react'
import { Beef, ClipboardList, CreditCard, Heart, House, LogOut, type LucideIcon, MapPin, PanelLeft, Receipt, Repeat, Tags } from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

interface AccountLink {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const LINKS: AccountLink[] = [
  { to: '/account', label: 'Overview', icon: House, end: true },
  { to: '/account/orders', label: 'Orders', icon: Receipt },
  { to: '/account/shares', label: 'My shares', icon: Beef },
  { to: '/account/animals', label: 'My animals', icon: Tags },
  { to: '/account/cut-sheets', label: 'Cut sheets', icon: ClipboardList },
  { to: '/account/ranch-box', label: 'Ranch Box', icon: Repeat },
  { to: '/account/favorites', label: 'Favorites', icon: Heart },
  { to: '/account/gift-cards', label: 'Gift cards', icon: CreditCard },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
]

const currentLabel = (pathname: string) =>
  [...LINKS].sort((a, b) => b.to.length - a.to.length).find((l) => (l.end ? pathname === l.to : pathname.startsWith(l.to)))?.label ?? 'Overview'

function AccountNav({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const signOut = useRanchStore((s) => s.signOut)
  return (
    <nav aria-label="Your account" className="grid gap-1">
      <ul className="grid gap-1">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-foreground',
                  isActive &&
                    'bg-primary/10 font-semibold text-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('size-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t pt-3">
        <button
          type="button"
          onClick={() => {
            signOut()
            onNavigate?.()
            toast('Signed out', { description: 'Your orders and shares stay saved in this browser.' })
            navigate('/beef')
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-foreground/85 hover:bg-muted"
        >
          <LogOut className="size-5 text-muted-foreground" aria-hidden />
          Sign out
        </button>
      </div>
    </nav>
  )
}

/** Shell for the customer account pages: sign-in gate, sidebar on large screens, slide-out menu on phones. */
export default function AccountLayout() {
  const { pathname } = useLocation()
  const account = useRanchStore((s) => s.account)
  const [menuOpen, setMenuOpen] = useState(false)

  if (!account) return <Navigate to={`/account/sign-in?next=${encodeURIComponent(pathname)}`} replace />

  const initials = account.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const badge = (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground"
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold">{account.name}</p>
        <p className="truncate text-sm text-muted-foreground">{account.email}</p>
      </div>
    </div>
  )

  return (
    <div className="container-page lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      <aside aria-label="Account pages" className="hidden lg:sticky lg:top-24 lg:my-8 lg:grid lg:content-start lg:gap-5 lg:self-start">
        {badge}
        <AccountNav />
      </aside>
      <div className="min-w-0 pb-16">
        <div className="flex items-center gap-3 border-b py-3 lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg">
                <PanelLeft aria-hidden />
                Account menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="gap-0 overflow-y-auto p-0 data-[side=left]:w-[85vw] data-[side=left]:max-w-xs">
              <SheetHeader className="border-b py-4 pr-14 pl-5">
                <SheetTitle className="font-heading text-2xl">Your account</SheetTitle>
                <SheetDescription>{account.email}</SheetDescription>
              </SheetHeader>
              <div className="grid gap-5 p-3">
                {badge}
                <AccountNav onNavigate={() => setMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <p className="min-w-0 truncate font-semibold" aria-hidden>
            {currentLabel(pathname)}
          </p>
        </div>
        <div className="pt-6 lg:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
