import { useState } from 'react'
import { Check, PackagePlus, ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CutImage } from '@/components/beef/CutImage'
import { PageHeader } from '@/components/PageHeader'
import { QtyStepper } from '@/components/shop/ShopBits'
import { Button } from '@/components/ui/button'
import { beefConfig } from '@/config/beef'
import type { BoxItem } from '@/data/beefTypes'
import { CUTS } from '@/data/shop'
import { formatCurrency } from '@/lib/format'
import { boxPricing, packPrice } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const pct = `${Math.round(beefConfig.box.discount * 100)}%`

/**
 * Build-Your-Own Box: pick packs until the box reaches its target weight,
 * watching a progress bar; once it's full, the box discount applies.
 */
export default function BuildBoxPage() {
  usePageTitle('Build your own box')
  const navigate = useNavigate()
  const products = useRanchStore((s) => s.products)
  const addBoxToCart = useRanchStore((s) => s.addBoxToCart)
  const [packs, setPacks] = useState<Record<string, number>>({})

  const items: BoxItem[] = Object.entries(packs)
    .filter(([, n]) => n > 0)
    .map(([productId, n]) => ({ productId, packs: n }))
  const box = boxPricing(items, products)
  const target = beefConfig.box.targetLb
  const left = Math.max(0, Math.round((target - box.lb) * 10) / 10)
  const set = (id: string, n: number) => setPacks((p) => ({ ...p, [id]: Math.max(0, n) }))

  const add = () => {
    addBoxToCart(items)
    setPacks({})
    toast.success('Your box is in the cart', {
      description: `${box.lb} lb, ${formatCurrency(box.price, true)} with ${pct} off.`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  const inStock = products.filter((p) => p.stock > 0)

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Build your own box"
        description={`Pick any cuts you like. Once your box reaches ${target} lb, the whole thing is ${pct} off.`}
        actions={
          <Button asChild variant="outline" size="lg">
            <Link to="/shop/boxes">See curated boxes</Link>
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 content-start gap-8">
          {CUTS.map((cut) => {
            const list = inStock.filter((p) => p.cut === cut.id)
            if (!list.length) return null
            return (
              <section key={cut.id} aria-labelledby={`box-${cut.id}`} className="grid gap-3">
                <h2 id={`box-${cut.id}`} className="text-2xl font-bold">
                  {cut.label}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {list.map((p) => {
                    const n = packs[p.id] ?? 0
                    return (
                      <li
                        key={p.id}
                        className={cn(
                          'grid grid-cols-[6rem_minmax(0,1fr)] gap-3 rounded-xl border bg-card p-3',
                          n > 0 && 'border-primary bg-primary/5',
                        )}
                      >
                        <div className="aspect-square overflow-hidden rounded-lg">
                          <CutImage cut={p.cut} seed={p.id} photos={p.photos} alt="" />
                        </div>
                        <div className="grid min-w-0 content-between gap-2">
                          <div>
                            <Link to={`/shop/${p.id}`} className="font-semibold underline-offset-4 hover:underline">
                              {p.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {p.packWeightLb} lb, {formatCurrency(packPrice(p), true)}. From {p.sourceTagId}.
                            </p>
                          </div>
                          {n > 0 ? (
                            <QtyStepper
                              value={n}
                              onChange={(v) => set(p.id, v)}
                              min={0}
                              max={p.stock}
                              label={`${p.name} packs in your box`}
                              className="justify-self-start"
                            />
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="justify-self-start"
                              onClick={() => set(p.id, 1)}
                              aria-label={`Add ${p.name} to your box`}
                            >
                              <PackagePlus aria-hidden />
                              Add
                            </Button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>

        <aside aria-labelledby="box-summary" className="grid content-start gap-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-28 lg:self-start">
          <h2 id="box-summary" className="text-2xl font-bold">
            Your box
          </h2>
          <div className="grid gap-2">
            <div
              role="progressbar"
              aria-label="Box weight"
              aria-valuemin={0}
              aria-valuemax={target}
              aria-valuenow={Math.min(target, box.lb)}
              aria-valuetext={`${box.lb} of ${target} lb`}
              className="h-4 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn('h-full rounded-full transition-[width] duration-300', box.reached ? 'bg-success' : 'bg-primary')}
                style={{ width: `${box.progress * 100}%` }}
              />
            </div>
            <p className="font-semibold" aria-live="polite">
              {box.reached ? (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <Check className="size-5" aria-hidden />
                  {pct} off unlocked
                </span>
              ) : items.length ? (
                `${box.lb} of ${target} lb. Add ${left} lb more to save ${pct}.`
              ) : (
                `Start adding cuts. ${target} lb unlocks ${pct} off.`
              )}
            </p>
          </div>

          {items.length > 0 && (
            <ul className="grid gap-1 text-sm">
              {items.map((i) => {
                const p = products.find((x) => x.id === i.productId)!
                return (
                  <li key={i.productId} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {i.packs}× {p.name}
                    </span>
                    <span className="tabular-nums">{formatCurrency(packPrice(p) * i.packs, true)}</span>
                  </li>
                )
              })}
            </ul>
          )}

          <dl className="grid gap-1 border-t pt-3 tabular-nums">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Packs one by one</dt>
              <dd>{formatCurrency(box.list, true)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Box discount ({pct})</dt>
              <dd className={box.reached ? 'text-success' : 'text-muted-foreground'}>
                {box.reached ? `−${formatCurrency(box.discount, true)}` : `At ${target} lb`}
              </dd>
            </div>
            <div className="flex justify-between gap-3 text-lg font-semibold">
              <dt>Box total</dt>
              <dd className="font-heading text-2xl font-bold">{formatCurrency(box.price, true)}</dd>
            </div>
          </dl>

          <Button size="lg" onClick={add} disabled={!items.length}>
            <ShoppingCart aria-hidden />
            Add box to cart
          </Button>
          {items.length > 0 && !box.reached && (
            <p className="text-sm text-muted-foreground">
              You can add it now; the {pct} off applies once it reaches {target} lb.
            </p>
          )}
          {items.length > 0 && (
            <Button variant="ghost" onClick={() => setPacks({})}>
              Start over
            </Button>
          )}
        </aside>
      </div>
    </div>
  )
}
