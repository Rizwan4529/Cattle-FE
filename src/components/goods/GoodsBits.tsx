import { Check, ShoppingCart } from 'lucide-react'
import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { QtyStepper } from '@/components/shop/ShopBits'
import { Button } from '@/components/ui/button'
import { byproductsConfig } from '@/config/byproducts'
import type { GoodsProduct } from '@/data/goodsTypes'
import type { Animal } from '@/data/types'
import { maxQty, unitPrice } from '@/lib/byproducts'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

/**
 * "From animal HCR-2672 · Hereford": ties an item to the animal(s) it came
 * from, each linking to its passport. Says where it came from otherwise.
 */
export function GoodsTrace({ product, animals, className }: { product: GoodsProduct; animals: Animal[]; className?: string }) {
  const tags = product.sourceTagIds
  if (!tags.length) {
    return <p className={cn('text-sm', className)}>{product.part ? 'From hides and bones of earlier harvests' : 'From our processor'}</p>
  }
  const one = tags.length === 1 ? animals.find((a) => a.tagId === tags[0]) : undefined
  return (
    <p className={cn('text-sm', className)}>
      From {tags.length === 1 ? 'animal' : 'animals'}{' '}
      {tags.map((t, i) => (
        <Fragment key={t}>
          {i > 0 && (i === tags.length - 1 ? ' and ' : ', ')}
          <Link to={`/animal/${t}`} className="font-semibold whitespace-nowrap text-primary underline underline-offset-4">
            {t}
          </Link>
        </Fragment>
      ))}
      {one && <> · {one.breed}</>}
    </p>
  )
}

/**
 * Add button that turns into a − qty + stepper once the item is in the cart
 * (like the rancher's mockup). One-of-a-kind items stop at 1.
 */
export function GoodsBuyControl({ product, className, size = 'default' }: { product: GoodsProduct; className?: string; size?: 'default' | 'lg' }) {
  const navigate = useNavigate()
  const line = useRanchStore((s) => s.cart.find((i) => i.kind === 'goods' && i.goodsId === product.id))
  const add = useRanchStore((s) => s.addGoodsToCart)
  const setQty = useRanchStore((s) => s.setCartQty)
  const max = maxQty(product)
  // One-of-a-kind items can share a name ("Polished drinking horn"), so their buttons name the animal too.
  const name = product.unique && product.sourceTagIds[0] ? `${product.name} from ${product.sourceTagIds[0]}` : product.name

  if (max <= 0) {
    return (
      <Button disabled variant="secondary" size={size} className={className} aria-label={`${name} is ${product.unique ? 'sold' : 'sold out'}`}>
        {product.unique ? 'Sold' : 'Sold out'}
      </Button>
    )
  }

  if (line?.kind === 'goods') {
    if (product.unique) {
      return (
        <Button
          variant="outline"
          size={size}
          className={className}
          onClick={() => {
            setQty(line.id, 0)
            toast(`${name} removed from your cart`)
          }}
          aria-label={`${name} is in your cart. Remove it`}
        >
          <Check aria-hidden />
          In cart
        </Button>
      )
    }
    return (
      <QtyStepper
        value={line.qty}
        min={0}
        max={max}
        onChange={(n) => setQty(line.id, n)}
        label={`Quantity of ${product.name} in your cart`}
        className={cn(size === 'lg' && '[&_button]:size-11', className)}
      />
    )
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={() => {
        add(product.id, 1)
        toast.success(`${name} added to your cart`, {
          description: product.unique
            ? 'One of a kind. It’s held in your cart until you check out.'
            : `${formatCurrency(product.price, true)} / ${product.unit}`,
          action: { label: 'View cart', onClick: () => navigate('/cart') },
        })
      }}
      aria-label={`Add ${name} to cart`}
    >
      <ShoppingCart aria-hidden />
      Add
    </Button>
  )
}

/** Price line: "$10.00 / lb", with the bulk hint when it applies. */
export function GoodsPrice({ product, className }: { product: GoodsProduct; className?: string }) {
  const best = product.bulk ? unitPrice(product, 1000, byproductsConfig) : product.price
  return (
    <p className={className}>
      <span className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(product.price, true)}</span>
      <span className="text-muted-foreground"> / {product.unit}</span>
      {product.bulk && !product.unique && (
        <span className="block text-sm text-muted-foreground tabular-nums">As low as {formatCurrency(best, true)} in bulk</span>
      )}
    </p>
  )
}
