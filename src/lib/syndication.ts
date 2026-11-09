import Papa from 'papaparse'
import { ranch } from '@/config/ranch'
import { DEMO_TODAY } from '@/data/animals'
import { auctionPartners, marketChannels } from '@/data/partners'
import type { Animal, DeliveryStatus, ExportFormat, Lot, SendRecipient } from '@/data/types'
import { COAT_LABELS, LOT_CLASS_LABELS, PRICING_MODE_LABELS, SEX_LABELS } from './labels'
import { getLotAnimals, getLotStats } from './lots'

/**
 * Sending lots to sale barns and marketplaces: the two CSV layouts, the
 * printable lot sheet's data, and the simulated replies after a send.
 */

export const EXPORT_FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  {
    value: 'auction-csv',
    label: 'Auction-ready CSV',
    description: 'One row per lot, in the columns sale barns use for a consignment: head, class, average weight, asking price, pickup.',
  },
  {
    value: 'standard-csv',
    label: 'Standard CSV',
    description: 'One row per animal with every reading: ear tag, RFID, weight, frame, body condition. For buyers who want the detail.',
  },
  {
    value: 'lot-sheet',
    label: 'Printable lot sheet',
    description: 'A one-page sheet per lot with the photo, price, and animal list. Print it or save it as a PDF.',
  },
]

export const EXPORT_FORMAT_LABELS = Object.fromEntries(EXPORT_FORMATS.map((f) => [f.value, f.label])) as Record<ExportFormat, string>

const pickup = (lot: Lot) => `${lot.pickupWindow.start} to ${lot.pickupWindow.end}`

/** One row per animal, with its lot's price and terms alongside. */
export function standardCsv(lots: Lot[], animals: Animal[]) {
  return Papa.unparse(
    lots.flatMap((lot) =>
      getLotAnimals(lot, animals).map((a) => ({
        lot_number: lot.number,
        lot_title: lot.title,
        tag_id: a.tagId,
        eid: a.eid ?? '',
        breed: a.breed,
        sex: SEX_LABELS[a.sex].toLowerCase(),
        coat_color: COAT_LABELS[a.coatColor].toLowerCase(),
        birth_date: a.birthDate,
        est_weight_lb: a.estWeight,
        frame_score: a.frameScore,
        bcs: a.bcs,
        preconditioned: a.preconditioned ? 'yes' : 'no',
        age_source_verified: a.ageSourceVerified ? 'yes' : 'no',
        price_per_head: lot.pricePerHead,
        pricing: PRICING_MODE_LABELS[lot.pricingMode],
        location: `${lot.location.pasture}, ${lot.location.city}, ${lot.location.state}`,
        pickup_window: pickup(lot),
      })),
    ),
  )
}

/** One row per lot in the column names a sale barn's consignment form uses. */
export function auctionCsv(lots: Lot[], animals: Animal[]) {
  return Papa.unparse(
    lots.map((lot) => {
      const s = getLotStats(lot, animals)
      const members = getLotAnimals(lot, animals)
      return {
        Consignor: ranch.name,
        'Consignor Phone': ranch.phone,
        'Lot #': lot.number,
        Head: s.headCount,
        Class: LOT_CLASS_LABELS[lot.class],
        Breed: lot.breedSummary,
        Description: lot.title,
        'Avg Weight (lb)': s.avgWeight,
        'Weight Range (lb)': `${s.minWeight}-${s.maxWeight}`,
        'Asking $/Head': lot.pricePerHead,
        'Asking $/Cwt': lot.class === 'pairs' ? '' : s.pricePerCwt.toFixed(2),
        'Health Program': lot.highlights.join('; '),
        'Age & Source': members.every((a) => a.ageSourceVerified) ? 'Verified' : 'Not verified',
        Location: `${lot.location.city}, ${lot.location.state}`,
        'Pickup Window': pickup(lot),
        'Tag Numbers': lot.tagIds.join(' '),
      }
    }),
  )
}

export const exportFileName = (format: Exclude<ExportFormat, 'lot-sheet'>) =>
  `${ranch.tagPrefix.toLowerCase()}-lots-${format === 'auction-csv' ? 'auction-ready' : 'standard'}-${DEMO_TODAY}.csv`

// ---------------------------------------------------------------------------
// Recipients and simulated replies
// ---------------------------------------------------------------------------

export interface Recipient {
  id: string
  name: string
  detail: string
  phone?: string
}

export const RECIPIENTS: Recipient[] = [
  ...auctionPartners.map((p) => ({
    id: p.id,
    name: p.name,
    detail: `${p.kind === 'video-auction' ? 'Video auction, ' : ''}${p.city}, ${p.state}`,
    phone: p.phone,
  })),
  ...marketChannels.map((c) => ({ id: c.id, name: c.name, detail: c.reach })),
]
export const recipientById = new Map(RECIPIENTS.map((r) => [r.id, r]))

/**
 * Plans who opens the file and who asks about the cattle, a few seconds
 * apart, so the history shows replies coming in. About 60% open it and a
 * quarter reply with interest (always at least one, so the demo shows it).
 */
export function planReplies(ids: string[], sentAt: number): SendRecipient[] {
  let seed = sentAt % 2_147_483_647
  const rand = () => {
    seed = (seed * 48_271) % 2_147_483_647
    return seed / 2_147_483_647
  }
  const order = ids.map((id) => ({ id, r: rand() })).sort((a, b) => a.r - b.r)
  const viewers = Math.max(1, Math.round(ids.length * 0.6))
  const keen = Math.max(1, Math.round(ids.length * 0.25))
  const rank = new Map(order.map((o, i) => [o.id, i]))
  return ids.map((id) => {
    const place = rank.get(id)!
    const views = place < viewers
    const interested = place < keen
    return {
      id,
      name: recipientById.get(id)?.name ?? id,
      status: 'delivered',
      viewedAt: views ? new Date(sentAt + 3_000 + place * 1_400 + Math.round(rand() * 1_000)).toISOString() : undefined,
      interestedAt: interested ? new Date(sentAt + 9_000 + place * 3_000 + Math.round(rand() * 2_000)).toISOString() : undefined,
    }
  })
}

/** What a recipient has done as of `now`. */
export function statusAt(r: SendRecipient, now: number): DeliveryStatus {
  if (r.interestedAt && Date.parse(r.interestedAt) <= now) return 'interested'
  if (r.viewedAt && Date.parse(r.viewedAt) <= now) return 'viewed'
  return r.status
}

export const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  delivered: 'Delivered',
  viewed: 'Viewed',
  interested: 'Interested',
}
