import Papa from 'papaparse'
import type { CutCategory, CutExtra, CutSheet, CutStyle, Primal, PrimalChoice, ShareSize, SteakThickness } from '@/data/beefTypes'
import { SHARE_LABELS } from './yield'

/**
 * The cut sheet: how each primal (section of the carcass) is cut, and an
 * estimate of how many pounds of steaks, roasts, ground beef, and extras
 * that gives for a share. Pure functions, tested in cutSheet.test.ts.
 */

export interface PrimalInfo {
  id: Primal
  label: string
  /** What this part of the animal is */
  about: string
  /** Share of the carcass's take-home beef that comes from here */
  share: number
  /** The ways this primal can be cut, with what each gives you */
  styles: Partial<Record<CutStyle, { label: string; cuts: string; yields: Partial<Record<CutCategory, number>> }>>
}

export const PRIMALS: PrimalInfo[] = [
  {
    id: 'chuck',
    label: 'Chuck',
    about: 'The shoulder. Well-worked, full of flavor, and the source of the best pot roasts and burgers.',
    share: 0.26,
    styles: {
      steaks: { label: 'Steaks', cuts: 'Flat iron, chuck eye, and Denver steaks; the rest ground', yields: { steak: 0.35, ground: 0.65 } },
      roasts: { label: 'Roasts', cuts: 'Chuck roasts and arm roasts; trim ground', yields: { roast: 0.7, ground: 0.3 } },
      ground: { label: 'All ground', cuts: 'Ground beef', yields: { ground: 1 } },
    },
  },
  {
    id: 'rib',
    label: 'Rib',
    about: 'The most marbled section. Ribeyes, or keep it whole for a standing rib roast.',
    share: 0.09,
    styles: {
      steaks: { label: 'Ribeye steaks', cuts: 'Ribeye steaks, bone-in or boneless', yields: { steak: 0.9, ground: 0.1 } },
      roasts: { label: 'Prime rib roast', cuts: 'Standing rib roast', yields: { roast: 0.95, ground: 0.05 } },
    },
  },
  {
    id: 'loin',
    label: 'Short loin',
    about: 'Home of the strip and the tenderloin. The most tender steaks on the animal.',
    share: 0.08,
    styles: {
      steaks: { label: 'Steaks', cuts: 'T-bones and porterhouses, or strips and filets', yields: { steak: 0.9, ground: 0.1 } },
      roasts: { label: 'Tenderloin roast', cuts: 'Whole tenderloin and strip roast', yields: { roast: 0.85, ground: 0.15 } },
    },
  },
  {
    id: 'sirloin',
    label: 'Sirloin',
    about: 'Lean and beefy. Top sirloin steaks and the tri-tip come from here.',
    share: 0.08,
    styles: {
      steaks: { label: 'Steaks', cuts: 'Top sirloin steaks and tri-tip', yields: { steak: 0.75, ground: 0.25 } },
      roasts: { label: 'Roasts', cuts: 'Sirloin tip and tri-tip roasts', yields: { roast: 0.75, ground: 0.25 } },
      ground: { label: 'All ground', cuts: 'Ground beef', yields: { ground: 1 } },
    },
  },
  {
    id: 'round',
    label: 'Round',
    about: 'The hind leg. Big and lean: roasts, round steaks, cube steak, or jerky meat.',
    share: 0.21,
    styles: {
      steaks: { label: 'Steaks', cuts: 'Round steaks and cube steaks', yields: { steak: 0.55, ground: 0.45 } },
      roasts: { label: 'Roasts', cuts: 'Rump, eye of round, and bottom round roasts', yields: { roast: 0.7, ground: 0.3 } },
      ground: { label: 'All ground', cuts: 'Ground beef', yields: { ground: 1 } },
    },
  },
  {
    id: 'brisket',
    label: 'Brisket',
    about: 'The chest. Smoke it whole, or grind it into rich burger.',
    share: 0.05,
    styles: {
      roasts: { label: 'Keep whole', cuts: 'Whole brisket (point and flat)', yields: { roast: 0.9, ground: 0.1 } },
      ground: { label: 'All ground', cuts: 'Ground beef', yields: { ground: 1 } },
    },
  },
  {
    id: 'plate',
    label: 'Plate',
    about: 'Below the rib. Skirt steak lives here; the rest is great ground beef.',
    share: 0.08,
    styles: {
      steaks: { label: 'Skirt steak', cuts: 'Skirt steak; the rest ground', yields: { steak: 0.25, ground: 0.75 } },
      ground: { label: 'All ground', cuts: 'Ground beef', yields: { ground: 1 } },
    },
  },
  {
    id: 'flank',
    label: 'Flank',
    about: 'A thin, flavorful cut for fajitas and London broil.',
    share: 0.03,
    styles: {
      steaks: { label: 'Flank steak', cuts: 'Flank steak', yields: { steak: 0.7, ground: 0.3 } },
      ground: { label: 'All ground', cuts: 'Ground beef', yields: { ground: 1 } },
    },
  },
  {
    id: 'shank',
    label: 'Shank',
    about: 'The front leg. Cross-cut for osso buco and soup, or ground.',
    share: 0.04,
    styles: {
      roasts: { label: 'Cross-cut shanks', cuts: 'Shank cross-cuts for braising', yields: { roast: 0.8, ground: 0.2 } },
      ground: { label: 'All ground', cuts: 'Ground beef', yields: { ground: 1 } },
    },
  },
]

