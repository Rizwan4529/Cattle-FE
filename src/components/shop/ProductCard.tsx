import { ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CutImage } from '@/components/beef/CutImage'
import { Button } from '@/components/ui/button'
import type { BeefProduct, ProductReview } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { LOW_STOCK, packPrice, ratingSummary, stockLabel } from '@/lib/shop'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'
import { FavoriteButton, Stars, TraceLine } from './ShopBits'

/** A Butcher Shop product. The card opens the product page; the button adds one pack. */
export function ProductCard({
  product,
  animal,
  reviews,
  className,
}: {
  product: BeefProduct
  animal?: Animal
  reviews: ProductReview[]
  className?: string
}) {
  const navigate = useNavigate()
  const addProductToCart = useRanchStore((s) => s.addProductToCart)
  const url = `/shop/${product.id}`
  const price = packPrice(product)
  const rating = ratingSummary(reviews)
  const soldOut = product.stock <= 0

  const add = () => {
    addProductToCart(product.id, 1)
    toast.success(`${product.name} added to your cart`, {
      description: `1 pack, ${formatCurrency(price, true)}`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <article
      className={cn(
        'group/card relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/40',
        className,
      )}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <CutImage
          cut={product.cut}
          seed={product.id}
          photos={product.photos}
          alt={product.name}
          className="transition-transform duration-500 group-hover/card:scale-[1.03]"
        />
        {product.stock <= LOW_STOCK && (
          <span
            className={cn(
              'absolute top-3 left-3 rounded-full px-2.5 py-1 text-sm font-semibold',
              soldOut ? 'bg-card text-foreground' : 'bg-tag text-tag-foreground',
            )}
          >
            {stockLabel(product.stock)}
          </span>
        )}
        <FavoriteButton productId={product.id} name={product.name} className="absolute top-3 right-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-xl font-bold">
            <Link
              to={url}
              className="underline-offset-4 group-hover/card:underline after:absolute after:inset-0 after:rounded-xl focus-visible:underline focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {product.name}
            </Link>
          </h3>
          {/* Above the card link so the passport link stays clickable */}
          <TraceLine product={product} animal={animal} className="relative z-10 mt-1 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {product.piecesPerPack > 1 ? `${product.piecesPerPack} per pack, ` : ''}
          {product.packNote}. About {product.packWeightLb} lb. Packed {formatShortDate(product.packDate)}.
        </p>
        {rating.count > 0 && (
          <p className="flex items-center gap-2 text-sm">
            <Stars rating={rating.avg} />
            <span className="text-muted-foreground">
              {rating.avg} ({rating.count})
            </span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t pt-3">
          <p>
            <span className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(price, true)}</span>
            <span className="block text-sm text-muted-foreground tabular-nums">{formatCurrency(product.pricePerLb, true)}/lb</span>
          </p>
          <Button
            onClick={add}
            disabled={soldOut}
            className="relative z-10"
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
          >
            <ShoppingCart aria-hidden />
            {soldOut ? 'Sold out' : 'Add'}
          </Button>
        </div>
      </div>
    </article>
  )
}
