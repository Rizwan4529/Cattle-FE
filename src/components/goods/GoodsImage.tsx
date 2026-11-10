import { type ReactNode, useId } from 'react'
import type { GoodsArt, GoodsProduct } from '@/data/goodsTypes'
import { cn } from '@/lib/utils'

/**
 * Illustrated placeholder for a Ranch Goods item: the item on a weathered
 * barn-wood board. Hides take the color of the animal they came from. Swap
 * in real photos later the same way as the Butcher Shop.
 */

const BONE = '#EFE4CE'
const BONE_SHADE = '#D2C09C'
const MARROW = '#C98B5E'
const LEAN = '#A8323A'
const LEAN_DARK = '#7E222A'
const FAT = '#F3E4CB'
const CHEW = '#B9814E'
const CHEW_DARK = '#8C5A30'
const KRAFT = '#C9A877'
const KRAFT_DARK = '#A88A58'
const HORN = '#E8D7B0'
const HORN_TIP = '#3A2E26'
const LEATHER = '#B5773F'
const LEATHER_DARK = '#8E5A2C'

const HIDE: Record<NonNullable<GoodsProduct['coat']>, { base: string; patch?: string }> = {
  black: { base: '#262220' },
  red: { base: '#8A3A22' },
  hereford: { base: '#8A3A22', patch: '#F2EBDD' },
  charolais: { base: '#EADFC8' },
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const Shadow = ({ cx = 200, cy = 236, rx = 120 }: { cx?: number; cy?: number; rx?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry="14" fill="#000" opacity="0.22" />
)

/** A paper bag with a label: garden meal, chews, scraps. */
function Bag({ label, fill = KRAFT, stripe }: { label: string; fill?: string; stripe: string }) {
  return (
    <g>
      <Shadow rx={92} />
      <path d="M128 92 L272 92 L282 236 L118 236 Z" fill={fill} />
      <path d="M128 92 L272 92 L268 112 L132 112 Z" fill={KRAFT_DARK} />
      <path d="M134 78 L266 78 L272 92 L128 92 Z" fill={KRAFT_DARK} opacity="0.8" />
      <rect x="146" y="140" width="108" height="64" rx="6" fill="#F7F1E5" />
      <rect x="146" y="140" width="108" height="12" rx="4" fill={stripe} />
      <text x="200" y="186" textAnchor="middle" fontFamily="var(--brand-font-heading)" fontWeight="700" fontSize="20" fill="#3A2E26">
        {label}
      </text>
    </g>
  )
}

function Jar({ fill, lid = '#6B4A2F', label }: { fill: string; lid?: string; label?: string }) {
  return (
    <g>
      <Shadow rx={84} />
      <rect x="132" y="106" width="136" height="130" rx="18" fill={fill} />
      <rect x="132" y="106" width="136" height="130" rx="18" fill="#fff" opacity="0.08" />
      <rect x="142" y="84" width="116" height="30" rx="6" fill={lid} />
      <path d="M150 128 C150 180 152 210 158 222" stroke="#fff" strokeOpacity="0.35" strokeWidth="6" fill="none" strokeLinecap="round" />
      {label && (
        <>
          <rect x="160" y="150" width="80" height="44" rx="4" fill="#F7F1E5" />
          <text x="200" y="179" textAnchor="middle" fontFamily="var(--brand-font-heading)" fontWeight="700" fontSize="16" fill="#3A2E26">
            {label}
          </text>
        </>
      )}
    </g>
  )
}

/** A long bone with knobbed ends, at an angle. */
function LongBone({ x, y, len, angle, r = 16, fill = BONE }: { x: number; y: number; len: number; angle: number; r?: number; fill?: string }) {
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <rect x={x - len / 2} y={y - r * 0.55} width={len} height={r * 1.1} rx={r * 0.5} fill={fill} />
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={x + (side * len) / 2} cy={y - r * 0.55} r={r * 0.8} fill={fill} />
          <circle cx={x + (side * len) / 2} cy={y + r * 0.55} r={r * 0.8} fill={fill} />
        </g>
      ))}
      <rect x={x - len / 2} y={y + r * 0.25} width={len} height={r * 0.3} rx={r * 0.15} fill={BONE_SHADE} opacity="0.7" />
    </g>
  )
}

