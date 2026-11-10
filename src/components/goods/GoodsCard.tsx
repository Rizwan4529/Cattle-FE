import { Link } from 'react-router'
import type { GoodsProduct } from '@/data/goodsTypes'
import type { Animal } from '@/data/types'
import { cn } from '@/lib/utils'
import { GoodsBuyControl, GoodsPrice, GoodsTrace } from './GoodsBits'
import { goodsStockLabel, goodsUrl } from '@/lib/byproducts'
import { GoodsImage } from './GoodsImage'

/** A Ranch Goods item. The card opens the product page; the control adds it to the cart. */
export function GoodsCard({
  product,
  animals,
  compact = false,
  className,
}: {
  product: GoodsProduct
  animals: Animal[]
  /** Smaller card for cross-sell rows */
  compact?: boolean
  className?: string
}) {
  const badge = goodsStockLabel(product)
  const sold = product.stock <= 0

  return (
    <article
      className={cn(
        'group/card relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/40',
        sold && 'opacity-80',
        className,
      )}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <GoodsImage
          art={product.art}
          coat={product.coat}
          seed={product.id}
          alt={product.name}
          className={cn('transition-transform duration-500 group-hover/card:scale-[1.03]', sold && 'grayscale-[60%]')}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.unique && !sold && (
            <span className="rounded-full bg-tag px-2.5 py-1 text-sm font-semibold text-tag-foreground">One of a kind</span>
          )}
          {badge && (
            <span className={cn('rounded-full px-2.5 py-1 text-sm font-semibold', sold ? 'bg-card text-foreground' : 'bg-tag text-tag-foreground')}>
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className={cn('flex flex-1 flex-col gap-2', compact ? 'p-3' : 'p-4')}>
        <h3 className={cn('font-bold', compact ? 'text-lg' : 'text-xl')}>
          <Link
            to={goodsUrl(product)}
            className="underline-offset-4 group-hover/card:underline after:absolute after:inset-0 after:rounded-xl focus-visible:underline focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>
        {!compact && <p className="text-sm text-muted-foreground">{product.description}</p>}
        {/* Above the card link so the passport links stay clickable */}
        {(product.unique || !compact) && <GoodsTrace product={product} animals={animals} className="relative z-10 text-muted-foreground" />}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t pt-3">
          <GoodsPrice product={product} />
          <div className="relative z-10">
            <GoodsBuyControl product={product} />
          </div>
        </div>
      </div>
    </article>
  )
}
