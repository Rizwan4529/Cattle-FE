import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlySales } from '@/data/market'
import type { ClassRow, WeightBin } from '@/lib/dashboard'
import { formatCurrency, formatNumber } from '@/lib/format'
import { ChartPanel, ChartTable, TooltipBox } from './ChartPanel'

/*
 * The three overview charts. Each is a single series in the brand's first
 * chart color, so none needs a legend; the panel title names what's drawn.
 * Bars start at zero, are at most 24px thick, and carry direct labels.
 */

const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 14 }
const monthLabel = (m: string, style: 'short' | 'long' = 'short') =>
  new Date(`${m}-15T12:00:00`).toLocaleDateString('en-US', style === 'short' ? { month: 'short' } : { month: 'long', year: 'numeric' })
const compactDollars = (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)

function ClassTooltip({ active, payload }: TooltipContentProps) {
  const r = payload?.[0]?.payload as ClassRow | undefined
  if (!active || !r) return null
  return <TooltipBox title={r.label} lines={[`${r.head} head on the ranch`, `${r.listed} listed for sale`]} />
}
function SalesTooltip({ active, payload }: TooltipContentProps) {
  const m = payload?.[0]?.payload as MonthlySales | undefined
  if (!active || !m) return null
  return <TooltipBox title={monthLabel(m.month, 'long')} lines={[formatCurrency(m.revenue), `${m.head} head sold`]} />
}
function BinTooltip({ active, payload }: TooltipContentProps) {
  const b = payload?.[0]?.payload as WeightBin | undefined
  if (!active || !b) return null
  return <TooltipBox title={`${b.label} lb`} lines={[`${b.head} head`]} />
}

/** Head on the ranch by class, as horizontal bars with the count at the end. */
export function InventoryByClassChart({ rows }: { rows: ClassRow[] }) {
  const total = rows.reduce((n, r) => n + r.head, 0)
  const top = [...rows].sort((a, b) => b.head - a.head)[0]
  const height = rows.length * 52 + 16

  return (
    <ChartPanel
      id="chart-class"
      title="Inventory by class"
      summary={total ? `${total} head on the ranch. ${top.label} make up the most, at ${top.head}.` : 'No cattle on the ranch.'}
      chart={
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 84, bottom: 0, left: 0 }}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis
                type="category"
                dataKey="label"
                width={112}
                tick={{ ...AXIS_TICK, fill: 'var(--foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={ClassTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
              <Bar dataKey="head" fill="var(--chart-1)" barSize={22} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList
                  dataKey="head"
                  position="right"
                  offset={10}
                  fill="var(--foreground)"
                  fontSize={15}
                  fontWeight={600}
                  formatter={(v) => `${v} head`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <ChartTable
          caption="Head on the ranch by class"
          columns={['Class', 'On the ranch', 'Listed for sale']}
          rows={rows.map((r) => [r.label, r.head, r.listed])}
        />
      }
    />
  )
}

/** Monthly revenue over the last 12 months. */
export function SalesChart({ months, className }: { months: MonthlySales[]; className?: string }) {
  const total = months.reduce((n, m) => n + m.revenue, 0)
  const best = [...months].sort((a, b) => b.revenue - a.revenue)[0]
  const lastIndex = months.length - 1
  const max = Math.max(...months.map((m) => m.revenue))
  const step = max > 60_000 ? 20_000 : 10_000
  const yMax = Math.ceil((max * 1.12) / step) * step
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step)

  return (
    <ChartPanel
      id="chart-sales"
      title="Sales over time"
      className={className}
      summary={`${formatCurrency(total)} over the last 12 months. Best month was ${monthLabel(best.month, 'long')}. Months before this website are sample figures; anything sold here is added to this month.`}
      chart={
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={months} margin={{ top: 28, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickFormatter={(m: string) => monthLabel(m)}
                tick={AXIS_TICK}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis domain={[0, yMax]} ticks={ticks} tickFormatter={compactDollars} tick={AXIS_TICK} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={SalesTooltip} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                isAnimationActive={false}
                dot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
              >
                <LabelList
                  dataKey="revenue"
                  content={({ x, y, value, index }) =>
                    index === lastIndex ? (
                      <text x={Number(x) - 10} y={Number(y) + 26} textAnchor="end" fill="var(--foreground)" fontSize={15} fontWeight={700}>
                        {formatCurrency(Number(value))} so far
                      </text>
                    ) : null
                  }
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <ChartTable
          caption="Monthly sales"
          columns={['Month', 'Head sold', 'Revenue']}
          rows={months.map((m) => [monthLabel(m.month, 'long'), m.head, formatCurrency(m.revenue)])}
        />
      }
    />
  )
}

/** How many head fall in each 200 lb weight range. */
export function WeightDistributionChart({ bins }: { bins: WeightBin[] }) {
  const busiest = [...bins].sort((a, b) => b.head - a.head)[0]

  return (
    <ChartPanel
      id="chart-weights"
      title="Herd weight distribution"
      summary={
        busiest
          ? `Most of the herd weighs ${busiest.label} lb (${busiest.head} head). Calves on the left, grown cattle on the right.`
          : 'No weights yet.'
      }
      chart={
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bins} margin={{ top: 24, right: 8, bottom: 20, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="from"
                tickFormatter={(v: number) => formatNumber(v)}
                tick={AXIS_TICK}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                label={{
                  value: 'Weight (lb), start of each 200 lb range',
                  position: 'insideBottom',
                  offset: -14,
                  fill: 'var(--muted-foreground)',
                  fontSize: 13,
                }}
              />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={BinTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
              <Bar dataKey="head" fill="var(--chart-1)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList
                  dataKey="head"
                  position="top"
                  offset={6}
                  fill="var(--foreground)"
                  fontSize={14}
                  fontWeight={600}
                  formatter={(v) => (Number(v) ? v : '')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={<ChartTable caption="Head by weight range" columns={['Weight range', 'Head']} rows={bins.map((b) => [`${b.label} lb`, b.head])} />}
    />
  )
}
