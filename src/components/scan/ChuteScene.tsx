import type { CSSProperties } from 'react'
import { CattleSprite } from '@/components/cattle/CattleImage'
import type { Animal } from '@/data/types'
import { CYCLE, phaseAt, TIMING } from '@/lib/chuteScan'
import { SEX_LABELS } from '@/lib/labels'

/**
 * The camera tunnel, side view. Cattle wait in the alley on the left, walk
 * into the tunnel one at a time, get swept by the scan line, photographed,
 * and have their ear tag read, then trot out to the right.
 *
 * Everything is a pure function of `elapsed` (simulated ms), so pausing and
 * changing speed are just a matter of how fast `elapsed` advances.
 */

// Scene geometry, in viewBox units (1200 × 420).
const W = 1200
const H = 420
const GROUND = 362
const CENTER = 600
const SPACING = 330
const EXIT = 820
/** Sprite scale and placement: the shape space is 400 wide with hooves at y = 240. */
const S = 0.86
const SPRITE_Y = GROUND - S * 240
const SPRITE_MID = 185

/** Shape-space point → scene point, for an animal centered at `cx` and facing right. */
const at = (cx: number, x: number, y: number) => ({
  x: cx + S * (SPRITE_MID - x),
  y: SPRITE_Y + S * y,
})

const BOX = { left: 334, right: 36, top: 76, bottom: 244 }

const KEYPOINTS = {
  nose: [46, 140],
  poll: [92, 90],
  withers: [168, 84],
  hip: [284, 84],
  tail: [316, 100],
  shoulder: [128, 124],
  elbow: [142, 164],
  frontHoof: [140, 238],
  stifle: [296, 152],
  hock: [293, 204],
  rearHoof: [292, 238],
} as const
type Keypoint = keyof typeof KEYPOINTS

const BONES: [Keypoint, Keypoint][] = [
  ['nose', 'poll'],
  ['poll', 'withers'],
  ['withers', 'hip'],
  ['hip', 'tail'],
  ['withers', 'shoulder'],
  ['shoulder', 'elbow'],
  ['elbow', 'frontHoof'],
  ['hip', 'stifle'],
  ['stifle', 'hock'],
  ['hock', 'rearHoof'],
]

const EAR_TAG = [114, 103] as const
const CAMERAS = [510, 600, 690]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
const easeIn = (t: number) => t * t

export interface ScenePlacement {
  index: number
  cx: number
  walking: boolean
  /** Exiting animals trot */
  trotting: boolean
  opacity: number
}

/** Where every visible animal stands at this moment. */
function placeAnimals(total: number, elapsed: number, reduce: boolean, view: { min: number; max: number }): ScenePlacement[] {
  const active = Math.floor(elapsed / CYCLE)
  const intoCycle = elapsed - active * CYCLE
  const shuffle = clamp01(intoCycle / TIMING.walkIn)
  const placements: ScenePlacement[] = []

  for (let i = 0; i < total; i++) {
    if (i >= active) {
      // In the alley or walking in: everyone moves up one slot during the walk-in.
      const slot = i - active + 1 - easeInOut(shuffle)
      if (reduce) {
        if (i !== active) continue
        placements.push({
          index: i,
          cx: CENTER,
          walking: false,
          trotting: false,
          opacity: shuffle,
        })
        continue
      }
      const cx = CENTER - SPACING * slot
      if (cx + 150 < view.min) continue
      placements.push({
        index: i,
        cx,
        walking: shuffle < 1 && intoCycle > 0,
        trotting: false,
        opacity: 1,
      })
    } else if (i === active - 1 && intoCycle < TIMING.walkOut) {
      const p = intoCycle / TIMING.walkOut
      if (reduce) {
        placements.push({
          index: i,
          cx: CENTER,
          walking: false,
          trotting: false,
          opacity: 1 - p,
        })
        continue
      }
      const cx = CENTER + EXIT * easeIn(p)
      if (cx - 150 > view.max) continue
      placements.push({
        index: i,
        cx,
        walking: true,
        trotting: true,
        opacity: 1,
      })
    }
  }
  return placements
}

