import { type ReactNode, useId } from 'react'
import type { CutId } from '@/data/beefTypes'
import { cn } from '@/lib/utils'

/**
 * Illustrated placeholder for a cut of beef: the cut on butcher paper over a
 * slate board, with a sprig of rosemary and a pinch of salt. Swap in real
 * photos by giving the product a `photos` array; nothing else changes.
 */

const LEAN = '#A8323A'
const LEAN_DARK = '#86232C'
const FAT = '#F3E4CB'
const MARBLE = '#F7EBD8'
const BONE = '#EFE4CE'
const BONE_SHADE = '#D6C5A4'
const MARROW = '#C98B5E'

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Little streaks of marbling, scattered inside a box. */
function Marbling({ x, y, w, h, n, seed, clip }: { x: number; y: number; w: number; h: number; n: number; seed: number; clip: string }) {
  const out: ReactNode[] = []
  let s = seed
  const r = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = 0; i < n; i++) {
    const cx = x + r() * w
    const cy = y + r() * h
    const len = 6 + r() * 16
    const a = r() * 180
    out.push(
      <path
        key={i}
        d={`M${cx} ${cy} q ${len / 2} ${-3 + r() * 6} ${len} 0`}
        stroke={MARBLE}
        strokeOpacity={0.55 + r() * 0.35}
        strokeWidth={1.4 + r() * 1.6}
        fill="none"
        strokeLinecap="round"
        transform={`rotate(${a} ${cx} ${cy})`}
      />,
    )
  }
  return <g clipPath={`url(#${clip})`}>{out}</g>
}

function Steak({ d, fat, marble, seed, uid }: { d: string; fat?: string; marble: number; seed: number; uid: string }) {
  return (
    <g>
      <path d={d} fill={LEAN_DARK} transform="translate(4 7)" opacity="0.6" />
      {fat && <path d={fat} fill={FAT} />}
      <path d={d} fill={LEAN} />
      <clipPath id={`${uid}-clip`}>
        <path d={d} />
      </clipPath>
      <Marbling x={100} y={80} w={200} h={140} n={marble} seed={seed} clip={`${uid}-clip`} />
    </g>
  )
}

