import { CircleCheck, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { EarTag } from '@/components/cattle/EarTag'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { depositPercent } from '@/lib/checkout'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { getLotStats } from '@/lib/lots'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const placedOn = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function OrderConfirmationPage() {
  const { orderId } = useParams()
  const order = useRanchStore((s) => s.orders.find((o) => o.id === orderId))
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
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
  const firstName = order.buyer.name.split(' ')[0]
  const earliest = orderLots.map((l) => l.pickupWindow.start).sort()[0]
  const latest = orderLots
    .map((l) => l.pickupWindow.end)
    .sort()
    .at(-1)
  const delivery = order.fulfillment === 'delivery'

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
              Order <strong className="font-semibold text-foreground">{order.number}</strong> is placed. Your deposit holds the cattle. A receipt goes
              to {order.buyer.email}.
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
              ['Cattle', formatCurrency(order.subtotal)],
              [delivery ? 'Estimated freight' : 'Freight (you haul)', formatCurrency(order.freight)],
              ['Order total', formatCurrency(order.subtotal + order.freight)],
              [`Deposit paid (${depositPercent})`, formatCurrency(order.deposit)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between gap-4 rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">
              <dt className="font-semibold">Balance due {delivery ? 'on delivery' : 'at pickup'}</dt>
              <dd className="font-heading text-2xl font-bold">{formatCurrency(order.balance)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="order-next" className="grid gap-5">
          <h2 id="order-next" className="text-3xl font-bold">
            What happens next
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
            <span className="font-semibold">{delivery ? 'Delivery to' : 'Pickup at the ranch'}</span>
            <br />
            {delivery ? order.buyer.address : `${ranch.location.address}, ${ranch.location.city}, ${ranch.location.state} ${ranch.location.zip}`}
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row print:hidden">
          <Button asChild size="lg">
            <a href={ranchPhoneHref}>Questions? Call {ranch.phone}</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/cattle">Browse more cattle</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