function Scenery() {
  return (
    <g aria-hidden>
      <rect width={W} height={H} className="fill-scene-sky" />
      <circle cx="170" cy="62" r="30" className="fill-tag" opacity="0.28" />
      <path d="M0 250 C160 214 300 236 470 222 C640 208 820 236 980 218 C1080 208 1150 224 1200 220 V420 H0 Z" className="fill-scene-hill" />

      {/* Barn 2, behind the pens */}
      <g transform="translate(900 120)">
        <path d="M0 70 L30 22 L110 0 L190 22 L220 70 V200 H0 Z" className="fill-primary" opacity="0.82" />
        <path d="M0 70 L30 22 L110 0 L190 22 L220 70" fill="none" className="stroke-card" strokeWidth="4" strokeLinejoin="round" opacity="0.8" />
        <rect x="76" y="110" width="68" height="90" className="fill-leather" opacity="0.35" />
        <path d="M76 110 L144 200 M144 110 L76 200" className="stroke-card" strokeWidth="3" opacity="0.7" />
        <rect x="76" y="110" width="68" height="90" fill="none" className="stroke-card" strokeWidth="3" opacity="0.7" />
        <rect x="96" y="44" width="28" height="28" rx="2" className="fill-card" opacity="0.75" />
        <text x="110" y="66" textAnchor="middle" className="fill-primary font-heading" fontSize="22" fontWeight="700">
          2
        </text>
      </g>

      {/* Ground and the dirt alley */}
      <rect y="300" width={W} height="120" className="fill-scene-ground" />
      <path d={`M0 ${GROUND - 14} H${W} V${GROUND + 18} H0 Z`} className="fill-foreground/8" />

      {/* Back rails of the alley, behind the cattle */}
      <g className="stroke-foreground/30" strokeLinecap="round">
        {[236, 270, 304].map((y) => (
          <line key={y} x1="0" y1={y} x2={W} y2={y} strokeWidth="5" />
        ))}
        {[60, 210, 360, 840, 990, 1140].map((x) => (
          <line key={x} x1={x} y1="226" x2={x} y2={GROUND - 8} strokeWidth="7" />
        ))}
      </g>
    </g>
  )
}

/** Rails on the near side of the alley; left open where the cameras look in. */
function FrontRails() {
  const runs: [number, number][] = [
    [0, 440],
    [760, W],
  ]
  return (
    <g aria-hidden className="stroke-foreground/45" strokeLinecap="round">
      {runs.map(([a, b]) => [296, 330].map((y) => <line key={`${a}-${y}`} x1={a} y1={y} x2={b} y2={y} strokeWidth="5" />))}
      {[110, 260, 410, 790, 940, 1090].map((x) => (
        <line key={x} x1={x} y1="284" x2={x} y2={GROUND + 10} strokeWidth="8" />
      ))}
    </g>
  )
}

function Tunnel({ live, reading, flash }: { live: boolean; reading: number; flash: number }) {
  return (
    <g aria-hidden>
      {/* Posts */}
      {[444, 742].map((x) => (
        <rect key={x} x={x} y="96" width="14" height={GROUND - 90} rx="3" className="fill-leather" />
      ))}
      {/* Camera housing */}
      <rect x="430" y="74" width="340" height="34" rx="7" className="fill-leather" />
      <text x="600" y="97" textAnchor="middle" className="fill-leather-foreground font-heading" fontSize="17" fontWeight="700" opacity="0.85">
        Chute camera tunnel
      </text>
      {CAMERAS.map((x, i) => (
        <g key={x} transform={`translate(${x} 108)`}>
          <rect x="-18" y="0" width="36" height="22" rx="5" className="fill-leather" />
          <circle cy="13" r="6.5" className="fill-foreground" />
          <circle cx="-2" cy="11" r="2" className="fill-card" opacity="0.7" />
          <circle
            cx="13"
            cy="5"
            r="2.6"
            className={live ? 'fill-success' : 'fill-leather-foreground/40'}
            opacity={live ? 0.6 + 0.4 * Math.abs(Math.sin(i + flash * 6)) : 1}
          />
        </g>
      ))}
      {/* RFID panel on the exit post */}
      <g transform="translate(728 206)">
        <rect x="0" y="0" width="30" height="50" rx="5" className="fill-leather" />
        <path
          d="M9 18 a8 8 0 0 1 12 0 M6 13 a13 13 0 0 1 18 0"
          fill="none"
          className="stroke-leather-foreground/70"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="15" cy="23" r="2.4" className={reading > 0 ? 'fill-tag' : 'fill-leather-foreground/60'} />
        <text x="15" y="42" textAnchor="middle" className="fill-leather-foreground/70" fontSize="9" fontWeight="700">
          RFID
        </text>
      </g>
    </g>
  )
}

