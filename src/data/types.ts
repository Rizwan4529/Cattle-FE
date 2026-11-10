/** Shared domain types. The ear tag ID (`tagId`) is the primary key for every animal. */

import type { BoxItem, FeedProgramId, ShareSize, SubscriptionFrequency, SubscriptionSize, UnfilledChoice } from './beefTypes'

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
  /** Set on animals raised for beef: they're sold by the share, not in a cattle lot */
  feedProgram?: FeedProgramId
  /** When the animal reaches its finished weight (ISO date) */
  finishDate?: string
  /** Has horns. Most of the herd is polled (Angus) or dehorned; horns become Ranch Goods. */
  horned?: boolean
  /** Processed for beef */
  harvest?: { date: string; hangingWeight: number; agedDays: number; processor: string }
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

/** A whole cattle lot (Buy Cattle) */
export interface LotCartItem {
  kind: 'lot'
  lotId: string
  addedAt: string
}

/** A share of one animal's beef (Buy Beef). The deposit is paid at checkout. */
export interface ShareCartItem {
  kind: 'share'
  id: string
  poolId: string
  size: ShareSize
  /** How the claim shows on the fill meter, e.g. "Sarah · Kansas City" */
  firstName: string
  city: string
  state: string
  ifUnfilled: UnfilledChoice
  addedAt: string
}

/** Packs of one Butcher Shop product */
export interface ProductCartItem {
  kind: 'product'
  id: string
  productId: string
  qty: number
  addedAt: string
}

/** A curated box or gift box */
export interface BundleCartItem {
  kind: 'bundle'
  id: string
  bundleId: string
  qty: number
  addedAt: string
}

/** A Build-Your-Own Box */
export interface BoxCartItem {
  kind: 'box'
  id: string
  items: BoxItem[]
  addedAt: string
}

/** First box of a Ranch Box subscription */
export interface SubscriptionCartItem {
  kind: 'subscription'
  id: string
  size: SubscriptionSize
  frequency: SubscriptionFrequency
  feedPreference: FeedProgramId | 'any'
  firstShip: string
  addedAt: string
}

export interface GiftCardCartItem {
  kind: 'gift-card'
  id: string
  amount: number
  fromName: string
  recipientName: string
  recipientEmail: string
  message: string
  sendOn: string
  addedAt: string
}

/** Everything sold in the Butcher Shop and Gifts pages */
export type ShopCartItem = ProductCartItem | BundleCartItem | BoxCartItem | SubscriptionCartItem | GiftCardCartItem

/** One cart for both sides of the site, with a line type per kind of purchase. */
export type CartItem = LotCartItem | ShareCartItem | ShopCartItem

/** A Butcher Shop or gift purchase in an order */
export interface OrderItem {
  kind: ShopCartItem['kind']
  title: string
  detail?: string
  qty: number
  total: number
  /** Product packs it took from stock */
  packs?: BoxItem[]
  /** Product or bundle id, for one-click reorder */
  ref?: string
}

/** How Butcher Shop beef in an order gets to the customer. */
export interface BeefDelivery {
  method: 'pickup' | 'local' | 'ship'
  cost: number
  pickup?: { date: string; slot: string }
}

/** A share bought in an order: deposit paid now, balance figured on the actual hanging weight. */
export interface OrderShare {
  claimId: string
  poolId: string
  tagId: string
  size: ShareSize
  deposit: number
  /** Estimated total and balance at checkout; the final balance uses the real hanging weight */
  estimatedTotal: number
  estimatedBalance: number
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
  /** Beef shares in this order */
  shares?: OrderShare[]
  /** Butcher Shop items, gift cards, and subscriptions (paid in full) */
  items?: OrderItem[]
  beefDelivery?: BeefDelivery
  /** How claimed shares are handed over once the beef is ready */
  shareHandoff?: 'pickup' | 'local'
  /** Promo code or gift card applied */
  discount?: { code: string; amount: number; kind: 'promo' | 'gift-card' }
  gift?: { to: string; message: string }
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
