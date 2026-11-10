import { RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Order } from '@/data/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { SHARE_LABELS } from '@/lib/yield'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

function summaryOf(o: Order) {
  return [
    ...(o.shares ?? []).map((s) => `${SHARE_LABELS[s.size]} of ${s.tagId}`),
    ...(o.items ?? []).map((i) => `${i.qty > 1 ? `${i.qty} × ` : ''}${i.title}`),
    ...(o.lotIds.length ? [`${o.lotIds.length} cattle ${o.lotIds.length === 1 ? 'lot' : 'lots'}`] : []),
  ].join(', ')
}

export default function OrdersPage() {
  usePageTitle('Orders')
  const navigate = useNavigate()
  const orders = useRanchStore((s) => s.orders)
  const reorder = useRanchStore((s) => s.reorder)

  const again = (o: Order) => {
    const n = reorder(o.id)
    if (n)
      toast.success(`Added ${n} ${n === 1 ? 'item' : 'items'} from order ${o.number}`, {
        action: { label: 'View cart', onClick: () => navigate('/cart') },
      })
    else toast.error('Those items are sold out right now')
  }

  return (
    <>
      <AccountHeader title="Orders" description="Every order placed in this browser. Open one for its receipt and timeline." />
      {orders.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <p className="text-lg">You haven’t ordered anything yet.</p>
          <Button asChild>
            <Link to="/shop">Visit the Butcher Shop</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {orders.map((o) => {
            const canReorder = (o.items ?? []).some((i) => i.kind === 'product' || i.kind === 'bundle' || i.kind === 'box')
            return (
              <li key={o.id} className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <Link to={`/order/${o.id}`} className="font-heading text-xl font-bold underline-offset-4 hover:underline">
                      Order {o.number}
                    </Link>
                    <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>
                  </p>
                  <p className="mt-1 text-muted-foreground">{summaryOf(o)}</p>
                  <p className="mt-1 text-sm tabular-nums">
                    {formatCurrency(o.deposit, true)} paid{o.balance > 0 ? `, about ${formatCurrency(o.balance, true)} due later` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/order/${o.id}`}>View</Link>
                  </Button>
                  {canReorder && (
                    <Button onClick={() => again(o)}>
                      <RotateCcw aria-hidden />
                      Order again
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