function Brackets({ x1, y1, x2, y2, opacity }: { x1: number; y1: number; x2: number; y2: number; opacity: number }) {
  const l = 22
  const d = [
    `M${x1} ${y1 + l} V${y1} H${x1 + l}`,
    `M${x2 - l} ${y1} H${x2} V${y1 + l}`,
    `M${x2} ${y2 - l} V${y2} H${x2 - l}`,
    `M${x1 + l} ${y2} H${x1} V${y2 - l}`,
  ].join(' ')
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} className="stroke-leather" strokeWidth="7" opacity="0.55" />
      <path d={d} className="stroke-tag" strokeWidth="4" />
    </g>
  )
}

/** Engineering-drawing style dimension line with end ticks and a label. */
function Dimension({
  from,
  to,
  label,
  vertical,
  opacity,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  label: string
  vertical?: boolean
  opacity: number
}) {
  const tick = 7
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  return (
    <g opacity={opacity}>
      <g className="stroke-foreground" strokeWidth="1.5">
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeDasharray="5 4" />
        {vertical ? (
          <>
            <line x1={from.x - tick} y1={from.y} x2={from.x + tick} y2={from.y} />
            <line x1={to.x - tick} y1={to.y} x2={to.x + tick} y2={to.y} />
          </>
        ) : (
          <>
            <line x1={from.x} y1={from.y - tick} x2={from.x} y2={from.y + tick} />
            <line x1={to.x} y1={to.y - tick} x2={to.x} y2={to.y + tick} />
          </>
        )}
      </g>
      <g transform={`translate(${mid.x} ${mid.y})`}>
        <rect
          x={vertical ? -84 : -54}
          y="-13"
          width="108"
          height="26"
          rx="5"
          className="fill-card"
          opacity="0.92"
          transform={vertical ? 'translate(-6 0)' : undefined}
        />
        <text
          x={vertical ? -36 : 0}
          y="5.5"
          textAnchor="middle"
          className="fill-foreground"
          fontSize="15"
          fontWeight="600"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {label}
        </text>
      </g>
    </g>
  )
}

/** Hip height and body length implied by frame score and age (illustrative only). */
function measurements(animal: Animal) {
  const ageMonths = (Date.parse('2026-11-06') - Date.parse(animal.birthDate)) / (30.4 * 86_400_000)
  const hip = 33 + animal.frameScore * 1.9 + Math.min(ageMonths, 24) * 0.33
  const length = hip * 1.27 + animal.bcs * 0.4
  return { hip: hip.toFixed(1), length: length.toFixed(1) }
}

