import { useCallback } from 'react'
import { Dog, Factory, Fingerprint, Soup } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { SearchBox } from '@/components/browse/SearchBox'
import { GoodsCard } from '@/components/goods/GoodsCard'
import { GoodsImage } from '@/components/goods/GoodsImage'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { byproductsConfig } from '@/config/byproducts'
import type { GoodsUse } from '@/data/goodsTypes'
import { filterGoods, GOODS_SORTS, type GoodsSort, isListed, PRICE_BUCKETS, type PriceBucket, visibleCategories } from '@/lib/byproducts'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const USES = Object.entries(byproductsConfig.uses) as [GoodsUse, string][]

/** Ranch Goods storefront: everything from the animal that isn't beef. */
export default function RanchGoodsPage() {
  usePageTitle('Ranch Goods')
  const allGoods = useRanchStore((s) => s.goods)
  const animals = useRanchStore((s) => s.animals)
  const categories = visibleCategories(byproductsConfig)
  const goods = allGoods.filter((g) => isListed(g, byproductsConfig))

  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const category = categories.find((c) => c.id === params.get('cat'))?.id
  const use = USES.find(([u]) => u === params.get('use'))?.[0]
  const price = PRICE_BUCKETS.find((b) => b.value === params.get('price'))?.value
  const sort: GoodsSort = GOODS_SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'featured'

  const update = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (!v || v === 'featured' || v === 'all') next.delete(k)
            else next.set(k, v)
          }
          return next
        },
        { replace: true, preventScrollReset: true },
      )
    },
    [setParams],
  )
  const onSearch = useCallback((value: string) => update({ q: value }), [update])

  const results = filterGoods(goods, { q, category, use, price, sort })
  const filtered = Boolean(q || use || price)
  // With no search or filters, show the catalog in sections, one per category.
  const sections = (category ? categories.filter((c) => c.id === category) : categories)
    .map((c) => ({ ...c, items: results.filter((g) => g.category === c.id) }))
    .filter((c) => c.items.length)
  const oneOfAKind = goods.filter((g) => g.unique && g.stock > 0)
  const heroRug = goods.find((g) => g.art === 'hide-rug' && g.stock > 0) ?? goods.find((g) => g.art === 'hide-rug')

  if (!categories.length) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold">Ranch Goods are coming back soon</h1>
        <p className="mt-3 text-lg text-muted-foreground">We’re not selling hides, tallow, or chews right now. Our beef is always available.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/beef">Claim your beef</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="container-page grid items-center gap-8 pt-8 pb-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pt-12">
        <div>
          <h1 className="text-4xl font-bold text-balance sm:text-5xl lg:text-6xl">Nothing wasted. Every part of the animal, put to use.</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Hides, horns, tallow, bones, and chews from the same cattle we raise for beef. The one-of-a-kind pieces tell you exactly which animal they
            came from.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => {
                update({ cat: 'hides', q: null, use: null, price: null })
                document.getElementById('goods-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Shop hides
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/ranch-goods/wholesale">Makers & Wholesale</Link>
            </Button>
          </div>
        </div>
        {heroRug && (
          <Link
            to={`/ranch-goods/${heroRug.id}`}
            className="group relative block overflow-hidden rounded-2xl border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="block aspect-4/3">
              <GoodsImage
                art={heroRug.art}
                coat={heroRug.coat}
                seed={heroRug.id}
                alt={heroRug.name}
                className="transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </span>
            <span className="absolute inset-x-3 bottom-3 rounded-xl bg-card/95 px-4 py-3 shadow-sm backdrop-blur-sm">
              <span className="block font-heading text-lg font-bold">{heroRug.name}</span>
              <span className="text-sm text-muted-foreground">From animal {heroRug.sourceTagIds[0]}. One of a kind.</span>
            </span>
          </Link>
        )}
      </section>

      {/* Category chips: sticky under the header, like the mockup */}
      <nav aria-label="Ranch Goods categories" className="sticky top-16 z-30 border-y bg-background/95 backdrop-blur lg:top-20">
        <ul className="container-page flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ id: 'all', name: 'Everything' }, ...categories].map((c) => {
            const on = (category ?? 'all') === c.id
            const count = c.id === 'all' ? goods.length : goods.filter((g) => g.category === c.id).length
            return (
              <li key={c.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    update({ cat: c.id })
                    document.getElementById('goods-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={cn(
                    'h-10 rounded-full border px-4 font-medium whitespace-nowrap transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card',
                  )}
                >
                  {c.name} <span className={cn('tabular-nums', on ? 'opacity-80' : 'text-muted-foreground')}>{count}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="container-page">
        {/* Search, filter, sort */}
        <div id="goods-results" className="grid scroll-mt-36 gap-3 pt-8 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
          <SearchBox value={q} onChange={onSearch} placeholder="Tallow, bully stick, HCR-2672…" label="Search Ranch Goods by name, use, or ear tag" />
          <Select value={use ?? 'all'} onValueChange={(v) => update({ use: v })}>
            <SelectTrigger aria-label="Filter by use" className="h-13 min-w-40 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any use</SelectItem>
              {USES.map(([u, label]) => (
                <SelectItem key={u} value={u}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={price ?? 'all'} onValueChange={(v) => update({ price: v as PriceBucket })}>
            <SelectTrigger aria-label="Filter by price" className="h-13 min-w-40 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any price</SelectItem>
              {PRICE_BUCKETS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => update({ sort: v })}>
            <SelectTrigger aria-label="Sort Ranch Goods" className="h-13 min-w-48 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {GOODS_SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="mt-4 text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? 'item' : 'items'}
          {filtered && (
            <>
              {' '}
              ·{' '}
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-4"
                onClick={() => update({ q: null, use: null, price: null })}
              >
                Clear filters
              </button>
            </>
          )}
        </p>

        {/* Results */}
        {results.length === 0 ? (
          <div className="mt-6 grid justify-items-start gap-3 rounded-xl border border-dashed bg-card p-6">
            <h2 className="text-2xl font-bold">Nothing matches</h2>
            <p className="text-muted-foreground">Try a different word or fewer filters. New hides, horns, and tallow come in after every harvest.</p>
            <Button onClick={() => update({ q: null, use: null, price: null, cat: null })}>Show everything</Button>
          </div>
        ) : filtered ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((g) => (
              <li key={g.id} className="grid">
                <GoodsCard product={g} animals={animals} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 grid gap-12">
            {sections.map((c) => (
              <section key={c.id} id={c.id} aria-labelledby={`${c.id}-heading`} className="grid scroll-mt-36 gap-4">
                <div>
                  <h2 id={`${c.id}-heading`} className="text-3xl font-bold">
                    {c.name}
                  </h2>
                  <p className="mt-1 text-muted-foreground">{c.description}</p>
                </div>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {c.items.map((g) => (
                    <li key={g.id} className="grid">
                      <GoodsCard product={g} animals={animals} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {/* Boxes and wholesale */}
        <section aria-labelledby="more-heading" className="mt-16 grid gap-4">
          <h2 id="more-heading" className="text-3xl font-bold">
            Every month, or by the pail
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {[
              {
                to: '/ranch-goods/boxes#dog-chew-box',
                icon: Dog,
                title: 'Monthly Dog Chew Box',
                body: 'Bully sticks, ears, and hooves from our own cattle, sized to your dog. Skip or pause any time.',
              },
              {
                to: '/ranch-goods/boxes#bone-broth-box',
                icon: Soup,
                title: 'Bone Broth Box',
                body: 'Knuckle, neck, and marrow bones for a big pot of broth, every month or two.',
              },
              {
                to: '/ranch-goods/wholesale',
                icon: Factory,
                title: 'Makers & Wholesale',
                body: 'Soap makers, pet-treat shops, leatherworkers, garden centers: up to 20% off by volume.',
              },
            ].map(({ to, icon: Icon, title, body }) => (
              <li key={to} className="grid">
                <Link
                  to={to}
                  className="grid content-start gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Icon className="size-7 text-primary" aria-hidden />
                  <span className="font-heading text-xl font-bold">{title}</span>
                  <span className="text-muted-foreground">{body}</span>
                </Link>
              </li>
            ))}
          </ul>
          {oneOfAKind.length > 0 && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Fingerprint className="size-4 shrink-0" aria-hidden />
              {oneOfAKind.length} one-of-a-kind {oneOfAKind.length === 1 ? 'piece is' : 'pieces are'} available now. Each sells once.
            </p>
          )}
        </section>

        <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">{byproductsConfig.consumerNote}</p>
      </div>
    </div>
  )
}
