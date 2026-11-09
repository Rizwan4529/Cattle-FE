/** Shared domain types. The ear tag ID (`tagId`) is the primary key for every animal. */

export type CoatColor = 'black' | 'red' | 'hereford' | 'black-baldy' | 'charolais' | 'smoke'

export type AnimalSex = 'steer' | 'heifer' | 'cow' | 'bull'

export type LotClass = 'steers' | 'heifers' | 'bred' | 'pairs' | 'bulls'

export type PricingMode = 'buy-now' | 'offer' | 'both'

export type LotStatus = 'available' | 'pending' | 'sold'

export type HealthEventType = 'vaccination' | 'deworming' | 'treatment' | 'castration' | 'weaning' | 'pregnancy-check' | 'exam'

export interface HealthEvent {
  id: string
  /** ISO date (yyyy-mm-dd) */
  date: string
  type: HealthEventType
  /** Product given, e.g. "Bovi-Shield Gold 5" */
  product?: string
  detail: string
  by: string
}

export interface WeighIn {
  date: string
  weight: number
  source: 'birth' | 'scale' | 'chute-scan'
}

/** One pass through the camera chute */
export interface ScanRecord {
  id: string
  date: string
  station: string
  estWeight: number
  frameScore: number
  bcs: number
  /** Camera confidence, 0–100 */
  confidence: number
}

export interface Pregnancy {
  status: 'bred' | 'open'
  checkedOn: string
  method: 'ultrasound' | 'palpation' | 'blood test'
  dueDate?: string
  bredTo?: string
}

export interface CalfAtSide {
  tagId: string
  sex: 'bull calf' | 'heifer calf'
  birthDate: string
  estWeight: number
}

export interface Animal {
  tagId: string
  /** 15-digit RFID (840 = USA) */
  eid?: string
  breed: string
  sex: AnimalSex
  birthDate: string
  /** Latest estimated weight in lb */
  estWeight: number
  /** 1–9 (USDA frame score) */
  frameScore: number
  /** Body condition score, 1–9 */
  bcs: number
  coatColor: CoatColor
  sire?: string
  dam?: string
  registration?: string
  health: HealthEvent[]
  weighIns: WeighIn[]
  scans: ScanRecord[]
  pregnancy?: Pregnancy
  calfAtSide?: CalfAtSide
  weaned: boolean
  weanDate?: string
  preconditioned: boolean
  ageSourceVerified: boolean
  notes: string
  /** Real photo URLs. Empty = illustrated placeholder. */
  photos: string[]
  scanDate: string
  scanConfidence: number
}

export interface Lot {
  id: string
  /** Display number, e.g. 104 → "Lot 104" */
  number: number
  title: string
  class: LotClass
  breedSummary: string
  description: string
  tagIds: string[]
  pricePerHead: number
  pricingMode: PricingMode
  status: LotStatus
  /** Buyers may offer on part of the lot */
  allowPartial: boolean
  minHead?: number
  location: { pasture: string; city: string; state: string }
  pickupWindow: { start: string; end: string }
  video: { durationSec: number; caption: string }
  highlights: string[]
  listedAt: string
  featured: boolean
  /** Not public yet: hidden from browse until the owner publishes it */
  draft?: boolean
}

export type OfferStatus = 'pending' | 'accepted' | 'countered' | 'declined'

export interface Offer {
  id: string
  lotId: string
  buyerName: string
  operation?: string
  phone: string
  email?: string
  pricePerHead: number
  headCount: number
  message?: string
  status: OfferStatus
  counterPricePerHead?: number
  /** The price the sale closed at: the offer, or the ranch's counter */
  acceptedPricePerHead?: number
  createdAt: string
  respondedAt?: string
  /** Made by the visitor on this device (vs. seed offers from other buyers) */
  fromThisDevice?: boolean
}

export interface CartItem {
  lotId: string
  addedAt: string
}

export interface Order {
  id: string
  number: string
  createdAt: string
  buyer: {
    name: string
    operation?: string
    phone: string
    email: string
    address: string
  }
  fulfillment: 'pickup' | 'delivery'
  lotIds: string[]
  subtotal: number
  freight: number
  deposit: number
  balance: number
}

export interface AuctionPartner {
  id: string
  name: string
  city: string
  state: string
  phone: string
  kind: 'sale-barn' | 'video-auction'
}

export interface MarketChannel {
  id: string
  name: string
  description: string
  reach: string
}

export type ExportFormat = 'standard-csv' | 'auction-csv' | 'lot-sheet'

export type DeliveryStatus = 'delivered' | 'viewed' | 'interested'

export interface SendRecord {
  id: string
  createdAt: string
  lotIds: string[]
  format: ExportFormat
  recipients: SendRecipient[]
}

export interface SendRecipient {
  id: string
  name: string
  status: DeliveryStatus
  /** Simulated replies: when the partner opened the file, and when they asked about the cattle */
  viewedAt?: string
  interestedAt?: string
}
