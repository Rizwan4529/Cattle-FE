import { useId, useState } from 'react'
import { Link } from 'react-router'
import { beefConfig } from '@/config/beef'
import { byproductsConfig } from '@/config/byproducts'
import type { ByproductPartId } from '@/data/goodsTypes'
import { expectedRaw, fullRecoveryRates, goodsUrl, isListed, partById, valueOfRaw, wholeAnimalValue } from '@/lib/byproducts'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

/**
 * "Whole Animal" mode of the carcass diagram: a side view of the live animal
 * with every part that becomes Ranch Goods. Click a part (or use the buttons)
 * to see what it becomes, what's for sale, and what it's worth per animal.
 *
 * Same idea as the cut-sheet diagram: the drawing is for pointer users, the
 * buttons do the same job for keyboards and screen readers.
 */

// viewBox 0 0 720 400, head on the left
const BODY =
  'M200 95 C300 82 470 82 590 92 C630 96 652 124 650 160 C648 196 640 228 628 252 L604 262 C520 270 330 272 236 266 C206 264 186 256 176 240 C166 220 160 196 150 182 C132 182 104 188 78 190 C58 191 40 182 36 168 C32 152 40 132 56 120 C76 104 102 88 124 82 C152 76 180 84 200 95 Z'
const LEGS = [
  'M192 248 L230 250 L226 342 L200 342 Z',
  'M236 250 L272 252 L266 342 L242 342 Z',
  'M556 246 L596 250 L590 342 L564 342 Z',
  'M598 246 L632 244 L626 342 L602 342 Z',
]
const HOOF_X = [
  [200, 226],
  [242, 266],
  [564, 590],
  [602, 626],
] as const

interface Region {
  /** Filled shapes */
  fills?: string[]
  /** Stroked lines (bones, tendons, trachea, tail) */
  strokes?: { d: string; w: number }[]
  ellipses?: [number, number, number, number, number?][]
  label: [number, number]
}

const REGIONS: Record<ByproductPartId, Region> = {
  hide: { fills: [BODY, ...LEGS], label: [520, 220] },
  horns: {
    fills: ['M106 88 C98 62 86 46 62 40 C78 54 86 70 92 92 Z', 'M124 82 C122 56 112 38 92 28 C104 46 110 62 112 84 Z'],
    label: [64, 26],
  },
  ears: { ellipses: [[150, 96, 26, 10, -24]], label: [196, 64] },
  trachea: { strokes: [{ d: 'M160 196 C168 210 178 226 192 242', w: 12 }], label: [120, 222] },
  bones: {
    strokes: [
      { d: 'M196 112 C320 102 480 102 612 118', w: 11 },
      { d: 'M270 110 C262 150 264 190 276 226', w: 7 },
      { d: 'M310 108 C302 150 304 192 316 232', w: 7 },
      { d: 'M350 107 C344 150 346 194 356 236', w: 7 },
      { d: 'M612 118 C626 150 618 196 600 230', w: 9 },
    ],
    label: [400, 128],
  },
  fat: { ellipses: [[468, 160, 52, 26]], label: [468, 160] },
  organs: { ellipses: [[318, 206, 50, 30]], label: [318, 206] },
  tendons: {
    strokes: HOOF_X.map(([a, b]) => ({ d: `M${(a + b) / 2} 290 L${(a + b) / 2} 336`, w: 7 })),
    label: [413, 312],
  },
  hooves: { fills: HOOF_X.map(([a, b]) => `M${a - 3} 342 L${b + 3} 342 L${b + 6} 362 L${a - 6} 362 Z`), label: [413, 372] },
  tail: { strokes: [{ d: 'M648 120 C668 156 672 214 664 270', w: 9 }], ellipses: [[664, 286, 10, 20]], label: [666, 330] },
  pizzle: { ellipses: [[500, 268, 22, 7]], label: [500, 292] },
}

