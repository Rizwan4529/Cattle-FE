import { BadgeCheck, Baby, Camera, HeartPulse, type LucideIcon, Radio, ShieldCheck, Syringe, Wheat } from 'lucide-react'
import type { Animal, HealthEvent } from '@/data/types'
import { daysSince, formatDate, formatShortDate } from './format'

export interface Verification {
  id: string
  label: string
  detail: string
  icon: LucideIcon
}

/**
 * Badges a lot earns from its animals' records. A badge appears only when
 * every animal in the lot qualifies.
 */
export function getVerifications(animals: Animal[]): Verification[] {
  if (!animals.length) return []
  const all = (test: (a: Animal) => boolean) => animals.every(test)
  const hasEvent = (a: Animal, test: (e: HealthEvent) => boolean) => a.health.some(test)
  const head = animals.length
  const out: Verification[] = [
    { id: 'bqa', label: 'BQA certified ranch', detail: 'Raised under Beef Quality Assurance practices', icon: ShieldCheck },
  ]

  if (all((a) => a.ageSourceVerified)) {
    out.push({ id: 'asv', label: 'Age and source verified', detail: 'Born and raised on this ranch, birth dates on record', icon: BadgeCheck })
  }
  if (all((a) => Boolean(a.eid))) {
    out.push({ id: 'eid', label: 'Electronic ID tags', detail: `${head} of ${head} head carry a 15-digit 840 RFID tag`, icon: Radio })
  }
  if (all((a) => a.preconditioned)) {
    out.push({ id: 'vac45', label: 'Preconditioned (VAC-45)', detail: 'Weaned 45+ days with two rounds of respiratory vaccine', icon: Syringe })
  } else if (all((a) => Boolean(a.weanDate))) {
    const days = Math.min(...animals.map((a) => daysSince(a.weanDate!)))
    out.push({ id: 'weaned', label: `Weaned ${days} days`, detail: 'Off the cow and eating from a bunk', icon: Wheat })
  }
  const females = animals.filter((a) => a.sex === 'heifer' || a.sex === 'cow')
  if (females.length === head && all((a) => hasEvent(a, (e) => e.product?.includes('RB51') ?? false))) {
    out.push({ id: 'bangs', label: 'Bangs vaccinated', detail: 'Brucellosis calfhood vaccination with official tag', icon: Syringe })
  }
  if (all((a) => a.pregnancy?.status === 'bred')) {
    const method = animals[0].pregnancy?.method ?? 'exam'
    out.push({ id: 'preg', label: 'Pregnancy confirmed', detail: `Checked bred by ${method}`, icon: Baby })
  }
  if (all((a) => a.sex === 'bull') && all((a) => hasEvent(a, (e) => e.detail.startsWith('Breeding soundness exam passed')))) {
    out.push({ id: 'bse', label: 'Breeding soundness tested', detail: 'Passed a vet BSE and tested negative for trich', icon: HeartPulse })
  }
  const latestScan = animals
    .map((a) => a.scanDate)
    .sort()
    .at(-1)!
  const avgConfidence = animals.reduce((s, a) => s + a.scanConfidence, 0) / head
  out.push({
    id: 'scan',
    label: 'Camera scanned',
    detail: `Every head scanned by ${formatShortDate(latestScan)}, ${avgConfidence.toFixed(1)}% average confidence`,
    icon: Camera,
  })
  return out
}

export interface ProductSummary {
  product: string
  purpose: string
  type: HealthEvent['type']
  head: number
  lastDate: string
}

export interface HealthSummary {
  /** Vaccines and dewormers, most recent first */
  products: ProductSummary[]
  /** One-off treatments, listed per animal for transparency */
  treatments: { tagId: string; event: HealthEvent }[]
  /** Short sentences: exams, pregnancy checks, weaning, castration */
  notes: string[]
}

export function getHealthSummary(animals: Animal[]): HealthSummary {
  const byProduct = new Map<string, ProductSummary & { tags: Set<string> }>()
  const treatments: HealthSummary['treatments'] = []

  for (const a of animals) {
    for (const e of a.health) {
      if ((e.type === 'vaccination' || e.type === 'deworming') && e.product) {
        const entry = byProduct.get(e.product) ?? {
          product: e.product,
          purpose: e.detail,
          type: e.type,
          head: 0,
          lastDate: e.date,
          tags: new Set<string>(),
        }
        entry.tags.add(a.tagId)
        entry.head = entry.tags.size
        if (e.date > entry.lastDate) {
          entry.lastDate = e.date
          entry.purpose = e.detail
        }
        byProduct.set(e.product, entry)
      } else if (e.type === 'treatment') {
        treatments.push({ tagId: a.tagId, event: e })
      }
    }
  }

  const head = animals.length
  const count = (test: (a: Animal) => boolean) => animals.filter(test).length
  const notes: string[] = []

  const weanDates = [...new Set(animals.map((a) => a.weanDate).filter(Boolean) as string[])].sort()
  if (weanDates.length) {
    notes.push(
      weanDates.length === 1
        ? `Weaned ${formatDate(weanDates[0])}, ${daysSince(weanDates[0])} days ago.`
        : `Weaned between ${formatShortDate(weanDates[0])} and ${formatDate(weanDates.at(-1)!)}.`,
    )
  }
  const castrated = count((a) => a.health.some((e) => e.type === 'castration'))
  if (castrated) notes.push(`${castrated} of ${head} steers banded at branding.`)

  const bred = animals.filter((a) => a.pregnancy?.status === 'bred' && a.pregnancy.dueDate)
  if (bred.length) {
    const due = bred.map((a) => a.pregnancy!.dueDate!).sort()
    notes.push(
      `${bred.length} of ${head} confirmed bred by ${bred[0].pregnancy!.method} to ${bred[0].pregnancy!.bredTo}. Due ${formatShortDate(due[0])}${due.length > 1 ? ` to ${formatDate(due.at(-1)!)}` : `, ${due[0].slice(0, 4)}`}.`,
    )
  }
  const bse = count((a) => a.health.some((e) => e.detail.startsWith('Breeding soundness exam passed')))
  if (bse) notes.push(`${bse} of ${head} passed a breeding soundness exam this fall.`)
  const trich = count((a) => a.health.some((e) => e.detail.startsWith('Trichomoniasis') && e.detail.endsWith('negative')))
  if (trich) notes.push(`${trich} of ${head} tested negative for trichomoniasis.`)
  const calves = animals.filter((a) => a.calfAtSide)
  if (calves.length)
    notes.push(`${calves.length} calves at side, born ${formatShortDate(calves.map((a) => a.calfAtSide!.birthDate).sort()[0])} or later.`)

  return {
    products: [...byProduct.values()]
      .map(({ product, purpose, type, head: given, lastDate }) => ({ product, purpose, type, head: given, lastDate }))
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate)),
    treatments: treatments.sort((a, b) => b.event.date.localeCompare(a.event.date)),
    notes,
  }
}
