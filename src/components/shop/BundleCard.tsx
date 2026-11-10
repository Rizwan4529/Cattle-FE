import { Gift, Package, ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CutImage } from '@/components/beef/CutImage'
import { Button } from '@/components/ui/button'
import type { BeefProduct, Bundle } from '@/data/beefTypes'
import { formatCurrency } from '@/lib/format'
import { bundlePricing, packsNeeded, shortOf } from '@/lib/shop'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

/** A curated box or gift box: what's inside, its price, and what it saves. */
export function BundleCard({ bundle, products, className }: { bundle: Bundle; products: BeefProduct[]; className?: string }) {
  const navigate = useNavigate()
  const addBundleToCart = useRanchStore((s) => s.addBundleToCart)
  const { list, price, savings, lb } = bundlePricing(bundle, products)
  const short = shortOf(packsNeeded(bundle.items), products)
  const byId = new Map(products.map((p) => [p.id, p]))
  const hero = byId.get(bundle.items[0].productId)
  const Icon = bundle.gift ? Gift : Package

  const add = () => {
    addBundleToCart(bundle.id)
    toast.success(`${bundle.name} added to your cart`, {
      description: formatCurrency(price),
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <article className={cn('flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs', className)}>
      <div className="relative aspect-video overflow-hidden bg-muted">
        {hero && <CutImage cut={hero.cut} seed={bundle.id} photos={hero.photos} alt="" />}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-semibold">
          <Icon className="size-4 text-primary" aria-hidden />
          {bundle.gift ? 'Gift box' : 'Curated box'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-2xl font-bold">{bundle.name}</h3>
        <p className="text-muted-foreground">{bundle.description}</p>
        <ul className="grid gap-1 text-sm">
          {bundle.items.map((i) => {
            const p = byId.get(i.productId)
            return (
              <li key={i.productId} className="flex justify-between gap-3">
                <Link to={`/shop/${i.productId}`} className="underline-offset-4 hover:underline">
                  {p?.name ?? i.productId}
                </Link>
                <span className="text-muted-foreground tabular-nums">× {i.packs}</span>
              </li>
            )
          })}
        </ul>
        <p className="text-sm text-muted-foreground">About {lb} lb, all traceable to the animal it came from.</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t pt-3">
          <p>
            <span className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(price)}</span>{' '}
            <span className="text-sm text-muted-foreground line-through tabular-nums">{formatCurrency(list)}</span>
            <span className="block text-sm font-medium text-success">Save {formatCurrency(savings)}</span>
          </p>
          <Button onClick={add} disabled={short !== undefined}>
            <ShoppingCart aria-hidden />
            {short !== undefined ? 'Sold out' : 'Add box'}
          </Button>
        </div>
      </div>
    </article>
  )
}
