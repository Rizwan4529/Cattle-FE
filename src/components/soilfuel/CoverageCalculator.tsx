import { useId, useState } from 'react'
import { Calculator, ShoppingCart, Truck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { soilFuelConfig } from '@/config/soilFuel'
import type { SoilProductId, SoilUse } from '@/data/soilFuelTypes'
import { formatNumber, formatPrice } from '@/lib/format'
import { type AreaUnit, type CoverageOption, coverage, soilProduct } from '@/lib/soilFuel'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const { soil } = soilFuelConfig

const optionLabel = (o: CoverageOption) =>
  `${formatNumber(o.qty)} ${o.qty === 1 ? soil.units[o.unit].label.toLowerCase() : soil.units[o.unit].plural}`

/**
 * Coverage calculator: area + use → how many bags, yards, or tons, what each
 * way costs, and a one-click add to the cart (truckloads go to the quote form).
 */
export function CoverageCalculator({ productId: fixed, className }: { productId?: SoilProductId; className?: string }) {
  const id = useId()
  const navigate = useNavigate()
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const addSoil = useRanchStore((s) => s.addSoilToCart)
  const products = soil.products.filter((p) => enabled[p.id])
  const [chosen, setChosen] = useState<SoilProductId>(fixed ?? products[0]?.id ?? 'garden-blend')
  const [use, setUse] = useState<SoilUse>('topdress')
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('sqft')
  const [area, setArea] = useState('1000')
  const productId = fixed ?? chosen
  const p = soilProduct(productId)
  const n = Number(area)
  const result = coverage(p, n, areaUnit, use)

  const add = (o: CoverageOption) => {
    if (o.unit === 'truckload') {
      navigate(`/soil/truckload?product=${p.id}&loads=${o.qty}`)
      return
    }
    addSoil(p.id, o.unit, o.qty)
    toast.success(`${optionLabel(o)} of ${p.name} added to your cart`, { action: { label: 'View cart', onClick: () => navigate('/cart') } })
  }

  return (
    <section aria-labelledby={`${id}-title`} className={cn('grid gap-5 rounded-2xl border bg-card p-5 sm:p-6', className)}>
      <div>
        <h2 id={`${id}-title`} className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Calculator className="size-7 text-primary" aria-hidden />
          How much do you need?
        </h2>
        <p className="mt-1 text-muted-foreground">Enter the area and what it’s for. We’ll work out bags, yards, or tons, and what each costs.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {!fixed && (
          <div className="grid gap-2">
            <Label htmlFor={`${id}-product`}>Product</Label>
            <Select value={productId} onValueChange={(v) => setChosen(v as SoilProductId)}>
              <SelectTrigger id={`${id}-product`} className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {products.map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {x.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor={`${id}-area`}>Area</Label>
          <div className="flex gap-2">
            <Input
              id={`${id}-area`}
              type="number"
              inputMode="decimal"
              min={0}
              step={areaUnit === 'acres' ? 0.5 : 50}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-11 min-w-0 flex-1 tabular-nums"
              aria-describedby={`${id}-area-hint`}
            />
            <ToggleGroup
              type="single"
              variant="outline"
              value={areaUnit}
              onValueChange={(v) => {
                if (!v || v === areaUnit) return
                setAreaUnit(v as AreaUnit)
                // Keep the same ground when switching units.
                if (n > 0) setArea(String(v === 'acres' ? Math.round((n / 43_560) * 100) / 100 : Math.round(n * 43_560)))
              }}
              aria-label="Area unit"
            >
              <ToggleGroupItem value="sqft" className="h-11 px-3">
                sq ft
              </ToggleGroupItem>
              <ToggleGroupItem value="acres" className="h-11 px-3">
                acres
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <p id={`${id}-area-hint`} className="text-sm text-muted-foreground">
            Length × width in feet. A typical front lawn is 2,000–5,000 sq ft.
          </p>
        </div>
        <fieldset className={cn('grid gap-2', !fixed && 'lg:col-span-2')}>
          <legend className="mb-2 text-sm font-medium">What it’s for</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {soil.uses.map((u) => (
              <label
                key={u.id}
                className={cn(
                  'grid cursor-pointer gap-0.5 rounded-xl border bg-background p-3 has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  use === u.id && 'border-primary bg-primary/10',
                )}
              >
                <input type="radio" name={`${id}-use`} value={u.id} checked={use === u.id} onChange={() => setUse(u.id)} className="sr-only" />
                <span className="font-semibold">{u.label}</span>
                <span className="text-sm text-muted-foreground">{u.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div aria-live="polite" className="grid gap-4">
        {result ? (
          <>
            <dl className="grid grid-cols-3 gap-3 rounded-xl bg-muted/70 p-4">
              {[
                ['Cubic yards', formatNumber(result.yards)],
                ['Tons', formatNumber(result.tons)],
                ['Bags', formatNumber(result.bags)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="font-heading text-3xl font-bold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              {p.name}: {result.note}
            </p>
            <ul className="grid gap-2">
              {result.options.map((o) => {
                const best = o === result.best
                return (
                  <li
                    key={o.unit}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3',
                      best && 'border-2 border-primary',
                    )}
                  >
                    <span>
                      <span className="block font-semibold">
                        {optionLabel(o)}
                        {best && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Best for this job</span>}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(o.cost)}
                        {o.unit === 'truckload' ? ' plus delivery' : o.unit === 'bag' ? '' : ', load at the ranch or have it delivered'}
                      </span>
                    </span>
                    <Button variant={best ? 'default' : 'outline'} onClick={() => add(o)}>
                      {o.unit === 'truckload' ? <Truck aria-hidden /> : <ShoppingCart aria-hidden />}
                      {o.unit === 'truckload' ? 'Get a quote' : 'Add to cart'}
                    </Button>
                  </li>
                )
              })}
            </ul>
            {!soilFuelConfig.estimatesConfirmed && <p className="text-sm text-muted-foreground">{soilFuelConfig.placeholderNote}</p>}
          </>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-muted-foreground">
            Enter an area above to see how much you need. Not sure?{' '}
            <Link to="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
              Ask us
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  )
}
