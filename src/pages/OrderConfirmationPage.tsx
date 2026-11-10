import { CircleCheck, ClipboardList, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { PoolTimeline } from '@/components/beef/PoolTimeline'
import { EarTag } from '@/components/cattle/EarTag'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { beefTitle, useNow } from '@/lib/beef'
import { depositPercent } from '@/lib/checkout'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { getLotStats } from '@/lib/lots'
import { usePageTitle } from '@/lib/usePageTitle'
import { SHARE_LABELS } from '@/lib/yield'
import { beefConfig } from '@/config/beef'
import { zoneForZip } from '@/lib/delivery'
import { useRanchStore } from '@/store/useRanchStore'
import { TreatThePup } from '@/components/goods/GoodsCrossSell'

const placedOn = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function OrderConfirmationPage() {
  const { orderId } = useParams()
  const order = useRanchStore((s) => s.orders.find((o) => o.id === orderId))
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
  const pools = useRanchStore((s) => s.pools)
  const cutSheets = useRanchStore((s) => s.cutSheets)
  const now = useNow(60_000)
  usePageTitle(order ? `Order ${order.number}` : 'Order not found')

  if (!order) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold">We can't find that order</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Orders are kept in this browser. If you placed it on another device, check your email receipt or call {ranch.phone}.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/cattle">Browse cattle</Link>
        </Button>
      </div>
    )
  }

  const orderLots = order.lotIds.flatMap((id) => lots.find((l) => l.id === id) ?? [])
  const orderShares = (order.shares ?? []).flatMap((sh) => {
    const pool = pools.find((p) => p.id === sh.poolId)
    const animal = animals.find((a) => a.tagId === sh.tagId)
    return pool && animal ? [{ share: sh, pool, animal }] : []
  })
  const hasLots = orderLots.length > 0
  const sharesTotal = orderShares.reduce((n, s) => n + s.share.estimatedTotal, 0)
  const items = order.items ?? []
  const itemsTotal = items.reduce((n, i) => n + i.total, 0)
  const paysToday = orderShares.length > 0 || items.length > 0
  const beefDelivery = order.beefDelivery
  const discount = order.discount?.amount ?? 0
  const physical = items.filter((i) => i.kind === 'product' || i.kind === 'bundle' || i.kind === 'box' || i.kind === 'goods')

  // When the Butcher Shop beef gets to the customer
  const placed = new Date(order.createdAt)
  const dayAfter = (n: number) => {
    const d = new Date(placed)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }
  const zone = zoneForZip(order.buyer.address.match(/(\d{5})$/)?.[1] ?? '')
  const shopSteps =
    beefDelivery && physical.length
      ? [
          { title: 'Order placed', body: 'Paid in full. Your receipt is on its way by email.', when: formatShortDate(order.createdAt) },
          {
            title: 'Pulled from the freezer and packed',
            body: 'Every pack keeps its label with the ear tag of the animal it came from.',
            when: formatShortDate(dayAfter(1)),
          },
          beefDelivery.method === 'pickup'
            ? {
                title: 'Ready for pickup',
                body: `${beefConfig.delivery.pickup.place}${beefDelivery.pickup ? `, ${beefDelivery.pickup.slot}` : ''}. Bring a cooler.`,
                when: beefDelivery.pickup ? formatShortDate(beefDelivery.pickup.date) : 'Your pickup day',
              }
            : beefDelivery.method === 'local'
              ? {
                  title: 'Delivered to your door',
                  body: `Our ${zone?.name ?? 'local'} route runs ${zone?.days.toLowerCase() ?? 'weekly'}. We text when we’re on the way.`,
                  when: 'Next route day',
                }
              : { title: 'Shipped frozen', body: `${beefConfig.delivery.shipping.note} You get a tracking number by email.`, when: 'Within 3 days' },
          ...(beefDelivery.method === 'ship'
            ? [{ title: 'At your door', body: 'Still frozen solid. Move it to the freezer right away.', when: '2 days after shipping' }]
            : []),
        ]
      : []
  const allFull = orderShares.length > 0 && orderShares.every((s) => s.pool.status !== 'open')
  const firstName = order.buyer.name.split(' ')[0]
  const earliest = orderLots.map((l) => l.pickupWindow.start).sort()[0]
  const latest = orderLots
    .map((l) => l.pickupWindow.end)
    .sort()
    .at(-1)
  const delivery = order.fulfillment === 'delivery'

  const beefSteps = [
    {
      ...(allFull
        ? {
            title: 'Harvest is locked in',
            body: 'Your claim filled the last share, so every share is spoken for. The ranch books the processor and emails you the date.',
          }
        : {
            title: 'Harvest locks in when the animal fills',
            body: 'Your name is on its fill meter now. When every share is claimed, the ranch books the processor and emails you the date.',
          }),
    },
    {
      title: 'Fill out your cut sheet',
      body: `Choose how you want it cut: steaks, roasts, ground beef, and thickness. It takes about five minutes, and ${ranch.owner} calls you at ${order.buyer.phone} if anything needs talking over.`,
    },
    { title: 'Dry aged, cut, and wrapped', body: 'The carcass hangs 14 to 21 days, then it’s cut to your sheet, vacuum-sealed, and frozen.' },
    {
      title: 'Pick up your beef',
      body: 'At the ranch store, or by local delivery. The balance is due then, figured on the actual hanging weight from the processor.',
    },
  ]

  const steps = [
    {
      title: `${ranch.owner} calls you`,
      body: `Within one business day, at ${order.buyer.phone}, to confirm the order and answer questions.`,
    },
    {
      title: 'Come see the cattle (optional)',
      body: `Look them over at the ranch before they load. If they aren't as described, you can back out and the ${formatCurrency(order.deposit)} deposit is refunded.`,
    },
    {
      title: 'Health papers and brand inspection',
      body: "The ranch's vet writes the health certificate for cattle leaving the state, and brand inspection is arranged where your state requires it.",
    },
    {
      title: delivery ? 'Delivery day' : 'Loading day',
      body: `${earliest && latest ? `Between ${formatShortDate(earliest)} and ${formatShortDate(latest)}. ` : ''}${
        delivery ? `The hauler delivers to ${order.buyer.address}.` : 'Loading chute and scale are on site.'
      } The ${formatCurrency(order.balance)} balance is due ${delivery ? 'on delivery' : 'at loading'}, by check or wire.`,
    },
  ]

  return (
    <div className="container-page max-w-4xl pb-16 print:max-w-none print:px-0">
      <div className="flex flex-col gap-4 pt-10 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <CircleCheck className="mt-1 size-10 shrink-0 text-success" aria-hidden />
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">Thank you, {firstName}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Order <strong className="font-semibold text-foreground">{order.number}</strong> is placed.{' '}
              {hasLots && orderShares.length
                ? 'Your deposit holds the cattle and your beef shares.'
                : hasLots
                  ? 'Your deposit holds the cattle.'
                  : orderShares.length
                    ? 'Your deposit holds your share.'
                    : 'Your beef is being packed.'}{' '}
              A receipt goes to {order.buyer.email}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Placed {placedOn(order.createdAt)}. Demo order: no card was charged.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="shrink-0 print:hidden">
          <Printer aria-hidden />
          Print receipt
        </Button>
      </div>

      <div className="grid gap-8">
        <section aria-labelledby="order-lots" className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id="order-lots" className="text-2xl font-bold">
            What you bought
          </h2>
          <ul className="grid gap-3">
            {orderShares.map(({ share, animal }) => (
              <li key={share.claimId} className="grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{SHARE_LABELS[share.size]} beef share</p>
                  <Link to={`/beef/${animal.tagId}`} className="font-heading text-xl font-bold underline-offset-4 hover:underline">
                    {beefTitle(animal)}
                  </Link>
                  <div className="mt-2">
                    <EarTag tagId={animal.tagId} size="sm" />
                  </div>
                </div>
                <p className="sm:text-right">
                  <span className="block font-heading text-xl font-bold tabular-nums">{formatCurrency(share.estimatedTotal)}</span>
                  <span className="text-sm text-muted-foreground">estimated</span>
                </p>
              </li>
            ))}
            {items.map((item, i) => (
              <li key={i} className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="font-heading text-xl font-bold">
                    {item.qty > 1 && `${item.qty} × `}
                    {item.title}
                  </p>
                  {item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>}
                </div>
                <p className="font-heading text-xl font-bold tabular-nums sm:text-right">{formatCurrency(item.total, true)}</p>
              </li>
            ))}
            {orderLots.map((lot) => {
              const stats = getLotStats(lot, animals)
              return (
                <li key={lot.id} className="grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Lot {lot.number}</p>
                    <Link to={`/lots/${lot.id}`} className="font-heading text-xl font-bold underline-offset-4 hover:underline">
                      {lot.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {lot.tagIds.map((t) => (
                        <EarTag key={t} tagId={t} size="sm" />
                      ))}
                    </div>
                  </div>
                  <p className="font-heading text-xl font-bold tabular-nums sm:text-right">{formatCurrency(stats.lotTotal)}</p>
                </li>
              )
            })}
          </ul>
          <dl className="grid gap-2 border-t pt-4 tabular-nums">
            {[
              ...(orderShares.length ? [['Beef shares, estimated', formatCurrency(sharesTotal, true)]] : []),
              ...(items.length
                ? [[items.some((i) => i.kind === 'goods') ? 'Shop items' : 'Butcher Shop and gifts', formatCurrency(itemsTotal, true)]]
                : []),
              ...(beefDelivery
                ? [
                    [
                      beefDelivery.method === 'pickup' ? 'Ranch pickup' : beefDelivery.method === 'local' ? 'Local delivery' : 'Frozen shipping',
                      beefDelivery.cost ? formatCurrency(beefDelivery.cost, true) : 'Free',
                    ],
                  ]
                : []),
              ...(order.discount
                ? [
                    [
                      `${order.discount.kind === 'gift-card' ? 'Gift card' : 'Promo'} ${order.discount.code}`,
                      discount ? `−${formatCurrency(discount, true)}` : 'Free shipping',
                    ],
                  ]
                : []),
              ...(hasLots
                ? [
                    ['Cattle', formatCurrency(order.subtotal)],
                    [delivery ? 'Estimated freight' : 'Freight (you haul)', formatCurrency(order.freight)],
                  ]
                : []),
              ['Order total', formatCurrency(order.subtotal + order.freight + sharesTotal + itemsTotal + (beefDelivery?.cost ?? 0) - discount, true)],
              [paysToday ? 'Paid today' : `Deposit paid (${depositPercent})`, formatCurrency(order.deposit, true)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between gap-4 rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">
              <dt className="font-semibold">
                {paysToday
                  ? order.balance > 0
                    ? 'Due later, estimated'
                    : 'Nothing more to pay'
                  : `Balance due ${delivery ? 'on delivery' : 'at pickup'}`}
              </dt>
              <dd className="font-heading text-2xl font-bold">{formatCurrency(order.balance, paysToday)}</dd>
            </div>
          </dl>
        </section>

        {shopSteps.length > 0 && (
          <section aria-labelledby="order-shop-next" className="grid gap-5">
            <h2 id="order-shop-next" className="text-3xl font-bold">
              {orderShares.length || hasLots ? 'Your shop order' : 'What happens next'}
            </h2>
            {order.gift && (
              <p className="rounded-xl border bg-card p-4">
                <strong className="font-semibold">Packed as a gift for {order.gift.to}.</strong>{' '}
                {order.gift.message ? `Card reads: “${order.gift.message}”` : 'No message on the card.'} No prices in the box.
              </p>
            )}
            <ol className="grid gap-0 rounded-2xl border bg-card p-5 sm:p-6">
              {shopSteps.map((st, i) => (
                <li key={st.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={
                        i === 0
                          ? 'grid size-10 place-items-center rounded-full bg-success font-heading text-lg font-bold text-success-foreground'
                          : 'grid size-10 place-items-center rounded-full border-2 bg-background font-heading text-lg font-bold text-muted-foreground'
                      }
                    >
                      {i + 1}
                    </span>
                    {i < shopSteps.length - 1 && <span aria-hidden className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className={i < shopSteps.length - 1 ? 'pb-5' : undefined}>
                    <p className="flex flex-wrap items-baseline gap-x-3 pt-1.5">
                      <span className="text-lg font-bold">{st.title}</span>
                      <span className="text-sm font-medium text-primary">{st.when}</span>
                    </p>
                    <p className="mt-1 text-muted-foreground">{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {orderShares.length > 0 && (
          <section aria-labelledby="order-beef-next" className="grid gap-5">
            <h2 id="order-beef-next" className="text-3xl font-bold">
              What happens next with your beef
            </h2>
            <ol className="grid gap-5">
              {beefSteps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
                  <EarTag tagId={String(i + 1)} srLabel="Step" className="w-10" />
                  <div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-1 text-lg">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {orderShares.map(({ share, pool, animal }) => (
              <div key={share.claimId} className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">Where {animal.tagId} is now</h3>
                  <Button asChild>
                    <Link to={`/beef/cut-sheet?claim=${share.claimId}`}>
                      <ClipboardList aria-hidden />
                      {cutSheets.some((c) => c.claimId === share.claimId) ? 'Edit your cut sheet' : 'Fill out your cut sheet'}
                    </Link>
                  </Button>
                </div>
                <PoolTimeline pool={pool} now={now} />
              </div>
            ))}
          </section>
        )}

        {hasLots && (
          <section aria-labelledby="order-next" className="grid gap-5">
            <h2 id="order-next" className="text-3xl font-bold">
              {orderShares.length ? 'What happens next with your cattle' : 'What happens next'}
            </h2>
            <ol className="grid gap-5">
              {steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
                  <EarTag tagId={String(i + 1)} srLabel="Step" className="w-10" />
                  <div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-1 text-lg">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="order-buyer" className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
          <h2 id="order-buyer" className="text-2xl font-bold sm:col-span-2">
            Your details
          </h2>
          <p>
            {order.buyer.name}
            {order.buyer.operation && (
              <>
                <br />
                {order.buyer.operation}
              </>
            )}
            <br />
            {order.buyer.phone}
            <br />
            {order.buyer.email}
          </p>
          <p>
            <span className="font-semibold">
              {order.buyer.address ? 'Delivery to' : hasLots ? 'Pickup at the ranch' : 'Pickup at the ranch store'}
            </span>
            <br />
            {order.buyer.address || `${ranch.location.address}, ${ranch.location.city}, ${ranch.location.state} ${ranch.location.zip}`}
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row print:hidden">
          <Button asChild size="lg">
            <a href={ranchPhoneHref}>Questions? Call {ranch.phone}</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            {hasLots ? (
              <Link to="/cattle">Browse more cattle</Link>
            ) : orderShares.length ? (
              <Link to="/beef">See more animals</Link>
            ) : (
              <Link to="/shop">Back to the Butcher Shop</Link>
            )}
          </Button>
        </div>

        {(orderShares.length > 0 || items.some((i) => i.packs?.length)) && <TreatThePup className="print:hidden" />}
      </div>
    </div>
  )
}
