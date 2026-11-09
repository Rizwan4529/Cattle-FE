import type { Animal, HealthEvent } from '@/data/types'
import { formatNumber } from './format'

export type TimelineKind = HealthEvent['type'] | 'birth' | 'weigh-in' | 'scan'

export interface TimelineEntry {
  id: string
  date: string
  kind: TimelineKind
  title: string
  detail?: string
  product?: string
  by?: string
  /** "health" entries vs. weights and scans, for the timeline filter */
  group: 'health' | 'weights'
}

const HEALTH_TITLES: Record<HealthEvent['type'], string> = {
  vaccination: 'Vaccinated',
  deworming: 'Dewormed',
  treatment: 'Treated',
  castration: 'Castrated',
  weaning: 'Weaned',
  'pregnancy-check': 'Pregnancy check',
  exam: 'Vet exam',
}

/** Everything that has happened to an animal, newest first. */
export function buildTimeline(animal: Animal): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  entries.push({
    id: 'birth',
    date: animal.birthDate,
    kind: 'birth',
    title: 'Born on the ranch',
    detail: [animal.sire && `Sire ${animal.sire}`, animal.dam && `dam ${animal.dam}`].filter(Boolean).join(', ') || undefined,
    group: 'weights',
  })

  for (const w of animal.weighIns) {
    if (w.source === 'birth') {
      entries[0].detail = [entries[0].detail, `Birth weight ${w.weight} lb`].filter(Boolean).join('. ')
      continue
    }
    if (w.source === 'chute-scan') continue // shown as a scan entry below
    entries.push({
      id: `w-${w.date}`,
      date: w.date,
      kind: 'weigh-in',
      title: `Weighed ${formatNumber(w.weight)} lb`,
      detail: 'On the scale',
      group: 'weights',
    })
  }

  for (const s of animal.scans) {
    entries.push({
      id: s.id,
      date: s.date,
      kind: 'scan',
      title: `Camera scan: ${formatNumber(s.estWeight)} lb`,
      detail: `Frame ${s.frameScore}, body condition ${s.bcs} of 9, ${s.confidence}% confidence. ${s.station}.`,
      group: 'weights',
    })
  }

  for (const e of animal.health) {
    entries.push({
      id: e.id,
      date: e.date,
      kind: e.type,
      title: HEALTH_TITLES[e.type],
      detail: e.detail,
      product: e.product,
      by: e.by,
      group: 'health',
    })
  }

  // Newest first; on the same day, health work before the scale.
  const order = (k: TimelineKind) => (k === 'scan' || k === 'weigh-in' ? 1 : 0)
  return entries.sort((a, b) => b.date.localeCompare(a.date) || order(a.kind) - order(b.kind))
}

export interface GainStats {
  /** lb gained across the record */
  gained: number
  /** average daily gain over the whole record, lb/day */
  adg: number
  /** daily gain between the last two weights, lb/day */
  recentAdg: number | null
  recentDays: number | null
}

const days = (a: string, b: string) => Math.max(1, Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86_400_000))

export function getGainStats(animal: Animal): GainStats {
  const w = animal.weighIns
  const first = w[0]
  const last = w[w.length - 1]
  const prev = w[w.length - 2]
  return {
    gained: last.weight - first.weight,
    adg: (last.weight - first.weight) / days(first.date, last.date),
    recentAdg: prev ? (last.weight - prev.weight) / days(prev.date, last.date) : null,
    recentDays: prev ? days(prev.date, last.date) : null,
  }
}

/** 840003211748943 → "840 003 211 748 943" */
export const formatEid = (eid: string) => eid.replace(/(\d{3})(?=\d)/g, '$1 ')