/** Trim from every section that always goes to ground beef */
export const TRIM_SHARE = 1 - PRIMALS.reduce((n, p) => n + p.share, 0)

/** Skirt and flank steaks are whole muscles: no thickness or per-pack choice. */
export const WHOLE_MUSCLE: Primal[] = ['plate', 'flank']

export const primalInfo = (id: Primal) => PRIMALS.find((p) => p.id === id)!

export const STYLE_NAMES: Record<CutStyle, string> = { steaks: 'Steaks', roasts: 'Roasts or whole', ground: 'Ground' }

/** Thinnest first (object keys like '1' would otherwise sort ahead of '0.75') */
export const THICKNESSES: SteakThickness[] = ['0.75', '1', '1.25', '1.5']

export const THICKNESS_LABELS: Record<SteakThickness, string> = { '0.75': '¾"', '1': '1"', '1.25': '1¼"', '1.5': '1½"' }

/** Average steak weight by thickness, lb, for package counts */
const STEAK_LB: Record<SteakThickness, number> = { '0.75': 0.6, '1': 0.75, '1.25': 0.95, '1.5': 1.1 }

export const STEAKS_PER_PACK = [1, 2, 4] as const
export const ROAST_SIZES = [2, 3, 4] as const

export const EXTRAS: { id: CutExtra; label: string; hint: string }[] = [
  { id: 'soupBones', label: 'Soup & marrow bones', hint: 'For broth. Adds bones that are usually left behind.' },
  { id: 'shortRibs', label: 'Short ribs', hint: 'Cut from the plate and chuck instead of grinding them.' },
  { id: 'organs', label: 'Organ meats', hint: 'Liver, heart, tongue, and oxtail.' },
  { id: 'fat', label: 'Fat & suet', hint: 'For rendering tallow or making soap.' },
]

/** Extra pounds, as a share of take-home, that each extra adds (things otherwise left at the processor) */
const EXTRA_ADDS: Record<Exclude<CutExtra, 'shortRibs'>, number> = { soupBones: 0.03, organs: 0.025, fat: 0.02 }
/** Short ribs come out of the plate and chuck instead of going to ground */
const SHORT_RIB_SHARE = 0.03

const choice = (style: CutStyle, rest: Partial<PrimalChoice> = {}): PrimalChoice => ({ style, thickness: '1', steaksPerPack: 2, roastLb: 3, ...rest })

export interface Preset {
  id: string
  name: string
  description: string
  primals: Record<Primal, CutStyle>
  thickness: SteakThickness
  steaksPerPack: number
  roastLb: number
  groundPackLb: 1 | 2
  patties: boolean
  extras: Record<CutExtra, boolean>
}