/** Scan line, skeleton, brackets, tag read, and labels for the animal in the tunnel. */
function ScanOverlay({ animal, cx, elapsed, index, reduce }: { animal: Animal; cx: number; elapsed: number; index: number; reduce: boolean }) {
  const { phase, progress } = phaseAt(index, elapsed)
  if (phase === 'queued' || phase === 'walk-in' || phase === 'gone') return null

  const order = ['scan', 'flash', 'read', 'fill', 'walk-out'] as const
  const step = order.indexOf(phase as (typeof order)[number])
  const past = (p: (typeof order)[number]) => step > order.indexOf(p)
  const fade = phase === 'walk-out' ? 1 - clamp01(progress / 0.3) : 1
  if (fade <= 0) return null

  const tl = at(cx, BOX.left, BOX.top)
  const br = at(cx, BOX.right, BOX.bottom)
  const box = { x1: tl.x - 6, y1: tl.y - 6, x2: br.x + 6, y2: br.y + 4 }

  // The scan line sweeps tail to head (left to right on screen).
  const sweep = phase === 'scan' ? easeInOut(progress) : 1
  const sweepX = box.x1 + (box.x2 - box.x1) * sweep
  const bracketIn = phase === 'scan' ? clamp01(progress / 0.2) : 1

  const points = Object.fromEntries(
    (Object.keys(KEYPOINTS) as Keypoint[]).map((k) => {
      const [kx, ky] = KEYPOINTS[k]
      const p = at(cx, kx, ky)
      // A point appears once the line has passed it.
      const seen = phase !== 'scan' || p.x <= sweepX
      return [k, { ...p, seen }]
    }),
  ) as Record<Keypoint, { x: number; y: number; seen: boolean }>

  const ear = at(cx, EAR_TAG[0], EAR_TAG[1])
  const readP = phase === 'read' ? progress : past('read') ? 1 : 0
  const tagChars = Math.round(animal.tagId.length * clamp01(readP / 0.7))
  const calloutY = 150
  const fillP = phase === 'fill' ? progress : past('fill') ? 1 : 0
  const dims = measurements(animal)
  // Climbs from a first rough read to the final confidence.
  const confidence = (72 + (animal.scanConfidence - 72) * clamp01(fillP / 0.6)).toFixed(1)

  const hipTop = at(cx, 284, 84)
  const hipFoot = at(cx, 284, 240)
  const lenFrom = at(cx, 318, 64)
  const lenTo = at(cx, 112, 64)

  return (
    <g aria-hidden opacity={fade}>
      {/* Camera fields of view */}
      {phase === 'scan' &&
        CAMERAS.map((x) => (
          <path
            key={x}
            d={`M${x} 128 L${x - 70} ${GROUND} L${x + 70} ${GROUND} Z`}
            className="fill-tag"
            opacity={0.1 + 0.06 * Math.sin(progress * 20)}
          />
        ))}

      {/* Scanned area and the line itself */}
      {phase === 'scan' && (
        <>
          <rect x={box.x1} y={box.y1} width={Math.max(0, sweepX - box.x1)} height={box.y2 - box.y1} className="fill-primary" opacity="0.1" />
          {!reduce && <line x1={sweepX} y1="128" x2={sweepX} y2={GROUND + 6} className="stroke-primary" strokeWidth="12" opacity="0.22" />}
          <line x1={sweepX} y1="128" x2={sweepX} y2={GROUND + 6} className="stroke-primary" strokeWidth="3" />
        </>
      )}

      <Brackets {...box} opacity={bracketIn} />

      {/* Pose points and the lines between them */}
      <g className="stroke-tag" strokeWidth="2.5" opacity="0.95">
        {BONES.filter(([a, b]) => points[a].seen && points[b].seen).map(([a, b]) => (
          <line key={`${a}-${b}`} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} />
        ))}
      </g>
      {Object.entries(points)
        .filter(([, p]) => p.seen)
        .map(([k, p]) => (
          <circle key={k} cx={p.x} cy={p.y} r="5" className="fill-tag stroke-leather" strokeWidth="2" />
        ))}

      {/* Measurements, once the readings are in */}
      {fillP > 0 && (
        <>
          <Dimension from={hipTop} to={hipFoot} label={`Hip ${dims.hip} in`} vertical opacity={clamp01(fillP / 0.25)} />
          <Dimension from={lenFrom} to={lenTo} label={`Length ${dims.length} in`} opacity={clamp01((fillP - 0.1) / 0.25)} />
        </>
      )}

      {/* Ear tag read: radio rings, then a callout with the number typing in */}
      {readP > 0 && (
        <>
          {phase === 'read' &&
            !reduce &&
            [0, 0.33, 0.66].map((delay) => {
              const r = clamp01((progress - delay) / 0.45)
              return r > 0 && r < 1 ? (
                <circle key={delay} cx={ear.x} cy={ear.y} r={8 + r * 36} fill="none" className="stroke-tag" strokeWidth="3" opacity={1 - r} />
              ) : null
            })}
          <line x1={ear.x} y1={ear.y - 8} x2={ear.x} y2={calloutY + 34} className="stroke-leather" strokeWidth="2" />
          <circle cx={ear.x} cy={ear.y} r="7" fill="none" className="stroke-leather" strokeWidth="2.5" />
          <g transform={`translate(${ear.x} ${calloutY})`} opacity={clamp01(readP / 0.15)}>
            <path
              d="M-78 34 V14 Q-78 -6 -50 -6 H50 Q78 -6 78 14 V34 Q78 38 74 38 H-74 Q-78 38 -78 34 Z"
              className="fill-tag stroke-leather"
              strokeWidth="2.5"
            />
            <circle cy="3" r="3.5" className="fill-tag-foreground" opacity="0.35" />
            <text
              y="30"
              textAnchor="middle"
              className="fill-tag-foreground font-heading"
              fontSize="25"
              fontWeight="700"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {animal.tagId.slice(0, tagChars)}
              {tagChars < animal.tagId.length && <tspan opacity="0.5">_</tspan>}
            </text>
          </g>
        </>
      )}

      {/* Detection label on the box */}
      {fillP > 0 && (
        <g transform={`translate(${box.x1} ${box.y2 + 8})`} opacity={clamp01(fillP / 0.2)}>
          <rect width="206" height="30" rx="5" className="fill-leather" />
          <text x="12" y="21" className="fill-leather-foreground" fontSize="16" fontWeight="600" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {SEX_LABELS[animal.sex]} detected, {confidence}%
          </text>
        </g>
      )}
    </g>
  )
}

