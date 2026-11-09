import { useId } from 'react'
import type { AnimalSex, CoatColor } from '@/data/types'
import { cn } from '@/lib/utils'

/**
 * Illustrated placeholder for cattle photos.
 *
 * Draws a side-view animal tinted by coat color on a pasture scene. When real
 * photos exist, pass them via `photos` and the photo is shown instead — no
 * other code needs to change.
 */
export interface CattleImageProps {
  coat: CoatColor
  /** Adds a bull's crest, a cow's udder, or a steer's sheath */
  sex?: AnimalSex
  /** Draws a calf at the cow's side (cow-calf pairs) */
  withCalf?: boolean
  /** Real photo URLs; the first one (or `photoIndex`) replaces the illustration */
  photos?: string[]
  photoIndex?: number
  /** Varies the pose, direction, and landscape so cards don't look identical */
  seed?: string
  pose?: 'standing' | 'grazing'
  alt: string
  className?: string
}

interface Palette {
  body: string
  shade: string
  muzzle: string
  /** White face / markings, if any */
  face?: string
  /** Hereford-style white brisket, belly, and switch */
  markings?: boolean
}

const WHITE = '#F3ECE0'

const PALETTES: Record<CoatColor, Palette> = {
  black: { body: '#25211E', shade: '#171412', muzzle: '#3B3431' },
  red: { body: '#8A3A20', shade: '#682B17', muzzle: '#C08B78' },
  hereford: { body: '#954220', shade: '#723118', muzzle: '#E2B4AA', face: WHITE, markings: true },
  'black-baldy': { body: '#25211E', shade: '#171412', muzzle: '#D6AAA1', face: WHITE },
  charolais: { body: '#E8DCC3', shade: '#CDBE9E', muzzle: '#DDB2A3' },
  smoke: { body: '#8D867C', shade: '#6D665D', muzzle: '#5C544E' },
}

const HOOF = '#2A2420'

function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Side-view shapes, facing left. The scene is 400×300 (4:3), from y = -40 to 260.
const SHAPES = {
  body: 'M112 110 C114 92 134 84 162 84 L266 82 C294 81 312 94 316 116 L318 148 C318 166 306 176 288 176 L156 178 C134 178 118 170 114 154 Z',
  neck: 'M164 86 C140 84 116 88 98 96 L84 128 C94 148 112 164 132 170 L156 154 Z',
  head: 'M103 94 C95 86 83 84 73 88 C63 92 53 108 45 122 C40 131 41 142 49 147 C57 152 68 150 75 143 C85 133 95 122 105 114 Z',
  ear: 'M96 97 C104 86 118 82 127 84 C121 94 109 100 99 103 Z',
  crest: 'M96 100 C110 74 142 68 172 84 L156 100 Z',
  legFrontNear: 'M128 160 L148 160 L146 206 L147 240 L133 240 L132 206 Z',
  legFrontFar: 'M152 162 L166 162 L164 238 L153 238 Z',
  legBackFar: 'M262 160 L278 160 L276 238 L264 238 Z',
  legBackNear: 'M280 140 L312 146 C308 170 301 188 300 204 L299 240 L285 240 L285 206 C282 188 280 166 280 140 Z',
  tail: 'M314 98 C328 120 328 162 322 202',
  switch: 'M316 198 C311 209 314 219 322 221 C330 219 331 207 326 198 Z',
  brisket: 'M97 126 C103 150 119 166 139 173 L150 160 C133 155 117 143 108 122 Z',
  belly: 'M180 175 C210 182 240 182 264 175 L264 171 C238 176 206 176 182 171 Z',
  sheath: 'M208 174 C212 186 226 186 232 176 Z',
  udder: 'M252 172 C252 186 278 188 282 172 Z',
}

const HOOVES: [number, number, number][] = [
  [133, 235, 14],
  [153, 233, 11],
  [264, 233, 12],
  [285, 235, 14],
]