export const PRESETS: Preset[] = [
  {
    id: 'butchers-choice',
    name: 'Butcher’s Choice',
    description: 'A balanced box the way our processor cuts it for most families.',
    primals: {
      chuck: 'roasts',
      rib: 'steaks',
      loin: 'steaks',
      sirloin: 'steaks',
      round: 'roasts',
      brisket: 'roasts',
      plate: 'ground',
      flank: 'steaks',
      shank: 'roasts',
    },
    thickness: '1',
    steaksPerPack: 2,
    roastLb: 3,
    groundPackLb: 1,
    patties: false,
    extras: { soupBones: true, shortRibs: false, organs: false, fat: false },
  },
  {
    id: 'steak-lover',
    name: 'Steak Lover',
    description: 'Every section that can be a steak, cut thick for the grill.',
    primals: {
      chuck: 'steaks',
      rib: 'steaks',
      loin: 'steaks',
      sirloin: 'steaks',
      round: 'steaks',
      brisket: 'ground',
      plate: 'steaks',
      flank: 'steaks',
      shank: 'ground',
    },
    thickness: '1.25',
    steaksPerPack: 2,
    roastLb: 3,
    groundPackLb: 1,
    patties: true,
    extras: { soupBones: false, shortRibs: true, organs: false, fat: false },
  },
  {
    id: 'family-freezer',
    name: 'Family Freezer',
    description: 'More ground beef for weeknight dinners, with steaks for the weekend.',
    primals: {
      chuck: 'ground',
      rib: 'steaks',
      loin: 'steaks',
      sirloin: 'steaks',
      round: 'ground',
      brisket: 'ground',
      plate: 'ground',
      flank: 'ground',
      shank: 'ground',
    },
    thickness: '1',
    steaksPerPack: 4,
    roastLb: 3,
    groundPackLb: 2,
    patties: true,
    extras: { soupBones: true, shortRibs: false, organs: false, fat: false },
  },
  {
    id: 'smoker-pack',
    name: 'Smoker Pack',
    description: 'Whole brisket, short ribs, and big roasts for low and slow.',
    primals: {
      chuck: 'roasts',
      rib: 'roasts',
      loin: 'steaks',
      sirloin: 'roasts',
      round: 'roasts',
      brisket: 'roasts',
      plate: 'ground',
      flank: 'steaks',
      shank: 'roasts',
    },
    thickness: '1.5',
    steaksPerPack: 2,
    roastLb: 4,
    groundPackLb: 1,
    patties: false,
    extras: { soupBones: false, shortRibs: true, organs: false, fat: true },
  },
]

export const presetById = (id: string) => PRESETS.find((p) => p.id === id)

/** Applies a preset to a sheet, keeping its name, link, and notes. */
export function applyPreset(sheet: CutSheet, preset: Preset): CutSheet {
  const primals = Object.fromEntries(
    PRIMALS.map((p) => [
      p.id,
      choice(preset.primals[p.id], { thickness: preset.thickness, steaksPerPack: preset.steaksPerPack, roastLb: preset.roastLb }),
    ]),
  ) as Record<Primal, PrimalChoice>
  return { ...sheet, primals, groundPackLb: preset.groundPackLb, patties: preset.patties, extras: { ...preset.extras }, preset: preset.id }
}

