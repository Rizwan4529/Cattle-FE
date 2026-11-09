import { ScanLine, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { InventoryByClassChart, SalesChart, WeightDistributionChart } from '@/components/dashboard/OverviewCharts'
import { OverviewStats } from '@/components/dashboard/OverviewStats'
import { Button } from '@/components/ui/button'
import { ranch } from '@/config/ranch'
import { classBreakdown, getOverview, indexLots, salesSeries, weightBins } from '@/lib/dashboard'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

export default function OverviewPage() {
  usePageTitle('Owner dashboard')
  const navigate = useNavigate()
  const animals = useRanchStore((s) => s.animals)
  const lots = useRanchStore((s) => s.lots)
  const offers = useRanchStore((s) => s.offers)
  const orders = useRanchStore((s) => s.orders)

  const index = indexLots(lots)
  const sales = salesSeries(offers, orders, lots, animals)
  const overview = getOverview(animals, lots, offers, sales)

  return (
    <div className="grid gap-10 text-base">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold">Overview</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {ranch.owner}, {ranch.name}. Your herd, lots, offers, and sales in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/scan">
              <ScanLine aria-hidden />
              Run a chute scan
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/syndicate">
              <Send aria-hidden />
              Send to auction partners
            </Link>
          </Button>
        </div>
      </div>
      <OverviewStats overview={overview} onOpenOffers={() => navigate('/dashboard/offers')} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SalesChart months={sales} className="xl:col-span-2" />
        <InventoryByClassChart rows={classBreakdown(animals, index)} />
        <WeightDistributionChart bins={weightBins(animals, index)} />
      </div>
    </div>
  )
}
