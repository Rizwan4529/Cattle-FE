import { useState } from 'react'
import {
  Beef,
  Calculator,
  CalendarDays,
  ChartColumn,
  FileUp,
  Gauge,
  HandCoins,
  Inbox,
  PiggyBank,
  ShieldCheck,
  Warehouse,
  type LucideIcon,
  Package,
  PanelLeft,
  ScanLine,
  Send,
  Settings,
  Snowflake,
  Tags,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { byproductsConfig } from '@/config/byproducts'
import { ranch } from '@/config/ranch'
import { isOpenOffer } from '@/lib/dashboard'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

interface OwnerLink {
  to: string
  label: string
  icon: LucideIcon
  /** Match only this exact path (the overview would otherwise match every owner page) */
  end?: boolean
  showOpenOffers?: boolean
  showNewInquiries?: boolean
}

const GROUPS: { label: string; links: OwnerLink[] }[] = [
  {
    label: 'Your ranch',
    links: [
      { to: '/dashboard', label: 'Overview', icon: Gauge, end: true },
      { to: '/dashboard/herd', label: 'Herd', icon: Tags },
      { to: '/dashboard/lots', label: 'Lots', icon: Package },
      { to: '/dashboard/offers', label: 'Offers', icon: HandCoins, showOpenOffers: true },
    ],
  },
  {
    label: 'Beef',
    links: [
      { to: '/dashboard/pools', label: 'Share pools', icon: Beef },
      { to: '/dashboard/harvest', label: 'Harvest schedule', icon: CalendarDays },
      { to: '/dashboard/inventory', label: 'Packaged inventory', icon: Snowflake },
      { to: '/dashboard/beef-sales', label: 'Sales by channel', icon: ChartColumn },
      { to: '/dashboard/live-vs-beef', label: 'Live vs. beef calculator', icon: Calculator },
    ],
  },
  ...(byproductsConfig.enabled
    ? [
        {
          label: 'Ranch Goods',
          links: [
            { to: '/dashboard/hidden-revenue', label: 'Hidden revenue', icon: PiggyBank },
            { to: '/dashboard/byproducts', label: 'Byproduct inventory', icon: Warehouse },
            { to: '/dashboard/wholesale', label: 'Wholesale inquiries', icon: Inbox, showNewInquiries: true },
            { to: '/dashboard/compliance', label: 'Compliance checklist', icon: ShieldCheck },
          ],
        },
      ]
    : []),
  {
    label: 'Selling and records',
    links: [
      { to: '/dashboard/syndicate', label: 'Send to auction partners', icon: Send },
      { to: '/dashboard/import', label: 'Import a spreadsheet', icon: FileUp },
      { to: '/scan', label: 'Run a chute scan', icon: ScanLine },
    ],
  },
]

const SETTINGS: OwnerLink = { to: '/dashboard/settings', label: 'Settings', icon: Settings }

const ALL_LINKS = [...GROUPS.flatMap((g) => g.links), SETTINGS]

/** Name of the owner page being shown, for the phone menu button. */
function currentLabel(pathname: string) {
  const match = ALL_LINKS.filter((l) => (l.end ? pathname === l.to : pathname === l.to || pathname.startsWith(`${l.to}/`))).sort(
    (a, b) => b.to.length - a.to.length,
  )[0]
  return match?.label ?? 'Overview'
}

function SidebarLink({
  link,
  openOffers,
  newInquiries,
  onNavigate,
}: {
  link: OwnerLink
  openOffers: number
  newInquiries: number
  onNavigate?: () => void
}) {
  const Icon = link.icon
  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-1.5 text-base font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-foreground',
          isActive &&
            'bg-primary/10 font-semibold text-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
          <span className="min-w-0 flex-1">{link.label}</span>
          {link.showOpenOffers && openOffers > 0 && (
            <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-sm font-semibold text-primary-foreground tabular-nums">
              <span className="sr-only">, </span>
              {openOffers}
              <span className="sr-only"> open</span>
            </span>
          )}
          {link.showNewInquiries && newInquiries > 0 && (
            <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-sm font-semibold text-primary-foreground tabular-nums">
              <span className="sr-only">, </span>
              {newInquiries}
              <span className="sr-only"> new</span>
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const openOffers = useRanchStore((s) => s.offers.filter(isOpenOffer).length)
  const newInquiries = useRanchStore((s) => s.wholesaleInquiries.filter((w) => w.status === 'new').length)
  return (
    <nav aria-label="Owner dashboard" className="grid gap-3">
      {GROUPS.map((group) => (
        <div key={group.label} className="grid gap-0.5">
          <p className="px-3 pb-0.5 text-sm font-medium text-muted-foreground">{group.label}</p>
          <ul className="grid gap-0.5">
            {group.links.map((link) => (
              <li key={link.to}>
                <SidebarLink link={link} openOffers={openOffers} newInquiries={newInquiries} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="border-t pt-3">
        <SidebarLink link={SETTINGS} openOffers={openOffers} newInquiries={newInquiries} onNavigate={onNavigate} />
      </div>
    </nav>
  )
}

function OwnerBadge() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground"
      >
        {ranch.owner
          .split(' ')
          .map((w) => w[0])
          .join('')}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold">{ranch.owner}</p>
        <p className="text-sm text-muted-foreground">Logged in as Owner</p>
      </div>
    </div>
  )
}

/** Shell for every owner page: a sidebar on large screens, a slide-out menu on phones and tablets. */
export default function OwnerLayout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="container-wide lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-10 print:block print:max-w-none print:px-0">
      <aside
        aria-label="Owner pages"
        className="hidden lg:sticky lg:top-24 lg:my-6 lg:grid lg:max-h-[calc(100svh-6.5rem)] lg:content-start lg:gap-4 lg:self-start lg:overflow-y-auto print:hidden"
      >
        <OwnerBadge />
        <SidebarNav />
      </aside>

      <div className="min-w-0 pb-16 print:pb-0">
        <div className="flex items-center gap-3 border-b py-3 lg:hidden print:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg">
                <PanelLeft aria-hidden />
                Dashboard menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="gap-0 overflow-y-auto p-0 data-[side=left]:w-[85vw] data-[side=left]:max-w-xs">
              <SheetHeader className="border-b py-4 pr-14 pl-5">
                <SheetTitle className="font-heading text-2xl">Owner dashboard</SheetTitle>
                <SheetDescription>{ranch.name}</SheetDescription>
              </SheetHeader>
              <div className="grid gap-6 p-3">
                <OwnerBadge />
                <SidebarNav onNavigate={() => setMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <p className="min-w-0 truncate font-semibold" aria-hidden>
            {currentLabel(pathname)}
          </p>
        </div>
        <div className="pt-6 lg:pt-8 print:pt-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
