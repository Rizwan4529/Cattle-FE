import { useState } from 'react'
import { Menu, Phone } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { useSide } from '@/lib/useSide'
import { cn } from '@/lib/utils'
import { moreNav, type NavItem, navActive, primaryNav } from './nav'
import { ThemeSegmented } from './ThemeToggle'

function MenuLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  const { pathname } = useLocation()
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-14 items-center gap-4 rounded-lg px-3 text-lg font-medium transition-colors hover:bg-muted',
          navActive(item.to, isActive, pathname) && 'bg-secondary text-secondary-foreground',
        )
      }
    >
      <Icon className="size-5 text-primary" aria-hidden />
      {item.label}
    </NavLink>
  )
}

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const side = useSide()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 overflow-x-hidden overflow-y-auto p-0 data-[side=right]:w-[88vw] data-[side=right]:max-w-sm">
        <SheetHeader className="border-b py-4 pr-14 pl-5">
          <SheetTitle className="font-heading text-2xl">{ranch.name}</SheetTitle>
          <SheetDescription>Every animal tagged, scanned, and verified.</SheetDescription>
        </SheetHeader>

        <nav aria-label="Main" className="flex flex-col gap-1 p-3">
          {primaryNav[side].map((item) => (
            <MenuLink key={item.to} item={item} onNavigate={close} />
          ))}
          <Separator className="my-2" />
          {moreNav.map((item) => (
            <MenuLink key={item.to} item={item} onNavigate={close} />
          ))}
        </nav>

        <div className="mt-auto space-y-4 border-t p-5">
          <Button asChild size="lg" className="w-full">
            <a href={ranchPhoneHref}>
              <Phone className="size-5" />
              Call {ranch.phone}
            </a>
          </Button>
          <ThemeSegmented />
        </div>
      </SheetContent>
    </Sheet>
  )
}
