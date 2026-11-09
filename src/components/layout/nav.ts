import { CircleHelp, Gauge, House, type LucideIcon, Phone, Route, ScanLine, Send, ShoppingCart, Store, Wheat } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  /** Shorter label for the desktop header */
  short?: string
  icon: LucideIcon
}

/** Shown in the desktop header and at the top of the mobile menu. */
export const primaryNav: NavItem[] = [
  { to: '/cattle', label: 'Browse cattle', icon: Store },
  { to: '/scan', label: 'Chute scan', icon: ScanLine },
  { to: '/how-it-works', label: 'How it works', icon: Route },
  { to: '/about', label: 'About the ranch', short: 'About', icon: Wheat },
  { to: '/contact', label: 'Contact', icon: Phone },
]

/** Secondary links in the mobile menu. */
export const moreNav: NavItem[] = [
  { to: '/faq', label: 'Questions & answers', icon: CircleHelp },
  { to: '/dashboard', label: 'Owner dashboard', icon: Gauge },
  { to: '/dashboard/syndicate', label: 'Send to auction partners', icon: Send },
]

/** Bottom tab bar on phones: the four things a buyer reaches for most. */
export const tabNav: NavItem[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/cattle', label: 'Browse', icon: Store },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
]
