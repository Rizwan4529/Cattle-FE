import { Building2, Flame, Store, Tent, TriangleAlert, Warehouse } from 'lucide-react'
import { Link } from 'react-router'
import { SoilFuelImage } from '@/components/soilfuel/SoilFuelImage'
import { WaitlistForm } from '@/components/soilfuel/WaitlistForm'
import { Button } from '@/components/ui/button'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { formatNumber, formatPrice } from '@/lib/format'
import { fuelPerBundle } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const { fuel } = soilFuelConfig

/** CROWDER Fuel storefront: fire logs, briquettes, campfire bundles, and the cow chip gift pack. */
export default function FuelPage() {
  usePageTitle(fuel.brand)
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const stock = useRanchStore((s) => s.fuelStock)
  const products = fuel.products.filter((p) => enabled[p.id])

  return (
    <div className="pb-16">
      <section className="bg-card">
        <div className="container-page grid items-center gap-8 py-10 lg:grid-cols-[1.1fr_minmax(0,1fr)] lg:py-14">
          <div>
            <p className="font-semibold text-primary">{fuel.brand}</p>
            <h1 className="mt-2 text-5xl leading-[1.05] font-bold sm:text-6xl">Fire logs from a ranch with no trees to spare.</h1>
            <p className="mt-5 max-w-xl text-xl text-muted-foreground">
              Plains settlers burned dried cattle chips where there was no wood. We press ours with hay into logs and briquettes, dry them in the
              Colorado sun, and cure them until they’re hard. By the bundle, the case, or the pallet.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-lg">
                <a href="#fuel-products">Shop fuel</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link to="/fuel/wholesale">
                  <Warehouse aria-hidden />
                  Wholesale
                </Link>
              </Button>
            </div>
          </div>
          <div className="aspect-4/3 overflow-hidden rounded-3xl border shadow-sm">
            <SoilFuelImage art="campfire" alt="Two fuel logs crossed under a fire" />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-14 pt-10">
        <p role="note" className="flex items-start gap-3 rounded-xl border-2 border-warning/60 bg-warning/10 p-4 text-lg">
          <TriangleAlert className="mt-1 size-6 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
          <span>
            <strong className="font-semibold">Outdoor use only.</strong> {fuel.outdoorNote.replace(/^For outdoor use only: /, 'For ')}
          </span>
        </p>

        <section id="fuel-products" aria-labelledby="fuel-products-heading" className="grid scroll-mt-28 gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="fuel-products-heading" className="text-3xl font-bold sm:text-4xl">
                The fuel line
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Every product by the bundle, the case, or the pallet. The more you buy, the less each bundle costs.
              </p>
            </div>
            {!soilFuelConfig.estimatesConfirmed && <p className="text-sm text-muted-foreground">{soilFuelConfig.placeholderNote}</p>}
          </div>
          {products.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((p) => (
                <li key={p.id} className="group relative grid content-start overflow-hidden rounded-2xl border bg-card">
                  <div className="aspect-4/3 overflow-hidden">
                    <SoilFuelImage art={p.art} seed={p.id} alt="" className="transition-transform group-hover:scale-[1.03]" />
                  </div>
                  <div className="grid gap-2 p-4">
                    <h3 className="text-xl font-bold">
                      <Link to={`/fuel/${p.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                        {p.name}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground">{p.tagline}</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      <Flame className="size-4 text-primary" aria-hidden />
                      {p.burnMinutes[0]}–{p.burnMinutes[1]} min {p.burnPer}
                    </p>
                    <p className="font-semibold tabular-nums">
                      {formatPrice(p.price.bundle)} a bundle · {formatPrice(fuelPerBundle(p, 'pallet'))} by the pallet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stock[p.id] > 0 ? `${formatNumber(stock[p.id])} bundles ready` : 'Next batch drying now'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed bg-card p-6 text-lg">
              Fuel is between batches. Join the list below and we’ll tell you when it’s back.
            </p>
          )}
        </section>

        <section aria-labelledby="made-heading" className="grid gap-6">
          <div>
            <h2 id="made-heading" className="text-3xl font-bold sm:text-4xl">
              How it’s made
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Six steps, about two months from the pen to the pallet. Drying needs sun, so we press from spring to fall.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fuel.process.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-2xl border bg-card p-4">
                <span className="grid size-10 place-items-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-lg font-bold">{s.title}</span>
                  <span className="text-muted-foreground">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="storage-heading" className="grid content-start gap-3 rounded-2xl border bg-card p-6">
            <h2 id="storage-heading" className="text-2xl font-bold">
              Keeping it dry
            </h2>
            <ul className="grid gap-2">
              {fuel.storage.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="wholesale-heading" className="grid content-start gap-3 rounded-2xl border-2 border-primary/30 bg-card p-6">
            <h2 id="wholesale-heading" className="text-2xl font-bold">
              For campgrounds, stores, and camps
            </h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Tent className="size-5 text-primary" aria-hidden />
                Campgrounds and RV parks
              </li>
              <li className="flex items-center gap-2">
                <Store className="size-5 text-primary" aria-hidden />
                Gift and outdoor stores
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" aria-hidden />
                Schools, camps, and institutions
              </li>
            </ul>
            <p>Pallet pricing, mixed pallets, and a ranch story card for your shelf. {ranch.owner} replies within two business days.</p>
            <Button asChild className="justify-self-start">
              <Link to="/fuel/wholesale">Ask about wholesale</Link>
            </Button>
          </section>
        </div>

        <div id="waitlist" className="scroll-mt-28">
          <WaitlistForm division="fuel" />
        </div>
      </div>
    </div>
  )
}