/** A hair-on hide laid flat, in the shape of a cowhide rug. */
function HideRug({ coat, seed }: { coat: NonNullable<GoodsProduct['coat']>; seed: number }) {
  const c = HIDE[coat]
  const d =
    'M120 96 C140 74 168 86 182 70 C196 58 214 58 226 70 C240 86 266 74 284 96 C300 116 286 132 300 152 C314 174 300 194 286 206 C268 222 250 214 236 232 C220 250 184 250 168 232 C152 214 132 222 116 206 C100 192 88 172 102 152 C114 132 104 116 120 96 Z'
  return (
    <g>
      <path d={d} fill="#000" opacity="0.2" transform="translate(5 8)" />
      <path d={d} fill={c.base} />
      {c.patch && (
        <>
          <path d="M184 72 C196 64 210 64 220 72 C226 110 222 170 214 236 C206 244 196 244 188 236 C180 170 176 110 184 72 Z" fill={c.patch} />
          <ellipse cx={130 + (seed % 20)} cy="190" rx="24" ry="16" fill={c.patch} opacity="0.95" />
        </>
      )}
      {/* hair texture */}
      {Array.from({ length: 18 }, (_, i) => {
        const x = 120 + ((seed >>> (i % 12)) % 160)
        const y = 96 + ((i * 37 + seed) % 130)
        return <path key={i} d={`M${x} ${y} q 6 4 12 0`} stroke="#fff" strokeOpacity="0.12" strokeWidth="2" fill="none" />
      })}
    </g>
  )
}

function Horn({ polished, flip = false }: { polished?: boolean; flip?: boolean }) {
  return (
    <g transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>
      <Shadow cx={196} cy={232} rx={110} />
      <path d="M96 210 C120 140 200 112 280 120 C306 122 320 108 326 92 C322 128 300 150 268 156 C204 166 150 186 128 226 Z" fill={HORN} />
      <path d="M300 112 C312 110 322 100 326 92 C322 112 312 126 298 134 Z" fill={HORN_TIP} />
      <path d="M96 210 L128 226 L120 236 L88 220 Z" fill="#CBB78F" />
      {polished && (
        <path d="M140 196 C170 160 230 140 280 136" stroke="#fff" strokeOpacity="0.55" strokeWidth="5" fill="none" strokeLinecap="round" />
      )}
      {polished && (
        <g>
          <rect x="132" y="232" width="150" height="12" rx="3" fill="#6B4A2F" />
          <rect x="150" y="212" width="10" height="22" fill="#6B4A2F" />
          <rect x="252" y="196" width="10" height="38" fill="#6B4A2F" />
        </g>
      )}
    </g>
  )
}

