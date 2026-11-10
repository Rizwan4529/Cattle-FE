import { Gift, Package, PackagePlus, Repeat, ShieldCheck, Truck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { CutImage } from '@/components/beef/CutImage'
import { PageHeader } from '@/components/PageHeader'
import { ProductCard } from '@/components/shop/ProductCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { beefConfig } from '@/config/beef'
import type { CutId, FeedProgramId } from '@/data/beefTypes'
import { CUTS, cutLabel, REVIEWS } from '@/data/shop'
import { formatCurrency } from '@/lib/format'
import { packPrice } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price per lb: low to high' },
  { value: 'price-desc', label: 'Price per lb: high to low' },
  { value: 'newest', label: 'Most recently packed' },
] as const
type Sort = (typeof SORTS)[number]['value']

const PROMOS = [
  {
    to: '/shop/boxes',
    icon: Package,
    title: 'Curated boxes',
    body: 'Grill night, a month of dinners, or the holiday roast. Bundled and discounted.',
  },
  {
    to: '/shop/build-a-box',
    icon: PackagePlus,
    title: 'Build your own box',
    body: `Pick any cuts. Reach ${beefConfig.box.targetLb} lb and save ${Math.round(beefConfig.box.discount * 100)}% on the whole box.`,
  },
  { to: '/shop/ranch-box', icon: Repeat, title: 'Ranch Box subscription', body: 'A box of our beef every month or two. Skip or pause any time.' },
  { to: '/gifts', icon: Gift, title: 'Gifts', body: 'Gift boxes, gift cards, and gifts for clients and crews.' },
]

export default function ShopPage() {
  usePageTitle('Butcher Shop')
  const products = useRanchStore((s) => s.products)
  const animals = useRanchStore((s) => s.animals)
  const [params, setParams] = useSearchParams()
  const cut = CUTS.find((c) => c.id === params.get('cut'))?.id
  const program = beefConfig.feedPrograms.find((p) => p.id === params.get('program'))?.id
  const sort: Sort = SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'featured'

  const update = (patch: { cut?: CutId | null; program?: FeedProgramId | null; sort?: Sort }) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'featured') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const byTag = new Map(animals.map((a) => [a.tagId, a]))
  const results = products
    .filter((p) => !cut || p.cut === cut)
    .filter((p) => !program || byTag.get(p.sourceTagId)?.feedProgram === program)
    .sort((a, b) => {
      if (sort === 'price-asc') return a.pricePerLb - b.pricePerLb
      if (sort === 'price-desc') return b.pricePerLb - a.pricePerLb
      if (sort === 'newest') return b.packDate.localeCompare(a.packDate)
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0)
    })

  if (!beefConfig.sellByTheCut) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold">The Butcher Shop is closed for now</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We’re selling beef by the share right now. Claim a share of an animal and have it cut your way.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/beef">Claim your beef</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Butcher Shop"
        description="Steaks, roasts, and ground beef from animals raised on our ranch. Every pack is labeled with the ear tag of the animal it came from, so you can look it up."
      />

      <section aria-labelledby="cuts-heading" className="grid gap-4">
        <h2 id="cuts-heading" className="text-2xl font-bold sm:text-3xl">
          Shop by cut
        </h2>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          <li>
            <button
              type="button"
              aria-pressed={!cut}
              onClick={() => update({ cut: null })}
              className={cn(
                'grid h-full w-full place-items-center rounded-xl border bg-card p-3 text-center font-semibold transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                !cut && 'border-primary bg-primary/5 ring-1 ring-primary',
              )}
            >
              All cuts
              <span className="block text-sm font-normal text-muted-foreground">{products.length} items</span>
            </button>
          </li>
          {CUTS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={cut === c.id}
                onClick={() => update({ cut: cut === c.id ? null : c.id })}
                className={cn(
                  'grid w-full gap-1.5 overflow-hidden rounded-xl border bg-card pb-2 text-center transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  cut === c.id && 'border-primary bg-primary/5 ring-1 ring-primary',
                )}
              >
                <span className="block aspect-4/3 overflow-hidden">
                  <CutImage cut={c.id} alt="" />
                </span>
                <span className="px-1 text-sm leading-tight font-semibold">{c.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PROMOS.map(({ to, icon: Icon, title, body }) => (
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

      <section aria-labelledby="products-heading" className="mt-12 grid gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="products-heading" className="mr-auto text-2xl font-bold sm:text-3xl" aria-live="polite">
            {cut ? cutLabel(cut) : 'Everything'}
            <span className="ml-2 font-sans text-base font-normal text-muted-foreground">
              {results.length} {results.length === 1 ? 'item' : 'items'}
            </span>
          </h2>
          <ToggleGroup
            type="single"
            variant="outline"
            value={program ?? 'all'}
            onValueChange={(v) => v && update({ program: v === 'all' ? null : (v as FeedProgramId) })}
            aria-label="Feed program"
            className="flex-wrap"
          >
            <ToggleGroupItem value="all" className="h-10 px-3">
              All
            </ToggleGroupItem>
            {beefConfig.feedPrograms.map((p) => (
              <ToggleGroupItem key={p.id} value={p.id} className="h-10 px-3">
                {p.short}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={sort} onValueChange={(v) => update({ sort: v as Sort })}>
            <SelectTrigger aria-label="Sort products" className="min-w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {results.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((p) => (
              <li key={p.id} className="grid">
                <ProductCard product={p} animal={byTag.get(p.sourceTagId)} reviews={REVIEWS.filter((r) => r.productId === p.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid justify-items-start gap-3 rounded-xl border border-dashed bg-card p-6">
            <h3 className="text-2xl font-bold">Nothing matches</h3>
            <p className="text-muted-foreground">
              We don’t have {cut ? cutLabel(cut).toLowerCase() : 'that'} from a {program?.replace('-', ' ')} animal right now. Try another feed
              program, or claim a share and get every cut.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => update({ cut: null, program: null })}>Show everything</Button>
              <Button asChild variant="outline">
                <Link to="/beef">Claim a share</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="flex items-start gap-4 rounded-2xl border bg-card p-6">
          <ShieldCheck className="mt-1 size-7 shrink-0 text-success" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold">{beefConfig.guarantee.title}</h2>
            <p className="mt-2 text-muted-foreground">{beefConfig.guarantee.body}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border bg-card p-6">
          <Truck className="mt-1 size-7 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold">Shipped frozen, or picked up fresh from the freezer</h2>
            <p className="mt-2 text-muted-foreground">
              Free frozen shipping on orders over {formatCurrency(beefConfig.delivery.shipping.freeOver)}. Local delivery and ranch pickup too. A
              ribeye pack starts at {formatCurrency(packPrice(products.find((p) => p.cut === 'ribeye') ?? products[0]), true)}.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
