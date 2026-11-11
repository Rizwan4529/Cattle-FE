import { useId } from 'react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { ChartPanel, ChartTable, TooltipBox } from '@/components/dashboard/ChartPanel'
import { Button } from '@/components/ui/button'
import { DIVISION_VARS, divisionColor } from '@/lib/divisionColors'
import { formatCurrency } from '@/lib/format'
import { DIVISIONS, planManure, type RanchDivision, wholeRanch } from '@/lib/manurePlanner'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const money = (v: number) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}`
const monthName = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString('en-US', { month: 'short' })

type Row = { label: string } & Record<RanchDivision, number>

function WholeTooltip({ active, payload }: TooltipContentProps) {
  const r = payload?.[0]?.payload as Row | undefined
  if (!active || !r) return null
  const lines = DIVISIONS.filter((d) => r[d.key] > 0).map((d) => `${d.label}: ${formatCurrency(r[d.key])}`)
  const total = DIVISIONS.reduce((n, d) => n + r[d.key], 0)
  return <TooltipBox title={r.label} lines={[...lines, `Total: ${formatCurrency(total)}`]} />
}

/**
 * The top of the owner dashboard: a year of sales across every part of the
 * ranch (Beef, Ranch Goods, Soil, Fuel, Live cattle), with and without the
 * planner's Soil & Fuel numbers.
 */
export function WholeRanchCard({ className }: { className?: string }) {
  const id = useId()
  const orders = useRanchStore((s) => s.orders)
  const settings = useRanchStore((s) => s.plannerSettings)
  const w = wholeRanch(orders, planManure(settings))
  const zero = { beef: 0, goods: 0, soil: 0, fuel: 0, live: 0 }
  const rows: Row[] = [
    { label: 'Today', ...w.annual, soil: 0, fuel: 0 },
    { label: 'With Soil & Fuel', ...zero, ...w.annual },
  ]
  const today = w.total - w.addedBySoilFuel
  const lift = today > 0 ? Math.round((w.addedBySoilFuel / today) * 100) : 0
  const basis = w.basis.length ? `${monthName(w.basis[0])}–${monthName(w.basis.at(-1)!)}` : 'recent months'

  return (
    <div className={cn(DIVISION_VARS, className)}>
      <ChartPanel
        id={`${id}-whole`}
        title="Whole ranch, a year ahead"
        summary={
          <>
            About <strong className="text-foreground">{formatCurrency(w.total)}</strong> in sales a year across everything the ranch sells. Soil and
            Fuel add {formatCurrency(w.addedBySoilFuel)} ({lift}% more), netting {formatCurrency(w.soilFuelNet)} after their costs.
          </>
        }
        chart={
          <div className="grid gap-4">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Sales a year by part of the ranch">
              {DIVISIONS.map((d) => (
                <li key={d.key} className="min-w-0">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: divisionColor(d.key) }} />
                    {d.label}
                  </span>
                  <span className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(w.annual[d.key])}</span>
                </li>
              ))}
            </ul>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barCategoryGap="28%">
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis
                    type="number"
                    tickFormatter={money}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={92}
                    tick={{ fill: 'var(--foreground)', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={WholeTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
                  {DIVISIONS.map((d, i) => (
                    <Bar
                      key={d.key}
                      dataKey={d.key}
                      name={d.label}
                      stackId="all"
                      fill={divisionColor(d.key)}
                      stroke="var(--card)"
                      strokeWidth={2}
                      radius={i === DIVISIONS.length - 1 ? [0, 4, 4, 0] : 0}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Beef and Ranch Goods: {basis} average × 12. Live cattle: the last 12 months. Soil and Fuel: your manure planner’s first year
                (placeholder numbers until you confirm them).
              </p>
              <Button asChild variant="outline" className="shrink-0">
                <Link to="/dashboard/manure-planner">Open the manure planner</Link>
              </Button>
            </div>
          </div>
        }
        table={
          <ChartTable
            caption="Sales a year by part of the ranch, today and with Soil & Fuel"
            columns={['Part of the ranch', 'Today', 'With Soil & Fuel']}
            rows={[
              ...DIVISIONS.map((d) => [d.label, formatCurrency(rows[0][d.key]), formatCurrency(rows[1][d.key])]),
              ['Total', formatCurrency(today), formatCurrency(w.total)],
            ]}
          />
        }
      />
    </div>
  )
}
