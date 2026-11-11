import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { ChartPanel, ChartTable, TooltipBox } from '@/components/dashboard/ChartPanel'
import { cutLabel } from '@/data/shop'
import type { CutId } from '@/data/beefTypes'
import { CHANNELS, type ChannelMonth, poolFillSpeed, revenueByChannel, topCuts } from '@/lib/beefAnalytics'
import { formatCurrency } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

/*
 * Seven channels need seven distinct colors. The brand's chart colors are too
 * close for that, so this chart has its own set, checked with the dataviz
 * palette validator for light and dark surfaces in CHANNELS order (every
 * neighbor passes color-blind separation). Soil, Fuel, Ranch Goods, and Live
 * cattle match the Whole Ranch card. Segments are separated by a 2px gap,
 * there's a legend, and the table view has every number.
 */
const PALETTE =
  '[--ch-shares:#A23B2A] [--ch-cuts:#3A6EA5] [--ch-subscriptions:#D08C1A] [--ch-goods:#7A5BA8] [--ch-live:#3F8F5A] [--ch-fuel:#9E3C9E] [--ch-soil:#A65A1B] dark:[--ch-shares:#C24E36] dark:[--ch-cuts:#3F7FC4] dark:[--ch-subscriptions:#B88418] dark:[--ch-goods:#8F72C4] dark:[--ch-live:#3E9A60] dark:[--ch-fuel:#B556B5] dark:[--ch-soil:#C06A28]'
const color = (key: string) => `var(--ch-${key})`

const monthShort = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString('en-US', { month: 'short' })
const monthLong = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const compact = (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)

function ChannelTooltip({ active, payload }: TooltipContentProps) {
  const m = payload?.[0]?.payload as ChannelMonth | undefined
  if (!active || !m) return null
  const total = CHANNELS.reduce((n, c) => n + m[c.key], 0)
  return (
    <TooltipBox
      title={monthLong(m.month)}
      lines={[...CHANNELS.map((c) => `${c.label}: ${formatCurrency(m[c.key])}`), `Total: ${formatCurrency(total)}`]}
    />
  )
}

export default function BeefAnalyticsPage() {
  usePageTitle('Sales by channel')
  const orders = useRanchStore((s) => s.orders)
  const products = useRanchStore((s) => s.products)
  const pools = useRanchStore((s) => s.pools)
  const months = revenueByChannel(orders)
  const totals = CHANNELS.map((c) => ({ ...c, value: months.reduce((n, m) => n + m[c.key], 0) }))
  const beefTotal = totals.filter((t) => !['live', 'soil', 'fuel'].includes(t.key)).reduce((n, t) => n + t.value, 0)
  const soilFuelTotal = totals.filter((t) => t.key === 'soil' || t.key === 'fuel').reduce((n, t) => n + t.value, 0)
  const cuts = topCuts(orders, products).slice(0, 8)
  const maxCut = cuts[0]?.packs ?? 1
  const fill = poolFillSpeed(pools)
  const maxDays = Math.max(...fill.pools.map((p) => p.days), 1)

  return (
    <div className={`grid gap-6 ${PALETTE}`}>
      <div>
        <h1 className="text-4xl font-bold">Sales by channel</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          Since June: {formatCurrency(beefTotal)} from beef shares, the Butcher Shop, the Ranch Box, and Ranch Goods, and{' '}
          {formatCurrency(soilFuelTotal)} from CROWDER Soil and Fuel. Sample data, plus orders placed on this site.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {totals.map((t) => (
          <div key={t.key} className="rounded-2xl border bg-card p-4">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="size-3 rounded-sm" style={{ background: color(t.key) }} />
              {t.label}
            </dt>
            <dd className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(t.value)}</dd>
            <dd className="text-sm text-muted-foreground">June to now</dd>
          </div>
        ))}
      </dl>

      <ChartPanel
        id="chart-channels"
        title="Revenue by channel"
        summary={`Beef shares are the biggest beef channel. Beef now brings in ${Math.round(
          (beefTotal /
            Math.max(
              1,
              totals.reduce((n, t) => n + t.value, 0),
            )) *
            100,
        )}% of sales since June; Soil and Fuel ${Math.round(
          (soilFuelTotal /
            Math.max(
              1,
              totals.reduce((n, t) => n + t.value, 0),
            )) *
            100,
        )}%.`}
        chart={
          <div className="grid gap-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
              {CHANNELS.map((c) => (
                <li key={c.key} className="flex items-center gap-2">
                  <span aria-hidden className="size-3 rounded-sm" style={{ background: color(c.key) }} />
                  {c.label}
                </li>
              ))}
            </ul>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={monthShort}
                    tick={{ fill: 'var(--foreground)', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={compact}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip content={ChannelTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
                  {CHANNELS.map((c, i) => (
                    <Bar
                      key={c.key}
                      dataKey={c.key}
                      stackId="rev"
                      fill={color(c.key)}
                      stroke="var(--card)"
                      strokeWidth={2}
                      barSize={36}
                      radius={i === CHANNELS.length - 1 ? [4, 4, 0, 0] : 0}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        }
        table={
          <ChartTable
            caption="Revenue by channel and month"
            columns={['Month', ...CHANNELS.map((c) => c.label)]}
            rows={months.map((m) => [monthLong(m.month), ...CHANNELS.map((c) => formatCurrency(m[c.key]))])}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="top-cuts" className="grid content-start gap-4 rounded-2xl border bg-card p-5 sm:p-6">
          <div>
            <h2 id="top-cuts" className="text-2xl font-bold">
              Top cuts
            </h2>
            <p className="mt-1 text-muted-foreground">Packs sold in the Butcher Shop since June.</p>
          </div>
          <ol className="grid gap-3">
            {cuts.map((c, i) => (
              <li key={c.cut} className="grid grid-cols-[1.5rem_8rem_minmax(0,1fr)_4rem] items-center gap-3">
                <span className="text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="truncate font-medium">{cutLabel(c.cut as CutId)}</span>
                <span className="h-3 rounded-full bg-muted" aria-hidden>
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(c.packs / maxCut) * 100}%` }} />
                </span>
                <span className="text-right font-semibold tabular-nums">{c.packs}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="fill-speed" className="grid content-start gap-4 rounded-2xl border bg-card p-5 sm:p-6">
          <div>
            <h2 id="fill-speed" className="text-2xl font-bold">
              How fast pools fill
            </h2>
            <p className="mt-1 text-muted-foreground">
              Days from opening to the last share claimed. Average: <strong className="font-semibold text-foreground">{fill.avg} days</strong>.
            </p>
          </div>
          <ul className="grid gap-3">
            {fill.pools.map((p) => (
              <li
                key={p.tagId}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm sm:grid-cols-[6rem_8rem_minmax(0,1fr)_4.5rem] sm:text-base"
              >
                <span className="font-semibold">{p.tagId}</span>
                <span className="hidden truncate text-muted-foreground sm:block">{p.program}</span>
                <span className="h-3 rounded-full bg-muted" aria-hidden>
                  <span className="block h-full rounded-full bg-chart-2" style={{ width: `${(p.days / maxDays) * 100}%` }} />
                </span>
                <span className="text-right font-semibold tabular-nums">{p.days} days</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
