import Papa from 'papaparse'
import { ranch } from '@/config/ranch'
import { DEMO_TODAY } from '@/data/animals'
import { type MonthlySales, salesHistory } from '@/data/market'
import type { Animal, Lot, Offer, Order } from '@/data/types'
import { COAT_LABELS, SEX_LABELS } from './labels'
import { getLotStats } from './lots'

/** Numbers behind the owner dashboard, all derived from the store. */

export type LotIndex = Map<string, Lot>

/** Which lot each ear tag is in. */
export const indexLots = (lots: Lot[]): LotIndex => new Map(lots.flatMap((l) => l.tagIds.map((t) => [t, l] as const)))

export type HerdStatus = 'unlisted' | 'draft' | 'listed' | 'pending' | 'sold'

export function herdStatus(tagId: string, index: LotIndex): HerdStatus {
  const lot = index.get(tagId)
  if (!lot) return 'unlisted'
  if (lot.draft) return 'draft'
  return lot.status === 'available' ? 'listed' : lot.status
}

export const HERD_STATUS_LABELS: Record<HerdStatus, string> = {
  unlisted: 'Not listed',
  draft: 'In a draft lot',
  listed: 'Listed for sale',
  pending: 'Offer pending',
  sold: 'Sold, awaiting pickup',
}

export const isOpenOffer = (o: Offer) => o.status === 'pending' || o.status === 'countered'

/**
 * Monthly sales: the ranch's history, plus anything sold on the site since
 * (accepted offers and checkout orders), counted in the current month.
 */
export function salesSeries(offers: Offer[], orders: Order[], lots: Lot[], animals: Animal[]): MonthlySales[] {
  const byId = new Map(lots.map((l) => [l.id, l]))
  let head = 0
  let revenue = 0
  for (const o of offers) {
    if (o.status !== 'accepted') continue
    head += o.headCount
    revenue += (o.acceptedPricePerHead ?? o.pricePerHead) * o.headCount
  }
  for (const order of orders) {
    revenue += order.subtotal
    for (const id of order.lotIds) {
      const lot = byId.get(id)
      if (lot) head += getLotStats(lot, animals).headCount
    }
  }
  return salesHistory.map((m, i) => (i === salesHistory.length - 1 ? { ...m, head: m.head + head, revenue: m.revenue + revenue } : m))
}

export interface Overview {
  /** Animals still on the ranch (not in a sold lot) */
  totalHead: number
  headListed: number
  headSold: number
  revenue: number
  openOffers: number
  avgCwt: number
}

export function getOverview(animals: Animal[], lots: Lot[], offers: Offer[], sales: MonthlySales[]): Overview {
  const index = indexLots(lots)
  const statuses = animals.map((a) => herdStatus(a.tagId, index))
  // $/cwt only means something for cattle sold by weight, so pairs and bulls are left out.
  const listedLots = lots.filter((l) => !l.draft && l.status !== 'sold' && l.class !== 'pairs' && l.class !== 'bulls')
  let dollars = 0
  let pounds = 0
  for (const l of listedLots) {
    const s = getLotStats(l, animals)
    dollars += s.lotTotal
    pounds += s.avgWeight * s.headCount
  }
  return {
    totalHead: statuses.filter((s) => s !== 'sold').length,
    headListed: statuses.filter((s) => s === 'listed' || s === 'pending').length,
    headSold: sales.reduce((n, m) => n + m.head, 0),
    revenue: sales.reduce((n, m) => n + m.revenue, 0),
    openOffers: offers.filter(isOpenOffer).length,
    avgCwt: pounds ? dollars / (pounds / 100) : 0,
  }
}

export interface ClassRow {
  label: string
  head: number
  listed: number
}

/** How a rancher counts the herd, in that order. Used by the class chart and the herd table filter. */
export const HERD_CLASSES = [
  { id: 'steers', label: 'Steers', match: (a: Animal) => a.sex === 'steer' },
  { id: 'open-heifers', label: 'Open heifers', match: (a: Animal) => a.sex === 'heifer' && a.pregnancy?.status !== 'bred' },
  { id: 'bred-heifers', label: 'Bred heifers', match: (a: Animal) => a.sex === 'heifer' && a.pregnancy?.status === 'bred' },
  { id: 'cows', label: 'Cows', match: (a: Animal) => a.sex === 'cow' },
  { id: 'bulls', label: 'Bulls', match: (a: Animal) => a.sex === 'bull' },
] as const

export type HerdClassId = (typeof HERD_CLASSES)[number]['id']

/** Head on the ranch (sold animals left out) by class. */
export function classBreakdown(animals: Animal[], index: LotIndex): ClassRow[] {
  return HERD_CLASSES.map(({ label, match }) => {
    const members = animals.filter((a) => match(a) && herdStatus(a.tagId, index) !== 'sold')
    const listed = members.filter((a) => ['listed', 'pending'].includes(herdStatus(a.tagId, index))).length
    return { label, head: members.length, listed }
  })
}

export interface WeightBin {
  label: string
  from: number
  head: number
}

/** Head on the ranch in 200 lb steps, from the lightest step that has cattle to the heaviest. */
export function weightBins(animals: Animal[], index: LotIndex, step = 200): WeightBin[] {
  const weights = animals.filter((a) => herdStatus(a.tagId, index) !== 'sold').map((a) => a.estWeight)
  if (!weights.length) return []
  const first = Math.floor(Math.min(...weights) / step) * step
  const last = Math.floor(Math.max(...weights) / step) * step
  const bins: WeightBin[] = []
  for (let from = first; from <= last; from += step) {
    bins.push({ label: `${from.toLocaleString()}–${(from + step - 1).toLocaleString()}`, from, head: 0 })
  }
  for (const w of weights) bins[Math.floor(w / step) - first / step].head++
  return bins
}

/** The selected animals as a CSV, same columns as the scan file plus where each one is listed. */
export function herdCsv(animals: Animal[], index: LotIndex) {
  return Papa.unparse(
    animals.map((a) => {
      const lot = index.get(a.tagId)
      return {
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
        scan_date: a.scanDate,
        lot: lot ? lot.number : '',
        status: HERD_STATUS_LABELS[herdStatus(a.tagId, index)].toLowerCase(),
        notes: a.notes,
      }
    }),
  )
}

export const herdCsvName = () => `${ranch.tagPrefix.toLowerCase()}-herd-${DEMO_TODAY}.csv`
