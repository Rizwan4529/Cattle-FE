import { Heart, ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ProductCard } from '@/components/shop/ProductCard'
import { Button } from '@/components/ui/button'
import { REVIEWS } from '@/data/shop'
import { formatCurrency } from '@/lib/format'
import { packPrice } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

export default function FavoritesPage() {
  usePageTitle('Favorites')
  const navigate = useNavigate()
  const favorites = useRanchStore((s) => s.favorites)
  const products = useRanchStore((s) => s.products)
  const animals = useRanchStore((s) => s.animals)
  const addProductToCart = useRanchStore((s) => s.addProductToCart)
  const list = favorites.flatMap((id) => products.find((p) => p.id === id) ?? [])
  const inStock = list.filter((p) => p.stock > 0)

  const addAll = () => {
    for (const p of inStock) addProductToCart(p.id, 1)
    toast.success(`Added ${inStock.length} favorites to your cart`, {
      description: `One pack each, ${formatCurrency(
        inStock.reduce((n, p) => n + packPrice(p), 0),
        true,
      )}.`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <>
      <AccountHeader
        title="Favorites"
        description="Cuts you’ve saved. Add one, or all of them, in a click."
        actions={
          inStock.length > 1 && (
            <Button onClick={addAll}>
              <ShoppingCart aria-hidden />
              Add all to cart
            </Button>
          )
        }
      />
      {list.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <Heart className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-lg">Tap the heart on any cut in the Butcher Shop to save it here.</p>
          <Button asChild>
            <Link to="/shop">Browse the Butcher Shop</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <li key={p.id} className="grid">
              <ProductCard
                product={p}
                animal={animals.find((a) => a.tagId === p.sourceTagId)}
                reviews={REVIEWS.filter((r) => r.productId === p.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
