import type { ReactNode } from 'react'
import { Dog } from 'lucide-react'
import { Link } from 'react-router'
import { byproductsConfig } from '@/config/byproducts'
import type { CutId } from '@/data/beefTypes'
import { CART_EXTRAS, GOODS_FOR_CUT, PUP_TREATS } from '@/data/goods'
import { cutLabel } from '@/data/shop'
import { goodsUrl, isListed } from '@/lib/byproducts'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'
import { GoodsBuyControl } from './GoodsBits'
import { GoodsImage } from './GoodsImage'

/**
 * A short row of Ranch Goods with add-to-cart steppers, for cross-sells on
 * beef pages and in the cart. Shows nothing when Ranch Goods is off or
 * nothing in the list is in stock.
 */
function GoodsRow({
  id,
  title,
  description,
  ids,
  icon,
  wide = false,
  className,
}: {
  wide?: boolean
  id: string
  title: string
  description: string
  ids: string[]
  icon?: ReactNode
  className?: string
}) {
  const goods = useRanchStore((s) => s.goods)
  const items = ids.flatMap((gid) => goods.find((g) => g.id === gid && g.stock > 0 && isListed(g, byproductsConfig)) ?? [])
  if (!items.length) return null

  return (
    <section aria-labelledby={id} className={cn('grid content-start gap-4', className)}>
      <div>
        <h2 id={id} className="flex items-center gap-2 text-2xl font-bold">
          {icon}
          {title}
        </h2>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      <ul className={cn('grid gap-3', wide && 'sm:grid-cols-2')}>
        {items.map((g) => (
          <li key={g.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <Link to={goodsUrl(g)} tabIndex={-1} aria-hidden className="block aspect-4/3 w-20 shrink-0 overflow-hidden rounded-lg border">
              <GoodsImage art={g.art} coat={g.coat} seed={g.id} alt="" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={goodsUrl(g)} className="font-semibold underline-offset-4 hover:underline">
                {g.name}
              </Link>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatCurrency(g.price, true)} / {g.unit}
              </p>
            </div>
            <GoodsBuyControl product={g} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Cart upsell when there's beef in the cart. */
export function WholeAnimalExtras({ className }: { className?: string }) {
  return (
    <GoodsRow
      id="cart-extras"
      title="Add the whole-animal extras"
      description="Marrow bones, tallow, and chews from the same cattle as your beef. They ride along with your order."
      ids={CART_EXTRAS}
      wide
      className={className}
    />
  )
}

/** "Goes with your ribeye" on a Butcher Shop product page. */
export function GoodsForCut({ cut, className }: { cut: CutId; className?: string }) {
  return (
    <GoodsRow
      id="goes-with"
      title={`Goes with your ${cutLabel(cut).toLowerCase()}`}
      description="From the rest of the animal, in Ranch Goods."
      ids={GOODS_FOR_CUT[cut] ?? []}
      className={className}
    />
  )
}

/** "Treat the pup": chews on every beef page. */
export function TreatThePup({ className }: { className?: string }) {
  return (
    <GoodsRow
      id="treat-the-pup"
      title="Treat the pup"
      description="Single-ingredient chews from our own cattle. Nothing added, nothing from overseas."
      ids={PUP_TREATS}
      icon={<Dog className="size-6 text-primary" aria-hidden />}
      className={className}
    />
  )
}
