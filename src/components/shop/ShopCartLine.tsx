import { CreditCard, Repeat, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { CutImage } from '@/components/beef/CutImage'
import { Button } from '@/components/ui/button'
import type { BeefProduct } from '@/data/beefTypes'
import { formatCurrency } from '@/lib/format'
import type { ShopLine } from '@/lib/shop'
import { QtyStepper } from './ShopBits'

/** A Butcher Shop product, box, subscription, or gift card in the cart. */
export function ShopCartLine({
  line,
  products,
  onQty,
  onRemove,
}: {
  line: ShopLine
  products: BeefProduct[]
  onQty: (qty: number) => void
  onRemove: () => void
}) {
  const { item } = line
  const first = line.packs[0] && products.find((p) => p.id === line.packs[0].productId)
  const stockMax = item.kind === 'product' ? (products.find((p) => p.id === item.productId)?.stock ?? 99) : 20

  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
      <Link to={line.href} tabIndex={-1} aria-hidden className="grid aspect-4/3 place-items-center overflow-hidden rounded-lg border bg-muted">
        {first ? (
          <CutImage cut={first.cut} seed={item.id} photos={first.photos} alt="" />
        ) : item.kind === 'gift-card' ? (
          <CreditCard className="size-10 text-primary" />
        ) : (
          <Repeat className="size-10 text-primary" />
        )}
      </Link>
      <div className="grid min-w-0 gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="min-w-0 text-xl font-bold">
            <Link to={line.href} className="underline-offset-4 hover:underline">
              {line.title}
            </Link>
          </h3>
          <p className="text-right">
            <span className="block font-heading text-2xl font-bold tabular-nums">{formatCurrency(line.total, true)}</span>
            {line.qty > 1 && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {line.qty} × {formatCurrency(line.unitPrice, true)}
              </span>
            )}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{line.detail}</p>
        {line.problem && (
          <p className="flex items-center gap-2 rounded-lg bg-warning/15 px-3 py-2 text-sm font-medium">
            <TriangleAlert className="size-4 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
            {line.problem}. Lower the quantity or remove it to check out.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {(item.kind === 'product' || item.kind === 'bundle') && (
            <QtyStepper value={line.qty} onChange={onQty} min={1} max={Math.max(1, stockMax)} label={`Quantity of ${line.title}`} />
          )}
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
            <Trash2 aria-hidden />
            Remove
          </Button>
        </div>
      </div>
    </li>
  )
}