/** A new sheet, set up as Butcher's Choice. */
export function newCutSheet(size: ShareSize, link: Pick<CutSheet, 'claimId' | 'tagId'> = {}): CutSheet {
  const blank: CutSheet = {
    id: `cut-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: link.tagId ? `${SHARE_LABELS[size]} of ${link.tagId}` : `My ${SHARE_LABELS[size].toLowerCase()} share`,
    ...link,
    size,
    primals: {} as Record<Primal, PrimalChoice>,
    groundPackLb: 1,
    patties: false,
    extras: { soupBones: false, shortRibs: false, organs: false, fat: false },
    notes: '',
    updatedAt: new Date().toISOString(),
  }
  return applyPreset(blank, PRESETS[0])
}

// ---------------------------------------------------------------------------
// Estimate
// ---------------------------------------------------------------------------

export interface CutEstimate {
  /** Pounds by category */
  lb: Record<CutCategory, number>
  /** Of the ground beef, pounds made into patties */
  pattyLb: number
  /** Approximate package counts by category */
  packages: Record<CutCategory, number>
  total: number
  byPrimal: { id: Primal; lb: number; style: CutStyle }[]
}

/** Approximate pounds and packages for a sheet, given the share's take-home weight. Labeled "estimate" wherever shown. */
export function estimateCuts(sheet: CutSheet, takeHomeLb: number): CutEstimate {
  const lb: Record<CutCategory, number> = { steak: 0, roast: 0, ground: takeHomeLb * TRIM_SHARE, other: 0 }
  const byPrimal: CutEstimate['byPrimal'] = []

  for (const p of PRIMALS) {
    let primalLb = takeHomeLb * p.share
    const pick = sheet.primals[p.id]
    // Short ribs come out of the plate and chuck before the rest is cut.
    if (sheet.extras.shortRibs && (p.id === 'plate' || p.id === 'chuck')) {
      const ribs = takeHomeLb * (SHORT_RIB_SHARE / 2)
      lb.other += ribs
      primalLb -= ribs
    }
    const style = p.styles[pick.style] ? pick.style : (Object.keys(p.styles)[0] as CutStyle)
    for (const [cat, f] of Object.entries(p.styles[style]!.yields) as [CutCategory, number][]) lb[cat] += primalLb * f
    byPrimal.push({ id: p.id, lb: Math.round(primalLb), style })
  }

  for (const [extra, f] of Object.entries(EXTRA_ADDS) as [Exclude<CutExtra, 'shortRibs'>, number][]) {
    if (sheet.extras[extra]) lb.other += takeHomeLb * f
  }

  const rounded = { steak: Math.round(lb.steak), roast: Math.round(lb.roast), ground: Math.round(lb.ground), other: Math.round(lb.other) }
  // Package counts use the most common settings on the sheet.
  const steakPick = PRIMALS.map((p) => sheet.primals[p.id]).find((c) => c.style === 'steaks') ?? sheet.primals.rib
  const roastPick = PRIMALS.map((p) => sheet.primals[p.id]).find((c) => c.style === 'roasts') ?? sheet.primals.chuck
  const pattyLb = sheet.patties ? Math.round(rounded.ground * 0.3) : 0
  return {
    lb: rounded,
    pattyLb,
    packages: {
      steak: Math.round(rounded.steak / (STEAK_LB[steakPick.thickness] * steakPick.steaksPerPack)),
      roast: Math.round(rounded.roast / roastPick.roastLb),
      // Patties come 6 to a 2 lb pack
      ground: Math.round((rounded.ground - pattyLb) / sheet.groundPackLb + pattyLb / 2),
      other: Math.round(rounded.other / 2.5),
    },
    total: rounded.steak + rounded.roast + rounded.ground + rounded.other,
    byPrimal,
  }
}

// ---------------------------------------------------------------------------
// Processor instructions
// ---------------------------------------------------------------------------

/** One plain-language instruction per primal, for the printed sheet and CSV. */
export function primalInstruction(id: Primal, c: PrimalChoice) {
  const info = primalInfo(id)
  const style = info.styles[c.style] ?? Object.values(info.styles)[0]!
  if (c.style === 'steaks')
    return WHOLE_MUSCLE.includes(id)
      ? `${style.cuts.replace(/(;|$)/, ', left whole$1')}.`
      : `${style.cuts}. ${THICKNESS_LABELS[c.thickness]} thick, ${c.steaksPerPack} per pack.`
  if (c.style === 'roasts') return id === 'brisket' || id === 'shank' ? `${style.cuts}.` : `${style.cuts}, about ${c.roastLb} lb each.`
  return 'Grind.'
}

export function cutSheetRows(sheet: CutSheet) {
  return [
    ...PRIMALS.map((p) => ({ section: p.label, instructions: primalInstruction(p.id, sheet.primals[p.id]) })),
    {
      section: 'Ground beef',
      instructions: `${sheet.groundPackLb} lb packs.${sheet.patties ? ' Make about a third into ⅓ lb patties, 6 to a pack.' : ''}`,
    },
    ...EXTRAS.map((e) => ({ section: e.label, instructions: sheet.extras[e.id] ? 'Yes, keep' : 'No' })),
    ...(sheet.notes.trim() ? [{ section: 'Special instructions', instructions: sheet.notes.trim() }] : []),
  ]
}

export function cutSheetCsv(sheet: CutSheet, owner?: string) {
  const head = [
    { section: 'Cut sheet', instructions: sheet.name },
    { section: 'Share', instructions: `${SHARE_LABELS[sheet.size]}${sheet.tagId ? ` of ${sheet.tagId}` : ''}` },
    ...(owner ? [{ section: 'Owner', instructions: owner }] : []),
  ]
  return Papa.unparse([...head, ...cutSheetRows(sheet)])
}

export const cutSheetFileName = (sheet: CutSheet) =>
  `cut-sheet-${(sheet.tagId ?? sheet.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.csv`
