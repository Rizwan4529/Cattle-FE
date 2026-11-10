import { useState } from 'react'
import { BadgeCheck, ChefHat, ChevronLeft, Snowflake, ShoppingCart, ThermometerSun } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { CutImage } from '@/components/beef/CutImage'
import { GoodsForCut, TreatThePup } from '@/components/goods/GoodsCrossSell'
import { EarTag } from '@/components/cattle/EarTag'
import { ProductCard } from '@/components/shop/ProductCard'
import { FavoriteButton, QtyStepper, Stars, TraceLine } from '@/components/shop/ShopBits'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { beefConfig, feedProgram } from '@/config/beef'
import { cutLabel, REVIEWS } from '@/data/shop'
import { beefTitle } from '@/lib/beef'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/format'
import { LOW_STOCK, packPrice, ratingSummary, stockLabel } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const REVIEW_SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
] as const

export default function ProductPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const product = useRanchStore((s) => s.products.find((p) => p.id === productId))
  const products = useRanchStore((s) => s.products)
  const animals = useRanchStore((s) => s.animals)
  const inCart = useRanchStore((s) => s.cart.find((i) => i.kind === 'product' && i.productId === productId))
  const addProductToCart = useRanchStore((s) => s.addProductToCart)
  const [qty, setQty] = useState(1)
  const [stars, setStars] = useState<number | null>(null)
  const [sort, setSort] = useState<(typeof REVIEW_SORTS)[number]['value']>('newest')
  usePageTitle(product?.name ?? 'Product not found')

  if (!product) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold">We can’t find that cut</h1>
        <p className="mt-3 text-lg text-muted-foreground">It may have sold out and come off the list. Have a look at what’s in the freezer now.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/shop">Back to the Butcher Shop</Link>
        </Button>
      </div>
    )
  }

  const animal = animals.find((a) => a.tagId === product.sourceTagId)
  const program = animal?.feedProgram ? feedProgram(animal.feedProgram) : undefined
  const price = packPrice(product)
  const reviews = REVIEWS.filter((r) => r.productId === product.id)
  const summary = ratingSummary(reviews)
  const shown = reviews
    .filter((r) => !stars || r.rating === stars)
    .sort((a, b) => (sort === 'highest' ? b.rating - a.rating : sort === 'lowest' ? a.rating - b.rating : b.date.localeCompare(a.date)))
  const pairs = product.pairsWith.flatMap((id) => products.find((p) => p.id === id) ?? [])
  const max = Math.max(0, product.stock - (inCart?.kind === 'product' ? inCart.qty : 0))
  const soldOut = product.stock <= 0

  const add = () => {
    addProductToCart(product.id, qty)
    toast.success(`${qty} × ${product.name} added to your cart`, {
      description: formatCurrency(price * qty, true),
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
    setQty(1)
  }

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link
          to={`/shop?cut=${product.cut}`}
          className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {cutLabel(product.cut)}
        </Link>
      </div>

      <div className="grid gap-8 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-12">
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl border bg-muted">
          <CutImage cut={product.cut} seed={product.id} photos={product.photos} alt={product.name} />
          <FavoriteButton productId={product.id} name={product.name} className="absolute top-4 right-4" />
        </div>

        <div className="grid content-start gap-5">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">{product.name}</h1>
            {summary.count > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 underline-offset-4 hover:underline">
                <Stars rating={summary.avg} />
                <span>
                  {summary.avg} from {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
                </span>
              </a>
            )}
          </div>
          <p className="text-lg">{product.description}</p>

          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <EarTag tagId={product.sourceTagId} />
            <div className="min-w-0">
              <TraceLine product={product} animal={animal} className="text-base" />
              {animal && <p className="text-sm text-muted-foreground">{beefTitle(animal)}. Tap the tag number for its full record.</p>}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
            {[
              ['Pack', `${product.piecesPerPack > 1 ? `${product.piecesPerPack} pieces, ` : ''}${product.packNote}`],
              ['Weight', `About ${product.packWeightLb} lb`],
              ['Price per lb', formatCurrency(product.pricePerLb, true)],
              ['Packed', formatShortDate(product.packDate)],
              ['Dry-aged', `${product.agedDays} days`],
              ['In the freezer', stockLabel(product.stock)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className={cn('font-semibold', k === 'In the freezer' && product.stock <= LOW_STOCK && 'text-primary')}>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 rounded-xl border bg-card p-5">
            <p>
              <span className="font-heading text-4xl font-bold tabular-nums">{formatCurrency(price, true)}</span>
              <span className="text-muted-foreground"> per pack</span>
            </p>
            {soldOut ? (
              <p className="font-semibold">Sold out. This animal’s {cutLabel(product.cut).toLowerCase()} is gone; claim a share to get your own.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <QtyStepper value={qty} onChange={setQty} max={Math.max(1, max)} label="Number of packs" />
                <Button size="lg" onClick={add} disabled={max <= 0} className="flex-1 text-lg">
                  <ShoppingCart aria-hidden />
                  Add {qty > 1 ? `${qty} packs` : 'to cart'}, {formatCurrency(price * qty, true)}
                </Button>
              </div>
            )}
            {inCart?.kind === 'product' && (
              <p className="text-sm">
                {inCart.qty} already in{' '}
                <Link to="/cart" className="font-medium text-primary underline underline-offset-4">
                  your cart
                </Link>
                .{max <= 0 && ' That’s all we have.'}
              </p>
            )}
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Snowflake className="size-4 text-primary" aria-hidden />
                Vacuum-sealed and frozen. Ships on dry ice; free over {formatCurrency(beefConfig.delivery.shipping.freeOver)}.
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-primary" aria-hidden />
                {beefConfig.processor.inspection} at {beefConfig.processor.name}.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="cook-heading" className="grid content-start gap-4 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id="cook-heading" className="flex items-center gap-2 text-3xl font-bold">
            <ChefHat className="size-7 text-primary" aria-hidden />
            How to cook it
          </h2>
          <p className="text-lg font-semibold">{product.cookingGuide.method}</p>
          <ol className="grid gap-3">
            {product.cookingGuide.steps.map((step, i) => (
              <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <EarTag tagId={String(i + 1)} size="sm" srLabel="Step" className="w-8" />
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {product.cookingGuide.doneness && (
            <p className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3">
              <ThermometerSun className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              {product.cookingGuide.doneness}
            </p>
          )}
          {program && <p className="text-muted-foreground">{program.flavor}</p>}
        </section>

        <section id="reviews" aria-labelledby="reviews-heading" className="grid scroll-mt-28 content-start gap-4">
          <h2 id="reviews-heading" className="text-3xl font-bold">
            Reviews
          </h2>
          {summary.count === 0 ? (
            <p className="rounded-xl border border-dashed bg-card p-5 text-muted-foreground">No reviews yet. This one’s new in the freezer.</p>
          ) : (
            <>
              <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <div className="grid justify-items-start gap-1">
                  <p className="font-heading text-5xl font-bold">{summary.avg}</p>
                  <Stars rating={summary.avg} size="lg" />
                  <p className="text-sm text-muted-foreground">{summary.count} reviews</p>
                </div>
                <ul className="grid gap-1.5" aria-label="Filter reviews by stars">
                  {summary.dist.map((d) => (
                    <li key={d.stars}>
                      <button
                        type="button"
                        aria-pressed={stars === d.stars}
                        disabled={d.count === 0}
                        onClick={() => setStars(stars === d.stars ? null : d.stars)}
                        className={cn(
                          'grid w-full grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-3 rounded-md px-2 py-1 text-left text-sm hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                          stars === d.stars && 'bg-primary/10',
                        )}
                      >
                        <span>{d.stars} stars</span>
                        <span className="h-2.5 rounded-full bg-muted" aria-hidden>
                          <span className="block h-full rounded-full bg-tag" style={{ width: `${(d.count / summary.count) * 100}%` }} />
                        </span>
                        <span className="text-right tabular-nums">{d.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {stars ? `Showing ${shown.length} ${stars}-star ${shown.length === 1 ? 'review' : 'reviews'}. ` : ''}
                  {stars && (
                    <button type="button" onClick={() => setStars(null)} className="font-medium text-primary underline underline-offset-4">
                      Show all
                    </button>
                  )}
                </p>
                <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                  <SelectTrigger aria-label="Sort reviews" className="min-w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {REVIEW_SORTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ul className="grid gap-3">
                {shown.map((r) => (
                  <li key={r.id} className="grid gap-2 rounded-xl border bg-card p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Stars rating={r.rating} />
                      <h3 className="font-heading text-lg font-bold">{r.title}</h3>
                    </div>
                    <p>{r.body}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.name}, {r.city}. {formatDate(r.date)}
                      {r.verified && ', verified buyer'}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-2 empty:hidden">
        <GoodsForCut cut={product.cut} />
        <TreatThePup />
      </div>

      {pairs.length > 0 && (
        <section aria-labelledby="pairs-heading" className="mt-14 grid gap-5">
          <h2 id="pairs-heading" className="text-3xl font-bold">
            Pairs well with
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pairs.map((p) => (
              <li key={p.id} className="grid">
                <ProductCard
                  product={p}
                  animal={animals.find((a) => a.tagId === p.sourceTagId)}
                  reviews={REVIEWS.filter((r) => r.productId === p.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
