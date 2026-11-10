import { ClipboardList, Recycle, Store } from 'lucide-react'
import { Link } from 'react-router'
import { WholeAnimalExplorer } from '@/components/goods/WholeAnimal'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { beefConfig } from '@/config/beef'
import { byproductsConfig } from '@/config/byproducts'
import { wholeAnimalValue } from '@/lib/byproducts'
import { formatCurrency } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'

/** Nose to tail: what every part of one animal becomes. */
export default function NothingWastedPage() {
  usePageTitle('Nothing wasted')
  const total = wholeAnimalValue(byproductsConfig, beefConfig)

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Nothing wasted"
        description={`Most of a steer leaves the processor as beef. The rest (about ${formatCurrency(total.goods)} worth of hide, horns, bones, fat, and more) usually gets thrown out or sold for pennies. We bring it home and put it to use.`}
      />

      <WholeAnimalExplorer />

      <section aria-labelledby="how-heading" className="mt-14 grid gap-5">
        <h2 id="how-heading" className="text-3xl font-bold">
          How it works when you buy a share
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          <li className="grid content-start gap-2 rounded-xl border bg-card p-5">
            <ClipboardList className="size-7 text-primary" aria-hidden />
            <h3 className="font-heading text-xl font-bold">You take what you want</h3>
            <p className="text-muted-foreground">
              On your cut sheet, ask for soup and marrow bones, organ meats, or fat and suet. They come out of your share of the animal, free.
            </p>
          </li>
          <li className="grid content-start gap-2 rounded-xl border bg-card p-5">
            <Recycle className="size-7 text-primary" aria-hidden />
            <h3 className="font-heading text-xl font-bold">We keep the rest</h3>
            <p className="text-muted-foreground">{byproductsConfig.rights.short} You agree to this when you claim.</p>
          </li>
          <li className="grid content-start gap-2 rounded-xl border bg-card p-5">
            <Store className="size-7 text-primary" aria-hidden />
            <h3 className="font-heading text-xl font-bold">It becomes Ranch Goods</h3>
            <p className="text-muted-foreground">
              Tallow, chews, hides, horn, and garden meal, each labeled with the animal it came from. That helps keep our beef prices where they are.
            </p>
          </li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/ranch-goods">Shop Ranch Goods</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/beef">Claim your beef</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
