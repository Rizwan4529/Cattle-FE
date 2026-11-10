import type { ReactNode } from 'react'
import { Beef, CreditCard, Heart, Repeat } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { myClaims } from '@/lib/account'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { POOL_STATUS_LABELS, SHARE_LABELS } from '@/lib/yield'
import { useRanchStore } from '@/store/useRanchStore'

export function AccountHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-lg text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export default function OverviewPage() {
  usePageTitle('Your account')
  const account = useRanchStore((s) => s.account)!
  const orders = useRanchStore((s) => s.orders)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const subscriptions = useRanchStore((s) => s.subscriptions)
  const giftCards = useRanchStore((s) => s.giftCards)
  const favorites = useRanchStore((s) => s.favorites)
  const claims = myClaims(pools, animals, orders)
  const active = subscriptions.find((s) => s.status === 'active')
  const balance = giftCards.reduce((n, g) => n + g.balance, 0)

  const cards = [
    {
      to: '/account/shares',
      icon: Beef,
      title: 'Shares',
      value: String(claims.length),
      note: claims[0]
        ? `${SHARE_LABELS[claims[0].claim.size]} of ${claims[0].animal.tagId}: ${POOL_STATUS_LABELS[claims[0].pool.status]}`
        : 'None claimed yet',
    },
    {
      to: '/account/ranch-box',
      icon: Repeat,
      title: 'Ranch Box',
      value: active ? formatShortDate(active.nextShip) : '–',
      note: active ? 'Next box ships' : subscriptions.length ? 'Paused' : 'Not subscribed',
    },
    { to: '/account/gift-cards', icon: CreditCard, title: 'Gift cards', value: formatCurrency(balance, true), note: `${giftCards.length} bought` },
    { to: '/account/favorites', icon: Heart, title: 'Favorites', value: String(favorites.length), note: 'One-click reorder' },
  ]

  return (
    <>
      <AccountHeader
        title={`Howdy, ${account.name.split(' ')[0]}`}
        description={`Member since ${formatDate(account.since)}. Everything you’ve bought from the ranch, in one place.`}
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ to, icon: Icon, title, value, note }) => (
          <li key={to} className="grid">
            <Link
              to={to}
              className="grid content-start gap-1 rounded-2xl border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex items-center gap-2 font-semibold text-muted-foreground">
                <Icon className="size-5 text-primary" aria-hidden />
                {title}
              </span>
              <span className="font-heading text-3xl font-bold tabular-nums">{value}</span>
              <span className="text-sm text-muted-foreground">{note}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent" className="mt-10 grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="recent" className="text-2xl font-bold">
            Recent orders
          </h2>
          {orders.length > 0 && (
            <Button asChild variant="link" className="px-0 text-base">
              <Link to="/account/orders">All orders</Link>
            </Button>
          )}
        </div>
        {orders.length ? (
          <ul className="grid gap-3">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link
                  to={`/order/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span>
                    <span className="block font-semibold">Order {o.number}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(o.deposit, true)} paid</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
            <p className="text-lg">No orders yet. Claim a share of an animal or pick out some steaks.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/beef">Claim your beef</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/shop">Butcher Shop</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
