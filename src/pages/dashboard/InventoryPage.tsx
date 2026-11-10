import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { QtyStepper } from '@/components/shop/ShopBits'
import { Button } from '@/components/ui/button'
import { beefConfig } from '@/config/beef'
import { CUTS, cutLabel } from '@/data/shop'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { LOW_STOCK, packPrice } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

/** Packaged beef in the freezer for the Butcher Shop, by cut, with low-stock warnings. */
export default function InventoryPage() {
  usePageTitle('Packaged inventory')
  const products = useRanchStore((s) => s.products)
  const setStock = useRanchStore((s) => s.setProductStock)
  const [filter, setFilter] = useState<'all' | 'low'>('all')
  const low = products.filter((p) => p.stock <= LOW_STOCK)
  const packs = products.reduce((n, p) => n + p.stock, 0)
  const lb = Math.round(products.reduce((n, p) => n + p.stock * p.packWeightLb, 0))
  const value = products.reduce((n, p) => n + p.stock * packPrice(p), 0)
  const shown = filter === 'low' ? low : products

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl font-bold">Packaged inventory</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          What’s in the freezer for the Butcher Shop. Packs come off automatically when someone buys them; adjust counts here after a freezer check.
        </p>
      </div>

      {!beefConfig.sellByTheCut && (
        <p className="rounded-xl bg-warning/15 px-4 py-3">The Butcher Shop is switched off, so none of this is for sale right now.</p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Packs in the freezer', packs.toLocaleString()],
          ['Pounds', `${lb.toLocaleString()} lb`],
          ['Value at shop prices', formatCurrency(value)],
          ['Low or sold out', String(low.length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="font-heading text-3xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {low.length > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-warning/60 bg-warning/10 p-4">
          <TriangleAlert className="size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
          <p className="min-w-0 flex-1">
            <strong className="font-semibold">Running low:</strong> {low.map((p) => `${p.name} (${p.stock})`).join(', ')}.
          </p>
          <Button variant="outline" onClick={() => setFilter(filter === 'low' ? 'all' : 'low')} aria-pressed={filter === 'low'}>
            {filter === 'low' ? 'Show everything' : 'Show only these'}
          </Button>
        </div>
      )}

      {CUTS.map((cut) => {
        const list = shown.filter((p) => p.cut === cut.id)
        if (!list.length) return null
        return (
          <section key={cut.id} aria-labelledby={`inv-${cut.id}`} className="grid gap-3">
            <h2 id={`inv-${cut.id}`} className="text-2xl font-bold">
              {cutLabel(cut.id)}
            </h2>
            <ul className="grid gap-2">
              {list.map((p) => (
                <li
                  key={p.id}
                  className={cn(
                    'grid items-center gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(0,1fr)_10rem_auto]',
                    p.stock <= LOW_STOCK && 'border-warning/60',
                  )}
                >
                  <div className="min-w-0">
                    <Link to={`/shop/${p.id}`} className="font-semibold underline-offset-4 hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      From {p.sourceTagId}, packed {formatShortDate(p.packDate)}. {p.packWeightLb} lb packs at {formatCurrency(packPrice(p), true)}.
                    </p>
                  </div>
                  <p
                    className={cn(
                      'font-semibold',
                      p.stock === 0
                        ? 'text-destructive'
                        : p.stock <= LOW_STOCK
                          ? 'text-warning-foreground dark:text-warning'
                          : 'text-muted-foreground',
                    )}
                  >
                    {p.stock === 0 ? 'Sold out' : p.stock <= LOW_STOCK ? 'Low stock' : 'In stock'}
                  </p>
                  <QtyStepper
                    value={p.stock}
                    min={0}
                    max={999}
                    label={`${p.name} packs in stock`}
                    onChange={(n) => {
                      setStock(p.id, n)
                      if (n === 0) toast(`${p.name} marked sold out`)
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
