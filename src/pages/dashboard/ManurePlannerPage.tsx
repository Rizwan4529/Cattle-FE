import { type ReactNode, useId, useState } from 'react'
import { Flame, Leaf, RotateCcw, Shovel, TriangleAlert } from 'lucide-react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { ChartPanel, ChartTable, TooltipBox } from '@/components/dashboard/ChartPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { plannerDefaults, plannerNote } from '@/config/manurePlanner'
import { soilFuelConfig } from '@/config/soilFuel'
import type { PlannerSettings } from '@/data/soilFuelTypes'
import { DIVISION_VARS, divisionColor } from '@/lib/divisionColors'
import { formatCurrency, formatNumber } from '@/lib/format'
import { allocation, type CostLines, planManure, type PlannerMonth } from '@/lib/manurePlanner'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const signed = (v: number) => `${v < 0 ? '−' : ''}${formatCurrency(Math.abs(Math.round(v)))}`
const money = (v: number) =>
  `${v < 0 ? '−' : ''}$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(1).replace(/\.0$/, '')}k` : Math.round(Math.abs(v))}`
const tons = (v: number) => `${formatNumber(Math.round(v))} tons`
const years = (v: number | null) => (v === null ? 'Doesn’t pay back' : v === 0 ? 'Nothing to buy' : `${v} ${v === 1 ? 'year' : 'years'}`)

/** Dotted path into the settings, e.g. "equipment.press" */
type Path =
  | Exclude<keyof PlannerSettings, 'compostMix' | 'compostPrice' | 'equipment' | 'seasonal'>
  | `compostMix.${keyof PlannerSettings['compostMix']}`
  | `compostPrice.${keyof PlannerSettings['compostPrice']}`
  | `equipment.${keyof PlannerSettings['equipment']}`

const read = (s: PlannerSettings, path: Path): number => {
  const [a, b] = path.split('.') as [keyof PlannerSettings, string?]
  return b ? (s[a] as unknown as Record<string, number>)[b] : (s[a] as number)
}
const patchFor = (s: PlannerSettings, path: Path, value: number): Partial<PlannerSettings> => {
  const [a, b] = path.split('.') as [keyof PlannerSettings, string?]
  return b ? { [a]: { ...(s[a] as object), [b]: value } } : { [a]: value }
}

function EstimateTag({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <Badge variant="outline" className="h-5 border-warning/60 px-1.5 text-xs font-medium text-warning-foreground dark:text-warning">
      Estimate
    </Badge>
  )
}

/** A number input bound to one planner setting. Percent fields show 0–100 and store 0–1. */
function Field({
  path,
  label,
  unit,
  step = 1,
  percent = false,
  max,
}: {
  path: Path
  label: string
  unit: string
  step?: number
  percent?: boolean
  max?: number
}) {
  const id = useId()
  const settings = useRanchStore((s) => s.plannerSettings)
  const update = useRanchStore((s) => s.updatePlanner)
  const [text, setText] = useState<string | null>(null)
  const value = read(settings, path)
  const shown = percent ? Math.round(value * 1000) / 10 : value
  const isDefault = value === read(plannerDefaults, path)
  return (
    <div className="grid content-end gap-1">
      <Label htmlFor={id} className="flex flex-wrap items-center gap-1.5 text-sm">
        {label}
        <EstimateTag show={isDefault && !soilFuelConfig.estimatesConfirmed} />
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={percent ? 100 : max}
          step={step}
          value={text ?? String(shown)}
          onChange={(e) => {
            setText(e.target.value)
            const n = Number(e.target.value)
            if (e.target.value === '' || !Number.isFinite(n) || n < 0) return
            const capped = percent ? Math.min(100, n) / 100 : max !== undefined ? Math.min(max, n) : n
            update(patchFor(settings, path, capped))
          }}
          onBlur={() => setText(null)}
          className="h-11 pr-16 tabular-nums"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{percent ? '%' : unit}</span>
      </div>
    </div>
  )
}

function InputGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="grid gap-4 rounded-2xl border bg-card p-5">
      <div>
        <h3 id={id} className="text-xl font-bold">
          {title}
        </h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">{children}</div>
    </section>
  )
}

function MonthTooltip({ active, payload }: TooltipContentProps) {
  const m = payload?.[0]?.payload as (PlannerMonth & { label: string }) | undefined
  if (!active || !m) return null
  return (
    <TooltipBox
      title={m.label}
      lines={[
        `Compost sales: ${formatCurrency(m.compost)}`,
        `Fuel sales: ${formatCurrency(m.fuel)}`,
        `Costs: ${formatCurrency(m.costs)}`,
        `Net: ${signed(m.net)}`,
      ]}
    />
  )
}

/** The two-thumb split of collected manure: compost | fuel | left on pasture. */
function AllocationSlider() {
  const id = useId()
  const settings = useRanchStore((s) => s.plannerSettings)
  const update = useRanchStore((s) => s.updatePlanner)
  const a = allocation(settings)
  const c = Math.round(a.compost * 100)
  const f = Math.round(a.fuel * 100)
  const p = 100 - c - f
  const r = planManure(settings)
  const parts = [
    { key: 'soil' as const, label: 'Compost', pct: c, tons: r.manure.toCompost, icon: Shovel },
    { key: 'fuel' as const, label: 'Fuel logs', pct: f, tons: r.manure.toFuel, icon: Flame },
    { key: 'pasture' as const, label: 'Left on pasture', pct: p, tons: r.manure.collected * a.pasture, icon: Leaf },
  ]
  return (
    <section aria-labelledby={id} className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6">
      <div>
        <h2 id={id} className="text-2xl font-bold">
          Where the collected manure goes
        </h2>
        <p className="mt-1 text-muted-foreground">
          Drag the two handles: compost on the left, fuel logs in the middle, and whatever’s left stays on the pasture as fertilizer. Of{' '}
          {tons(r.manure.produced)} a year, you collect {tons(r.manure.collected)}.
        </p>
      </div>
      <div className="relative py-3">
        <div aria-hidden className="absolute inset-x-0 top-1/2 flex h-4 -translate-y-1/2 overflow-hidden rounded-full">
          <span style={{ width: `${c}%`, background: divisionColor('soil') }} />
          <span style={{ width: `${f}%`, background: divisionColor('fuel') }} className="border-l-2 border-card" />
          <span style={{ width: `${p}%` }} className="border-l-2 border-card bg-muted" />
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          minStepsBetweenThumbs={0}
          value={[c, c + f]}
          onValueChange={([x, y]) => update({ toCompost: x / 100, toFuel: (y - x) / 100 })}
          thumbLabels={['Compost share', 'Fuel share (the pasture keeps the rest)']}
          getValueText={(v, i) => (i === 0 ? `${v} percent to compost` : `${v - c} percent to fuel logs, ${100 - v} percent left on pasture`)}
          className="relative [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-track]]:bg-transparent"
        />
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {parts.map(({ key, label, pct, tons: t, icon: Icon }) => (
          <li key={key} className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2">
            <span
              aria-hidden
              className={cn('size-3 shrink-0 rounded-sm', key === 'pasture' && 'border border-foreground/30 bg-muted')}
              style={key === 'pasture' ? undefined : { background: divisionColor(key) }}
            />
            <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block font-semibold">
                {label}: {pct}%
              </span>
              <span className="text-sm text-muted-foreground">{tons(t)} a year</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const COST_ROWS: { key: keyof CostLines; label: string }[] = [
  { key: 'hay', label: 'Alfalfa and hay' },
  { key: 'labor', label: 'Labor' },
  { key: 'equipment', label: 'Equipment (per year)' },
  { key: 'packaging', label: 'Bags and packaging' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'space', label: 'Drying and curing space' },
]

/** Manure Revenue Planner: what the herd's manure could earn as compost and fuel logs. */
export default function ManurePlannerPage() {
  usePageTitle('Manure revenue planner')
  const id = useId()
  const settings = useRanchStore((s) => s.plannerSettings)
  const update = useRanchStore((s) => s.updatePlanner)
  const reset = useRanchStore((s) => s.resetPlanner)
  const r = planManure(settings)
  const { compost, fuel, total } = r

  const better = compost.perManureTon >= fuel.perManureTon ? 'compost' : 'fuel'
  const gap = Math.abs(compost.perManureTon - fuel.perManureTon)
  const months = r.months.map((m) => ({ ...m, label: MONTHS[m.month] }))

  const units = [
    ['Compost by the bag', `${formatNumber(compost.bags)} bags`],
    ['Compost by the yard', `${formatNumber(compost.yards)} cubic yards`],
    ['Compost by the ton', `${formatNumber(compost.tonsSold)} tons`],
    ['Fuel bundles pressed', `${formatNumber(fuel.bundles)} bundles`],
  ]

  return (
    <div className={cn('grid gap-6', DIVISION_VARS)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Manure revenue planner</h1>
          <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
            What your herd’s manure could earn as {soilFuelConfig.soil.brand} compost and {soilFuelConfig.fuel.brand} logs, after hay, labor,
            equipment, and packaging. Change any number; everything below updates as you type.
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw aria-hidden />
          Back to the defaults
        </Button>
      </div>

      <p className="flex items-start gap-3 rounded-xl border border-warning/50 bg-warning/10 px-4 py-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
        <span>
          <strong className="font-semibold">{plannerNote}</strong> Manure per head, collection rate, prices, and costs are rough starting figures.
          Fields still on the starting figure are marked “Estimate”.
        </span>
      </p>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Manure collected a year</dt>
          <dd className="font-heading text-3xl font-bold tabular-nums">{tons(r.manure.collected)}</dd>
          <dd className="text-sm text-muted-foreground">
            {Math.round(settings.collectionRate * 100)}% of {tons(r.manure.produced)} from {formatNumber(settings.headCount)} head
          </dd>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Sales a year</dt>
          <dd className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(Math.round(total.revenue))}</dd>
          <dd className="text-sm text-muted-foreground">Less {formatCurrency(Math.round(total.costs))} in costs</dd>
        </div>
        <div className={cn('rounded-2xl border-2 bg-card p-4', total.net >= 0 ? 'border-success/50' : 'border-destructive/50')}>
          <dt className="text-sm text-muted-foreground">Net profit a year</dt>
          <dd className={cn('font-heading text-4xl font-bold tabular-nums', total.net < 0 && 'text-destructive')}>{signed(total.net)}</dd>
          <dd className="text-sm text-muted-foreground">
            Compost {signed(compost.net)}, fuel {signed(fuel.net)}
          </dd>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Equipment pays for itself in</dt>
          <dd className="font-heading text-3xl font-bold tabular-nums">{years(total.paybackYears)}</dd>
          <dd className="text-sm text-muted-foreground">{formatCurrency(total.equipmentCost)} up front</dd>
        </div>
      </dl>

      <section aria-labelledby={`${id}-per-ton`} className="grid gap-4 rounded-2xl border-2 border-primary/30 bg-card p-5 sm:p-6">
        <div>
          <h2 id={`${id}-per-ton`} className="text-2xl font-bold sm:text-3xl">
            What one ton of manure earns
          </h2>
          <p className="mt-1 text-lg">
            {compost.manureTons > 0 && fuel.manureTons > 0 ? (
              <>
                Right now a ton earns <strong>{formatCurrency(Math.round(gap))} more</strong> as {better === 'fuel' ? 'fuel logs' : 'compost'}.{' '}
                {better === 'fuel'
                  ? fuel.unsold > 0
                    ? `But you’d press ${formatNumber(fuel.unsold)} more bundles than the market takes, so sending more manure to fuel only adds labor.`
                    : `Fuel’s market is small, though: about ${formatNumber(settings.fuelMaxBundles)} bundles a year. Compost sells by the truckload.`
                  : 'Compost also sells in volume, by the yard and the truckload.'}
              </>
            ) : (
              'Send some manure to both to compare them.'
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { key: 'soil' as const, title: 'As compost', d: compost, icon: Shovel, extra: `${tons(compost.finishedTons)} finished compost` },
            {
              key: 'fuel' as const,
              title: 'As fuel logs',
              d: fuel,
              icon: Flame,
              extra: `${formatNumber(fuel.sold)} of ${formatNumber(fuel.bundles)} bundles sold`,
            },
          ].map(({ key, title, d, icon: Icon, extra }) => (
            <div
              key={key}
              className={cn(
                'grid content-start gap-2 rounded-xl border bg-background/60 p-4',
                d.manureTons > 0 && better === key && 'ring-2 ring-success',
              )}
            >
              <p className="flex items-center gap-2 font-semibold">
                <span aria-hidden className="size-3 rounded-sm" style={{ background: divisionColor(key) }} />
                <Icon className="size-5 text-muted-foreground" aria-hidden />
                {title}
                {d.manureTons > 0 && better === key && <Badge className="ml-auto bg-success text-success-foreground">Earns more per ton</Badge>}
              </p>
              <p className="font-heading text-5xl font-bold tabular-nums">{d.manureTons > 0 ? signed(d.perManureTon) : '–'}</p>
              <p className="text-muted-foreground">per ton of manure, after costs</p>
              <p className="text-sm">
                {tons(d.manureTons)} in. {extra}. Sales {formatCurrency(Math.round(d.revenue))}, net {signed(d.net)}. Payback{' '}
                {years(d.paybackYears).toLowerCase()}.
              </p>
            </div>
          ))}
          <div className="grid content-start gap-2 rounded-xl border border-dashed p-4">
            <p className="flex items-center gap-2 font-semibold">
              <Leaf className="size-5 text-muted-foreground" aria-hidden />
              Left on pasture
            </p>
            <p className="font-heading text-5xl font-bold tabular-nums">$0</p>
            <p className="text-muted-foreground">sold, but not wasted</p>
            <p className="text-sm">{tons(r.manure.toPasture)} a year (including what can’t be collected) feeds the grass the cattle eat next year.</p>
          </div>
        </div>
      </section>

      <AllocationSlider />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold">Your numbers</h2>
          <InputGroup title="Herd and manure" description="Wet manure, before any drying.">
            <Field path="headCount" label="Head on the ranch" unit="head" />
            <Field path="lbPerHeadDay" label="Manure per head a day" unit="lb" />
            <Field path="collectionRate" label="Can be collected" unit="" percent />
            <Field path="hayPerTon" label="Hay mixed in per ton" unit="tons" step={0.01} />
            <Field path="hayCostPerTon" label="Alfalfa/hay cost" unit="$/ton" step={5} />
          </InputGroup>
          <InputGroup title="Compost" description="Weight lost while composting, what sells how, and prices.">
            <Field path="compostLoss" label="Weight lost composting" unit="" percent />
            <Field path="compostLbPerYard" label="Weight of a yard" unit="lb" step={50} />
            <Field path="compostBagLb" label="Weight of a bag" unit="lb" />
            <Field path="compostMix.bag" label="Sold in bags" unit="" percent />
            <Field path="compostMix.yard" label="Sold by the yard" unit="" percent />
            <Field path="compostMix.ton" label="Sold by the ton" unit="" percent />
            <Field path="compostPrice.bag" label="Price per bag" unit="$" step={0.25} />
            <Field path="compostPrice.yard" label="Price per yard" unit="$" />
            <Field path="compostPrice.ton" label="Price per ton" unit="$" />
          </InputGroup>
          <InputGroup title="Fuel logs" description="Drying takes most of the weight. The market for manure fuel is small.">
            <Field path="fuelLoss" label="Weight lost drying" unit="" percent />
            <Field path="fuelLbPerBundle" label="Weight of a bundle" unit="lb" />
            <Field path="fuelPricePerBundle" label="Price per bundle" unit="$" step={0.25} />
            <Field path="fuelMaxBundles" label="Bundles you can sell a year" unit="bundles" step={100} />
          </InputGroup>
          <InputGroup title="Costs" description="Equipment is spread over the years it lasts.">
            <Field path="laborRate" label="Labor" unit="$/hr" step={0.5} />
            <Field path="laborHoursPerTonCompost" label="Hours per ton, compost" unit="hr" step={0.1} />
            <Field path="laborHoursPerTonFuel" label="Hours per ton, fuel" unit="hr" step={0.5} />
            <Field path="equipment.turner" label="Compost turner" unit="$" step={500} />
            <Field path="equipment.bagger" label="Bagging line" unit="$" step={500} />
            <Field path="equipment.press" label="Log press" unit="$" step={500} />
            <Field path="equipmentYears" label="Equipment lasts" unit="years" />
            <Field path="dryingSpacePerYear" label="Drying space" unit="$/yr" step={100} />
            <Field path="bagCost" label="Each bag" unit="$" step={0.05} />
            <Field path="fuelPackCost" label="Each fuel bundle’s wrap" unit="$" step={0.05} />
            <Field path="deliveryCostPerTon" label="Delivery" unit="$/ton" />
            <Field path="deliveredShare" label="Compost delivered" unit="" percent />
          </InputGroup>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-24">
          <ChartPanel
            id={`${id}-months`}
            title="A year, month by month"
            summary={
              settings.seasonal
                ? 'Compost sells in spring and fall; fuel in camping and fire-pit season. Fuel only dries well from May to September, so press ahead.'
                : 'Sales spread evenly over the year.'
            }
            chart={
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
                    <li className="flex items-center gap-2">
                      <span aria-hidden className="size-3 rounded-sm" style={{ background: divisionColor('soil') }} />
                      Compost sales
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden className="size-3 rounded-sm" style={{ background: divisionColor('fuel') }} />
                      Fuel sales
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden className="h-0.5 w-5 border-t-2 border-dashed border-foreground/70" />
                      Costs
                    </li>
                  </ul>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={settings.seasonal ? 'season' : 'even'}
                    onValueChange={(v) => v && update({ seasonal: v === 'season' })}
                    aria-label="Spread sales"
                  >
                    <ToggleGroupItem value="season" className="h-10 px-3">
                      By season
                    </ToggleGroupItem>
                    <ToggleGroupItem value="even" className="h-10 px-3">
                      Evenly
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" tick={{ fill: 'var(--foreground)', fontSize: 13 }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis
                        tickFormatter={money}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                      />
                      <Tooltip content={MonthTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
                      <Bar
                        dataKey="compost"
                        stackId="s"
                        fill={divisionColor('soil')}
                        stroke="var(--card)"
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="fuel"
                        stackId="s"
                        fill={divisionColor('fuel')}
                        stroke="var(--card)"
                        strokeWidth={2}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey="costs"
                        type="monotone"
                        stroke="var(--foreground)"
                        strokeOpacity={0.7}
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={false}
                        activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            }
            table={
              <ChartTable
                caption="Compost and fuel sales, costs, and net by month"
                columns={['Month', 'Compost', 'Fuel', 'Costs', 'Net']}
                rows={months.map((m) => [m.label, formatCurrency(m.compost), formatCurrency(m.fuel), formatCurrency(m.costs), signed(m.net)])}
              />
            }
          />

          <section aria-labelledby={`${id}-breakdown`} className="grid gap-3 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 id={`${id}-breakdown`} className="text-2xl font-bold">
              The year in numbers
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {units.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="overflow-x-auto rounded-lg border" tabIndex={0} role="region" aria-label="Compost and fuel, a year">
              <table className="w-full text-left tabular-nums">
                <caption className="sr-only">Sales, costs, and net profit a year for compost and fuel</caption>
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      A year
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      Compost
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      Fuel
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <th scope="row" className="px-3 py-2 font-medium">
                      Tons of manure in
                    </th>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatNumber(Math.round(compost.manureTons))}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatNumber(Math.round(fuel.manureTons))}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatNumber(Math.round(compost.manureTons + fuel.manureTons))}</td>
                  </tr>
                  <tr className="border-t font-semibold">
                    <th scope="row" className="px-3 py-2">
                      Sales
                    </th>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(Math.round(compost.revenue))}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(Math.round(fuel.revenue))}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(Math.round(total.revenue))}</td>
                  </tr>
                  {COST_ROWS.map(({ key, label }) => (
                    <tr key={key} className="border-t text-muted-foreground">
                      <th scope="row" className="px-3 py-2 font-normal">
                        {label}
                      </th>
                      <td className="px-3 py-2 text-right whitespace-nowrap">−{formatCurrency(Math.round(compost.costs[key]))}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">−{formatCurrency(Math.round(fuel.costs[key]))}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">−{formatCurrency(Math.round(compost.costs[key] + fuel.costs[key]))}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold">
                    <th scope="row" className="px-3 py-2">
                      Net profit
                    </th>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{signed(compost.net)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{signed(fuel.net)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{signed(total.net)}</td>
                  </tr>
                  <tr className="border-t">
                    <th scope="row" className="px-3 py-2 font-medium">
                      Per ton of manure
                    </th>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{compost.manureTons ? signed(compost.perManureTon) : '–'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{fuel.manureTons ? signed(fuel.perManureTon) : '–'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">–</td>
                  </tr>
                  <tr className="border-t">
                    <th scope="row" className="px-3 py-2 font-medium">
                      Equipment payback
                    </th>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{compost.manureTons ? years(compost.paybackYears) : '–'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{fuel.manureTons ? years(fuel.paybackYears) : '–'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{years(total.paybackYears)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
