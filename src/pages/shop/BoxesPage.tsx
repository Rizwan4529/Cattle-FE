import { PackagePlus, Repeat } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { BundleCard } from '@/components/shop/BundleCard'
import { Button } from '@/components/ui/button'
import { beefConfig } from '@/config/beef'
import { BUNDLES } from '@/data/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

export default function BoxesPage() {
  usePageTitle('Curated boxes')
  const products = useRanchStore((s) => s.products)
  const curated = BUNDLES.filter((b) => !b.gift)
  const gifts = BUNDLES.filter((b) => b.gift)

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Curated boxes"
        description="Our favorite combinations, packed together and priced below what the same packs cost one by one."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link to="/shop">Back to the Butcher Shop</Link>
          </Button>
        }
      />
      <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {curated.map((b) => (
          <li key={b.id} className="grid">
            <BundleCard bundle={b} products={products} />
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Link
          to="/shop/build-a-box"
          className="flex items-start gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <PackagePlus className="mt-1 size-8 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block font-heading text-2xl font-bold">Rather pick it yourself?</span>
            <span className="text-muted-foreground">
              Build your own box. Reach {beefConfig.box.targetLb} lb and the whole box is {Math.round(beefConfig.box.discount * 100)}% off.
            </span>
          </span>
        </Link>
        <Link
          to="/shop/ranch-box"
          className="flex items-start gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Repeat className="mt-1 size-8 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block font-heading text-2xl font-bold">Want one every month?</span>
            <span className="text-muted-foreground">The Ranch Box arrives every month or two. Skip or pause whenever you like.</span>
          </span>
        </Link>
      </div>

      <section aria-labelledby="gift-boxes" className="mt-14 grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="gift-boxes" className="text-3xl font-bold">
            Gift boxes
          </h2>
          <Button asChild variant="link" className="px-0 text-base">
            <Link to="/gifts">All gifts and gift cards</Link>
          </Button>
        </div>
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {gifts.map((b) => (
            <li key={b.id} className="grid">
              <BundleCard bundle={b} products={products} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
