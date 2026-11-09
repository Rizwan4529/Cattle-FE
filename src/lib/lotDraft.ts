import { ranch } from '@/config/ranch'
import { CHUTE_STATION, DEMO_TODAY } from '@/data/animals'
import { marketQuotes } from '@/data/market'
import type { Animal, Lot, LotClass, PricingMode } from '@/data/types'
import { formatShortDate } from './format'
import { LOT_CLASS_LABELS } from './labels'

/**
 * Turning a set of animals into a new lot: which class it is, a suggested
 * title and price, and the full draft lot. Used by "Create lot from scan"
 * and "Create lot from selected" in the herd table.
 */

/** The lot class an animal sells in. */
export function classOf(a: Animal): LotClass {
  if (a.sex === 'steer') return 'steers'
  if (a.sex === 'bull') return 'bulls'
  if (a.sex === 'cow') return a.calfAtSide ? 'pairs' : 'bred'
  return a.pregnancy?.status === 'bred' ? 'bred' : 'heifers'
}

/** The most common class, and whether the animals span more than one. */
export function inferLotClass(animals: Animal[]): { lotClass: LotClass; mixed: boolean } {
  const counts = new Map<LotClass, number>()
  for (const a of animals) counts.set(classOf(a), (counts.get(classOf(a)) ?? 0) + 1)
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return { lotClass: ranked[0]?.[0] ?? 'steers', mixed: ranked.length > 1 }
}

const quote = (id: string) => marketQuotes.find((q) => q.id === id)!.price

/**
 * Sample-market $/cwt for feeder cattle at a weight: a straight line between
 * the 550 lb and 750 lb quotes (lighter cattle bring more per pound).
 */
export function suggestedCwt(lotClass: LotClass, avgWeight: number) {
  const light = quote('feeder-steers-550')
  const heavy = quote('feeder-steers-750')
  const slope = (heavy - light) / 200
  const steer = light + (Math.min(Math.max(avgWeight, 400), 950) - 550) * slope
  const heiferDiscount = quote('feeder-heifers-550') / light
  return lotClass === 'heifers' ? steer * heiferDiscount : steer
}

/** Breeding stock isn't priced by the pound; fall back to these if there are no other lots to go by. */
const PER_HEAD_FALLBACK: Partial<Record<LotClass, number>> = { bred: 3400, pairs: 3900, bulls: 5200 }

const NOUNS: Record<LotClass, [string, string]> = {
  steers: ['Steer', 'Steers'],
  heifers: ['Heifer', 'Heifers'],
  bred: ['Bred Heifer', 'Bred Heifers'],
  pairs: ['Cow-Calf Pair', 'Cow-Calf Pairs'],
  bulls: ['Bull', 'Bulls'],
}

const titleCase = (s: string) =>
  s
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join('-')