/** The pivot where the neck meets the shoulders; the head rotates around it to graze. */
const NECK_PIVOT = '150 112'
/** Swing the head down to the grass and drop it slightly so the muzzle reaches the ground. */
const GRAZING_TRANSFORM = `translate(0 14) rotate(-55 ${NECK_PIVOT})`
/** Exact inverse of GRAZING_TRANSFORM, applied to the head's shading gradient. */
const GRAZING_INVERSE = `rotate(55 ${NECK_PIVOT}) translate(0 -14)`

interface AnimalShapeProps {
  palette: Palette
  sex?: AnimalSex
  grazing: boolean
  /** Shared top-light / bottom-shadow gradient */
  shade: string
}

/**
 * One animal, drawn in two passes: an outline pass underneath (strokes only),
 * then the filled shapes on top, so only the outer silhouette shows a line.
 */
function AnimalShape({ palette, sex, grazing, shade }: AnimalShapeProps) {
  const headTransform = grazing ? GRAZING_TRANSFORM : undefined
  // The head group is rotated when grazing; use the counter-rotated gradient so light still falls from above.
  const headShade = grazing ? shade.replace(')', '-head)') : shade

  const layers = (outline: boolean) => {
    // In the outline pass, fills are inherited ("none") from the parent group.
    const paint = (color: string) => (outline ? undefined : color)
    const shaded = (d: string, color: string, overlay = shade) => (
      <>
        <path d={d} fill={paint(color)} />
        {!outline && <path d={d} fill={overlay} />}
      </>
    )
    // Each leg is grouped with its hoof so it can swing as one piece when walking
    // (see .cattle-walking in index.css). Diagonal pairs share a phase.
    const leg = (d: string, hoof: number, color: string, withShade: boolean, phaseB: boolean) => {
      const [x, y, w] = HOOVES[hoof]
      return (
        <g className={phaseB ? 'leg leg-b' : 'leg'}>
          {withShade ? shaded(d, color) : <path d={d} fill={paint(color)} />}
          {!outline && <rect x={x} y={y} width={w} height="6" rx="2" fill={HOOF} />}
        </g>
      )
    }
    return (
      <>
        {leg(SHAPES.legFrontFar, 1, palette.shade, false, true)}
        {leg(SHAPES.legBackFar, 2, palette.shade, false, false)}
        <path d={SHAPES.tail} fill="none" stroke={outline ? undefined : palette.body} strokeWidth={outline ? 7.5 : 4.5} strokeLinecap="round" />
        <path d={SHAPES.switch} fill={paint(palette.markings ? WHITE : palette.shade)} />
        {shaded(SHAPES.body, palette.body)}
        {!outline && (
          <>
            {palette.markings && <path d={SHAPES.belly} fill={WHITE} />}
            {sex === 'cow' && <path d={SHAPES.udder} fill={palette.muzzle} />}
            {(sex === 'steer' || sex === 'bull') && <path d={SHAPES.sheath} fill={palette.shade} />}
          </>
        )}
        {leg(SHAPES.legBackNear, 3, palette.body, true, true)}
        {leg(SHAPES.legFrontNear, 0, palette.body, true, false)}
        {sex === 'bull' && !grazing && shaded(SHAPES.crest, palette.body)}
        <g transform={headTransform}>
          {shaded(SHAPES.neck, palette.body, headShade)}
          {!outline && palette.markings && <path d={SHAPES.brisket} fill={WHITE} />}
          <path d={SHAPES.ear} fill={paint(palette.shade)} />
          <path d={SHAPES.head} fill={paint(palette.face ?? palette.body)} />
          {!outline && (
            <>
              <ellipse cx="50" cy="140" rx="11" ry="9" transform="rotate(-30 50 140)" fill={palette.muzzle} />
              <ellipse cx="45" cy="139" rx="2.2" ry="3" fill={HOOF} opacity="0.7" />
              <circle cx="76" cy="106" r="3.4" fill={HOOF} />
              <circle cx="77" cy="105" r="1" fill="#fff" opacity="0.8" />
              <g transform="rotate(-12 114 100)">
                <rect x="108" y="96" width="12" height="14" rx="3" className="fill-tag" />
                <circle cx="114" cy="99" r="1.3" className="fill-tag-foreground" opacity="0.5" />
              </g>
            </>
          )}
        </g>
      </>
    )
  }

  return (
    <g>
      <g fill="none" className="stroke-foreground/25" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {layers(true)}
      </g>
      {layers(false)}
    </g>
  )
}

