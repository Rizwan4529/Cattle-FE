import { useId, useState } from 'react'
import { Check, ChevronLeft, Flame, ShoppingCart, TriangleAlert } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { QtyStepper } from '@/components/shop/ShopBits'
import { SoilFuelImage } from '@/components/soilfuel/SoilFuelImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { soilFuelConfig } from '@/config/soilFuel'
import type { FuelProductId, FuelUnit } from '@/data/soilFuelTypes'
import { formatNumber, formatPrice } from '@/lib/format'
import { fuelBundles, fuelLb, fuelPerBundle, fuelSavings } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import NotFoundPage from '@/pages/NotFoundPage'
import { useRanchStore } from '@/store/useRanchStore'

const { fuel } = soilFuelConfig
const UNITS: FuelUnit[] = ['bundle', 'case', 'pallet']

export default function FuelProductPage() {
  const { productId } = useParams()
  const p = fuel.products.find((x) => x.id === productId)
  const enabled = useRanchStore((s) => (p ? s.soilFuelEnabled[p.id] : false))
  usePageTitle(p ? `${p.name}, ${fuel.brand}` : 'Not found')
  if (!p || !enabled) return <NotFoundPage />
  return <ProductView key={p.id} productId={p.id} />
}

function ProductView({ productId }: { productId: FuelProductId }) {
  const id = useId()
  const navigate = useNavigate()
  const p = fuel.products.find((x) => x.id === productId)!
  const bundlesOnHand = useRanchStore((s) => s.fuelStock[p.id])
  const addFuel = useRanchStore((s) => s.addFuelToCart)
  const [unit, setUnit] = useState<FuelUnit>('bundle')
  const [qty, setQty] = useState(1)
  const u = fuel.units[unit]
  const available = Math.floor(bundlesOnHand / fuelBundles(p, unit))
  const total = p.price[unit] * qty
  const savings = fuelSavings(p, unit)

  const add = () => {
    addFuel(p.id, unit, qty)
    toast.success(`${qty} ${qty === 1 ? u.label.toLowerCase() : u.plural} of ${p.name} added to your cart`, {
      description: formatPrice(total),
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link to="/fuel" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          {fuel.brand}
        </Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="aspect-4/3 overflow-hidden rounded-3xl border lg:sticky lg:top-28 lg:self-start">
          <SoilFuelImage art={p.art} seed={p.id} alt={`${p.name} illustration`} />
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">{p.name}</h1>
            <p className="mt-3 text-xl text-muted-foreground">{p.tagline}</p>
          </div>
          <p className="text-lg">{p.description}</p>

          <dl className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/70 p-4">
            <div>
              <dt className="text-sm text-muted-foreground">Burn time</dt>
              <dd className="flex items-center gap-1 font-heading text-xl font-bold">
                <Flame className="size-5 text-primary" aria-hidden />
                {p.burnMinutes[0]}–{p.burnMinutes[1]} min
              </dd>
              <dd className="text-sm text-muted-foreground">{p.burnPer}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Form</dt>
              <dd className="font-heading text-xl font-bold">{p.form}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">A bundle</dt>
              <dd className="font-semibold">{p.bundleContents}</dd>
            </div>
          </dl>

          <section aria-labelledby={`${id}-buy`} className="grid gap-5 rounded-2xl border bg-card p-5">
            <h2 id={`${id}-buy`} className="sr-only">
              Choose how much
            </h2>
            <div className="grid gap-2">
              <span id={`${id}-unit`} className="font-medium">
                Buy by the
              </span>
              <ToggleGroup
                type="single"
                variant="outline"
                value={unit}
                onValueChange={(v) => {
                  if (!v) return
                  setUnit(v as FuelUnit)
                  setQty(1)
                }}
                aria-labelledby={`${id}-unit`}
                className="grid w-full grid-cols-3"
              >
                {UNITS.map((x) => (
                  <ToggleGroupItem
                    key={x}
                    value={x}
                    className="h-auto min-h-14 flex-col gap-0 px-2 py-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                  >
                    <span className="font-semibold">{fuel.units[x].label}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{formatPrice(p.price[x])}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div aria-live="polite" className="grid gap-1">
              <p>
                <span className="font-heading text-4xl font-bold tabular-nums">{formatPrice(p.price[unit])}</span>
                <span className="text-muted-foreground"> per {u.label.toLowerCase()}</span>
                {!soilFuelConfig.estimatesConfirmed && (
                  <Badge variant="outline" className="ml-2 align-middle">
                    Estimate
                  </Badge>
                )}
              </p>
              <p className="text-muted-foreground">
                {unit === 'bundle'
                  ? `${p.bundleContents}.`
                  : `${formatNumber(fuelBundles(p, unit))} bundles, about ${formatNumber(fuelLb(p, unit))} lb${unit === 'pallet' ? `, ${p.casesPerPallet} cases` : ''}.`}
              </p>
              <p className="text-sm">
                {formatPrice(fuelPerBundle(p, unit))} a bundle
                {savings > 0 && <span className="font-semibold text-success"> · save {Math.round(savings * 100)}%</span>}
                {unit === 'pallet' && ' · delivered on the ranch truck or picked up with a forklift'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <QtyStepper value={qty} onChange={setQty} min={1} max={Math.max(1, Math.min(999, available))} label={`Number of ${u.plural}`} />
              <p className="text-lg">
                Total <span className="font-heading text-2xl font-bold tabular-nums">{formatPrice(total)}</span>
              </p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {available > 0 ? (
                <>
                  <Check className="size-4 text-success" aria-hidden />
                  {formatNumber(available)} {available === 1 ? u.label.toLowerCase() : u.plural} ready
                </>
              ) : (
                `Not enough on hand for a ${u.label.toLowerCase()} right now. Try a smaller size, or ask about wholesale.`
              )}
            </p>
            <Button size="lg" onClick={add} disabled={available <= 0} className="justify-self-start">
              <ShoppingCart aria-hidden />
              Add to cart
            </Button>
          </section>

          <p role="note" className="flex items-start gap-3 rounded-xl border-2 border-warning/60 bg-warning/10 p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
            <span>
              <strong className="font-semibold">Outdoor use only.</strong> {fuel.outdoorNote.replace(/^For outdoor use only: /, 'For ')}
            </span>
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="text-xl font-bold">Good for</h2>
              <ul className="mt-2 grid gap-1.5">
                {p.uses.map((m) => (
                  <li key={m} className="flex gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold">Storing it</h2>
              <ul className="mt-2 grid gap-1.5">
                {fuel.storage.map((m) => (
                  <li key={m} className="flex gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section aria-labelledby={`${id}-made`}>
            <h2 id={`${id}-made`} className="text-xl font-bold">
              How it’s made
            </h2>
            <ol className="mt-3 grid gap-2">
              {fuel.process.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
                  <span>
                    <span className="font-semibold">{s.title}.</span> <span className="text-muted-foreground">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