function mostCommon<T>(items: T[]): T | undefined {
  const counts = new Map<T, number>()
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

function breedPhrase(animals: Animal[]) {
  const breed = mostCommon(animals.map((a) => a.breed)) ?? 'Mixed'
  const coats = new Set(animals.map((a) => a.coatColor))
  if (coats.size === 1 && coats.has('black') && breed === 'Angus') return 'Black Angus'
  if (coats.size === 1 && coats.has('black-baldy')) return 'Black Baldy'
  // "Angus cross" reads as "Angus-Cross" in a title; names like "Red Angus" stay as they are.
  return / cross$/i.test(breed) ? titleCase(breed) : breed
}

export interface LotSuggestion {
  lotClass: LotClass
  mixed: boolean
  title: string
  pricePerHead: number
  avgWeight: number
  /** $/cwt the price was based on (feeder cattle only) */
  cwt?: number
  /** Plain-language note on where the price came from */
  basis: string
}

export const averageWeight = (animals: Animal[]) => (animals.length ? Math.round(animals.reduce((s, a) => s + a.estWeight, 0) / animals.length) : 0)

/** Title and asking price for a set of animals. `lots` are the ranch's other lots, used to price breeding stock. */
export function suggestLot(animals: Animal[], lots: Lot[]): LotSuggestion {
  const { lotClass, mixed } = inferLotClass(animals)
  const avgWeight = averageWeight(animals)
  const [one, many] = NOUNS[lotClass]
  const hasCows = animals.some((a) => a.sex === 'cow')
  const noun = lotClass === 'bred' && hasCows ? (animals.length === 1 ? 'Bred Cow' : 'Bred Cows') : animals.length === 1 ? one : many
  const weightPart = lotClass === 'pairs' || lotClass === 'bulls' ? '' : `, ~${Math.round(avgWeight / 5) * 5} lb`
  const title = animals.length ? `${animals.length} ${breedPhrase(animals)} ${noun}${weightPart}` : ''

  if (lotClass === 'steers' || lotClass === 'heifers') {
    const cwt = suggestedCwt(lotClass, avgWeight)
    return {
      lotClass,
      mixed,
      title,
      avgWeight,
      cwt,
      pricePerHead: Math.round(((avgWeight / 100) * cwt) / 25) * 25,
      basis: `sample feeder ${lotClass === 'heifers' ? 'heifer' : 'steer'} market`,
    }
  }

  const similar = lots.filter((l) => l.class === lotClass && !l.draft)
  const perHead = similar.length ? similar.reduce((s, l) => s + l.pricePerHead, 0) / similar.length : (PER_HEAD_FALLBACK[lotClass] ?? 3000)
  return {
    lotClass,
    mixed,
    title,
    avgWeight,
    pricePerHead: Math.round(perHead / 25) * 25,
    basis: similar.length
      ? `the average of your ${similar.length} other ${LOT_CLASS_LABELS[lotClass].toLowerCase()} ${similar.length === 1 ? 'lot' : 'lots'}`
      : 'recent prices for this class',
  }
}

/** The listing's opening paragraph, written from the animals. */
export function describeLot(animals: Animal[], lotClass: LotClass, source: 'scan' | 'herd') {
  const label = LOT_CLASS_LABELS[lotClass].toLowerCase()
  if (source === 'scan') {
    const scanDay = new Date(`${DEMO_TODAY}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    return `${animals.length} head of ${label} run through the ${CHUTE_STATION.toLowerCase()} on ${scanDay}. Every animal has a camera-estimated weight, frame score, and body condition score on its record, along with its shots and weights since birth.`
  }
  return `${animals.length} head of ${label} from the ${ranch.name} herd. Every animal has its own record with weights, shots, and camera scans, linked from the table below.`
}

/** The most common breed in the set, for the listing's breed line. */
export const breedSummaryOf = (animals: Animal[]) => mostCommon(animals.map((a) => a.breed)) ?? 'Mixed'

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const daysSinceDemo = (date: string) => Math.round((Date.parse(DEMO_TODAY) - Date.parse(date)) / 86_400_000)

/** Selling points that hold for every animal in the set. */
export function highlightsFor(animals: Animal[], lotClass: LotClass): string[] {
  if (!animals.length) return []
  const out: string[] = []
  const latestScan = animals
    .map((a) => a.scanDate)
    .sort()
    .at(-1)
  if (latestScan) out.push(`Camera-scanned ${formatShortDate(latestScan)}`)
  const weanDays = animals.map((a) => (a.weanDate ? daysSinceDemo(a.weanDate) : null))
  if (lotClass === 'steers' || lotClass === 'heifers') {
    if (weanDays.every((d) => d !== null && d >= 45)) out.push(`Weaned ${Math.min(...(weanDays as number[]))}+ days`)
    if (animals.every((a) => a.preconditioned)) out.push('Two rounds of shots (VAC-45)')
  }
  if (lotClass === 'bred') {
    const due = animals.flatMap((a) => (a.pregnancy?.dueDate ? [a.pregnancy.dueDate] : [])).sort()
    if (due.length) out.push(`Due ${formatShortDate(due[0])} to ${formatShortDate(due.at(-1)!)}`)
  }
  if (lotClass === 'pairs') out.push('Calves at side')
  if (lotClass === 'bulls' && animals.every((a) => a.health.some((h) => h.type === 'exam'))) out.push('Breeding soundness exam passed')
  if (animals.every((a) => a.ageSourceVerified)) out.push('Age & source verified')
  return out.slice(0, 4)
}

/** A complete draft lot. The owner checks it on the lot page, then publishes. */
export function buildDraftLot({
  animals,
  number,
  title,
  pricePerHead,
  pricingMode,
  lotClass,
  source,
  pasture,
}: {
  animals: Animal[]
  number: number
  title: string
  pricePerHead: number
  pricingMode: PricingMode
  lotClass: LotClass
  source: 'scan' | 'herd'
  pasture: string
}): Lot {
  const description = describeLot(animals, lotClass, source)
  const partial = pricingMode !== 'buy-now' && animals.length > 3

  return {
    id: `lot-${number}`,
    number,
    title: title.trim(),
    class: lotClass,
    breedSummary: breedSummaryOf(animals),
    description,
    tagIds: animals.map((a) => a.tagId),
    pricePerHead,
    pricingMode,
    status: 'available',
    allowPartial: partial,
    minHead: partial ? 2 : undefined,
    location: { pasture, city: ranch.location.city, state: ranch.location.state },
    pickupWindow: { start: addDays(DEMO_TODAY, 7), end: addDays(DEMO_TODAY, 35) },
    video: { durationSec: 52, caption: source === 'scan' ? 'Chute tunnel camera footage' : 'Walk-through of the cattle' },
    highlights: highlightsFor(animals, lotClass),
    listedAt: DEMO_TODAY,
    featured: false,
    draft: true,
  }
}
