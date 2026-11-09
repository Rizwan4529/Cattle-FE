import { CalendarDays, MapPin, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { DestinationZip, FulfillmentChoice, OrderTotals } from '@/components/cart/OrderSummary'
import { CattleImage } from '@/components/cattle/CattleImage'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { summarizeCart } from '@/lib/checkout'
import { formatCurrency, formatCwt, formatNumber, formatShortDate } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import { lotIllustration } from '@/lib/lots'
import { usePageTitle } from '@/lib/usePageTitle'
import { usePreferences } from '@/store/usePreferences'
import { useRanchStore } from '@/store/useRanchStore'

export default function CartPage() {
  usePageTitle('Your cart')
  const cart = useRanchStore((s) => s.cart)
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
  const removeFromCart = useRanchStore((s) => s.removeFromCart)
  const fulfillment = usePreferences((s) => s.fulfillment)
  const setFulfillment = usePreferences((s) => s.setFulfillment)
  const destination = usePreferences((s) => s.freightDestination)
  const summary = summarizeCart(cart, lots, animals, fulfillment, destination)

  const remove = (lotId: string, number?: number) => {
    removeFromCart(lotId)
    toast(number ? `Lot ${number} removed from your cart` : 'Removed from your cart')
  }

  if (cart.length === 0) {
    return (
      <div className="container-page max-w-2xl py-16 text-center">
        <ShoppingCart className="mx-auto size-14 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-4xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Find a lot you like and choose Buy now. You pay a deposit today and the rest when the cattle load.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/cattle">Browse cattle</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Your cart"
        description={`${summary.lines.length} ${summary.lines.length === 1 ? 'lot' : 'lots'}, ${summary.head} head. Cattle stay on the ranch until pickup or delivery.`}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid min-w-0 content-start gap-4">
          {summary.unavailable.map(({ lotId, lot }) => (
            <div key={lotId} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-warning/60 bg-warning/10 p-4">
              <TriangleAlert className="size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
              <p className="min-w-0 flex-1">
                <strong className="font-semibold">{lot ? `Lot ${lot.number}: ${lot.title}` : 'A lot in your cart'}</strong>{' '}
                {lot?.status === 'sold' ? 'sold to another buyer.' : 'is no longer for sale online.'}
              </p>
              <Button variant="outline" onClick={() => remove(lotId, lot?.number)}>
                Remove
              </Button>
            </div>
          ))}

          <ul className="grid gap-4">
            {summary.lines.map(({ lot, stats }) => (
              <li key={lot.id} className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:p-5">
                <Link to={`/lots/${lot.id}`} tabIndex={-1} aria-hidden className="block aspect-4/3 overflow-hidden rounded-lg border">
                  <CattleImage {...lotIllustration(lot, stats)} alt="" />
                </Link>
                <div className="grid min-w-0 gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-muted-foreground">Lot {lot.number}</p>
                      <h2 className="text-2xl font-bold">
                        <Link to={`/lots/${lot.id}`} className="underline-offset-4 hover:underline">
                          {lot.title}
                        </Link>
                      </h2>
                    </div>
                    <p className="text-right">
                      <span className="block font-heading text-2xl font-bold tabular-nums">{formatCurrency(stats.lotTotal)}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {stats.headCount} × {formatCurrency(lot.pricePerHead)}/{priceUnit(lot.class)}
                      </span>
                    </p>
                  </div>
                  <p className="text-muted-foreground tabular-nums">
                    {stats.headCount} {lot.class === 'pairs' ? 'pairs' : 'head'}, {formatNumber(stats.avgWeight)} lb average
                    {lot.class !== 'pairs' && `, ${formatCwt(stats.pricePerCwt)}`}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-primary" aria-hidden />
                      {lot.location.pasture}, {lot.location.city}, {lot.location.state}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-primary" aria-hidden />
                      Pickup {formatShortDate(lot.pickupWindow.start)} to {formatShortDate(lot.pickupWindow.end)}
                    </span>
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(lot.id, lot.number)}
                      className="-ml-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 aria-hidden />
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground">
            Want more?{' '}
            <Link to="/cattle" className="font-medium text-primary underline-offset-4 hover:underline">
              Keep browsing
            </Link>
            . Everything in your cart ships together.
          </p>
        </div>

        <aside
          aria-labelledby="summary-heading"
          className="grid content-start gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-28 lg:self-start"
        >
          <h2 id="summary-heading" className="text-2xl font-bold">
            Order summary
          </h2>
          <FulfillmentChoice value={fulfillment} onChange={setFulfillment} />
          {fulfillment === 'delivery' && <DestinationZip compact />}
          <OrderTotals summary={summary} fulfillment={fulfillment} />
          <Button asChild size="lg" className="text-lg" disabled={summary.lines.length === 0}>
            {summary.lines.length ? <Link to="/checkout">Check out</Link> : <span>Check out</span>}
          </Button>
          <p className="text-sm text-muted-foreground">
            Nothing is final until the ranch calls you. Come see the cattle before they load if you like.
          </p>
        </aside>
      </div>
    </div>
  )
}