export function ChuteScene({
  batch,
  elapsed,
  running,
  speed,
  reduce,
  compact,
}: {
  batch: Animal[]
  elapsed: number
  running: boolean
  speed: number
  reduce: boolean
  /** Phones: crop to the tunnel */
  compact: boolean
}) {
  const view = compact ? { min: 330, max: 870 } : { min: 0, max: W }
  const placements = placeAnimals(batch.length, elapsed, reduce, view)
  const active = Math.floor(elapsed / CYCLE)
  const current = active < batch.length ? phaseAt(active, elapsed) : null
  const flash = current?.phase === 'flash' && !reduce ? current.progress : 0
  const flashOpacity = flash ? (flash < 0.2 ? flash / 0.2 : 1 - (flash - 0.2) / 0.8) * 0.85 : 0
  const live = Boolean(current && ['scan', 'flash', 'read', 'fill'].includes(current.phase))
  const reading = current?.phase === 'read' ? current.progress : 0

  // The animal in the tunnel, or the one just leaving it, gets the overlay.
  const overlayIndex = current && current.phase !== 'walk-in' ? active : active - 1
  const overlayPlacement = placements.find((p) => p.index === overlayIndex)

  return (
    <svg viewBox={`${view.min} 0 ${view.max - view.min} ${H}`} className="block h-auto w-full" aria-hidden>
      <Scenery />
      <Tunnel live={live} reading={reading} flash={flash} />

      {placements.map((p) => {
        const a = batch[p.index]
        const stride = (p.trotting ? 0.3 : 0.44) / speed
        return (
          <g
            key={a.tagId}
            opacity={p.opacity}
            className={p.walking && running && !reduce ? 'cattle-walking' : undefined}
            style={{ '--stride': `${stride}s` } as CSSProperties}
          >
            <ellipse cx={p.cx} cy={GROUND + 2} rx="128" ry="8" className="fill-foreground/15" />
            <g transform={`translate(${p.cx + S * SPRITE_MID} ${SPRITE_Y}) scale(${-S} ${S})`}>
              <CattleSprite coat={a.coatColor} sex={a.sex} />
            </g>
          </g>
        )
      })}

      <FrontRails />

      {overlayPlacement && (
        <ScanOverlay animal={batch[overlayIndex]} cx={overlayPlacement.cx} elapsed={elapsed} index={overlayIndex} reduce={reduce} />
      )}

      {flashOpacity > 0 && <rect x={view.min} width={view.max - view.min} height={H} fill="#fff" opacity={flashOpacity} />}
    </svg>
  )
}
