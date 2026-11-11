import { type FormEvent, useId, useState } from 'react'
import { ArrowRight, CircleAlert, Package, Plus, RefreshCw, Thermometer, TriangleAlert } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { TooltipBox } from '@/components/dashboard/ChartPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { soilFuelConfig } from '@/config/soilFuel'
import type { CompostBatch, FuelBatch, FuelProductId, SoilProductId } from '@/data/soilFuelTypes'
import { formatNumber, formatShortDate } from '@/lib/format'
import {
  bagLb,
  bundlesFromBatch,
  COMPOST_FLOW,
  COMPOST_LABEL,
  compostCheck,
  daysSince,
  FUEL_FLOW,
  FUEL_LABEL,
  fuelCheck,
  fuelProduct,
  lowFuelStock,
  lowSoilStock,
  soilProduct,
  tonsPerYard,
} from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const { production, soil, fuel, lowStock } = soilFuelConfig
const today = () => new Date().toISOString().slice(0, 10)
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** The stages of a batch as a row of steps; the current one is highlighted. */
function Stages<T extends string>({ flow, labels, current }: { flow: T[]; labels: Record<T, string>; current: T }) {
  const at = flow.indexOf(current)
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Stage">
      {flow.map((s, i) => (
        <li
          key={s}
          aria-current={i === at ? 'step' : undefined}
          className={cn(
            'rounded-full border px-3 py-1 text-sm',
            i < at && 'border-success/40 bg-success/10',
            i === at && 'border-primary bg-primary font-semibold text-primary-foreground',
            i > at && 'text-muted-foreground',
          )}
        >
          {labels[s]}
        </li>
      ))}
    </ol>
  )
}

