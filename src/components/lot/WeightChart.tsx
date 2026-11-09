import { useNavigate } from 'react-router'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis, YAxis } from 'recharts'
import type { Animal } from '@/data/types'
import { formatNumber, formatWeight } from '@/lib/format'

interface Row {
  tagId: string
  weight: number
  frame: number
  bcs: number
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const row = payload?.[0]?.payload as Row | undefined
  if (!active || !row) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-heading text-base font-bold">{row.tagId}</p>
      <p className="tabular-nums">{formatWeight(row.weight)}</p>
      <p className="text-muted-foreground">
        Frame {row.frame}, body condition {row.bcs} of 9
      </p>
      <p className="mt-1 text-muted-foreground">Click to open its record</p>
    </div>
  )
}

/**
 * One bar per animal, heaviest first, measured from zero so the spread is
 * shown honestly. The average is stated in the caption rather than drawn,
 * because every bar ends near it and a line would cut through the labels.
 * Clicking a bar opens the animal's passport; the animal table below is the
 * chart's table view.
 */
export function WeightChart({ animals, avgWeight }: { animals: Animal[]; avgWeight: number }) {
  const navigate = useNavigate()
  const rows: Row[] = [...animals]
    .sort((a, b) => b.estWeight - a.estWeight)
    .map((a) => ({ tagId: a.tagId, weight: a.estWeight, frame: a.frameScore, bcs: a.bcs }))
  const min = Math.min(...rows.map((r) => r.weight))
  const max = Math.max(...rows.map((r) => r.weight))
  const spread = max - min
  const height = rows.length * 44 + 40
  // Round axis: 0, 200, 400… (or every 400 lb for heavy cattle)
  const step = max > 1200 ? 400 : 200
  const axisMax = Math.ceil(max / step) * step
  const ticks = Array.from({ length: axisMax / step + 1 }, (_, i) => i * step)

  return (
    <figure className="grid gap-4">
      <figcaption>
        <h3 className="text-2xl font-bold">Weight by animal</h3>
        <p className="mt-1 text-muted-foreground">
          Average {formatNumber(avgWeight)} lb.{' '}
          {rows.length > 1
            ? `Spread of ${formatNumber(spread)} lb from lightest to heaviest (${Math.round((spread / avgWeight) * 100)}% of the average). ${
                spread / avgWeight <= 0.12 ? 'A closely matched set.' : 'Some variation in size.'
              }`
            : 'A single animal.'}{' '}
          Estimated by the chute camera.
        </p>
      </figcaption>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 72, bottom: 4, left: 8 }}
            barCategoryGap={10}
            className="cursor-pointer"
            // The whole row is the hit target, not just the bar.
            onClick={(state) => {
              if (state.activeLabel) navigate(`/animal/${state.activeLabel}`)
            }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeWidth={1} />
            <XAxis
              type="number"
              domain={[0, axisMax]}
              ticks={ticks}
              tickFormatter={(v: number) => formatNumber(v)}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }}
              axisLine={false}
              tickLine={false}
              unit=" lb"
            />
            <YAxis
              type="category"
              dataKey="tagId"
              width={92}
              tick={{ fill: 'var(--foreground)', fontSize: 15, fontWeight: 600 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <Tooltip content={ChartTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
            <Bar
              dataKey="weight"
              fill="var(--chart-1)"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              activeBar={{ fill: 'var(--chart-1)', fillOpacity: 0.8 }}
            >
              <LabelList
                dataKey="weight"
                position="right"
                formatter={(v) => `${formatNumber(Number(v))} lb`}
                style={{ fill: 'var(--foreground)', fontSize: 14, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
