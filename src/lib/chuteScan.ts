import Papa from 'papaparse'
import { ranch } from '@/config/ranch'
import { buildAnimal, CHUTE_STATION, COMMERCIAL_SIRES, DEMO_TODAY, type HerdGroup } from '@/data/animals'
import type { Animal } from '@/data/types'
import { COAT_LABELS, SEX_LABELS } from './labels'

/**
 * Everything behind the chute scan demo that isn't drawing: which cattle walk
 * through, the timing of each pass, the CSV file, and the suggested lot.
 */

// ---------------------------------------------------------------------------
// Groups that can be run through the chute
// ---------------------------------------------------------------------------

export type ScanGroupId = 'steer-calves' | 'heifer-calves' | 'yearling-steers'

interface ScanGroup {
  id: ScanGroupId
  label: string
  /** Where these cattle wait after the scan; becomes the lot's pasture */
  pen: string
  herd: Omit<HerdGroup, 'tags' | 'notes'>
}

export const SCAN_GROUPS: ScanGroup[] = [
  {
    id: 'steer-calves',
    label: 'Steer calves',
    pen: 'Barn 2 pens',
    herd: {
      breed: 'Angus cross',
      sex: 'steer',
      coat: ['black', 'black', 'black-baldy', 'black', 'red', 'black', 'smoke', 'black-baldy'],
      born: ['2026-02-26', '2026-04-08'],
      weight: [522, 618],
      frame: [5, 6],
      bcs: [5, 6],
      program: 'calf',
      weanDate: '2026-09-18',
      lastScan: DEMO_TODAY,
      sires: COMMERCIAL_SIRES,
    },
  },
  {
    id: 'heifer-calves',
    label: 'Heifer calves',
    pen: 'Barn 2 pens',
    herd: {
      breed: 'Angus cross',
      sex: 'heifer',
      coat: ['black', 'black-baldy', 'black', 'red', 'black', 'black-baldy'],
      born: ['2026-02-20', '2026-04-02'],
      weight: [486, 574],
      frame: [5, 5],
      bcs: [5, 6],
      program: 'calf',
      weanDate: '2026-09-18',
      lastScan: DEMO_TODAY,
      sires: COMMERCIAL_SIRES,
    },
  },
  {
    id: 'yearling-steers',
    label: 'Yearling steers',
    pen: 'South trap',
    herd: {
      breed: 'Angus',
      sex: 'steer',
      coat: ['black', 'black', 'black', 'black-baldy'],
      born: ['2025-03-01', '2025-04-10'],
      weight: [784, 872],
      frame: [6, 6],
      bcs: [5, 6],
      program: 'yearling',
      weanDate: '2025-09-12',
      lastScan: DEMO_TODAY,
      sires: COMMERCIAL_SIRES,
    },
  },
]

export const scanGroup = (id: ScanGroupId) => SCAN_GROUPS.find((g) => g.id === id)!

export const HEAD_COUNTS = [5, 8, 12, 20] as const
export const SPEEDS = [1, 2, 4] as const

/** Below this camera confidence the animal should go through again before it's sold. */
export const RESCAN_BELOW = 92

/**
 * The next free ear-tag numbers, starting after the ranch's current calf crop.
 * Tag books skip the odd number (lost or retired tags), so a few are skipped too.
 */
function freeTags(count: number, taken: Set<string>, start = 2470) {
  const tags: number[] = []
  for (let n = start; tags.length < count; n++) {
    if (taken.has(`${ranch.tagPrefix}-${n}`)) continue
    // Deterministic skips so the numbers look like a real tag book.
    if (n % 7 === 3 || n % 11 === 5) continue
    tags.push(n)
  }
  return tags
}

/** A fresh set of animals for one run through the chute. */
export function generateScanBatch(groupId: ScanGroupId, count: number, existing: Animal[]): Animal[] {
  const group = scanGroup(groupId)
  const taken = new Set(existing.map((a) => a.tagId))
  const herd: HerdGroup = {
    ...group.herd,
    tags: freeTags(count, taken),
    notes: ['Scanned in the chute tunnel, not yet sorted.', '', ''],
  }
  return herd.tags.map((_, i) => buildAnimal(herd, i))
}

// ---------------------------------------------------------------------------
// Timing. One "cycle" per animal, at 1× speed, in milliseconds.
// ---------------------------------------------------------------------------

export const TIMING = {
  walkIn: 2000,
  scan: 1700,
  flash: 320,
  read: 800,
  fill: 1500,
  walkOut: 2000,
}
export const CYCLE = TIMING.walkIn + TIMING.scan + TIMING.flash + TIMING.read + TIMING.fill

export type ScanPhase = 'queued' | 'walk-in' | 'scan' | 'flash' | 'read' | 'fill' | 'walk-out' | 'gone'

const PHASE_ORDER: [Exclude<ScanPhase, 'queued' | 'walk-out' | 'gone'>, number][] = [
  ['walk-in', TIMING.walkIn],
  ['scan', TIMING.scan],
  ['flash', TIMING.flash],
  ['read', TIMING.read],
  ['fill', TIMING.fill],
]

/** Where animal `index` is in its pass, `elapsed` ms into the run. `progress` is 0–1 within the phase. */
export function phaseAt(index: number, elapsed: number): { phase: ScanPhase; progress: number; local: number } {
  const local = elapsed - index * CYCLE
  if (local < 0) return { phase: 'queued', progress: 0, local }
  let t = local
  for (const [phase, duration] of PHASE_ORDER) {
    if (t < duration) return { phase, progress: t / duration, local }
    t -= duration
  }
  if (t < TIMING.walkOut) return { phase: 'walk-out', progress: t / TIMING.walkOut, local }
  return { phase: 'gone', progress: 1, local }
}

/** Animals whose readings are complete (their row is in the scan file). */
export const completedAt = (elapsed: number, total: number) => Math.min(total, Math.floor(elapsed / CYCLE))

/** Total run length: every cycle, plus the last animal walking out. */
export const runLength = (total: number) => total * CYCLE + TIMING.walkOut

/**
 * Clock time on the ranch for each scan. The tunnel moves about one head every
 * 20–30 seconds, starting at 7:42 in the morning on the demo's "today".
 */
export function scanTimestamp(index: number) {
  const seconds = 7 * 3600 + 42 * 60 + index * 26 + ((index * 7) % 9)
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${DEMO_TODAY}T${hh}:${mm}:${ss}`
}

/** Repeatable 0–1 jitter, for the flickering "estimating" readouts. */
export function jitter(seed: number, step: number) {
  const x = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export const formatClock = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })

// ---------------------------------------------------------------------------
// The CSV file
// ---------------------------------------------------------------------------

export const csvFileName = () => `${ranch.tagPrefix.toLowerCase()}-chute-scan-${DEMO_TODAY}.csv`

/** The same columns the herd import expects, so a scan file can be imported as-is. */
export function scanCsv(animals: Animal[]) {
  return Papa.unparse(
    animals.map((a, i) => ({
      tag_id: a.tagId,
      eid: a.eid ?? '',
      breed: a.breed,
      sex: SEX_LABELS[a.sex].toLowerCase(),
      coat_color: COAT_LABELS[a.coatColor].toLowerCase(),
      birth_date: a.birthDate,
      est_weight_lb: a.estWeight,
      frame_score: a.frameScore,
      bcs: a.bcs,
      scan_confidence_pct: a.scanConfidence,
      scanned_at: scanTimestamp(i),
      station: CHUTE_STATION,
      flag: a.scanConfidence < RESCAN_BELOW ? 'rescan' : '',
    })),
  )
}

export function downloadText(fileName: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before freeing the file.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
