import { CalendarDays, MapPin, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { FreezerCalculator } from '@/components/beef/FreezerCalculator'
import { BeefDeliveryChoice, ShareHandoffChoice, ZipChecker } from '@/components/beef/BeefDelivery'
import { ShareCartLine, ShareTotals, UnavailableShare } from '@/components/beef/ShareCart'
import { ShopCartLine } from '@/components/shop/ShopCartLine'
import { DestinationZip, FulfillmentChoice, OrderTotals } from '@/components/cart/OrderSummary'
import { CattleImage } from '@/components/cattle/CattleImage'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { BUNDLES } from '@/data/shop'
import { useNow } from '@/lib/beef'
import { summarizeShares } from '@/lib/beefCart'
import { summarizeCart } from '@/lib/checkout'
import { formatCurrency, formatCwt, formatNumber, formatShortDate } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import { lotIllustration } from '@/lib/lots'
import { summarizeShop } from '@/lib/shop'
import { useCheckoutSummary } from '@/lib/useCheckoutSummary'
import { usePageTitle } from '@/lib/usePageTitle'
import { SHARE_LABELS } from '@/lib/yield'
import { usePreferences } from '@/store/usePreferences'
import { useRanchStore } from '@/store/useRanchStore'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export default function CartPage() {
  usePageTitle('Your cart')
  const now = useNow(30_000)
  const cart = useRanchStore((s) => s.cart)
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
  const pools = useRanchStore((s) => s.pools)
  const products = useRanchStore((s) => s.products)
  const removeFromCart = useRanchStore((s) => s.removeFromCart)
  const removeShare = useRanchStore((s) => s.removeCartLine)
  const setCartQty = useRanchStore((s) => s.setCartQty)
  const fulfillment = usePreferences((s) => s.fulfillment)
  const setFulfillment = usePreferences((s) => s.setFulfillment)
  const destination = usePreferences((s) => s.freightDestination)
  const summary = summarizeCart(cart, lots, animals, fulfillment, destination)
  const shares = summarizeShares(cart, pools, animals, now)
  const hasLots = summary.lines.length > 0 || summary.unavailable.length > 0
  const hasShares = shares.lines.length > 0 || shares.unavailable.length > 0
  const shop = summarizeShop(cart, products, BUNDLES)
  const hasShop = shop.lines.length > 0
  // Show section headings only when the cart mixes kinds of purchase.
  const mixed = [hasShares, hasShop, hasLots].filter(Boolean).length > 1
  // Same numbers as checkout, including Butcher Shop delivery.
  const totals = useCheckoutSummary()
  const payToday = totals.payToday
  const canCheckOut = (summary.lines.length > 0 || shares.lines.length > 0 || hasShop) && shop.problems.length === 0
  const beefLb = shares.takeHomeLb + shop.lb

  const remove = (lotId: string, number?: number) => {
    removeFromCart(lotId)
    toast(number ? `Lot ${number} removed from your cart` : 'Removed from your cart')
  }
  const removeShareLine = (id: string, label: string) => {
    removeShare(id)
    toast(`${label} removed from your cart`)
  }

  if (cart.length === 0) {
    return (
      <div className="container-page max-w-2xl py-16 text-center">
        <ShoppingCart className="mx-auto size-14 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-4xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Claim a share of beef from an animal you choose, shop steaks and boxes in the Butcher Shop, or buy cattle by the lot.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/beef">Claim your beef</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/shop">Butcher Shop</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/cattle">Browse cattle</Link>
          </Button>
        </div>
      </div>
    )
  }

  const described = [
    shares.lines.length && plural(shares.lines.length, 'beef share'),
    shop.lines.length && plural(shop.lines.length, 'shop item'),
    summary.lines.length && `${plural(summary.lines.length, 'lot')}, ${summary.head} head`,
  ].filter(Boolean)

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Your cart"
        description={`${described.join(', ').replace(/, ([^,]*)$/, ' and $1') || 'Nothing that can be bought right now'}.${summary.lines.length ? ' Cattle stay on the ranch until pickup or delivery.' : ''}`}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid min-w-0 content-start gap-8">
          {hasShares && (
            <section aria-labelledby="cart-beef" className="grid gap-4">
              <h2 id="cart-beef" className={mixed ? 'text-2xl font-bold' : 'sr-only'}>
                Beef shares
              </h2>
              {shares.unavailable.map((u) => (
                <UnavailableShare key={u.item.id} entry={u} onRemove={() => removeShareLine(u.item.id, `${SHARE_LABELS[u.item.size]} share`)} />
              ))}
              <ul className="grid gap-4">
                {shares.lines.map((line) => (
                  <ShareCartLine
                    key={line.item.id}
                    line={line}
                    onRemove={() => removeShareLine(line.item.id, `${SHARE_LABELS[line.item.size]} of ${line.animal.tagId}`)}
                  />
                ))}
              </ul>
            </section>
          )}

          {hasShop && (
            <section aria-labelledby="cart-shop" className="grid gap-4">
              <h2 id="cart-shop" className={mixed ? 'text-2xl font-bold' : 'sr-only'}>
                Butcher Shop and gifts
              </h2>
              <ul className="grid gap-4">
                {shop.lines.map((line) => (
                  <ShopCartLine
                    key={line.item.id}
                    line={line}
                    products={products}
                    onQty={(qty) => setCartQty(line.item.id, qty)}
                    onRemove={() => removeShareLine(line.item.id, line.title)}
                  />
                ))}
              </ul>
            </section>
          )}

          {hasLots && (
            <section aria-labelledby="cart-cattle" className="grid gap-4">
              <h2 id="cart-cattle" className={mixed ? 'text-2xl font-bold' : 'sr-only'}>
                Cattle
              </h2>
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
                          <h3 className="text-2xl font-bold">
                            <Link to={`/lots/${lot.id}`} className="underline-offset-4 hover:underline">
                              {lot.title}
                            </Link>
                          </h3>
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
            </section>
          )}

          {(totals.hasShopBeef || totals.hasShares) && (
            <section aria-labelledby="cart-delivery" className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
              <div>
                <h2 id="cart-delivery" className="text-2xl font-bold">
                  Getting your beef
                </h2>
                <p className="mt-1 text-muted-foreground">Check your ZIP for local delivery and shipping. You can change this at checkout.</p>
              </div>
              <ZipChecker summary={totals} />
              {totals.hasShopBeef && (
                <div className="grid gap-3">
                  <h3 className="text-lg font-bold">Butcher Shop order</h3>
                  <BeefDeliveryChoice summary={totals} />
                </div>
              )}
              {totals.hasShares && (
                <div className="grid gap-3">
                  <h3 className="text-lg font-bold">Your share, once it’s ready</h3>
                  <ShareHandoffChoice summary={totals} />
                </div>
              )}
            </section>
          )}

          {beefLb > 0 && <FreezerCalculator key={beefLb} initialLb={beefLb} title="Will your beef fit in the freezer?" />}

          <p className="text-muted-foreground">
            Want more?{' '}
            <Link to="/beef" className="font-medium text-primary underline-offset-4 hover:underline">
              Claim more beef
            </Link>
            ,{' '}
            <Link to="/shop" className="font-medium text-primary underline-offset-4 hover:underline">
              shop cuts
            </Link>
            , or{' '}
            <Link to="/cattle" className="font-medium text-primary underline-offset-4 hover:underline">
              browse cattle
            </Link>
            .
          </p>
        </div>

        <aside
          aria-labelledby="summary-heading"
          className="grid content-start gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-28 lg:self-start"
        >
          <h2 id="summary-heading" className="text-2xl font-bold">
            Order summary
          </h2>
          {shares.lines.length > 0 && <ShareTotals summary={shares} />}
          {hasShop && (
            <dl className={shares.lines.length ? 'border-t pt-4' : undefined}>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-semibold">
                  Butcher Shop and gifts
                  <span className="block text-sm font-normal text-muted-foreground">Paid in full today</span>
                </dt>
                <dd className="font-semibold tabular-nums">{formatCurrency(shop.subtotal, true)}</dd>
              </div>
              {totals.hasShopBeef && (
                <div className="mt-2 flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">{totals.delivery.label}</dt>
                  <dd className="font-semibold tabular-nums">{totals.deliveryCost ? formatCurrency(totals.deliveryCost, true) : 'Free'}</dd>
                </div>
              )}
            </dl>
          )}
          {summary.lines.length > 0 && (
            <>
              {(shares.lines.length > 0 || hasShop) && <h3 className="border-t pt-4 text-xl font-bold">Cattle</h3>}
              <FulfillmentChoice value={fulfillment} onChange={setFulfillment} />
              {fulfillment === 'delivery' && <DestinationZip compact />}
              <OrderTotals summary={summary} fulfillment={fulfillment} />
            </>
          )}
          {(shares.lines.length > 0 || hasShop) && (
            <dl
              className={
                summary.lines.length
                  ? 'flex items-baseline justify-between gap-4 rounded-lg bg-primary px-4 py-3 text-primary-foreground'
                  : 'flex items-baseline justify-between gap-4 rounded-lg bg-secondary px-4 py-3 text-secondary-foreground'
              }
            >
              <dt className="font-semibold">{summary.lines.length ? 'Pay today in all' : 'Pay today'}</dt>
              <dd className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(payToday, true)}</dd>
            </dl>
          )}
          {shop.problems.length > 0 && (
            <p role="alert" className="rounded-lg bg-warning/15 px-4 py-3 text-sm font-medium">
              Some items are running low. Lower the quantity or remove them to check out.
            </p>
          )}
          {canCheckOut ? (
            <Button asChild size="lg" className="text-lg">
              <Link to="/checkout">Check out</Link>
            </Button>
          ) : (
            <Button size="lg" className="text-lg" disabled>
              Check out
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            {shares.lines.length
              ? 'Shares in your cart are held for you. Nothing is harvested until the animal is fully claimed.'
              : hasShop
                ? 'Frozen beef ships Monday to Wednesday, or pick it up at the ranch store.'
                : 'Nothing is final until the ranch calls you. Come see the cattle before they load if you like.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
