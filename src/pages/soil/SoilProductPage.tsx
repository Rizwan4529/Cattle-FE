import { useId, useState } from 'react'
import { Check, ChevronLeft, ShoppingCart, Truck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { QtyStepper } from '@/components/shop/ShopBits'
import { CoverageCalculator } from '@/components/soilfuel/CoverageCalculator'
import { SoilFuelImage } from '@/components/soilfuel/SoilFuelImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { soilFuelConfig } from '@/config/soilFuel'
import type { SoilUnit } from '@/data/soilFuelTypes'
import { formatNumber, formatPrice } from '@/lib/format'
import { bagLb, pricePerYard, soilUnitPrice, tonsPerYard, unitAmount } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import NotFoundPage from '@/pages/NotFoundPage'
import { useRanchStore } from '@/store/useRanchStore'

const { soil } = soilFuelConfig
const UNITS: SoilUnit[] = ['bag', 'yard', 'ton', 'truckload']
const USE_LABEL = Object.fromEntries(soil.uses.map((u) => [u.id, u.label]))

export default function SoilProductPage() {
  const { productId } = useParams()
  const p = soil.products.find((x) => x.id === productId)
  const enabled = useRanchStore((s) => (p ? s.soilFuelEnabled[p.id] : false))
  usePageTitle(p ? `${p.name}, ${soil.brand}` : 'Not found')
  if (!p || !enabled) return <NotFoundPage />
  return <ProductView key={p.id} productId={p.id} />
}

function ProductView({ productId }: { productId: (typeof soil.products)[number]['id'] }) {
  const id = useId()
  const navigate = useNavigate()
  const p = soil.products.find((x) => x.id === productId)!
  const stock = useRanchStore((s) => s.soilStock[p.id])
  const addSoil = useRanchStore((s) => s.addSoilToCart)
  const [unit, setUnit] = useState<SoilUnit>('bag')
  const [qty, setQty] = useState(1)

  const price = soilUnitPrice(p, unit)
  const amount = unitAmount(p, unit)
  const total = price * qty
  const available =
    unit === 'bag' ? stock.bags : unit === 'yard' ? Math.floor(stock.yards) : unit === 'ton' ? Math.floor(stock.yards * tonsPerYard(p)) : Infinity
  const saving = unit !== 'bag' ? Math.round((1 - pricePerYard(p, unit) / pricePerYard(p, 'bag')) * 100) : 0
  const u = soil.units[unit]

  const amountText =
    unit === 'bag'
      ? `${p.bagCuFt} cu ft, about ${bagLb(p)} lb`
      : unit === 'yard'
        ? `About ${formatNumber(amount.tons)} tons; fills a pickup bed about level`
        : unit === 'ton'
          ? `About ${formatNumber(amount.yards)} cubic yards`
          : `${formatNumber(amount.yards)} cubic yards, ${formatNumber(amount.tons)} tons, end-dump delivery`

  const add = () => {
    addSoil(p.id, unit as Exclude<SoilUnit, 'truckload'>, qty)
    toast.success(`${qty} ${qty === 1 ? u.label.toLowerCase() : u.plural} of ${p.name} added to your cart`, {
      description: formatPrice(total),
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link to="/soil" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          {soil.brand}
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
                  setUnit(v as SoilUnit)
                  setQty(1)
                }}
                aria-labelledby={`${id}-unit`}
                className="grid w-full grid-cols-2 sm:grid-cols-4"
              >
                {UNITS.map((x) => (
                  <ToggleGroupItem
                    key={x}
                    value={x}
                    className="h-auto min-h-14 flex-col gap-0 px-2 py-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                  >
                    <span className="font-semibold">{soil.units[x].label}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{formatPrice(soilUnitPrice(p, x))}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div aria-live="polite" className="grid gap-1">
              <p>
                <span className="font-heading text-4xl font-bold tabular-nums">{formatPrice(price)}</span>
                <span className="text-muted-foreground"> per {u.label.toLowerCase()}</span>
                {!soilFuelConfig.estimatesConfirmed && (
                  <Badge variant="outline" className="ml-2 align-middle">
                    Estimate
                  </Badge>
                )}
              </p>
              <p className="text-muted-foreground">{amountText}.</p>
              <p className="text-sm">
                {formatPrice(pricePerYard(p, unit))} per cubic yard
                {saving > 0 && <span className="font-semibold text-success"> · {saving}% less than bags</span>}
                {unit === 'truckload' && ` · ${Math.round(soil.truckload.discount * 100)}% truckload discount, delivery priced by ZIP`}
              </p>
            </div>

            {unit === 'truckload' ? (
              <div className="grid gap-3">
                <p>Truckloads are delivered by end-dump and priced to your ZIP. Get a delivered price in a minute, then we confirm it.</p>
                <Button asChild size="lg" className="justify-self-start">
                  <Link to={`/soil/truckload?product=${p.id}&loads=1`}>
                    <Truck aria-hidden />
                    Get a truckload quote
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
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
                      {unit !== 'bag' && '. Load at the ranch or have it delivered.'}
                    </>
                  ) : (
                    `None ready by the ${u.label.toLowerCase()} right now. Try another size, or join the list on the Soil page.`
                  )}
                </p>
                <Button size="lg" onClick={add} disabled={available <= 0} className="justify-self-start">
                  <ShoppingCart aria-hidden />
                  Add to cart
                </Button>
              </div>
            )}
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="text-xl font-bold">What it’s made of</h2>
              <ul className="mt-2 grid gap-1.5">
                {p.madeOf.map((m) => (
                  <li key={m} className="flex gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold">Best for</h2>
              <ul className="mt-2 grid gap-1.5">
                {p.bestUses.map((m) => (
                  <li key={m} className="flex gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section aria-labelledby={`${id}-rates`}>
            <h2 id={`${id}-rates`} className="text-xl font-bold">
              How much to put down
            </h2>
            <div className="mt-3 overflow-x-auto rounded-lg border" tabIndex={0} role="region" aria-label={`Application rates for ${p.name}`}>
              <table className="w-full text-left">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Use
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Rate
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      How
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {p.rates.map((r) => (
                    <tr key={r.use} className="border-t align-top">
                      <th scope="row" className="px-3 py-2 font-medium whitespace-nowrap">
                        {USE_LABEL[r.use]}
                      </th>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                        {'depthIn' in r ? `${r.depthIn} in deep` : `${r.tonsPerAcre} tons/acre`}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <CoverageCalculator productId={p.id} className="mt-12" />
    </div>
  )
}