/** A number + button pair for logging a reading. */
function LogReading({
  label,
  what,
  unit,
  min,
  max,
  onLog,
}: {
  label: string
  what: string
  unit: string
  min: number
  max: number
  onLog: (n: number) => void
}) {
  const id = useId()
  const [v, setV] = useState('')
  const [error, setError] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(v)
    if (v === '' || !Number.isFinite(n) || n < min || n > max) {
      setError(`Enter a number from ${min} to ${max}.`)
      return
    }
    onLog(n)
    setV('')
    setError('')
  }
  return (
    <form onSubmit={submit} noValidate className="grid gap-1">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="flex gap-2">
        <div className="relative">
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            value={v}
            onChange={(e) => setV(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-10 w-28 pr-9 tabular-nums"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
        </div>
        <Button type="submit" variant="outline" className="h-10" aria-label={`Log ${what}`}>
          <Plus aria-hidden />
          Log
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

function TempTooltip({ active, payload }: TooltipContentProps) {
  const r = payload?.[0]?.payload as { date: string; f: number } | undefined
  if (!active || !r) return null
  return <TooltipBox title={formatShortDate(r.date)} lines={[`${r.f} °F`]} />
}

function MoistTooltip({ active, payload }: TooltipContentProps) {
  const r = payload?.[0]?.payload as { date: string; pct: number } | undefined
  if (!active || !r) return null
  return <TooltipBox title={formatShortDate(r.date)} lines={[`${r.pct}% moisture`]} />
}

// ---------------------------------------------------------------- Compost

function CompostCard({ b }: { b: CompostBatch }) {
  const id = useId()
  const logTemp = useRanchStore((s) => s.logCompostTemp)
  const logTurn = useRanchStore((s) => s.logCompostTurn)
  const advance = useRanchStore((s) => s.advanceCompost)
  const convert = useRanchStore((s) => s.convertCompost)
  const [finished, setFinished] = useState(String(Math.round((b.manureTons + b.hayTons) * 0.5)))
  const [productId, setProductId] = useState<SoilProductId>('garden-blend')
  const [bags, setBags] = useState('0')
  // Bulk yards default to the whole windrow (for the chosen product) until the owner types a number
  const [yards, setYards] = useState<string | null>(null)
  const [convertError, setConvertError] = useState('')
  const check = compostCheck(b)
  const { min, max } = production.tempTarget
  const next = COMPOST_FLOW[COMPOST_FLOW.indexOf(b.status) + 1]
  const p = soilProduct(productId)
  const bagsN = Math.max(0, Math.floor(Number(bags) || 0))
  const defaultYards = Math.floor(
    Math.max(0, (b.finishedTons ?? 0) - (Math.max(0, Math.floor(Number(bags) || 0)) * bagLb(p)) / 2000) / tonsPerYard(p),
  )
  const yardsN = Math.max(0, Number(yards ?? defaultYards) || 0)
  const usedTons = (bagsN * bagLb(p)) / 2000 + yardsN * tonsPerYard(p)
  const temps = [...b.temps].sort((x, y) => x.date.localeCompare(y.date))
  const yMax = Math.max(170, ...temps.map((t) => t.f + 5))

  const doConvert = (e: FormEvent) => {
    e.preventDefault()
    if (!bagsN && !yardsN) return setConvertError('Enter bags, bulk yards, or both.')
    if (usedTons > (b.finishedTons ?? 0) + 0.05)
      return setConvertError(`That’s about ${formatNumber(Math.round(usedTons * 10) / 10)} tons; this windrow made ${b.finishedTons} tons.`)
    convert(b.id, { productId, bags: bagsN, yards: yardsN })
    setConvertError('')
    toast.success(`${b.windrow} is in stock`, { description: `${bagsN} bags and ${yardsN} yd³ of ${p.name} added to inventory.` })
  }

  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">
            Windrow {b.windrow}
            <span className="ml-2 text-base font-normal text-muted-foreground">started {formatShortDate(b.startDate)}</span>
          </h3>
          <p className="text-muted-foreground">
            {formatNumber(b.manureTons)} tons manure + {formatNumber(b.hayTons)} tons hay · day {daysSince(b.startDate, today())}
          </p>
        </div>
        <Stages flow={COMPOST_FLOW} labels={COMPOST_LABEL} current={b.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <figure className="grid gap-2">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 font-semibold">
              <Thermometer className="size-4 text-primary" aria-hidden />
              Core temperature
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span aria-hidden className="h-3 w-5 rounded-sm bg-success/25" />
              Target {min}–{max} °F
            </span>
          </figcaption>
          {temps.length ? (
            <>
              <div
                className="h-44 w-full"
                role="img"
                aria-label={`Temperature log for ${b.windrow}: ${temps.length} readings, last ${temps.at(-1)!.f} °F on ${formatShortDate(temps.at(-1)!.date)}.`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temps} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <ReferenceArea y1={min} y2={max} fill="var(--success)" fillOpacity={0.18} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      domain={[40, yMax]}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                    />
                    <Tooltip content={TempTooltip} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4' }} />
                    <Line
                      dataKey="f"
                      type="monotone"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 0, fill: 'var(--primary)' }}
                      activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-primary">All {temps.length} readings and turns</summary>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <ul className="grid gap-0.5 tabular-nums">
                    {temps.map((t, i) => (
                      <li key={`${t.date}-${i}`}>
                        {formatShortDate(t.date)}: {t.f} °F
                      </li>
                    ))}
                  </ul>
                  <ul className="grid content-start gap-0.5">
                    {b.turns.length ? (
                      b.turns.map((t, i) => (
                        <li key={`${t.date}-${i}`}>
                          Turned {formatShortDate(t.date)}
                          {t.note ? `: ${t.note}` : ''}
                        </li>
                      ))
                    ) : (
                      <li>No turns yet.</li>
                    )}
                  </ul>
                </div>
              </details>
            </>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-muted-foreground">
              No readings yet. Log the first one once the pile starts heating.
            </p>
          )}
        </figure>

        <div className="grid content-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={check.hotDays >= production.hotDays ? 'default' : 'outline'}
              className={check.hotDays >= production.hotDays ? 'bg-success text-success-foreground' : ''}
            >
              {check.hotDays} of {production.hotDays} hot days
            </Badge>
            <Badge
              variant={check.turns >= production.minTurns ? 'default' : 'outline'}
              className={check.turns >= production.minTurns ? 'bg-success text-success-foreground' : ''}
            >
              {check.turns} of {production.minTurns} turns
            </Badge>
          </div>
          {check.tooHot && (
            <p className="flex items-start gap-2 text-sm font-medium">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
              Over {max} °F: turn it to let heat out.
            </p>
          )}
          {(b.status === 'mixing' || b.status === 'composting' || b.status === 'curing') && (
            <>
              <LogReading
                label="Today’s temperature"
                what={`temperature for ${b.windrow}`}
                unit="°F"
                min={20}
                max={190}
                onLog={(n) => {
                  logTemp(b.id, n)
                  toast.success(`${b.windrow}: ${n} °F logged`)
                }}
              />
              <Button
                variant="outline"
                className="justify-self-start"
                onClick={() => {
                  logTurn(b.id)
                  toast.success(`${b.windrow} turned`, { description: `${b.turns.length + 1} turns so far.` })
                }}
              >
                <RefreshCw aria-hidden />
                Log a turn<span className="sr-only"> for {b.windrow}</span>
              </Button>
            </>
          )}

          {next && next !== 'screened' && next !== 'bagged' && (
            <Button
              className="justify-self-start"
              onClick={() => {
                advance(b.id)
                toast.success(`${b.windrow} moved to ${COMPOST_LABEL[next].toLowerCase()}`)
              }}
            >
              Move to {COMPOST_LABEL[next].toLowerCase()}
              <span className="sr-only"> {b.windrow}</span>
              <ArrowRight aria-hidden />
            </Button>
          )}
          {next === 'screened' && (
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const n = Number(finished)
                if (!(n > 0)) return
                advance(b.id, n)
                toast.success(`${b.windrow} screened`, { description: `${n} tons of finished compost.` })
              }}
            >
              <Label htmlFor={`${id}-finished`} className="text-sm">
                Finished tons after screening
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`${id}-finished`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={finished}
                  onChange={(e) => setFinished(e.target.value)}
                  className="h-10 w-24 tabular-nums"
                />
                <Button type="submit" className="h-10">
                  Mark screened<span className="sr-only"> {b.windrow}</span>
                </Button>
              </div>
            </form>
          )}
          {b.status === 'screened' && !b.converted && (
            <form className="grid gap-2 rounded-xl bg-muted/70 p-3" onSubmit={doConvert} noValidate>
              <p className="font-semibold">Into inventory: {b.finishedTons} tons</p>
              <Label htmlFor={`${id}-product`} className="text-sm">
                Product
              </Label>
              <Select value={productId} onValueChange={(v) => setProductId(v as SoilProductId)}>
                <SelectTrigger id={`${id}-product`} className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {soil.products.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor={`${id}-bags`} className="text-sm">
                    Bags
                  </Label>
                  <Input
                    id={`${id}-bags`}
                    type="number"
                    min={0}
                    value={bags}
                    onChange={(e) => setBags(e.target.value)}
                    className="h-10 tabular-nums"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${id}-yards`} className="text-sm">
                    Bulk yd³
                  </Label>
                  <Input
                    id={`${id}-yards`}
                    type="number"
                    min={0}
                    value={yards ?? String(defaultYards)}
                    onChange={(e) => setYards(e.target.value)}
                    className="h-10 tabular-nums"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Uses about {formatNumber(Math.round(usedTons * 10) / 10)} of {b.finishedTons} tons.
              </p>
              {convertError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {convertError}
                </p>
              )}
              <Button type="submit" className="justify-self-start">
                <Package aria-hidden />
                Add to inventory<span className="sr-only"> from {b.windrow}</span>
              </Button>
            </form>
          )}
          {b.converted && (
            <p className="rounded-xl bg-success/10 p-3 text-sm">
              <strong className="font-semibold">In stock {formatShortDate(b.converted.date)}:</strong> {formatNumber(b.converted.bags)} bags and{' '}
              {formatNumber(b.converted.yards)} yd³ of {soilProduct(b.converted.productId).name}.
            </p>
          )}
          {b.status === 'curing' && <p className="text-sm text-muted-foreground">Cures {b.curingDays} days before screening.</p>}
        </div>
      </div>
    </li>
  )
}

function StartCompost() {
  const id = useId()
  const batches = useRanchStore((s) => s.compostBatches)
  const start = useRanchStore((s) => s.startCompostBatch)
  const busy = new Set(batches.filter((b) => b.status !== 'bagged').map((b) => b.windrow))
  const free = production.windrows.filter((w) => !busy.has(w))
  const [windrow, setWindrow] = useState(free[0] ?? '')
  const [manure, setManure] = useState('80')
  const [hay, setHay] = useState('12')
  const m = Number(manure)
  const h = Number(hay)
  if (!free.length) return <p className="text-muted-foreground">Every windrow pad is in use. Screen or bag one to start another.</p>
  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!(m > 0) || !(h >= 0) || !windrow) return
        start({ windrow, manureTons: m, hayTons: h })
        toast.success(`Windrow ${windrow} started`, { description: `${m} tons manure + ${h} tons hay.` })
        setWindrow(free.find((w) => w !== windrow) ?? '')
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor={`${id}-w`} className="text-sm">
          Windrow pad
        </Label>
        <Select value={windrow} onValueChange={setWindrow}>
          <SelectTrigger id={`${id}-w`} className="h-10 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {free.map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-m`} className="text-sm">
          Manure, tons
        </Label>
        <Input id={`${id}-m`} type="number" min={1} value={manure} onChange={(e) => setManure(e.target.value)} className="h-10 w-24 tabular-nums" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-h`} className="text-sm">
          Alfalfa/hay, tons
        </Label>
        <Input id={`${id}-h`} type="number" min={0} value={hay} onChange={(e) => setHay(e.target.value)} className="h-10 w-24 tabular-nums" />
      </div>
      <Button type="submit" className="h-10">
        <Plus aria-hidden />
        Start windrow
      </Button>
      <p className="basis-full text-sm text-muted-foreground">
        {m > 0 ? `${Math.round((h / m) * 100)}% hay by weight. About 12–18% keeps the pile from going sour.` : ''}
      </p>
    </form>
  )
}

// ---------------------------------------------------------------- Fuel

function FuelCard({ b }: { b: FuelBatch }) {
  const id = useId()
  const logMoisture = useRanchStore((s) => s.logFuelMoisture)
  const advance = useRanchStore((s) => s.advanceFuel)
  const convert = useRanchStore((s) => s.convertFuel)
  const p = fuelProduct(b.productId)
  const check = fuelCheck(b)
  const next = FUEL_FLOW[FUEL_FLOW.indexOf(b.status) + 1]
  const [bundles, setBundles] = useState(String(bundlesFromBatch(b)))
  const readings = [...b.moisture].sort((x, y) => x.date.localeCompare(y.date))
  const target = production.fuelTargetMoisture

  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">
            {p.name}
            <span className="ml-2 text-base font-normal text-muted-foreground">pressed {formatShortDate(b.startDate)}</span>
          </h3>
          <p className="text-muted-foreground">
            {formatNumber(b.collectedTons)} tons collected · {Math.round(b.hayShare * 100)}% hay/straw · {formatNumber(b.pressedCount)} pieces pressed
          </p>
        </div>
        <Stages flow={FUEL_FLOW} labels={FUEL_LABEL} current={b.status} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <figure className="grid gap-2">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold">Moisture while drying</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span aria-hidden className="w-5 border-t-2 border-dashed border-success" />
              Pack at {target}% or less
            </span>
          </figcaption>
          {readings.length ? (
            <div
              className="h-40 w-full"
              role="img"
              aria-label={`Moisture log: ${readings.length} readings, last ${readings.at(-1)!.pct}% on ${formatShortDate(readings.at(-1)!.date)}.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    domain={[0, 80]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <ReferenceLine y={target} stroke="var(--success)" strokeDasharray="6 4" strokeWidth={2} />
                  <Tooltip content={MoistTooltip} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4' }} />
                  <Line
                    dataKey="pct"
                    type="monotone"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: 'var(--primary)' }}
                    activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-muted-foreground">
              No readings yet. Check moisture every few days while it dries.
            </p>
          )}
        </figure>
        <div className="grid content-start gap-3">
          <p className="text-sm">
            {check.last ? (
              <>
                Last reading <strong>{check.last.pct}%</strong> on {formatShortDate(check.last.date)}.{' '}
                {check.dry ? 'Dry enough to pack.' : `Needs to reach ${target}%.`}
              </>
            ) : (
              'No moisture readings yet.'
            )}
          </p>
          {b.status !== 'packed' && (
            <LogReading
              label="Moisture reading"
              what={`moisture for ${p.name}, pressed ${formatShortDate(b.startDate)}`}
              unit="%"
              min={0}
              max={100}
              onLog={(n) => {
                logMoisture(b.id, n)
                toast.success(`${p.name}: ${n}% logged`)
              }}
            />
          )}
          {next && next !== 'packed' && (
            <Button
              className="justify-self-start"
              onClick={() => {
                advance(b.id)
                toast.success(`${p.name} batch moved to ${FUEL_LABEL[next].toLowerCase()}`)
              }}
            >
              Move to {FUEL_LABEL[next].toLowerCase()}
              <span className="sr-only">
                {' '}
                {p.name}, pressed {formatShortDate(b.startDate)}
              </span>
              <ArrowRight aria-hidden />
            </Button>
          )}
          {b.status === 'curing' && !b.converted && (
            <form
              className="grid gap-2 rounded-xl bg-muted/70 p-3"
              onSubmit={(e) => {
                e.preventDefault()
                const n = Math.floor(Number(bundles))
                if (!(n > 0)) return
                convert(b.id, n)
                toast.success(`${n} bundles of ${p.name} in stock`)
              }}
            >
              <Label htmlFor={`${id}-bundles`} className="text-sm">
                Pack into bundles ({p.piecesPerBundle} pieces each)
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`${id}-bundles`}
                  type="number"
                  min={1}
                  value={bundles}
                  onChange={(e) => setBundles(e.target.value)}
                  className="h-10 w-28 tabular-nums"
                />
                <Button type="submit" className="h-10" disabled={!check.dry}>
                  <Package aria-hidden />
                  Pack
                  <span className="sr-only">
                    {' '}
                    {p.name}, pressed {formatShortDate(b.startDate)}
                  </span>
                </Button>
              </div>
              {!check.dry && <p className="text-sm text-muted-foreground">Log a reading at {target}% or less to pack.</p>}
            </form>
          )}
          {b.converted && (
            <p className="rounded-xl bg-success/10 p-3 text-sm">
              <strong className="font-semibold">Packed {formatShortDate(b.converted.date)}:</strong> {formatNumber(b.converted.bundles)} bundles in
              stock.
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

function StartFuel() {
  const id = useId()
  const start = useRanchStore((s) => s.startFuelBatch)
  const [productId, setProductId] = useState<FuelProductId>('fuel-logs')
  const [tons, setTons] = useState('6')
  const [hay, setHay] = useState('15')
  const [pressed, setPressed] = useState('1800')
  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault()
        const t = Number(tons)
        const h = Number(hay)
        const n = Math.floor(Number(pressed))
        if (!(t > 0) || !(h >= 0 && h <= 100) || !(n > 0)) return
        start({ productId, collectedTons: t, hayShare: h / 100, pressedCount: n })
        toast.success(`${fuelProduct(productId).name} batch started`, { description: `${formatNumber(n)} pieces on the drying racks.` })
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor={`${id}-p`} className="text-sm">
          Product
        </Label>
        <Select value={productId} onValueChange={(v) => setProductId(v as FuelProductId)}>
          <SelectTrigger id={`${id}-p`} className="h-10 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fuel.products.map((x) => (
              <SelectItem key={x.id} value={x.id}>
                {x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-t`} className="text-sm">
          Collected, tons
        </Label>
        <Input id={`${id}-t`} type="number" min={0} value={tons} onChange={(e) => setTons(e.target.value)} className="h-10 w-24 tabular-nums" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-h`} className="text-sm">
          Hay/straw, %
        </Label>
        <Input
          id={`${id}-h`}
          type="number"
          min={0}
          max={100}
          value={hay}
          onChange={(e) => setHay(e.target.value)}
          className="h-10 w-24 tabular-nums"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-n`} className="text-sm">
          Pieces pressed
        </Label>
        <Input id={`${id}-n`} type="number" min={1} value={pressed} onChange={(e) => setPressed(e.target.value)} className="h-10 w-28 tabular-nums" />
      </div>
      <Button type="submit" className="h-10">
        <Plus aria-hidden />
        Start batch
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------- Inventory

function StockInput({ label, value, step = 1, onCommit }: { label: string; value: number; step?: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState<string | null>(null)
  return (
    <Input
      type="number"
      min={0}
      step={step}
      aria-label={label}
      value={text ?? String(value)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const n = Number(text)
        if (text !== null && text !== '' && Number.isFinite(n) && n >= 0 && n !== value) {
          onCommit(n)
          toast.success(`${label}: ${n}`)
        }
        setText(null)
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="h-10 w-24 text-right tabular-nums"
    />
  )
}

function Inventory() {
  const soilStock = useRanchStore((s) => s.soilStock)
  const fuelStock = useRanchStore((s) => s.fuelStock)
  const setSoil = useRanchStore((s) => s.setSoilStock)
  const setFuel = useRanchStore((s) => s.setFuelStock)
  const lowSoil = lowSoilStock(soilStock)
  const lowFuel = lowFuelStock(fuelStock)
  const isLow = (id: string, form: string) => lowSoil.some((l) => l.id === id && l.form === form)
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section aria-labelledby="inv-soil" className="grid content-start gap-3 rounded-2xl border bg-card p-5">
        <h3 id="inv-soil" className="text-xl font-bold">
          {soil.brand}
        </h3>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Soil stock, scrollable table">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  Product
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Bags
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Bulk yd³
                </th>
              </tr>
            </thead>
            <tbody>
              {soil.products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {p.name}
                    {(isLow(p.id, 'bags') || isLow(p.id, 'yards')) && (
                      <Badge variant="outline" className="ml-2 border-warning/60 text-warning-foreground dark:text-warning">
                        Low
                      </Badge>
                    )}
                  </th>
                  <td className="py-2 pl-2">
                    <div className="flex justify-end">
                      <StockInput label={`${p.name} bags`} value={soilStock[p.id].bags} onCommit={(n) => setSoil(p.id, { bags: n })} />
                    </div>
                  </td>
                  <td className="py-2 pl-2">
                    <div className="flex justify-end">
                      <StockInput
                        label={`${p.name} bulk cubic yards`}
                        value={soilStock[p.id].yards}
                        step={0.5}
                        onCommit={(n) => setSoil(p.id, { yards: n })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Low below {lowStock.bags} bags or {lowStock.yards} yd³. Sales by the ton come out of bulk yards.
        </p>
      </section>
      <section aria-labelledby="inv-fuel" className="grid content-start gap-3 rounded-2xl border bg-card p-5">
        <h3 id="inv-fuel" className="text-xl font-bold">
          {fuel.brand}
        </h3>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Fuel stock, scrollable table">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  Product
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Bundles
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Cases / pallets
                </th>
              </tr>
            </thead>
            <tbody>
              {fuel.products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {p.name}
                    {lowFuel.some((l) => l.id === p.id) && (
                      <Badge variant="outline" className="ml-2 border-warning/60 text-warning-foreground dark:text-warning">
                        Low
                      </Badge>
                    )}
                  </th>
                  <td className="py-2 pl-2">
                    <div className="flex justify-end">
                      <StockInput label={`${p.name} bundles`} value={fuelStock[p.id]} onCommit={(n) => setFuel(p.id, n)} />
                    </div>
                  </td>
                  <td className="py-2 pl-2 text-right text-sm text-muted-foreground tabular-nums">
                    {Math.floor(fuelStock[p.id] / p.bundlesPerCase)} / {Math.floor(fuelStock[p.id] / (p.bundlesPerCase * p.casesPerPallet))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">Low below {lowStock.bundles} bundles.</p>
      </section>
    </div>
  )
}

/** Production Tracker: compost windrows, fuel batches, and finished stock for both divisions. */
export default function ProductionPage() {
  usePageTitle('Production tracker')
  const compost = useRanchStore((s) => s.compostBatches)
  const fuelBatches = useRanchStore((s) => s.fuelBatches)
  const soilStock = useRanchStore((s) => s.soilStock)
  const fuelStock = useRanchStore((s) => s.fuelStock)
  const lowSoil = lowSoilStock(soilStock)
  const lowFuel = lowFuelStock(fuelStock)
  const sortedCompost = [...compost].sort(
    (a, b) => COMPOST_FLOW.indexOf(a.status) - COMPOST_FLOW.indexOf(b.status) || b.startDate.localeCompare(a.startDate),
  )
  const sortedFuel = [...fuelBatches].sort(
    (a, b) => FUEL_FLOW.indexOf(a.status) - FUEL_FLOW.indexOf(b.status) || b.startDate.localeCompare(a.startDate),
  )
  const activeCompost = compost.filter((b) => b.status !== 'bagged').length
  const activeFuel = fuelBatches.filter((b) => b.status !== 'packed').length

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl font-bold">Production tracker</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          Every compost windrow and fuel batch from the first mix to finished stock: temperatures, turns, moisture, and what’s ready to sell.
        </p>
      </div>

      {(lowSoil.length > 0 || lowFuel.length > 0) && (
        <section aria-labelledby="low-stock" className="grid gap-2 rounded-xl border border-warning/60 bg-warning/10 p-4">
          <h2 id="low-stock" className="flex items-center gap-2 font-semibold">
            <CircleAlert className="size-5 text-warning-foreground dark:text-warning" aria-hidden />
            Running low
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {lowSoil.map((l) => (
              <li key={`${l.id}-${l.form}`}>
                {soilProduct(l.id).name}: {formatNumber(l.left)} {l.form === 'bags' ? 'bags' : 'yd³ bulk'}
              </li>
            ))}
            {lowFuel.map((l) => (
              <li key={l.id}>
                {fuelProduct(l.id).name}: {formatNumber(l.left)} bundles
              </li>
            ))}
          </ul>
        </section>
      )}

      <Tabs defaultValue="compost" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          <TabsTrigger value="compost" className="min-h-10 flex-none px-4 text-base text-foreground/85">
            Compost ({activeCompost} active)
          </TabsTrigger>
          <TabsTrigger value="fuel" className="min-h-10 flex-none px-4 text-base text-foreground/85">
            Fuel ({activeFuel} active)
          </TabsTrigger>
          <TabsTrigger value="inventory" className="min-h-10 flex-none px-4 text-base text-foreground/85">
            Inventory{lowSoil.length + lowFuel.length ? ` (${lowSoil.length + lowFuel.length} low)` : ''}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="compost" className="grid gap-4">
          <h2 className="sr-only">Compost windrows</h2>
          <StartCompost />
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4">
            {sortedCompost.map((b) => (
              <CompostCard key={b.id} b={b} />
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="fuel" className="grid gap-4">
          <h2 className="sr-only">Fuel batches</h2>
          <StartFuel />
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4">
            {sortedFuel.map((b) => (
              <FuelCard key={b.id} b={b} />
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="inventory" className="grid gap-4">
          <h2 className="sr-only">Finished stock</h2>
          <Inventory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
