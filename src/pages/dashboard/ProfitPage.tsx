import { useId, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import { ChartPanel, ChartTable, TooltipBox } from '@/components/dashboard/ChartPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/format'
import { compareLiveVsBeef, PROFIT_DEFAULTS, type ProfitInputs } from '@/lib/profit'
import { usePageTitle } from '@/lib/usePageTitle'

type Key = Exclude<keyof ProfitInputs, 'beefPrices'>

const FIELDS: { key: Key; label: string; unit: string; step: number; percent?: boolean }[] = [
  { key: 'feederLb', label: 'Feeder weight', unit: 'lb', step: 25 },
  { key: 'feederPricePerCwt', label: 'Feeder price', unit: '$/cwt', step: 5 },
  { key: 'gainLb', label: 'Weight gained finishing', unit: 'lb', step: 25 },
  { key: 'costPerLbGain', label: 'Cost of gain', unit: '$/lb', step: 0.01 },
  { key: 'fedPricePerLb', label: 'Fed cattle price (live)', unit: '$/lb', step: 0.01 },
  { key: 'dressingPercent', label: 'Dressing (hanging ÷ live)', unit: '%', step: 1, percent: true },
  { key: 'takeHomePercent', label: 'Take-home (beef ÷ live)', unit: '%', step: 1, percent: true },
  { key: 'processing', label: 'Processing, whole animal', unit: '$', step: 25 },
]

/** Round axis ticks (every $250, $500, $1,000...) that include zero. */
function niceTicks(lo: number, hi: number) {
  const span = Math.max(1, hi - lo)
  const step = [250, 500, 1000, 2000, 5000].find((s) => span / s <= 6) ?? 10000
  const out: number[] = []
  for (let t = Math.floor(lo / step) * step; t <= Math.ceil(hi / step) * step; t += step) out.push(t)
  return out
}

const money = (v: number) =>
  `${v < 0 ? '−' : ''}$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(Math.abs(v) % 1000 ? 1 : 0)}k` : Math.abs(v)}`

interface Row {
  label: string
  net: number
}

function NetTooltip({ active, payload }: TooltipContentProps) {
  const r = payload?.[0]?.payload as Row | undefined
  if (!active || !r) return null
  return <TooltipBox title={r.label} lines={[`${r.net < 0 ? 'Loses' : 'Nets'} ${formatCurrency(Math.abs(r.net))} per head`]} />
}

/** "Sell live vs. sell as beef" calculator, prefilled from the ranch's economics sheet. */
export default function ProfitPage() {
  usePageTitle('Sell live vs. sell as beef')
  const id = useId()
  const [inputs, setInputs] = useState<ProfitInputs>(PROFIT_DEFAULTS)
  const [raw, setRaw] = useState<Record<string, string>>({})
  const r = compareLiveVsBeef(inputs)

  const shown = (f: (typeof FIELDS)[number]) => raw[f.key] ?? String(f.percent ? Math.round(inputs[f.key] * 100) : inputs[f.key])
  const change = (f: (typeof FIELDS)[number], v: string) => {
    setRaw((x) => ({ ...x, [f.key]: v }))
    const n = Number(v)
    if (v !== '' && Number.isFinite(n) && n >= 0) setInputs((x) => ({ ...x, [f.key]: f.percent ? n / 100 : n }))
  }
  const setPrice = (i: number, v: string) => {
    setRaw((x) => ({ ...x, [`price${i}`]: v }))
    const n = Number(v)
    if (v !== '' && Number.isFinite(n) && n >= 0) setInputs((x) => ({ ...x, beefPrices: x.beefPrices.map((p, j) => (j === i ? n : p)) }))
  }

  const rows: Row[] = [{ label: 'Sell live', net: r.live.net }, ...r.beef.map((b) => ({ label: `Beef at $${b.pricePerLb}/lb`, net: b.net }))]
  const best = [...r.beef].sort((a, b) => b.net - a.net)[0]
  const ticks = niceTicks(Math.min(0, ...rows.map((x) => x.net)), Math.max(0, ...rows.map((x) => x.net)))

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Sell live vs. sell as beef</h1>
          <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
            What one steer nets sold live at the fed price, or sold as beef by the take-home pound. Numbers start from the cattle economics sheet;
            change any of them.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setInputs(PROFIT_DEFAULTS)
            setRaw({})
          }}
        >
          <RotateCcw aria-hidden />
          Back to the sheet’s numbers
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section aria-labelledby={`${id}-inputs`} className="grid content-start gap-4 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id={`${id}-inputs`} className="text-2xl font-bold">
            Your numbers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="grid content-start gap-1.5">
                <Label htmlFor={`${id}-${f.key}`}>{f.label}</Label>
                <div className="relative">
                  <Input
                    id={`${id}-${f.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={f.step}
                    value={shown(f)}
                    onChange={(e) => change(f, e.target.value)}
                    className="pr-16 tabular-nums"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-1 font-semibold">Beef prices to compare ($ per take-home lb)</legend>
            <div className="grid grid-cols-3 gap-2">
              {inputs.beefPrices.map((p, i) => (
                <Input
                  key={i}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.25}
                  aria-label={`Beef price ${i + 1}, dollars per take-home pound`}
                  value={raw[`price${i}`] ?? String(p)}
                  onChange={(e) => setPrice(i, e.target.value)}
                  className="tabular-nums"
                />
              ))}
            </div>
          </fieldset>
        </section>

        <div className="grid content-start gap-6">
          <dl className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {[
              ['Cost to finish', formatCurrency(r.costToFinish), `${formatCurrency(r.feederCost)} feeder + ${formatCurrency(r.gainCost)} gain`],
              ['Finished steer', `${r.finishedLb.toLocaleString()} lb`, `${r.hangingLb} lb hanging, ${r.takeHomeLb} lb take-home`],
              ['Breakeven, live', `${formatCurrency(r.breakevenLivePerLb, true)}/lb`, `Market is ${formatCurrency(inputs.fedPricePerLb, true)}/lb`],
              ['Breakeven, beef', `${formatCurrency(r.breakevenBeefPerLb, true)}/lb`, 'Per take-home lb, after processing'],
            ].map(([k, v, note]) => (
              <div key={k} className="rounded-2xl border bg-card p-4">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="font-heading text-3xl font-bold tabular-nums">{v}</dd>
                <dd className="text-sm text-muted-foreground">{note}</dd>
              </div>
            ))}
          </dl>

          <ChartPanel
            id={`${id}-chart`}
            title="Net per head"
            summary={
              <>
                Sold live, a steer {r.live.net < 0 ? 'loses' : 'nets'} {formatCurrency(Math.abs(r.live.net))}. As beef at ${best.pricePerLb}/lb it{' '}
                {best.net < 0 ? 'loses' : 'nets'} {formatCurrency(Math.abs(best.net))}, {formatCurrency(Math.abs(best.vsLive))}{' '}
                {best.vsLive >= 0 ? 'more' : 'less'}.
              </>
            }
            chart={
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 28, right: 8, bottom: 0, left: 8 }}>
                    <XAxis dataKey="label" tick={{ fill: 'var(--foreground)', fontSize: 14 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[ticks[0], ticks.at(-1)!]}
                      ticks={ticks}
                      tickFormatter={money}
                      width={64}
                    />
                    <ReferenceLine y={0} stroke="var(--foreground)" strokeOpacity={0.5} />
                    <Tooltip content={NetTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
                    <Bar dataKey="net" barSize={56} radius={4} isAnimationActive={false}>
                      {rows.map((row) => (
                        <Cell key={row.label} fill={row.net < 0 ? 'var(--chart-1)' : 'var(--chart-2)'} />
                      ))}
                      <LabelList
                        dataKey="net"
                        position="top"
                        fill="var(--foreground)"
                        fontSize={15}
                        fontWeight={700}
                        formatter={(v) => `${Number(v) < 0 ? '−' : ''}${formatCurrency(Math.abs(Number(v)))}`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            }
            table={
              <ChartTable
                caption="Net per head, sold live and as beef at each price"
                columns={['Sold', 'Revenue', 'Net per head', 'vs. selling live']}
                rows={[
                  ['Live', formatCurrency(r.live.revenue), formatCurrency(r.live.net), '–'],
                  ...r.beef.map((b) => [
                    `Beef at $${b.pricePerLb}/lb`,
                    formatCurrency(b.revenue),
                    formatCurrency(b.net),
                    `${b.vsLive >= 0 ? '+' : '−'}${formatCurrency(Math.abs(b.vsLive))}`,
                  ]),
                ]}
              />
            }
          />
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-sm bg-chart-2" />
              Makes money
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-sm bg-chart-1" />
              Loses money (below the line)
            </span>
          </p>
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Nets leave out interest, vet bills, death loss, packaging, labor, marketing, and shipping. Cattle and beef prices move every week, so
            check your numbers before you decide.
          </p>
        </div>
      </div>
    </div>
  )
}