/** Top-light / bottom-shadow gradients shared by an animal's shapes. */
function ShadeDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="82" x2="0" y2="228">
        <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient
        id={`${id}-head`}
        href={`#${id}`}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="82"
        x2="0"
        y2="228"
        gradientTransform={GRAZING_INVERSE}
      />
    </defs>
  )
}

/**
 * Just the animal, as an SVG group in the 400×300 shape space (facing left,
 * hooves at y = 240), for placing inside another scene such as the chute.
 * Inside an element with the `cattle-walking` class its legs swing.
 */
export function CattleSprite({ coat, sex, grazing = false }: { coat: CoatColor; sex?: AnimalSex; grazing?: boolean }) {
  const id = `sprite-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <g className="walk-body">
      <ShadeDefs id={id} />
      <AnimalShape palette={PALETTES[coat]} sex={sex} grazing={grazing} shade={`url(#${id})`} />
    </g>
  )
}

export function CattleImage({ coat, sex, withCalf = false, photos, photoIndex = 0, seed = coat, pose, alt, className }: CattleImageProps) {
  const rawId = useId()
  const photo = photos?.[photoIndex]

  if (photo) {
    return <img src={photo} alt={alt} loading="lazy" className={cn('h-full w-full object-cover', className)} />
  }

  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const gradientId = `shade-${id}`
  const shade = `url(#${gradientId})`
  const h = hash(seed)
  const palette = PALETTES[coat]
  const flip = (h & 1) === 1
  // Bulls are shown standing so buyers see their build.
  const grazing = pose ? pose === 'grazing' : sex !== 'bull' && h % 5 === 0
  const sunX = 60 + (h % 280)
  const hillA = 136 + ((h >> 3) % 24)
  const hillB = 146 + ((h >> 7) % 22)

  return (
    <svg
      viewBox="0 -40 400 300"
      preserveAspectRatio="xMidYMid slice"
      // An empty alt marks the picture as decorative.
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn('h-full w-full', className)}
    >
      <ShadeDefs id={gradientId} />

      {/* Scene */}
      <rect y="-40" width="400" height="300" className="fill-scene-sky" />
      <circle cx={sunX} cy="26" r="24" className="fill-tag" opacity="0.3" />
      <path d={`M0 168 C80 ${hillA} 170 ${hillB} 250 156 C320 164 360 ${hillA + 4} 400 148 V260 H0 Z`} className="fill-scene-hill" />
      <g className="stroke-foreground/20" strokeWidth="2.5">
        {[24, 84, 144, 204, 264, 324, 384].map((x) => (
          <line key={x} x1={x} y1="160" x2={x} y2="190" />
        ))}
        <line x1="0" y1="168" x2="400" y2="166" strokeWidth="1.2" />
        <line x1="0" y1="178" x2="400" y2="176" strokeWidth="1.2" />
      </g>
      <path d="M0 196 C120 186 280 190 400 184 V260 H0 Z" className="fill-scene-ground" />
      <ellipse cx={withCalf ? 190 : 205} cy="232" rx="128" ry="7" className="fill-foreground/15" />

      <g transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>
        <g transform={`translate(${withCalf ? 6 : 22} -9)`}>
          <AnimalShape palette={palette} sex={sex} grazing={grazing} shade={shade} />
        </g>
        {withCalf && (
          <g transform="translate(222 116) scale(0.5)">
            <ellipse cx="200" cy="242" rx="120" ry="8" className="fill-foreground/15" />
            <AnimalShape palette={palette} grazing={false} shade={shade} />
          </g>
        )}
      </g>
    </svg>
  )
}
