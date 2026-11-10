import { useId } from 'react'
import type { CutStyle, Primal, PrimalChoice } from '@/data/beefTypes'
import { primalInfo, STYLE_NAMES } from '@/lib/cutSheet'
import { cn } from '@/lib/utils'

/**
 * A side view of a beef carcass split into its nine primals, drawn for this
 * site. Each section is filled by how it's being cut (steaks, roasts, or
 * ground), with a texture as well as a color so the difference doesn't rely
 * on color alone. Click a section to choose how it's cut.
 *
 * The drawing is for pointer users; the buttons next to it do the same job
 * for keyboards and screen readers.
 */

// viewBox 0 0 640 340, head end on the left
const SILHOUETTE =
  'M58 112 C78 82 108 70 140 68 L520 60 C570 62 600 86 604 122 L598 248 C594 274 580 300 574 322 L528 322 C524 292 516 264 506 244 C470 241 440 239 410 239 L250 245 C222 247 196 249 180 253 L172 322 L124 322 C120 300 116 274 112 252 C86 246 62 234 48 212 C36 192 36 152 44 134 Z'

const REGIONS: Record<Primal, { d: string; label: [number, number] }> = {
  chuck: { d: 'M0 0 L212 0 L202 166 L0 172 Z', label: [118, 118] },
  rib: { d: 'M212 0 L302 0 L298 154 L202 166 Z', label: [254, 100] },
  loin: { d: 'M302 0 L388 0 L392 150 L298 154 Z', label: [346, 100] },
  sirloin: { d: 'M388 0 L472 0 L462 168 L392 150 Z', label: [430, 104] },
  round: { d: 'M472 0 L640 0 L640 340 L452 340 L452 270 L462 168 Z', label: [550, 170] },
  brisket: { d: 'M0 172 L202 166 L202 252 L0 252 Z', label: [118, 214] },
  plate: { d: 'M202 166 L298 154 L306 270 L202 270 Z', label: [252, 214] },
  flank: { d: 'M298 154 L392 150 L462 168 L452 270 L306 270 Z', label: [382, 206] },
  shank: { d: 'M96 252 L202 252 L202 340 L96 340 Z', label: [148, 292] },
}

const FILL: Record<CutStyle, string> = { steaks: 'var(--primary)', roasts: 'var(--chart-3)', ground: 'var(--chart-4)' }

export function CarcassDiagram({
  primals,
  selected,
  onSelect,
  className,
}: {
  primals: Record<Primal, PrimalChoice>
  selected: Primal
  onSelect: (p: Primal) => void
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  const clip = `${id}-clip`

  return (
    <svg viewBox="0 0 640 340" aria-hidden className={cn('w-full select-none', className)}>
      <defs>
        <clipPath id={clip}>
          <path d={SILHOUETTE} />
        </clipPath>
        <pattern id={`${id}-roasts`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="2.2" fill="white" fillOpacity="0.45" />
        </pattern>
        <pattern id={`${id}-ground`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="white" strokeOpacity="0.4" strokeWidth="3" />
        </pattern>
      </defs>

      <g clipPath={`url(#${clip})`}>
        {(Object.keys(REGIONS) as Primal[]).map((p) => {
          const style = primals[p].style
          const dim = selected !== p
          return (
            <g key={p} onClick={() => onSelect(p)} className="cursor-pointer transition-opacity hover:opacity-100" opacity={dim ? 0.82 : 1}>
              <path d={REGIONS[p].d} fill={FILL[style]} />
              {style !== 'steaks' && <path d={REGIONS[p].d} fill={`url(#${id}-${style})`} />}
              <path d={REGIONS[p].d} fill="none" stroke="var(--card)" strokeWidth="4" />
            </g>
          )
        })}
        <path d={REGIONS[selected].d} fill="none" stroke="var(--foreground)" strokeWidth="9" pointerEvents="none" />
      </g>
      <path d={SILHOUETTE} fill="none" stroke="var(--foreground)" strokeOpacity="0.35" strokeWidth="2.5" pointerEvents="none" />

      {(Object.keys(REGIONS) as Primal[]).map((p) => {
        const [x, y] = REGIONS[p].label
        const text = primalInfo(p).label
        const w = text.length * 8.6 + 18
        const on = selected === p
        return (
          // On phones the drawing is small, so only the selected section is labeled; the buttons below name the rest.
          <g key={p} onClick={() => onSelect(p)} className={cn('cursor-pointer', !on && 'max-sm:hidden')}>
            <rect x={x - w / 2} y={y - 15} width={w} height="28" rx="14" fill={on ? 'var(--foreground)' : 'var(--card)'} />
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

/** Color-and-texture key for the diagram. */
export function StyleLegend({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm', className)}>
      {(Object.keys(FILL) as CutStyle[]).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <svg viewBox="0 0 20 20" className="size-5 rounded" aria-hidden>
            <defs>
              <pattern id={`${id}-r`} width="7" height="7" patternUnits="userSpaceOnUse">
                <circle cx="3.5" cy="3.5" r="1.3" fill="white" fillOpacity="0.5" />
              </pattern>
              <pattern id={`${id}-g`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeOpacity="0.45" strokeWidth="1.6" />
              </pattern>
            </defs>
            <rect width="20" height="20" fill={FILL[s]} />
            {s === 'roasts' && <rect width="20" height="20" fill={`url(#${id}-r)`} />}
            {s === 'ground' && <rect width="20" height="20" fill={`url(#${id}-g)`} />}
          </svg>
          {STYLE_NAMES[s]}
        </li>
      ))}
    </ul>
  )
}
