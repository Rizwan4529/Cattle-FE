import { ScanLine, Send, UserRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { CsvImport } from '@/components/dashboard/CsvImport'
import { DashboardSettings } from '@/components/dashboard/DashboardSettings'
import { HerdTable } from '@/components/dashboard/HerdTable'
import { LotsOverview } from '@/components/dashboard/LotsOverview'
import { OffersInbox } from '@/components/dashboard/OffersInbox'
import { InventoryByClassChart, SalesChart, WeightDistributionChart } from '@/components/dashboard/OverviewCharts'
import { OverviewStats } from '@/components/dashboard/OverviewStats'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ranch } from '@/config/ranch'
import { classBreakdown, getOverview, indexLots, isOpenOffer, salesSeries, weightBins } from '@/lib/dashboard'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'herd', label: 'Herd' },
  { value: 'lots', label: 'Lots' },
  { value: 'offers', label: 'Offers' },
  { value: 'import', label: 'Import' },
  { value: 'settings', label: 'Settings' },
] as const
type Tab = (typeof TABS)[number]['value']

const isTab = (v: string | null): v is Tab => TABS.some((t) => t.value === v)

export default function DashboardPage() {
  usePageTitle('Owner dashboard')
  const [params, setParams] = useSearchParams()
  const tab: Tab = isTab(params.get('tab')) ? (params.get('tab') as Tab) : 'overview'
  const setTab = (next: Tab) => {
    setParams(next === 'overview' ? {} : { tab: next }, { replace: true, preventScrollReset: true })
  }

  const animals = useRanchStore((s) => s.animals)
  const lots = useRanchStore((s) => s.lots)
  const offers = useRanchStore((s) => s.offers)
  const orders = useRanchStore((s) => s.orders)

  const index = indexLots(lots)
  const sales = salesSeries(offers, orders, lots, animals)
  const overview = getOverview(animals, lots, offers, sales)
  const openOffers = offers.filter(isOpenOffer).length
  const showOffers = () => {
    setTab('offers')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container-page pb-16">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            Owner dashboard
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 font-sans text-base font-medium">
              <UserRound className="size-4 text-primary" aria-hidden />
              Logged in as Owner
            </span>
          </span>
        }
        description={`${ranch.owner}, ${ranch.name}. Your herd, lots, offers, and sales in one place.`}
        actions={
          <>
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
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-8">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-13! w-full min-w-max justify-start sm:w-fit">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="h-full min-w-24 px-4 text-base text-foreground/85 dark:text-foreground/85">
                {t.label}
                {t.value === 'offers' && openOffers > 0 && (
                  <span className="ml-0.5 grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-sm font-semibold text-primary-foreground tabular-nums">
                    <span className="sr-only">, </span>
                    {openOffers}
                    <span className="sr-only"> open</span>
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="grid gap-10 text-base">
          <OverviewStats overview={overview} onOpenOffers={showOffers} />
          <div className="grid gap-6 xl:grid-cols-2">
            <SalesChart months={sales} className="xl:col-span-2" />
            <InventoryByClassChart rows={classBreakdown(animals, index)} />
            <WeightDistributionChart bins={weightBins(animals, index)} />
          </div>
        </TabsContent>

        <TabsContent value="lots" className="text-base">
          <LotsOverview onOpenOffers={showOffers} />
        </TabsContent>

        <TabsContent value="import" className="text-base">
          <CsvImport onShowHerd={() => setTab('herd')} />
        </TabsContent>

        <TabsContent value="herd" className="text-base">
          <HerdTable />
        </TabsContent>

        <TabsContent value="offers" className="text-base">
          <OffersInbox />
        </TabsContent>

        <TabsContent value="settings" className="text-base">
          <DashboardSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
