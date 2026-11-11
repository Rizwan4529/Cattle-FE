import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router'
import { beefConfig } from '@/config/beef'
import { byproductsConfig } from '@/config/byproducts'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { BrandMark } from './RanchBrand'

const columns = [
  {
    heading: 'Buying beef',
    links: [
      { to: '/beef', label: 'Claim a share' },
      ...(beefConfig.sellByTheCut ? [{ to: '/shop', label: 'Butcher Shop' }] : []),
      ...(byproductsConfig.enabled ? [{ to: '/ranch-goods', label: 'Ranch Goods' }] : []),
      { to: '/shop/ranch-box', label: 'Ranch Box' },
      { to: '/gifts', label: 'Gifts & gift cards' },
      { to: '/account', label: 'Your account' },
    ],
  },
  ...(soilFuelConfig.soilEnabled || soilFuelConfig.fuelEnabled
    ? [
        {
          heading: 'Soil & Fuel',
          links: [
            ...(soilFuelConfig.soilEnabled ? [{ to: '/soil', label: soilFuelConfig.soil.brand }] : []),
            ...(soilFuelConfig.fuelEnabled ? [{ to: '/fuel', label: soilFuelConfig.fuel.brand }] : []),
            ...(soilFuelConfig.soilEnabled
              ? [
                  { to: '/soil/pro', label: 'Pro accounts' },
                  { to: '/soil/stores', label: 'Find a store' },
                ]
              : []),
          ],
        },
      ]
    : []),
  {
    heading: 'Buying cattle',
    links: [
      { to: '/cattle', label: 'Browse cattle' },
      { to: '/how-it-works', label: 'How it works' },
      { to: '/scan', label: 'Chute scan demo' },
      { to: '/dashboard', label: 'Owner dashboard' },
    ],
  },
  {
    heading: 'The ranch',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/faq', label: 'Questions & answers' },
      { to: '/contact', label: 'Contact' },
      { to: '/cart', label: 'Your cart' },
    ],
  },
]

export function Footer() {
  const { location } = ranch
  return (
    <footer className="bg-leather pb-24 text-leather-foreground lg:pb-0 print:hidden">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.2fr_0.9fr_0.8fr_0.9fr_0.9fr_1.4fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark className="h-12 text-tag" />
            <p className="font-heading text-2xl font-bold">{ranch.name}</p>
          </div>
          <p className="mt-4 max-w-xs text-leather-foreground/75">
            {ranch.family} has raised beef cattle in {location.county} since {ranch.established}. Every animal we sell carries our tag and its full
            record.
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="font-heading text-lg font-semibold">{col.heading}</h2>
            <ul className="mt-3 space-y-1">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="inline-flex min-h-10 items-center text-leather-foreground/80 underline-offset-4 hover:text-leather-foreground hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="font-heading text-lg font-semibold">Reach us</h2>
          <ul className="mt-3 space-y-3 text-leather-foreground/85">
            <li>
              <a href={ranchPhoneHref} className="inline-flex items-center gap-2 text-xl font-semibold text-leather-foreground hover:underline">
                <Phone className="size-5 text-tag" aria-hidden />
                {ranch.phone}
              </a>
              <p className="ml-7 text-sm text-leather-foreground/65">{ranch.hours}</p>
            </li>
            <li>
              <a href={`mailto:${ranch.email}`} className="inline-flex items-center gap-2 break-all hover:underline">
                <Mail className="size-5 shrink-0 text-tag" aria-hidden />
                {ranch.email}
              </a>
            </li>
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-5 shrink-0 text-tag" aria-hidden />
              <span>
                {location.address}
                <br />
                {location.city}, {location.state} {location.zip}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-leather-foreground/15">
        <div className="container-page flex flex-col gap-1 py-5 text-sm text-leather-foreground/60 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {ranch.name}
          </p>
          <p>Demo site with sample data. No real payments are processed.</p>
        </div>
      </div>
    </footer>
  )
}
