import { useId, useState } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartPanel, ChartTable, TooltipBox } from '@/components/dashboard/ChartPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { byproductsConfig } from '@/config/byproducts'
import type { ByproductPartId, PartSettings } from '@/data/goodsTypes'
import { animalByproductValue, expectedRaw, fullRecoveryRates, herdProjection, isEstimate, valueOfRaw, withSettings } from '@/lib/byproducts'
import { formatCurrency } from '@/lib/format'
import { compareLiveVsBeef, PROFIT_DEFAULTS } from '@/lib/profit'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

/** Beef price used for "sell as beef": the ranch's own (≈ $7.10 per hanging lb). */
const BEEF_PRICE = PROFIT_DEFAULTS.beefPrices.at(-1)!
const TARGETS = [0.5, 0.8, 1] as const

/** Round axis ticks (every $250, $500, $1,000…) that include zero. */
function niceTicks(lo: number, hi: number) {
  const span = Math.max(1, hi - lo)
  const step = [250, 500, 1000, 2000, 5000].find((x) => span / x <= 6) ?? 10000
  const out: number[] = []
  for (let t = Math.floor(lo / step) * step; t <= Math.ceil(hi / step) * step; t += step) out.push(t)
  return out
}

/** "/lb" for "lb tallow", "/bag" for "1 lb bag", "/stick" for "12 in stick". */
const perUnit = (sellUnit: string) => `/${sellUnit.startsWith('lb') ? 'lb' : sellUnit.split(' ').at(-1)}`

