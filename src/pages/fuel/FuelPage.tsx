import { Flame, Phone } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ranchPhoneHref } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { formatCurrency } from '@/lib/format'
import { fuelBundles } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const UNITS = ['bundle', 'case', 'pallet'] as const

/** CROWDER Fuel: the manure fuel line (the full storefront arrives in S5). */
export default function FuelPage() {
  usePageTitle(soilFuelConfig.fuel.brand)
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const { fuel } = soilFuelConfig
  const products = fuel.products.filter((p) => enabled[p.id])

  return (
    <div className="container-page pb-16">
      <PageHeader
        title={fuel.brand}
        description={fuel.tagline}
        actions={
          <Button asChild size="lg">
            <a href={ranchPhoneHref}>
              <Phone aria-hidden />
              Call to order
            </a>
          </Button>
        }
      />
      <p className="mb-6 flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-lg">
        <Flame className="mt-1 size-5 shrink-0 text-warning" aria-hidden />
        {fuel.outdoorNote}
      </p>
      <ul className="grid gap-5 md:grid-cols-2">
        {products.map((p) => (
          <li key={p.id} className="grid content-start gap-4 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="text-2xl font-bold">{p.name}</h2>
              <p className="mt-1 text-lg text-muted-foreground">{p.tagline}</p>
            </div>
            <p>
              <span className="font-semibold">Burn time: </span>
              {p.burnMinutes[0]}–{p.burnMinutes[1]} minutes {p.burnPer}. <span className="font-semibold">Bundle: </span>
              {p.bundleContents}.
            </p>
            <dl className="grid grid-cols-3 gap-2">
              {UNITS.map((u) => (
                <div key={u} className="rounded-lg bg-muted px-3 py-2">
                  <dt className="text-sm text-muted-foreground">{fuel.units[u].label}</dt>
                  <dd className="font-heading text-xl font-bold">{formatCurrency(p.price[u])}</dd>
                  <dd className="text-xs text-muted-foreground">{u === 'bundle' ? 'each' : `${fuelBundles(p, u)} bundles`}</dd>
                </div>
              ))}
            </dl>
            {!soilFuelConfig.estimatesConfirmed && (
              <Badge variant="outline" className="justify-self-start">
                Estimate
              </Badge>
            )}
          </li>
        ))}
      </ul>
      {!products.length && (
        <p className="rounded-2xl border border-dashed bg-card p-6 text-lg">Fuel products are coming soon. Call us to get on the list.</p>
      )}
    </div>
  )
}
