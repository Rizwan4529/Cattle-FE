import { Phone } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { formatCurrency } from '@/lib/format'
import { soilUnitPrice, unitAmount } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const UNITS = ['bag', 'yard', 'ton', 'truckload'] as const

/** CROWDER Soil: the compost product line (the full storefront arrives in S4). */
export default function SoilPage() {
  usePageTitle(soilFuelConfig.soil.brand)
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const { soil } = soilFuelConfig
  const products = soil.products.filter((p) => enabled[p.id])

  return (
    <div className="container-page pb-16">
      <PageHeader
        title={soil.brand}
        description={`${soil.tagline} Made at ${ranch.name} from our own cattle manure and alfalfa hay, composted, cured, and screened.`}
        actions={
          <Button asChild size="lg">
            <a href={ranchPhoneHref}>
              <Phone aria-hidden />
              Call to order
            </a>
          </Button>
        }
      />
      {!soilFuelConfig.estimatesConfirmed && <p className="mb-6 text-muted-foreground">{soilFuelConfig.placeholderNote}</p>}
      <ul className="grid gap-5 md:grid-cols-2">
        {products.map((p) => (
          <li key={p.id} className="grid content-start gap-4 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="text-2xl font-bold">{p.name}</h2>
              <p className="mt-1 text-lg text-muted-foreground">{p.tagline}</p>
            </div>
            <p>
              <span className="font-semibold">Made of: </span>
              {p.madeOf.join(', ')}.
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {UNITS.map((u) => (
                <div key={u} className="rounded-lg bg-muted px-3 py-2">
                  <dt className="text-sm text-muted-foreground">{soil.units[u].label}</dt>
                  <dd className="font-heading text-xl font-bold">{formatCurrency(soilUnitPrice(p, u))}</dd>
                  <dd className="text-xs text-muted-foreground">
                    {u === 'bag' ? `${p.bagCuFt} cu ft` : u === 'truckload' ? `${unitAmount(p, u).tons} tons` : `${unitAmount(p, u).tons} ton`}
                  </dd>
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
        <p className="rounded-2xl border border-dashed bg-card p-6 text-lg">Soil products are coming soon. Call us to get on the list.</p>
      )}
    </div>
  )
}