const DRAW: Record<GoodsArt, (seed: number, coat: NonNullable<GoodsProduct['coat']>) => ReactNode> = {
  tallow: () => <Jar fill="#F3E7C4" label="Tallow" />,
  pail: () => (
    <g>
      <Shadow rx={96} />
      <path d="M118 104 L282 104 L268 236 L132 236 Z" fill="#E9E4DA" />
      <rect x="112" y="96" width="176" height="18" rx="5" fill="#D3CCBF" />
      <path d="M122 100 C140 40 260 40 278 100" stroke="#8A8378" strokeWidth="5" fill="none" />
      <rect x="150" y="146" width="100" height="52" rx="5" fill="#F3E7C4" />
      <text x="200" y="179" textAnchor="middle" fontFamily="var(--brand-font-heading)" fontWeight="700" fontSize="17" fill="#3A2E26">
        5 LB
      </text>
    </g>
  ),
  suet: (seed) => (
    <g>
      <Shadow rx={110} />
      {Array.from({ length: 7 }, (_, i) => {
        const x = 110 + (i % 4) * 46 + ((seed >>> i) % 10)
        const y = 120 + Math.floor(i / 4) * 52 + ((seed >>> (i + 3)) % 8)
        return (
          <path
            key={i}
            d={`M${x} ${y + 20} C${x} ${y} ${x + 50} ${y - 6} ${x + 56} ${y + 18} C${x + 60} ${y + 44} ${x + 4} ${y + 52} ${x} ${y + 20} Z`}
            fill={FAT}
            stroke="#E2CFAE"
            strokeWidth="2"
          />
        )
      })}
    </g>
  ),
  soap: () => (
    <g>
      <Shadow rx={110} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 62 - 62} ${i % 2 ? -8 : 6}) rotate(${i * 5 - 5} 200 170)`}>
          <rect x="164" y="124" width="76" height="96" rx="12" fill="#ECE0C8" />
          <rect x="164" y="124" width="76" height="20" rx="10" fill="#fff" opacity="0.25" />
          <rect x="178" y="160" width="48" height="24" rx="4" fill="none" stroke="#C9B38E" strokeWidth="3" />
        </g>
      ))}
    </g>
  ),
  'soup-bones': () => (
    <g>
      <Shadow rx={120} />
      {[
        [140, 168, 40],
        [224, 140, 34],
        [262, 204, 30],
        [176, 220, 24],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <path
            d={`M${cx - r} ${cy} C${cx - r} ${cy - r * 1.3} ${cx + r} ${cy - r * 1.2} ${cx + r * 1.1} ${cy} C${cx + r} ${cy + r} ${cx - r * 0.8} ${cy + r * 1.1} ${cx - r} ${cy} Z`}
            fill={BONE}
          />
          <circle cx={cx} cy={cy} r={r * 0.36} fill={MARROW} />
          <path
            d={`M${cx - r * 0.9} ${cy - r * 0.2} q ${r * 0.3} ${-r * 0.5} ${r * 0.8} ${-r * 0.6}`}
            stroke={LEAN}
            strokeWidth="5"
            fill="none"
            opacity="0.7"
          />
        </g>
      ))}
    </g>
  ),
  marrow: () => (
    <g>
      <Shadow rx={110} />
      {[
        [150, 160, 44],
        [246, 140, 40],
        [222, 220, 34],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <ellipse cx={cx + 3} cy={cy + 10} rx={r} ry={r * 0.92} fill={BONE_SHADE} />
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.92} fill={BONE} />
          <ellipse cx={cx} cy={cy} rx={r * 0.58} ry={r * 0.52} fill={MARROW} />
          <ellipse cx={cx - r * 0.15} cy={cy - r * 0.12} rx={r * 0.22} ry={r * 0.18} fill="#E6B98F" />
        </g>
      ))}
    </g>
  ),
  oxtail: () => (
    <g>
      <Shadow rx={120} />
      {[
        [124, 170, 34],
        [190, 160, 30],
        [248, 168, 26],
        [296, 176, 21],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx + 2} cy={cy + 6} r={r} fill={LEAN_DARK} />
          <circle cx={cx} cy={cy} r={r} fill={LEAN} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={FAT} strokeWidth="6" />
          <circle cx={cx} cy={cy} r={r * 0.32} fill={BONE} />
        </g>
      ))}
    </g>
  ),
  liver: () => (
    <g>
      <Shadow rx={120} />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          transform={`translate(${i * 46 - 46} ${i * 12 - 12})`}
          d="M120 168 C120 130 180 112 230 120 C276 128 292 156 278 182 C262 210 214 214 170 206 C138 200 120 190 120 168 Z"
          fill={i === 1 ? '#7A2E2B' : '#6A2626'}
          stroke="#511C1C"
          strokeWidth="2"
        />
      ))}
    </g>
  ),
  heart: () => (
    <g>
      <Shadow rx={100} />
      <path d="M200 236 C140 196 112 160 120 122 C128 88 170 82 196 108 C222 78 272 84 280 124 C288 164 252 200 200 236 Z" fill="#8E2B2E" />
      <path d="M150 106 C170 96 196 104 200 118" stroke={FAT} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M232 98 C246 92 262 98 268 110" stroke={FAT} strokeWidth="8" fill="none" strokeLinecap="round" />
    </g>
  ),
  'bully-stick': (seed) => (
    <g>
      <Shadow rx={130} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`rotate(${-18 + i * 4 + (seed % 5)} 200 170)`}>
          <rect x="84" y={130 + i * 22} width="232" height="16" rx="8" fill={i % 2 ? CHEW : CHEW_DARK} />
          <path d={`M96 ${136 + i * 22} q 60 -4 200 2`} stroke="#E0B583" strokeOpacity="0.5" strokeWidth="2" fill="none" />
        </g>
      ))}
    </g>
  ),
  tendon: (seed) => (
    <g>
      <Shadow rx={120} />
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d={`M${110 + i * 30} ${120 + ((seed >>> i) % 30)} C${150 + i * 20} ${90 + i * 8} ${170 + i * 10} ${210 - i * 6} ${150 + i * 26} ${230}`}
          stroke={i % 2 ? '#D9B985' : '#C49B62'}
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  ),
  ear: () => (
    <g>
      <Shadow rx={110} />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i * 84 - 42} ${i * 10}) rotate(${i ? 18 : -14} 200 170)`}>
          <path d="M200 96 C246 112 262 170 236 218 C224 236 176 236 164 218 C138 170 154 112 200 96 Z" fill={CHEW} />
          <path d="M200 116 C228 132 236 174 220 206 C210 216 190 216 180 206 C164 174 172 132 200 116 Z" fill={CHEW_DARK} opacity="0.55" />
        </g>
      ))}
    </g>
  ),
  trachea: () => (
    <g>
      <Shadow rx={130} />
      <rect x="86" y="140" width="228" height="56" rx="26" fill="#D8B88A" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={98 + i * 21} y="140" width="9" height="56" rx="4" fill="#B98F5C" />
      ))}
      <ellipse cx="314" cy="168" rx="12" ry="28" fill="#8C6A3E" />
    </g>
  ),
  hoof: () => (
    <g>
      <Shadow rx={110} />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i * 96 - 48} 0)`}>
          <path d="M160 214 C150 160 166 112 200 108 C234 112 250 160 240 214 Z" fill="#5A4636" />
          <path d="M200 112 L200 214" stroke="#2E2219" strokeWidth="5" />
          <ellipse cx="200" cy="112" rx="34" ry="12" fill="#C9A06B" />
        </g>
      ))}
    </g>
  ),
  knuckle: () => (
    <g>
      <Shadow rx={110} />
      <path d="M120 170 C110 110 180 96 200 128 C222 96 292 110 280 170 C292 230 222 244 200 212 C178 244 108 230 120 170 Z" fill="#B88A55" />
      <path d="M140 160 C150 132 178 128 192 146" stroke="#E2BE8A" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6" />
    </g>
  ),
  'hide-rug': (seed, coat) => <HideRug coat={coat} seed={seed} />,
  'raw-hide': (seed, coat) => (
    <g>
      <Shadow rx={124} />
      <path d="M96 128 L304 116 L314 214 L90 226 Z" fill={HIDE[coat].base} />
      <path d="M96 128 L304 116 L300 140 L100 152 Z" fill="#E9DFCF" opacity="0.85" />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={110 + ((seed >>> (i % 14)) % 190)} cy={126 + ((i * 29) % 26)} r="2" fill="#fff" opacity="0.8" />
      ))}
    </g>
  ),
  rawhide: () => (
    <g>
      <Shadow rx={120} />
      <path d="M104 104 C150 92 250 92 296 104 C306 150 306 190 296 228 C250 240 150 240 104 228 C94 190 94 150 104 104 Z" fill="#E6D2A8" />
      <path
        d="M104 104 C150 92 250 92 296 104 C306 150 306 190 296 228 C250 240 150 240 104 228 C94 190 94 150 104 104 Z"
        fill="none"
        stroke="#C9AE7C"
        strokeWidth="4"
      />
      <path d="M140 140 C190 130 230 150 260 136" stroke="#D2B985" strokeWidth="4" fill="none" opacity="0.7" />
    </g>
  ),
  leather: () => (
    <g>
      <Shadow rx={124} />
      <path d="M92 116 C140 102 260 96 312 116 L300 228 C240 240 150 238 104 224 Z" fill={LEATHER} />
      <path d="M92 116 C140 102 260 96 312 116 L310 132 C250 116 150 118 94 132 Z" fill={LEATHER_DARK} />
      <path d="M150 150 C200 140 250 150 280 146" stroke="#D59A5F" strokeOpacity="0.5" strokeWidth="4" fill="none" />
    </g>
  ),
  scraps: (seed) => (
    <g>
      <Shadow rx={124} />
      {Array.from({ length: 9 }, (_, i) => {
        const x = 104 + (i % 3) * 66 + ((seed >>> i) % 14)
        const y = 112 + Math.floor(i / 3) * 40 + ((seed >>> (i + 4)) % 10)
        return (
          <path
            key={i}
            d={`M${x} ${y} l 52 ${(i % 3) * 4 - 4} l ${-6 + (i % 4) * 3} 34 l -50 4 Z`}
            fill={i % 3 === 0 ? LEATHER_DARK : i % 3 === 1 ? LEATHER : '#7A4A2A'}
            transform={`rotate(${((seed >>> i) % 30) - 15} ${x + 26} ${y + 18})`}
          />
        )
      })}
    </g>
  ),
  horn: (seed) => <Horn flip={seed % 2 === 0} />,
  'drinking-horn': () => <Horn polished />,
  'bone-blanks': (seed) => (
    <g>
      <Shadow rx={124} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={i}
          x={112 + (i % 3) * 62}
          y={124 + Math.floor(i / 3) * 52}
          width="54"
          height="30"
          rx="5"
          fill={i % 2 ? BONE : '#F6EEDD'}
          stroke={BONE_SHADE}
          strokeWidth="2"
          transform={`rotate(${((seed >>> i) % 20) - 10} ${140 + (i % 3) * 62} ${140 + Math.floor(i / 3) * 52})`}
        />
      ))}
      <LongBone x={200} y={236} len={170} angle={0} r={10} />
    </g>
  ),
  sinew: () => (
    <g>
      <Shadow rx={110} />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${120 + i * 4} 104 C${170 + i * 6} 140 ${150 + i * 8} 190 ${200 + i * 10} 232`}
          stroke={i % 2 ? '#EADBB8' : '#D9C39A'}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <rect x="132" y="150" width="60" height="16" rx="4" fill="#8A3A22" transform="rotate(25 162 158)" />
    </g>
  ),
  glue: () => (
    <g>
      <Jar fill="#C78E3E" lid="#3A2E26" label="Glue" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={96 + i * 4 + (i % 3) * 6} cy={228 - (i % 4) * 3} r="4" fill="#B57A2E" />
      ))}
    </g>
  ),
  'bone-meal': () => <Bag label="Bone meal" stripe="#E6DAC2" />,
  'blood-meal': () => <Bag label="Blood meal" stripe="#8E2B2E" />,
  'hoof-meal': () => <Bag label="Hoof & horn" stripe="#5A4636" />,
}

export function GoodsImage({
  art,
  coat = 'black',
  seed = art,
  alt,
  className,
}: {
  art: GoodsArt
  coat?: GoodsProduct['coat']
  seed?: string
  alt: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const h = hash(seed)
  return (
    <svg
      viewBox="0 0 400 300"
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
      className={cn('size-full', className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E5844" />
          <stop offset="1" stopColor="#4F3E30" />
        </linearGradient>
      </defs>
      {/* Barn-wood boards */}
      <rect width="400" height="300" fill={`url(#${uid}-wood)`} />
      {[60, 122, 184, 246].map((y, i) => (
        <g key={y}>
          <rect y={y} width="400" height="3" fill="#3B2E24" opacity="0.7" />
          <path
            d={`M0 ${y + 24 + (i % 2) * 8} q 120 ${-6 + ((h >>> i) % 10)} 400 4`}
            stroke="#8A715A"
            strokeOpacity="0.35"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ))}
      <circle cx={40 + (h % 300)} cy={90 + ((h >>> 3) % 120)} r="5" fill="#3B2E24" opacity="0.5" />
      <g>{DRAW[art](h, coat ?? 'black')}</g>
    </svg>
  )
}