const DRAW: Record<CutId, (seed: number, uid: string) => ReactNode> = {
  ribeye: (seed, uid) => (
    <Steak
      uid={uid}
      seed={seed}
      marble={34}
      fat="M112 150 C110 98 160 70 214 74 C276 78 304 118 300 160 C296 210 248 236 196 232 C142 228 114 196 112 150 Z"
      d="M124 152 C124 108 166 86 214 88 C266 92 288 124 286 160 C282 202 244 220 198 218 C150 214 124 188 124 152 Z"
    />
  ),
  'ny-strip': (seed, uid) => (
    <Steak
      uid={uid}
      seed={seed}
      marble={22}
      fat="M98 120 C150 92 252 88 306 112 L300 132 C250 112 152 116 104 140 Z"
      d="M104 138 C150 114 250 110 300 130 C312 170 296 214 250 222 C200 230 140 226 112 204 C94 188 94 160 104 138 Z"
    />
  ),
  filet: (seed) => (
    <g>
      {[
        [150, 150],
        [258, 158],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy + 22} rx="56" ry="40" fill={LEAN_DARK} />
          <rect x={cx - 56} y={cy} width="112" height="22" fill={LEAN_DARK} />
          <ellipse cx={cx} cy={cy} rx="56" ry="40" fill={LEAN} />
          <ellipse cx={cx - 8} cy={cy - 6} rx="30" ry="18" fill={MARBLE} opacity="0.12" />
          <path
            d={`M${cx - 30} ${cy + 4} q 14 -6 26 2 M${cx + 6} ${cy - 14} q 12 4 20 -2`}
            stroke={MARBLE}
            strokeOpacity="0.5"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ))}
      {seed % 2 === 0 && <path d="M100 216 L304 216" stroke="#3A2A20" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="2 6" />}
    </g>
  ),
  sirloin: (seed, uid) => (
    <Steak
      uid={uid}
      seed={seed}
      marble={14}
      fat="M110 128 C160 96 252 94 296 126 L290 140 C246 112 166 114 118 142 Z"
      d="M116 140 C164 112 246 110 290 138 C304 176 284 218 236 226 C180 234 128 216 112 188 C104 172 106 154 116 140 Z"
    />
  ),
  't-bone': (seed, uid) => (
    <g>
      <path d="M102 150 C102 104 150 84 196 86 L200 220 C150 222 104 200 102 150 Z" fill={FAT} />
      <path d="M112 152 C112 112 152 98 192 100 L194 210 C150 210 114 192 112 152 Z" fill={LEAN} />
      <path d="M212 96 C260 92 302 118 300 160 C298 196 266 218 214 214 Z" fill={LEAN} />
      <clipPath id={`${uid}-clip`}>
        <path d="M112 152 C112 112 152 98 192 100 L194 210 C150 210 114 192 112 152 Z" />
      </clipPath>
      <Marbling x={110} y={96} w={90} h={120} n={14} seed={seed} clip={`${uid}-clip`} />
      <path d="M192 80 L214 80 L214 226 L192 226 Z" fill={BONE} />
      <path d="M160 82 L246 82 L246 96 L160 96 Z" fill={BONE} />
      <path d="M192 96 L214 96 L214 226" stroke={BONE_SHADE} strokeWidth="3" fill="none" />
    </g>
  ),
  'flat-iron': (seed) => (
    <g>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(0 ${i * 62})`}>
          <rect x="96" y="102" width="212" height="48" rx="22" fill={LEAN_DARK} transform="translate(3 5)" opacity="0.6" />
          <rect x="96" y="102" width="212" height="48" rx="22" fill={LEAN} />
          <path d="M104 126 C150 120 250 132 300 126" stroke={MARBLE} strokeOpacity="0.55" strokeWidth="2.5" fill="none" />
          <path
            d={`M${120 + (seed % 30)} 112 q 10 4 20 0 M${200 + (seed % 20)} 138 q 12 -3 22 2`}
            stroke={MARBLE}
            strokeOpacity="0.45"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ))}
    </g>
  ),
  brisket: (seed, uid) => (
    <g>
      <path d="M86 196 C84 150 120 116 190 112 C262 108 318 130 320 176 C322 214 290 232 220 232 C150 232 88 230 86 196 Z" fill={LEAN_DARK} />
      <path d="M86 186 C84 140 120 108 190 104 C262 100 318 120 320 166 C322 204 290 222 220 222 C150 222 88 220 86 186 Z" fill={LEAN} />
      <path d="M150 112 C190 92 270 96 312 140 C290 132 220 124 170 136 Z" fill={FAT} />
      <clipPath id={`${uid}-clip`}>
        <path d="M86 186 C84 140 120 108 190 104 C262 100 318 120 320 166 C322 204 290 222 220 222 C150 222 88 220 86 186 Z" />
      </clipPath>
      <Marbling x={90} y={130} w={220} h={90} n={26} seed={seed} clip={`${uid}-clip`} />
    </g>
  ),
  'short-ribs': () => (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 70} ${i % 2 ? 10 : 0})`}>
          <rect x="102" y="98" width="58" height="118" rx="12" fill={LEAN_DARK} transform="translate(3 5)" opacity="0.6" />
          <rect x="102" y="98" width="58" height="118" rx="12" fill={LEAN} />
          <rect x="102" y="98" width="58" height="22" rx="10" fill={FAT} />
          <rect x="112" y="190" width="38" height="34" rx="8" fill={BONE} />
          <path d="M108 150 q 20 -6 46 4 M108 170 q 22 4 46 -2" stroke={MARBLE} strokeOpacity="0.5" strokeWidth="2.5" fill="none" />
        </g>
      ))}
    </g>
  ),
  roast: () => (
    <g>
      <rect x="110" y="104" width="190" height="110" rx="55" fill={LEAN_DARK} />
      <rect x="110" y="96" width="190" height="104" rx="52" fill={LEAN} />
      <path d="M140 104 C170 96 240 96 270 104" stroke={FAT} strokeWidth="10" fill="none" strokeLinecap="round" />
      {[150, 190, 230, 266].map((x) => (
        <path key={x} d={`M${x} 98 C${x - 6} 140 ${x - 6} 170 ${x} 210`} stroke="#F8F1E4" strokeWidth="3.5" fill="none" />
      ))}
    </g>
  ),
  ground: (seed) => (
    <g>
      <ellipse cx="204" cy="196" rx="104" ry="30" fill={LEAN_DARK} opacity="0.55" />
      <path d="M108 190 C112 136 160 108 206 108 C254 108 298 138 300 190 Z" fill={LEAN} />
      {Array.from({ length: 70 }, (_, i) => {
        const a = ((seed + i * 47) % 360) * (Math.PI / 180)
        const rr = ((i * 37 + seed) % 88) + 4
        const x = 204 + Math.cos(a) * rr
        const y = 168 + Math.sin(a) * rr * 0.55
        return y < 190 ? <circle key={i} cx={x} cy={y} r={i % 3 ? 2.6 : 3.4} fill={i % 4 ? '#C24A4F' : MARBLE} opacity="0.8" /> : null
      })}
    </g>
  ),
  patties: () => (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 14} ${-i * 26})`}>
          <ellipse cx="190" cy="214" rx="86" ry="28" fill={LEAN_DARK} />
          <rect x="104" y="198" width="172" height="16" fill={LEAN_DARK} />
          <ellipse cx="190" cy="198" rx="86" ry="28" fill={LEAN} />
          {[-40, -12, 18, 46].map((dx) => (
            <circle key={dx} cx={190 + dx} cy={196 + (dx % 3)} r="2.6" fill={MARBLE} opacity="0.6" />
          ))}
        </g>
      ))}
    </g>
  ),
  stew: (seed) => (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const x = 120 + (i % 3) * 58 + ((seed >> i) % 12)
        const y = 110 + Math.floor(i / 3) * 44 + ((seed >> (i + 2)) % 10)
        return (
          <g key={i} transform={`rotate(${((seed >> i) % 30) - 15} ${x + 20} ${y + 18})`}>
            <rect x={x} y={y + 4} width="42" height="36" rx="8" fill={LEAN_DARK} />
            <rect x={x} y={y} width="42" height="36" rx="8" fill={LEAN} />
            {i % 3 === 0 && <rect x={x} y={y} width="42" height="9" rx="4" fill={FAT} />}
          </g>
        )
      })}
    </g>
  ),
  bones: () => (
    <g>
      {[
        [140, 160, 46],
        [236, 132, 38],
        [258, 214, 34],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx + 3} cy={cy + 6} r={r} fill={BONE_SHADE} />
          <circle cx={cx} cy={cy} r={r} fill={BONE} />
          <circle cx={cx} cy={cy} r={r * 0.55} fill={MARROW} />
          <circle cx={cx - r * 0.15} cy={cy - r * 0.15} r={r * 0.2} fill="#E0B088" />
        </g>
      ))}
    </g>
  ),
}

export function CutImage({
  cut,
  seed = cut,
  photos,
  alt,
  className,
}: {
  cut: CutId
  seed?: string
  photos?: string[]
  alt: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  if (photos?.length) return <img src={photos[0]} alt={alt} className={cn('size-full object-cover', className)} />
  const h = hash(seed)
  const tilt = (h % 9) - 4
  return (
    <svg
      viewBox="0 0 400 300"
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
      className={cn('size-full', className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="300" fill="#2F2926" />
      <rect width="400" height="300" fill={`url(#${uid}-sheen)`} />
      <defs>
        <radialGradient id={`${uid}-sheen`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      {/* Butcher paper */}
      <g transform={`rotate(${tilt} 200 160)`}>
        <rect x="64" y="58" width="272" height="196" rx="4" fill="#E4D3B6" />
        <path d="M64 58 L336 58 L336 66 C250 70 150 62 64 70 Z" fill="#D6C2A0" opacity="0.6" />
      </g>
      <g transform={`rotate(${tilt / 2} 200 160)`}>{DRAW[cut](h, uid)}</g>
      {/* Rosemary */}
      <g transform={`translate(${300 + (h % 20)} ${40 + (h % 16)}) rotate(${30 + (h % 25)})`}>
        <path d="M0 0 L0 86" stroke="#5B6B3A" strokeWidth="2.5" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <ellipse cx="-7" cy={8 + i * 9} rx="8" ry="2.6" fill="#6F8447" transform={`rotate(-30 -7 ${8 + i * 9})`} />
            <ellipse cx="7" cy={12 + i * 9} rx="8" ry="2.6" fill="#7D9452" transform={`rotate(30 7 ${12 + i * 9})`} />
          </g>
        ))}
      </g>
      {/* Salt and pepper */}
      {Array.from({ length: 14 }, (_, i) => (
        <circle
          key={i}
          cx={30 + ((h >> (i % 16)) % 60) + i * 2}
          cy={210 + ((h >> ((i + 3) % 16)) % 60)}
          r={i % 3 ? 1.6 : 2.2}
          fill={i % 3 ? '#F4EFE6' : '#1A1614'}
          opacity="0.9"
        />
      ))}
    </svg>
  )
}
