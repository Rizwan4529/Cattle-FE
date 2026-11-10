import {
  Beef,
  Bone,
  CircleHelp,
  ClipboardList,
  Gauge,
  Gift,
  House,
  type LucideIcon,
  Phone,
  Route,
  ScanLine,
  Send,
  ShoppingCart,
  Store,
  UserRound,
  Wheat,
} from 'lucide-react'
import { beefConfig } from '@/config/beef'
import { byproductsConfig } from '@/config/byproducts'

export interface NavItem {
  to: string
  label: string
  /** Shorter label for the desktop header */
  short?: string
  /** Left out of the desktop header to keep it on one line; always in the menu and footer */
  menuOnly?: boolean
  icon: LucideIcon
}

/**
 * The site has two sides: Buy Beef (families buying beef) and Buy Cattle
 * (the livestock marketplace). The header switch moves between them and the
 * menus show the links for the side you're on.
 */
export type Side = 'beef' | 'cattle'

export const SIDES: Record<Side, { label: string; to: string; description: string }> = {
  beef: { label: 'Buy Beef', to: '/', description: 'Beef for your freezer, from one animal you choose.' },
  cattle: { label: 'Buy Cattle', to: '/livestock', description: 'Live cattle for ranchers, buyers, and sale barns.' },
}

const BEEF_PATHS = ['/beef', '/shop', '/gifts', '/account', '/ranch-goods', '/nothing-wasted']
const CATTLE_PATHS = ['/livestock', '/cattle', '/lots', '/scan', '/how-it-works', '/dashboard']

const under = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`)

/** The side a page belongs to, or null for shared pages (about, contact, cart…), which keep the side you came from. */
export function sideForPath(pathname: string): Side | null {
  if (pathname === '/' || BEEF_PATHS.some((p) => under(pathname, p))) return 'beef'
  if (CATTLE_PATHS.some((p) => under(pathname, p))) return 'cattle'
  return null
}

const ABOUT: NavItem = { to: '/about', label: 'About the ranch', short: 'About', icon: Wheat, menuOnly: true }
const CONTACT: NavItem = { to: '/contact', label: 'Contact', icon: Phone, menuOnly: true }

/** Header and menu links, per side. */
export const primaryNav: Record<Side, NavItem[]> = {
  beef: [
    { to: '/beef', label: 'Claim your beef', icon: Beef },
    // The Butcher Shop only shows when the ranch sells by the cut (config flag).
    ...(beefConfig.sellByTheCut ? [{ to: '/shop', label: 'Butcher Shop', icon: Store }] : []),
    // Ranch Goods (hides, tallow, chews…) only shows when the byproduct store is switched on.
    ...(byproductsConfig.enabled ? [{ to: '/ranch-goods', label: 'Ranch Goods', icon: Bone }] : []),
    { to: '/gifts', label: 'Gifts', icon: Gift },
    // Reached from claims, orders, and the account; the menu keeps it one tap away.
    { to: '/beef/cut-sheet', label: 'Cut sheet builder', short: 'Cut sheet', icon: ClipboardList, menuOnly: true },
    ABOUT,
    CONTACT,
  ],
  cattle: [
    { to: '/cattle', label: 'Browse cattle', icon: Store },
    { to: '/scan', label: 'Chute scan', icon: ScanLine },
    { to: '/how-it-works', label: 'How it works', icon: Route },
    ABOUT,
    CONTACT,
  ],
}

/** Links whose pages sit under another link's path; the parent link isn't highlighted on them. */
const SEPARATE_PAGES: Record<string, string[]> = { '/beef': ['/beef/cut-sheet'] }

/** NavLink's match, minus pages that have their own link (the cut sheet lives under /beef). */
export const navActive = (to: string, isActive: boolean, pathname: string) => isActive && !SEPARATE_PAGES[to]?.some((p) => pathname.startsWith(p))

/** Secondary links in the mobile menu. */
export const moreNav: NavItem[] = [
  { to: '/account', label: 'Your account', icon: UserRound },
  { to: '/faq', label: 'Questions & answers', icon: CircleHelp },
  { to: '/dashboard', label: 'Owner dashboard', icon: Gauge },
  { to: '/dashboard/syndicate', label: 'Send to auction partners', icon: Send },
]

/** Bottom tab bar on phones: the four things a visitor reaches for most on each side. */
export const tabNav: Record<Side, NavItem[]> = {
  beef: [
    { to: '/', label: 'Home', icon: House },
    { to: '/beef', label: 'Shares', icon: Beef },
    beefConfig.sellByTheCut ? { to: '/shop', label: 'Shop', icon: Store } : { to: '/gifts', label: 'Gifts', icon: Gift },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
  ],
  cattle: [
    { to: '/livestock', label: 'Home', icon: House },
    { to: '/cattle', label: 'Browse', icon: Store },
    { to: '/scan', label: 'Scan', icon: ScanLine },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
  ],
}
