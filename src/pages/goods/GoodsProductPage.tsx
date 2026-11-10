import { useState } from 'react'
import { ChevronLeft, Factory, Fingerprint, ShoppingCart } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { EarTag } from '@/components/cattle/EarTag'
import { GoodsBuyControl, GoodsTrace } from '@/components/goods/GoodsBits'
import { GoodsCard } from '@/components/goods/GoodsCard'
import { GoodsImage } from '@/components/goods/GoodsImage'
import { ProductCard } from '@/components/shop/ProductCard'
import { QtyStepper } from '@/components/shop/ShopBits'
import { Button } from '@/components/ui/button'
import { byproductsConfig } from '@/config/byproducts'
import { REVIEWS } from '@/data/shop'
import { beefTitle } from '@/lib/beef'
import { categoryById, goodsStockLabel, isListed, maxQty, tierFor, unitPrice } from '@/lib/byproducts'
import { formatCurrency, formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

export default function GoodsProductPage() {
  const { goodsId } = useParams()
  const navigate = useNavigate()
  const product = useRanchStore((s) => s.goods.find((g) => g.id === goodsId))
  const goods = useRanchStore((s) => s.goods)
  const animals = useRanchStore((s) => s.animals)
  const products = useRanchStore((s) => s.products)
  const inCart = useRanchStore((s) => s.cart.find((i) => i.kind === 'goods' && i.goodsId === goodsId))
  const addGoodsToCart = useRanchStore((s) => s.addGoodsToCart)
  const [qty, setQty] = useState(1)
  usePageTitle(product?.name ?? 'Item not found')

  if (!product || !isListed(product, byproductsConfig)) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold">We can’t find that item</h1>
        <p className="mt-3 text-lg text-muted-foreground">It may have sold and come off the list. Have a look at what’s in Ranch Goods now.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/ranch-goods">Back to Ranch Goods</Link>
        </Button>
      </div>
    )
  }

  const category = categoryById(byproductsConfig, product.category)
  const sources = product.sourceTagIds.flatMap((t) => animals.find((a) => a.tagId === t) ?? [])
  const animal = sources.length === 1 ? sources[0] : undefined
  const inCartQty = inCart?.kind === 'goods' ? inCart.qty : 0
  const max = Math.max(0, maxQty(product) - inCartQty)
  const sold = product.stock <= 0
  const lineQty = Math.min(qty, Math.max(1, max))
  const price = unitPrice(product, inCartQty + lineQty, byproductsConfig)
  const fromSameAnimals = goods.filter(
    (g) => g.id !== product.id && g.sourceTagIds.some((t) => product.sourceTagIds.includes(t)) && isListed(g, byproductsConfig),
  )
  const beefFromAnimal = animal ? products.filter((p) => p.sourceTagId === animal.tagId && p.stock > 0) : []
  const sameCategory = goods
    .filter((g) => g.id !== product.id && g.category === product.category && g.stock > 0 && !fromSameAnimals.includes(g))
    .slice(0, 4)

  const add = () => {
    addGoodsToCart(product.id, lineQty)
    toast.success(`${lineQty > 1 ? `${lineQty} × ` : ''}${product.name} added to your cart`, {
      description: formatCurrency(unitPrice(product, inCartQty + lineQty, byproductsConfig) * lineQty, true),
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
    setQty(1)
  }

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link
          to={`/ranch-goods?cat=${product.category}`}
          className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {category?.name ?? 'Ranch Goods'}
        </Link>
      </div>

      <div className="grid gap-8 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-12">
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl border bg-muted">
          <GoodsImage art={product.art} coat={product.coat} seed={product.id} alt={product.name} className={cn(sold && 'grayscale-[60%]')} />
          {product.unique && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-tag px-3 py-1.5 font-semibold text-tag-foreground">
              <Fingerprint className="size-4" aria-hidden />
              {sold ? 'Sold' : 'One of a kind'}
            </span>
          )}
        </div>

        <div className="grid content-start gap-5">
          <h1 className="text-4xl font-bold sm:text-5xl">{product.name}</h1>
          <p className="text-lg">{product.description}</p>

          {/* Traceability */}
          {animal ? (
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <EarTag tagId={animal.tagId} />
              <div className="min-w-0">
                <p className="text-base">
                  From animal{' '}
                  <Link to={`/animal/${animal.tagId}`} className="font-semibold text-primary underline underline-offset-4">
                    {animal.tagId}
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  {beefTitle(animal)}
                  {animal.harvest && `, harvested ${formatDate(animal.harvest.date)}`}.{' '}
                  {product.unique ? 'This exact piece came from this animal.' : ''} Tap the tag number for its full record.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4">
              <GoodsTrace product={product} animals={animals} className="text-base" />
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
            {[
              ['Sold by', product.unit],
              ['Good for', product.uses.map((u) => byproductsConfig.uses[u]).join(', ')],
              ['Available', product.unique ? (sold ? 'Sold' : 'This one only') : goodsStockLabel(product) || `${product.stock} on hand`],
              ...(product.details ?? []).map((d, i) => [i === 0 ? 'Details' : '', d]),
            ].map(([k, v], i) => (
              <div key={i}>
                <dt className="min-h-5 text-sm text-muted-foreground">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 rounded-xl border bg-card p-5">
            <p>
              <span className="font-heading text-4xl font-bold tabular-nums">
                {formatCurrency(product.unique || sold ? product.price : price, true)}
              </span>
              <span className="text-muted-foreground"> / {product.unit}</span>
              {!product.unique && price < product.price && (
                <span className="ml-2 text-sm text-muted-foreground line-through tabular-nums">{formatCurrency(product.price, true)}</span>
              )}
            </p>
            {sold ? (
              <p className="font-semibold">
                {product.unique ? 'Sold. Each hide and horn sells once; more come in after every harvest.' : 'Sold out until the next harvest.'}
              </p>
            ) : product.unique ? (
              <GoodsBuyControl product={product} size="lg" className="w-full text-lg" />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <QtyStepper
                  value={lineQty}
                  onChange={setQty}
                  max={Math.max(1, max)}
                  label={`Number of ${product.unit === 'lb' ? 'pounds' : 'units'}`}
                />
                <Button size="lg" onClick={add} disabled={max <= 0} className="flex-1 text-lg">
                  <ShoppingCart aria-hidden />
                  Add to cart, {formatCurrency(price * lineQty, true)}
                </Button>
              </div>
            )}
            {inCartQty > 0 && !product.unique && (
              <p className="text-sm">
                {inCartQty} already in{' '}
                <Link to="/cart" className="font-medium text-primary underline underline-offset-4">
                  your cart
                </Link>
                .{max <= 0 && ' That’s all we have.'}
              </p>
            )}
          </div>

          {product.bulk && !product.unique && (
            <section aria-labelledby="tiers-heading" className="grid gap-3 rounded-xl border bg-card p-5">
              <h2 id="tiers-heading" className="flex items-center gap-2 text-xl font-bold">
                <Factory className="size-5 text-primary" aria-hidden />
                Volume pricing
              </h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="py-2 font-medium">Quantity</th>
                    <th className="py-2 font-medium">Discount</th>
                    <th className="py-2 text-right font-medium">Price / {product.unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {byproductsConfig.priceTiers.map((t) => {
                    const current = tierFor(inCartQty + lineQty, byproductsConfig.priceTiers) === t
                    return (
                      <tr key={t.min} className={cn('border-b last:border-0', current && 'bg-primary/5 font-semibold')}>
                        <td className="py-2">
                          {t.max ? `${t.min}–${t.max}` : `${t.min}+`}
                          {current && <span className="sr-only"> (your quantity)</span>}
                        </td>
                        <td className="py-2">{t.off ? `${Math.round(t.off * 100)}% off` : 'List price'}</td>
                        <td className="py-2 text-right tabular-nums">{formatCurrency(product.price * (1 - t.off), true)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-sm text-muted-foreground">
                Need more than we list?{' '}
                <Link to="/ranch-goods/wholesale" className="font-medium text-primary underline underline-offset-4">
                  Ask about wholesale
                </Link>
                .
              </p>
            </section>
          )}
        </div>
      </div>

      {(fromSameAnimals.length > 0 || beefFromAnimal.length > 0) && (
        <section aria-labelledby="same-animal-heading" className="mt-14 grid gap-5">
          <h2 id="same-animal-heading" className="text-3xl font-bold">
            {animal ? `More from ${animal.tagId}` : 'More from the same animals'}
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fromSameAnimals.slice(0, 4).map((g) => (
              <li key={g.id} className="grid">
                <GoodsCard product={g} animals={animals} compact />
              </li>
            ))}
            {beefFromAnimal.slice(0, Math.max(0, 4 - fromSameAnimals.length)).map((p) => (
              <li key={p.id} className="grid">
                <ProductCard product={p} animal={animal} reviews={REVIEWS.filter((r) => r.productId === p.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sameCategory.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14 grid gap-5">
          <h2 id="related-heading" className="text-3xl font-bold">
            More {category?.name.toLowerCase()}
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sameCategory.map((g) => (
              <li key={g.id} className="grid">
                <GoodsCard product={g} animals={animals} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">{byproductsConfig.consumerNote}</p>
    </div>
  )
}
