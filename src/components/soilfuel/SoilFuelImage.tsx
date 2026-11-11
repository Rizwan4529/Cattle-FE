import { type ReactNode, useId } from 'react'
import type { SoilFuelArt } from '@/data/soilFuelTypes'
import { cn } from '@/lib/utils'

/**
 * Illustrated placeholders for CROWDER Soil and Fuel products. Soil sits in a
 * field under the sky; fuel sits on barn-wood boards like Ranch Goods. Swap in
 * real photos later.
 */

const COMPOST = '#3B2A1E'
const COMPOST_LIGHT = '#5A4230'
const KRAFT = '#C9A877'
const KRAFT_DARK = '#A88A58'
const LABEL = '#F7F1E5'
const INK = '#2A211B'
const GRASS = '#6F8F4E'
const GRASS_DARK = '#556F3A'
const LOG = '#6B4E35'
const LOG_END = '#9C7A55'
const LOG_RING = '#7A5C40'

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const Shadow = ({ cx = 200, cy = 250, rx = 120 }: { cx?: number; cy?: number; rx?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry="13" fill="#000" opacity="0.22" />
)

/** Crumbly compost: a mound of dark specks. */
function Crumbs({ cx, cy, rx, ry, seed, n = 40 }: { cx: number; cy: number; rx: number; ry: number; seed: number; n?: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={COMPOST} />
      {Array.from({ length: n }, (_, i) => {
        const a = ((seed >>> (i % 16)) % 360) * (Math.PI / 180) + i
        const r = ((i * 37 + seed) % 100) / 100
        return <circle key={i} cx={cx + Math.cos(a) * rx * r * 0.9} cy={cy + Math.sin(a) * ry * r * 0.8} r={1.5 + (i % 3)} fill={COMPOST_LIGHT} />
      })}
    </g>
  )
}

/** A filled sack with the CROWDER label and a colored band. */
function Sack({ name, band, x = 200 }: { name: string; band: string; x?: number }) {
  return (
    <g transform={`translate(${x - 200} 0)`}>
      <Shadow rx={84} />
      <path d="M126 92 C150 80 250 80 274 92 L284 244 C240 256 160 256 116 244 Z" fill={KRAFT} />
      <path d="M126 92 C150 80 250 80 274 92 L272 110 C246 100 154 100 128 110 Z" fill={KRAFT_DARK} />
      <rect x="140" y="128" width="120" height="86" rx="6" fill={LABEL} />
      <rect x="140" y="128" width="120" height="16" rx="4" fill={band} />
      <text x="200" y="168" textAnchor="middle" fontFamily="var(--brand-font-heading)" fontWeight="800" fontSize="17" fill={INK}>
        CROWDER
      </text>
      <text x="200" y="192" textAnchor="middle" fontFamily="var(--brand-font-heading)" fontWeight="700" fontSize="14" fill={INK}>
        {name}
      </text>
    </g>
  )
}

function Logs({ seed, rows = [4, 3, 2], x0 = 200, y0 = 232, r = 22 }: { seed: number; rows?: number[]; x0?: number; y0?: number; r?: number }) {
  return (
    <g>
      <Shadow cx={x0} cy={y0 + r + 4} rx={rows[0] * r + 10} />
      {rows.map((count, row) =>
        Array.from({ length: count }, (_, i) => {
          const cx = x0 + (i - (count - 1) / 2) * r * 2.05
          const cy = y0 - row * r * 1.8
          return (
            <g key={`${row}-${i}`}>
              <circle cx={cx} cy={cy} r={r} fill={LOG} />
              <circle cx={cx} cy={cy} r={r * 0.8} fill={LOG_END} />
              <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke={LOG_RING} strokeWidth="2" />
              <circle cx={cx + ((seed >>> (i + row)) % 5) - 2} cy={cy} r={r * 0.15} fill={LOG_RING} />
            </g>
          )
        }),
      )}
    </g>
  )
}

const DRAW: Record<SoilFuelArt, (seed: number) => ReactNode> = {
  'garden-bag': (s) => (
    <g>
      <Crumbs cx={290} cy={242} rx={70} ry={20} seed={s} />
      <Sack name="Garden Blend" band="#5F7A58" x={170} />
      <path d="M318 232 c-4 -22 4 -40 14 -52 c4 18 -2 38 -14 52 Z" fill={GRASS} />
      <path d="M318 232 c6 -18 20 -26 34 -28 c-6 14 -18 24 -34 28 Z" fill={GRASS_DARK} />
    </g>
  ),
  topdress: (s) => (
    <g>
      <rect x="40" y="206" width="320" height="50" rx="6" fill={GRASS} />
      {Array.from({ length: 34 }, (_, i) => (
        <path key={i} d={`M${46 + i * 9.4} 208 l3 -12 l3 12`} fill={GRASS_DARK} />
      ))}
      {Array.from({ length: 60 }, (_, i) => (
        <circle key={i} cx={60 + ((i * 53 + s) % 280)} cy={214 + ((i * 17) % 36)} r={1.6 + (i % 2)} fill={COMPOST} />
      ))}
      <Shadow cx={220} cy={198} rx={90} />
      {/* wheelbarrow */}
      <path d="M140 120 L300 120 L276 184 L168 184 Z" fill="#7E2C1F" />
      <Crumbs cx={220} cy={122} rx={78} ry={18} seed={s} n={30} />
      <circle cx="160" cy="196" r="18" fill={INK} />
      <circle cx="160" cy="196" r="7" fill="#8A8A8A" />
      <path d="M276 160 L340 196 M290 176 L292 200 M180 184 L176 200" stroke={INK} strokeWidth="7" strokeLinecap="round" />
    </g>
  ),
  'bulk-pile': (s) => (
    <g>
      <Shadow cx={200} cy={250} rx={160} />
      <path d="M40 250 C80 150 140 104 200 100 C260 104 320 150 360 250 Z" fill={COMPOST} />
      {Array.from({ length: 70 }, (_, i) => (
        <circle key={i} cx={70 + ((i * 41 + s) % 260)} cy={130 + ((i * 29) % 110)} r={2 + (i % 3)} fill={COMPOST_LIGHT} />
      ))}
      <path d="M170 102 C186 92 214 92 230 102" stroke="#fff" strokeOpacity="0.25" strokeWidth="4" fill="none" />
      {/* loader bucket */}
      <path d="M300 168 L372 150 L380 196 L318 210 Z" fill="#D9A21B" />
      <path d="M300 168 L318 210" stroke={INK} strokeWidth="4" />
      <path d="M372 150 L400 136" stroke="#D9A21B" strokeWidth="12" />
    </g>
  ),
  'potting-bag': (s) => (
    <g>
      <Sack name="Potting Mix" band="#B87A12" x={160} />
      <Shadow cx={300} cy={250} rx={46} />
      <path d="M262 190 L338 190 L328 248 L272 248 Z" fill="#B5562F" />
      <rect x="256" y="182" width="88" height="14" rx="3" fill="#C9683F" />
      <Crumbs cx={300} cy={186} rx={40} ry={7} seed={s} n={12} />
      <path d="M300 182 C298 150 300 130 306 112" stroke={GRASS_DARK} strokeWidth="4" fill="none" />
      <path d="M302 150 c-20 -6 -30 -20 -30 -30 c16 2 28 14 30 30 Z" fill={GRASS} />
      <path d="M304 132 c18 -8 32 -6 38 0 c-12 10 -26 10 -38 0 Z" fill={GRASS} />
      <circle cx="306" cy="108" r="8" fill="#E0A93E" />
    </g>
  ),
  'fuel-logs': (s) => <Logs seed={s} />,
  briquettes: (s) => (
    <g>
      <Shadow rx={130} />
      <path d="M96 118 L196 110 L206 248 L104 252 Z" fill={KRAFT} />
      <rect x="116" y="150" width="72" height="54" rx="4" fill={LABEL} />
      <rect x="116" y="150" width="72" height="10" rx="3" fill="#3A6EA5" />
      <text x="152" y="186" textAnchor="middle" fontFamily="var(--brand-font-heading)" fontWeight="800" fontSize="12" fill={INK}>
        CROWDER
      </text>
      {Array.from({ length: 14 }, (_, i) => {
        const x = 220 + (i % 5) * 28 + ((s >>> i) % 6)
        const y = 236 - Math.floor(i / 5) * 20
        return (
          <g key={i}>
            <rect x={x} y={y} width="26" height="18" rx="7" fill={LOG} />
            <rect x={x + 4} y={y + 3} width="18" height="5" rx="2" fill={LOG_END} opacity="0.7" />
          </g>
        )
      })}
    </g>
  ),
  campfire: (s) => (
    <g>
      <Shadow rx={110} />
      <path d="M200 70 C230 110 250 130 236 170 C228 192 172 192 164 170 C152 134 176 116 200 70 Z" fill="#E0A93E" />
      <path d="M200 110 C216 132 222 150 214 170 C206 184 194 184 186 170 C180 150 190 134 200 110 Z" fill="#F4D58A" />
      <g transform="rotate(-14 200 220)">
        <rect x="104" y="200" width="192" height="30" rx="15" fill={LOG} />
        <circle cx="290" cy="215" r="13" fill={LOG_END} />
      </g>
      <g transform="rotate(14 200 220)">
        <rect x="104" y="208" width="192" height="30" rx="15" fill={LOG} />
        <circle cx="110" cy="223" r="13" fill={LOG_END} />
      </g>
      <path d={`M150 ${232 + (s % 4)} q 50 10 100 0`} stroke="#C9A877" strokeWidth="4" fill="none" />
    </g>
  ),
  'cow-chips': (s) => (
    <g>
      <Shadow rx={130} />
      <path d="M80 140 L320 140 L320 246 L80 246 Z" fill="#7E2C1F" />
      <path d="M80 140 L320 140 L300 122 L100 122 Z" fill="#9A3A28" />
      <rect x="80" y="180" width="240" height="12" fill="#E0A93E" />
      {[130, 200, 270].map((cx, i) => (
        <g key={cx}>
          <ellipse cx={cx} cy={150 - (i % 2) * 6} rx="34" ry="14" fill="#7A6247" />
          <ellipse cx={cx - 4} cy={147 - (i % 2) * 6} rx="22" ry="7" fill="#947A5A" opacity="0.8" />
          <path d={`M${cx - 18} ${150 + ((s >>> i) % 3)} q 10 -4 22 0`} stroke="#5C4A35" strokeWidth="2" fill="none" />
        </g>
      ))}
      <text x="200" y="224" textAnchor="middle" fontFamily="var(--brand-font-heading)" fontWeight="800" fontSize="20" fill={LABEL}>
        RANCH COW CHIPS
      </text>
    </g>
  ),
}

const SOIL_ART: SoilFuelArt[] = ['garden-bag', 'topdress', 'bulk-pile', 'potting-bag']

export function SoilFuelImage({ art, seed = art, alt, className }: { art: SoilFuelArt; seed?: string; alt: string; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const h = hash(seed)
  const soil = SOIL_ART.includes(art)
  return (
    <svg
      viewBox="0 0 400 300"
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
      className={cn('size-full', className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={soil ? '#DCE6EA' : '#6E5844'} />
          <stop offset="1" stopColor={soil ? '#F1E9D9' : '#4F3E30'} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${uid}-bg)`} />
      {soil ? (
        <>
          <path d={`M0 ${190 + (h % 12)} C120 170 260 ${200 - (h % 16)} 400 180 L400 300 L0 300 Z`} fill="#B3B07E" />
          <rect y="236" width="400" height="64" fill="#8C6B4A" />
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M${(i * 47 + h) % 400} ${262 + (i % 3) * 10} q 14 -3 28 0`} stroke="#6E5238" strokeWidth="2" fill="none" />
          ))}
        </>
      ) : (
        [60, 122, 184, 246].map((y) => <rect key={y} y={y} width="400" height="3" fill="#3B2E24" opacity="0.7" />)
      )}
      <g>{DRAW[art](h)}</g>
    </svg>
  )
}
