import { BriefcaseBusiness, MapPin, Truck } from 'lucide-react'
import { Link } from 'react-router'
import { CoverageCalculator } from '@/components/soilfuel/CoverageCalculator'
import { SoilFuelImage } from '@/components/soilfuel/SoilFuelImage'
import { TrustSection } from '@/components/soilfuel/TrustSection'
import { WaitlistForm } from '@/components/soilfuel/WaitlistForm'
import { Button } from '@/components/ui/button'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { formatNumber, formatPrice } from '@/lib/format'
import { soilUnitPrice, truckloadTons } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const { soil } = soilFuelConfig

/** CROWDER Soil storefront: the product line, coverage calculator, truckloads, pro and dealer links, trust, and the waitlist. */
export default function SoilPage() {
  usePageTitle(soil.brand)
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const stock = useRanchStore((s) => s.soilStock)
  const products = soil.products.filter((p) => enabled[p.id])
  const ag = soil.products.find((p) => p.id === 'ag-bulk')!

  return (
    <div className="pb-16">
      <section className="bg-card">
        <div className="container-page grid items-center gap-8 py-10 lg:grid-cols-[1.1fr_minmax(0,1fr)] lg:py-14">
          <div>
            <p className="font-semibold text-primary">{soil.brand}</p>
            <h1 className="mt-2 text-5xl leading-[1.05] font-bold sm:text-6xl">Compost from our herd and our hay.</h1>
            <p className="mt-5 max-w-xl text-xl text-muted-foreground">
              Manure from {ranch.name} cattle, composted hot with alfalfa from our own meadows, cured for months, and screened. By the bag, the yard,
              the ton, or the truckload.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-lg">
                <a href="#soil-products">Shop soil</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link to="/soil/truckload">
                  <Truck aria-hidden />
                  Truckload quote
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-muted-foreground">
              The first screened batches are ready in limited amounts. Full launch is {soil.launch.season}:{' '}
              <a href="#waitlist" className="font-medium text-primary underline-offset-4 hover:underline">
                join the list
              </a>{' '}
              for first pick.
            </p>
          </div>
          <div className="aspect-4/3 overflow-hidden rounded-3xl border shadow-sm">
            <SoilFuelImage art="bulk-pile" alt="A pile of dark, screened compost with a loader bucket" />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-16 pt-12">
        <section id="soil-products" aria-labelledby="soil-products-heading" className="grid scroll-mt-28 gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="soil-products-heading" className="text-3xl font-bold sm:text-4xl">
                The soil line
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">Every product sold by the bag, cubic yard, ton, or truckload.</p>
            </div>
            {!soilFuelConfig.estimatesConfirmed && <p className="text-sm text-muted-foreground">{soilFuelConfig.placeholderNote}</p>}
          </div>
          {products.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((p) => {
                const s = stock[p.id]
                return (
                  <li key={p.id} className="group relative grid content-start overflow-hidden rounded-2xl border bg-card">
                    <div className="aspect-4/3 overflow-hidden">
                      <SoilFuelImage art={p.art} seed={p.id} alt="" className="transition-transform group-hover:scale-[1.03]" />
                    </div>
                    <div className="grid gap-2 p-4">
                      <h3 className="text-xl font-bold">
                        <Link to={`/soil/${p.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                          {p.name}
                        </Link>
                      </h3>
                      <p className="text-muted-foreground">{p.tagline}</p>
                      <p className="font-semibold tabular-nums">
                        {formatPrice(p.price.bag)}/bag · {formatPrice(p.price.yard)}/yd³ · {formatPrice(p.price.ton)}/ton
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {s.bags || s.yards
                          ? `${s.bags ? `${formatNumber(s.bags)} bags` : 'No bags'}, ${formatNumber(s.yards)} yd³ bulk ready`
                          : 'Next batch curing now'}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed bg-card p-6 text-lg">
              Soil products are between batches. Join the list below and we’ll tell you when they’re back.
            </p>
          )}
        </section>

        <CoverageCalculator />

        <section
          aria-labelledby="truckload-heading"
          className="grid gap-6 rounded-2xl border-2 border-primary/30 bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
        >
          <div>
            <h2 id="truckload-heading" className="text-3xl font-bold">
              By the truckload
            </h2>
            <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
              For farms, landscapers, and golf courses: {soil.truckload.yards} cubic yards (up to {soil.truckload.maxTons} tons) a load, delivered.
              Ag-Grade Bulk runs about {formatPrice(soilUnitPrice(ag, 'truckload'))} a load ({formatNumber(truckloadTons(ag))} tons) before delivery.
              Enter your ZIP for a delivered price.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/soil/truckload">
              <Truck aria-hidden />
              Price a truckload
            </Link>
          </Button>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section aria-labelledby="pro-heading" className="grid content-start gap-3 rounded-2xl border bg-card p-6">
            <BriefcaseBusiness className="size-8 text-primary" aria-hidden />
            <h2 id="pro-heading" className="text-2xl font-bold">
              Pro accounts
            </h2>
            <p className="text-muted-foreground">
              Landscapers, golf courses, farms, and garden centers: up to {Math.round(soil.proTiers.at(-1)!.off * 100)}% off list with volume pricing.
            </p>
            <Button asChild variant="outline" className="justify-self-start">
              <Link to="/soil/pro">See pro pricing</Link>
            </Button>
          </section>
          <section aria-labelledby="stores-heading" className="grid content-start gap-3 rounded-2xl border bg-card p-6">
            <MapPin className="size-8 text-primary" aria-hidden />
            <h2 id="stores-heading" className="text-2xl font-bold">
              Find us in stores
            </h2>
            <p className="text-muted-foreground">
              Garden centers and feed stores around the Front Range carry our bags. Want to stock it? Become a dealer.
            </p>
            <Button asChild variant="outline" className="justify-self-start">
              <Link to="/soil/stores">Find a store</Link>
            </Button>
          </section>
        </div>

        <TrustSection />

        <div id="waitlist" className="scroll-mt-28">
          <WaitlistForm division="soil" />
        </div>
      </div>
    </div>
  )
}