/** Order the buttons list them in: outside in. */
const ORDER: ByproductPartId[] = ['hide', 'horns', 'ears', 'hooves', 'tail', 'trachea', 'bones', 'fat', 'organs', 'tendons', 'pizzle']

export function WholeAnimalDiagram({
  selected,
  onSelect,
  className,
}: {
  selected: ByproductPartId
  onSelect: (p: ByproductPartId) => void
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  const drawOrder: ByproductPartId[] = ['hide', 'horns', 'ears', 'tail', 'hooves', 'tendons', 'trachea', 'bones', 'fat', 'organs', 'pizzle']

  return (
    <svg viewBox="0 0 720 400" aria-hidden className={cn('w-full select-none', className)}>
      <defs>
        <pattern id={`${id}-inside`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="var(--foreground)" strokeOpacity="0.18" strokeWidth="3" />
        </pattern>
      </defs>
      {drawOrder.map((p) => {
        const r = REGIONS[p]
        const on = selected === p
        const isHide = p === 'hide'
        const fill = on ? 'var(--primary)' : isHide ? 'var(--chart-4)' : 'var(--card)'
        const stroke = on ? 'var(--foreground)' : isHide ? 'none' : 'var(--foreground)'
        return (
          <g key={p} onClick={() => onSelect(p)} className="cursor-pointer" opacity={isHide && !on ? 0.75 : 1}>
            {r.fills?.map((d, i) => (
              <path key={i} d={d} fill={fill} stroke={stroke} strokeOpacity={on ? 1 : 0.5} strokeWidth={on ? 4 : 2} />
            ))}
            {r.ellipses?.map(([cx, cy, rx, ry, rot], i) => (
              <g key={i}>
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={rx}
                  ry={ry}
                  transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
                  fill={fill}
                  stroke={stroke}
                  strokeOpacity={on ? 1 : 0.5}
                  strokeWidth={on ? 4 : 2}
                />
                {/* Inside parts get a hatch, so they read as "inside" without relying on color */}
                {!on && p !== 'ears' && p !== 'tail' && <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-inside)`} pointerEvents="none" />}
              </g>
            ))}
            {r.strokes?.map((s, i) => (
              <g key={i}>
                {/* Wide invisible stroke: an easier target than a thin line */}
                <path d={s.d} stroke="transparent" strokeWidth={Math.max(22, s.w + 12)} fill="none" />
                <path
                  d={s.d}
                  stroke="var(--foreground)"
                  strokeOpacity={on ? 1 : 0.45}
                  strokeWidth={s.w + (on ? 5 : 3)}
                  fill="none"
                  strokeLinecap="round"
                />
                <path d={s.d} stroke={on ? 'var(--primary)' : 'var(--card)'} strokeWidth={s.w} fill="none" strokeLinecap="round" />
              </g>
            ))}
          </g>
        )
      })}
      {/* Eye */}
      <circle cx="84" cy="128" r="5" fill="var(--foreground)" pointerEvents="none" />

      {ORDER.map((p) => {
        const [x, y] = REGIONS[p].label
        const text = partById(byproductsConfig, p)?.name ?? p
        const w = text.length * 8.6 + 18
        const on = selected === p
        return (
          // Small screens: only the selected part is labeled; the buttons name the rest.
          <g key={p} onClick={() => onSelect(p)} className={cn('cursor-pointer', !on && 'max-lg:hidden')}>
            <rect x={x - w / 2} y={y - 15} width={w} height="28" rx="14" fill={on ? 'var(--foreground)' : 'var(--card)'} opacity={on ? 1 : 0.92} />
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill={on ? 'var(--background)' : 'var(--foreground)'}
              style={{ fontFamily: 'var(--brand-font-heading)' }}
            >
              {text}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** The amount of a part, in words: "1 hide", "about 50 lb". */
function amount(raw: number, unit: 'lb' | 'each', name: string) {
  if (unit === 'lb') return `about ${formatNumber(raw)} lb`
  return `${raw} ${raw === 1 ? name.toLowerCase().replace(/s$/, '') : name.toLowerCase()}`
}

/**
 * Diagram + part buttons + what the chosen part becomes, what's for sale from
 * it, and the "one animal = $X beef + $Y ranch goods" total.
 */
export function WholeAnimalExplorer({ compact = false, className }: { compact?: boolean; className?: string }) {
  const id = useId()
  const goods = useRanchStore((s) => s.goods)
  const [selected, setSelected] = useState<ByproductPartId>('hide')
  const rates = fullRecoveryRates(byproductsConfig)
  const part = partById(byproductsConfig, selected)!
  const raw = expectedRaw(part)
  const value = valueOfRaw(part, raw * rates[selected])
  const forSale = goods.filter((g) => g.part === selected && isListed(g, byproductsConfig))
  const total = wholeAnimalValue(byproductsConfig, beefConfig)

  return (
    <div className={cn('grid gap-6', !compact && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10', className)}>
      <div className="grid min-w-0 content-start gap-4">
        <div className="rounded-2xl border bg-card p-3 sm:p-5">
          <WholeAnimalDiagram selected={selected} onSelect={setSelected} />
        </div>
        <div role="group" aria-label="Parts of the animal" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ORDER.map((p) => {
            const info = partById(byproductsConfig, p)!
            const v = valueOfRaw(info, expectedRaw(info) * rates[p])
            const on = selected === p
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                aria-controls={`${id}-detail`}
                onClick={() => setSelected(p)}
                className={cn(
                  'grid min-h-12 content-center rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  on && 'border-foreground bg-foreground text-background hover:bg-foreground',
                )}
              >
                <span className="font-semibold">{info.name}</span>
                <span className={cn('text-sm tabular-nums', on ? 'text-background/80' : 'text-muted-foreground')}>~{formatCurrency(v.gross)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid content-start gap-4">
        <section id={`${id}-detail`} aria-live="polite" aria-labelledby={`${id}-name`} className="grid gap-3 rounded-2xl border bg-card p-5">
          <h3 id={`${id}-name`} className="text-2xl font-bold">
            {part.name}
          </h3>
          <p className="text-lg">Becomes: {part.becomes.toLowerCase()}.</p>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-sm text-muted-foreground">From one animal</dt>
              <dd className="font-semibold">{amount(raw, part.rawUnit, part.name)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Worth, retail</dt>
              <dd className="font-semibold tabular-nums">about {formatCurrency(value.gross)}</dd>
            </div>
          </dl>
          {(part.hornedOnly || part.malesOnly) && (
            <p className="text-sm text-muted-foreground">
              {part.hornedOnly ? 'Only horned animals. Our Angus are naturally polled.' : 'Steers and bulls only.'}
            </p>
          )}
          {forSale.length > 0 ? (
            <div>
              <p className="text-sm font-semibold">In Ranch Goods now</p>
              <ul className="mt-1 grid gap-1">
                {forSale.slice(0, 5).map((g) => (
                  <li key={g.id} className="flex justify-between gap-3">
                    <Link to={goodsUrl(g)} className="text-primary underline underline-offset-4">
                      {g.name}
                      {g.unique && g.sourceTagIds[0] ? `, ${g.sourceTagIds[0]}` : ''}
                    </Link>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{g.stock > 0 ? formatCurrency(g.price) : 'Sold'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing from this part is for sale right now.</p>
          )}
        </section>

        <section aria-label="What one animal is worth" className="grid gap-2 rounded-2xl bg-leather p-5 text-leather-foreground">
          <p className="text-sm font-semibold opacity-80">One animal</p>
          <p className="font-heading text-2xl leading-tight font-bold sm:text-3xl">
            {formatCurrency(total.beef)} beef + {formatCurrency(total.goods)} in ranch goods
          </p>
          <p className="text-sm opacity-80">
            Estimates for a typical {formatNumber(beefConfig.typicalLiveWeight)} lb finished steer at retail. Real yields vary animal to animal.
          </p>
        </section>
      </div>
    </div>
  )
}
