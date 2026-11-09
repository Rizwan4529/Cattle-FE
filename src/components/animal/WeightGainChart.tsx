import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import type { Animal, WeighIn } from '@/data/types'
import { getGainStats } from '@/lib/animalTimeline'
import { formatDate, formatNumber } from '@/lib/format'

interface Point {
  t: number
  date: string
  weight: number
  source: WeighIn['source']
}

const SOURCE_LABELS: Record<WeighIn['source'], string> = {
  birth: 'Birth weight',
  scale: 'Scale weight',
  'chute-scan': 'Camera estimate',
}

const toTime = (iso: string) => Date.parse(`${iso}T12:00:00`)

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const p = payload?.[0]?.payload as Point | undefined
  if (!active || !p) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="text-muted-foreground">{formatDate(p.date)}</p>
      <p className="font-heading text-lg font-bold tabular-nums">{formatNumber(p.weight)} lb</p>
      <p className="text-muted-foreground">{SOURCE_LABELS[p.source]}</p>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-l-4 border-primary/60 pl-4">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-heading text-3xl font-bold">{value}</p>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  )
}

/** Weight over time on a true time axis, from birth (or a year back) to the latest scan. */
export function WeightGainChart({ animal }: { animal: Animal }) {
  if (animal.weighIns.length < 2) {
    const only = animal.weighIns[0]
    return (
      <p className="text-lg">
        {only ? (
          <>
            One weight on record: <strong className="font-semibold">{formatNumber(only.weight)} lb</strong> on {formatDate(only.date)} (
            {SOURCE_LABELS[only.source].toLowerCase()}). The chart fills in as more weights come in.
          </>
        ) : (
          'No weights on record yet.'
        )}
      </p>
    )
  }
  return <GainChart animal={animal} />
}

function GainChart({ animal }: { animal: Animal }) {
  const points: Point[] = animal.weighIns.map((w) => ({ t: toTime(w.date), date: w.date, weight: w.weight, source: w.source }))
  const stats = getGainStats(animal)
  const maxWeight = Math.max(...points.map((p) => p.weight))
  const step = maxWeight > 1200 ? 500 : maxWeight > 600 ? 200 : 100
  const yMax = Math.ceil((maxWeight * 1.08) / step) * step
  const yTicks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step)
  const first = points[0].t
  const last = points[points.length - 1].t
  const spanDays = (last - first) / 86_400_000
  const tickFormat = (t: number) => new Date(t).toLocaleDateString('en-US', spanDays > 300 ? { month: 'short', year: '2-digit' } : { month: 'short' })
  // Evenly spaced ticks on the 1st of the month, at most ~7 of them.
  const monthStep = Math.max(1, Math.ceil(spanDays / 30 / 6))
  const start = new Date(first)
  const year = start.getFullYear()
  const xTicks: number[] = []
  // Date() rolls month 13 into next January, so stepping the month index is enough.
  for (let m = start.getMonth() + (start.getDate() > 1 ? 1 : 0); ; m += monthStep) {
    const tick = new Date(year, m, 1, 12).getTime()
    if (tick > last) break
    xTicks.push(tick)
  }
  const lastIndex = points.length - 1

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_13rem]">
      <figure className="min-w-0">
        <figcaption className="sr-only">Weight over time. {points.map((p) => `${formatDate(p.date)}: ${p.weight} lb`).join('; ')}.</figcaption>
        {/* Fixed in px, not rem: print shrinks the root font size, but the chart is drawn at screen size. */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 24, right: 48, bottom: 4, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                type="number"
                dataKey="t"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={tickFormat}
                ticks={xTicks}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={yTicks}
                tickFormatter={(v: number) => formatNumber(v)}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={ChartTooltip} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.1}
                isAnimationActive={false}
                // Markers would otherwise inherit the area's 10% fill opacity.
                dot={{ r: 5, fill: 'var(--chart-1)', fillOpacity: 1, stroke: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: 'var(--chart-1)', fillOpacity: 1, stroke: 'var(--card)', strokeWidth: 2 }}
              >
                {/* Label only the latest weight */}
                <LabelList
                  dataKey="weight"
                  position="top"
                  offset={12}
                  content={({ x, y, value, index }) =>
                    index === lastIndex ? (
                      <text x={Number(x)} y={Number(y) - 12} textAnchor="middle" fill="var(--foreground)" fontSize={15} fontWeight={700}>
                        {formatNumber(Number(value))} lb
                      </text>
                    ) : null
                  }
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <div className="grid content-start gap-5 sm:grid-cols-3 lg:grid-cols-1">
        <Stat label={points[0].source === 'birth' ? 'Gained since birth' : 'Gained this year'} value={`+${formatNumber(stats.gained)} lb`} />
        <Stat label="Average daily gain" value={`${stats.adg.toFixed(2)} lb`} note="per day, whole record" />
        {stats.recentAdg !== null && (
          <Stat label="Recent gain" value={`${stats.recentAdg.toFixed(2)} lb`} note={`per day, last ${stats.recentDays} days`} />
        )}
      </div>
    </div>
  )
}