const money = (v: number) =>
  `${v < 0 ? '−' : ''}$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(1).replace(/\.0$/, '')}k` : Math.round(Math.abs(v))}`
const signed = (v: number) => `${v < 0 ? '−' : ''}${formatCurrency(Math.abs(v))}`

function EstimateTag({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <Badge variant="outline" className="h-5 border-warning/60 px-1.5 text-xs font-medium text-warning-foreground dark:text-warning">
      Estimate
    </Badge>
  )
}

interface WayRow {
  label: string
  /** Live sale or beef sale net */
  base: number
  /** Ranch Goods net on top (third bar only) */
  goods: number
}

function WaysTooltip({ active, payload }: TooltipContentProps) {
  const r = payload?.[0]?.payload as WayRow | undefined
  if (!active || !r) return null
  const lines = r.goods
    ? [`Beef: ${signed(r.base)}`, `Ranch Goods: +${formatCurrency(r.goods)}`, `Total: ${signed(r.base + r.goods)}`]
    : [`Net: ${signed(r.base)} per head`]
  return <TooltipBox title={r.label} lines={lines} />
}

function ProjectionTooltip({ active, payload }: TooltipContentProps) {
  const m = payload?.[0]?.payload as { label: string; today: number; target: number } | undefined
  if (!active || !m) return null
  return (
    <TooltipBox
      title={`By the end of ${m.label}`}
      lines={[`Today’s recovery: ${formatCurrency(m.today)}`, `At your target: ${formatCurrency(m.target)}`]}
    />
  )
}

/** One byproduct's numbers: yield, price, cost, and how much comes back from the processor. */
function PartCard({ part, settings, onChange }: { part: ByproductPartId; settings: PartSettings; onChange: (patch: Partial<PartSettings>) => void }) {
  const id = useId()
  const all = useRanchStore((s) => s.byproductSettings)
  const base = byproductsConfig.parts.find((p) => p.id === part)!
  const config = withSettings(byproductsConfig, all)
  const info = config.parts.find((p) => p.id === part)!
  const atRate = valueOfRaw(info, expectedRaw(info) * settings.recoveryRate)
  const full = valueOfRaw(info, expectedRaw(info))
  const [raw, setRaw] = useState<Record<string, string>>({})
  const field = (key: 'rawPerAnimal' | 'price' | 'cost', label: string, unit: string, step: number) => (
    <div className="grid content-start gap-1">
      <Label htmlFor={`${id}-${key}`} className="flex flex-wrap items-center gap-1.5 text-sm">
        {label}
        <EstimateTag show={isEstimate(byproductsConfig, all, part, key)} />
      </Label>
      <div className="relative">
        <Input
          id={`${id}-${key}`}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={raw[key] ?? String(settings[key])}
          onChange={(e) => {
            const v = e.target.value
            setRaw((x) => ({ ...x, [key]: v }))
            const n = Number(v)
            if (v !== '' && Number.isFinite(n) && n >= 0) onChange({ [key]: n })
          }}
          onBlur={() => setRaw((x) => ({ ...x, [key]: undefined as unknown as string }))}
          className="h-10 pr-14 tabular-nums"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  )

  return (
    <li className="grid content-start gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{base.name}</h3>
          <p className="text-sm text-muted-foreground">{base.becomes}</p>
        </div>
        <p className="text-right">
          <span className="block font-heading text-xl font-bold tabular-nums">{formatCurrency(atRate.net)}</span>
          <span className="text-xs text-muted-foreground">net per animal</span>
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {field('rawPerAnimal', 'Per animal', base.rawUnit, base.rawUnit === 'lb' ? 1 : 1)}
        {field('price', 'Sells for', perUnit(base.sellUnit), 0.25)}
        {field('cost', 'Cost', perUnit(base.sellUnit), 0.25)}
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            Back from the processor
            <EstimateTag show={isEstimate(byproductsConfig, all, part, 'recoveryRate')} />
          </span>
          <span className="font-semibold tabular-nums">{Math.round(settings.recoveryRate * 100)}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[Math.round(settings.recoveryRate * 100)]}
          onValueChange={([v]) => onChange({ recoveryRate: v / 100 })}
          thumbLabels={[`${base.name}: share you get back from the processor`]}
          getValueText={(v) => `${v} percent`}
        />
        <p className="text-sm text-muted-foreground">
          {settings.recoveryRate >= 1 ? 'You get all of it back.' : `${formatCurrency(full.net - atRate.net)} per animal stays with the processor.`}
          {base.hornedOnly && ' Horned animals only.'}
          {base.malesOnly && ' Steers and bulls only.'}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">{base.basis}</p>
    </li>
  )
}

/** Hidden Revenue: what the byproducts of every animal are worth, and how much the ranch leaves with the processor. */
export default function HiddenRevenuePage() {
  usePageTitle('Hidden revenue')
  const id = useId()
  const settings = useRanchStore((s) => s.byproductSettings)
  const update = useRanchStore((s) => s.updateByproductPart)
  const setHead = useRanchStore((s) => s.setHeadPerYear)
  const reset = useRanchStore((s) => s.resetByproductSettings)
  const [target, setTarget] = useState<(typeof TARGETS)[number]>(0.8)
  const [headText, setHeadText] = useState<string | null>(null)

  const config = withSettings(byproductsConfig, settings)
  const today = animalByproductValue(config)
  const full = animalByproductValue(config, { rates: fullRecoveryRates(config) })
  const profit = compareLiveVsBeef(PROFIT_DEFAULTS)
  const beef = profit.beef.find((b) => b.pricePerLb === BEEF_PRICE) ?? profit.beef.at(-1)!
  const projection = herdProjection(config, settings.headPerYear, target)
  const estimates = !byproductsConfig.estimatesConfirmed && config.parts.some((p) => isEstimate(byproductsConfig, settings, p.id, 'price'))

  const ways: WayRow[] = [
    { label: 'Sell live', base: profit.live.net, goods: 0 },
    { label: `Sell as beef ($${BEEF_PRICE}/lb)`, base: beef.net, goods: 0 },
    { label: 'Beef + Ranch Goods', base: beef.net, goods: Math.round(today.net) },
  ]
  const top = Math.max(...ways.map((w) => w.base + w.goods))
  const bottom = Math.min(0, ...ways.map((w) => w.base))
  const ticks = niceTicks(bottom, top)

  const start = new Date('2026-12-01T12:00:00')
  const monthLabel = (i: number) => new Date(start.getFullYear(), start.getMonth() + i, 15).toLocaleDateString('en-US', { month: 'short' })
  const months = projection.months.map((m, i) => ({ ...m, label: monthLabel(i) }))

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Hidden revenue</h1>
          <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
            What the hide, bones, fat, and the rest of each animal are worth, and how much of it you leave with the processor today.
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw aria-hidden />
          Back to the estimates
        </Button>
      </div>

      {estimates && (
        <p className="flex items-start gap-3 rounded-xl border border-warning/50 bg-warning/10 px-4 py-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
          <span>
            <strong className="font-semibold">These are placeholder estimates, not your numbers yet.</strong> Check yields and prices with your
            processor and tannery, then type in your own below. Anything you change loses its “Estimate” label.
          </span>
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Byproducts per animal, today</dt>
          <dd className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(today.net)}</dd>
          <dd className="text-sm text-muted-foreground">Net, at today’s recovery rates</dd>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">If you got everything back</dt>
          <dd className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(full.net)}</dd>
          <dd className="text-sm text-muted-foreground">
            {formatCurrency(full.gross)} retail less {formatCurrency(full.cost)} to make it sellable
          </dd>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Left with the processor</dt>
          <dd className="font-heading text-3xl font-bold text-destructive tabular-nums">{formatCurrency(full.net - today.net)}</dd>
          <dd className="text-sm text-muted-foreground">Per animal</dd>
        </div>
        <div className="rounded-2xl border-2 border-destructive/40 bg-card p-4">
          <dt className="text-sm text-muted-foreground">Money left on the table each year</dt>
          <dd className="font-heading text-4xl font-bold text-destructive tabular-nums">{formatCurrency(projection.leftOnTable)}</dd>
          <dd className="text-sm text-muted-foreground">At {settings.headPerYear} head harvested a year</dd>
        </div>
      </dl>

      <ChartPanel
        id={`${id}-ways`}
        title="Per animal: three ways to sell"
        summary={
          <>
            Sold live, a steer {profit.live.net < 0 ? 'loses' : 'nets'} {formatCurrency(Math.abs(profit.live.net))}. As beef it nets{' '}
            {signed(beef.net)}. Add what you recover in Ranch Goods today and it’s {signed(beef.net + today.net)}.
          </>
        }
        chart={
          <div className="grid gap-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-3 rounded-sm bg-chart-2" />
                Beef or live sale
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-3 rounded-sm bg-chart-3" />
                Ranch Goods
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-3 rounded-sm bg-chart-1" />
                Loses money (below the line)
              </li>
            </ul>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ways} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--foreground)', fontSize: 14 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[ticks[0], ticks.at(-1)!]}
                    ticks={ticks}
                    tickFormatter={money}
                    width={60}
                  />
                  <ReferenceLine y={0} stroke="var(--foreground)" strokeOpacity={0.5} />
                  <Tooltip content={WaysTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
                  <Bar dataKey="base" stackId="a" barSize={64} isAnimationActive={false} stroke="var(--card)" strokeWidth={2} radius={0}>
                    {ways.map((w) => (
                      <Cell key={w.label} fill={w.base < 0 ? 'var(--chart-1)' : 'var(--chart-2)'} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="goods"
                    stackId="a"
                    barSize={64}
                    fill="var(--chart-3)"
                    stroke="var(--card)"
                    strokeWidth={2}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        }
        table={
          <ChartTable
            caption="Net per head three ways"
            columns={['Sold', 'Beef or live', 'Ranch Goods', 'Net per head']}
            rows={ways.map((w) => [w.label, signed(w.base), w.goods ? formatCurrency(w.goods) : '–', signed(w.base + w.goods)])}
          />
        }
      />
      <p className="-mt-3 text-sm text-muted-foreground">
        Live and beef nets come from the Live vs. beef calculator’s defaults (fed {formatCurrency(PROFIT_DEFAULTS.fedPricePerLb, true)}/lb, beef $
        {BEEF_PRICE}/take-home lb). Ranch Goods are net of tanning, rendering, and packing, at the recovery rates you set below.
      </p>

      <section aria-labelledby={`${id}-parts`} className="grid gap-4">
        <div>
          <h2 id={`${id}-parts`} className="text-2xl font-bold">
            Yield and price, part by part
          </h2>
          <p className="mt-1 text-muted-foreground">
            Slide “Back from the processor” to what you actually get back today. Most processors keep the hide, fat, and organs unless you ask.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {config.parts.map((p) => (
            <PartCard key={p.id} part={p.id} settings={settings.parts[p.id]} onChange={(patch) => update(p.id, patch)} />
          ))}
        </ul>
      </section>

      <ChartPanel
        id={`${id}-herd`}
        title="Across the herd, the next 12 months"
        summary={
          <>
            Recovering {Math.round(target * 100)}% of every part would add {formatCurrency(projection.gain)} a year over what you get back today (
            {formatCurrency(projection.yearToday)} → {formatCurrency(projection.yearTarget)}).
          </>
        }
        chart={
          <div className="grid gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-1">
                <Label htmlFor={`${id}-head`}>Head harvested a year</Label>
                <Input
                  id={`${id}-head`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={headText ?? String(settings.headPerYear)}
                  onChange={(e) => {
                    setHeadText(e.target.value)
                    const n = Number(e.target.value)
                    if (e.target.value !== '' && Number.isFinite(n) && n >= 0) setHead(n)
                  }}
                  onBlur={() => setHeadText(null)}
                  className="h-10 w-28 tabular-nums"
                />
              </div>
              <div className="grid gap-1">
                <span className="text-sm font-medium" id={`${id}-target-label`}>
                  What if you recovered
                </span>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={String(target)}
                  onValueChange={(v) => v && setTarget(Number(v) as (typeof TARGETS)[number])}
                  aria-labelledby={`${id}-target-label`}
                >
                  {TARGETS.map((t) => (
                    <ToggleGroupItem key={t} value={String(t)} className="h-10 px-4">
                      {Math.round(t * 100)}%
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-0.5 w-5 bg-chart-3" />
                At {Math.round(target * 100)}% recovery
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-0.5 w-5 border-t-2 border-dashed border-muted-foreground" />
                Today’s recovery
              </li>
            </ul>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={months} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--foreground)', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={money}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={ProjectionTooltip} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4' }} />
                  <Line
                    type="monotone"
                    dataKey="today"
                    stroke="var(--muted-foreground)"
                    strokeWidth={2}
                    strokeDasharray="6 5"
                    dot={false}
                    activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="var(--chart-3)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        }
        table={
          <ChartTable
            caption="Cumulative byproduct net over the next 12 months"
            columns={['Month', 'Today’s recovery', `At ${Math.round(target * 100)}%`]}
            rows={months.map((m) => [m.label, formatCurrency(m.today), formatCurrency(m.target)])}
          />
        }
      />
    </div>
  )
}
