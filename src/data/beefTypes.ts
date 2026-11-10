/**
 * Types for the beef storefront (SPEC-BEEF): feed programs, share pools,
 * claims, butcher-shop products, and the cart lines they create.
 * Animals themselves stay in `types.ts`; a finished animal just carries a
 * `feedProgram` (and a `harvest` record once it's been processed).
 */

import type { GoodsBoxId } from './goodsTypes'

export type FeedProgramId = 'grass-finished' | 'grain-finished' | 'forage-grain'

/** How much of one animal a customer buys. Eighths are off unless the ranch turns them on. */
export type ShareSize = 'whole' | 'half' | 'quarter' | 'eighth'

/** The smallest share a pool is divided into; sets how many segments its fill meter has. */
export type PoolUnit = 'quarter' | 'eighth'

/**
 * Where an animal's beef is in the journey. A pool is "open" until every share
 * is claimed; harvest happens only after that.
 */
export type PoolStatus = 'open' | 'full' | 'harvest-scheduled' | 'dry-aging' | 'cut-wrap' | 'ready' | 'shipped'

/** If a pool isn't full by its deadline, each claimant chose one of these when claiming. */
export type UnfilledChoice = 'roll-over' | 'refund'

export interface ShareClaim {
  id: string
  size: ShareSize
  /** Fill-meter segments this claim takes (a half of a quarter-pool takes 2) */
  segments: number
  firstName: string
  city: string
  state: string
  claimedAt: string
  ifUnfilled: UnfilledChoice
  /** When the buyer agreed the ranch keeps the byproducts they don't request on the cut sheet (ISO) */
  byproductRightsAcceptedAt?: string
  /** Deposit actually paid (price locked at claim time) */
  deposit: number
  /** Claimed by the visitor on this device, at checkout */
  fromThisDevice?: boolean
  orderId?: string
}

export interface PoolStatusEvent {
  status: PoolStatus
  /** ISO date-time the pool reached this status */
  at: string
}

export interface SharePool {
  id: string
  tagId: string
  feedProgram: FeedProgramId
  /** Locked when the pool opens; before feed-program and breed adjustments */
  pricePerHangingLb: number
  unit: PoolUnit
  claims: ShareClaim[]
  /** ISO date-time. Not full by then → roll over or refund, as each claimant chose. */
  deadline: string
  status: PoolStatus
  history: PoolStatusEvent[]
  /** Set once the ranch books the processor */
  harvestDate?: string
  /** Days the carcass hangs (14–21) */
  agingDays?: number
  /** Actual hanging weight from the processor, once harvested. Balances are figured on this. */
  hangingWeight?: number
  createdAt: string
}

/** Sign-up for "tell me when a new animal opens". */
export interface NotifySignup {
  id: string
  email: string
  feedProgram: FeedProgramId | 'any'
  createdAt: string
}

// ---------------------------------------------------------------------------
// Butcher shop
// ---------------------------------------------------------------------------

export type CutCategory = 'steak' | 'roast' | 'ground' | 'other'

export type CutId =
  'ribeye' | 'ny-strip' | 'filet' | 'sirloin' | 't-bone' | 'flat-iron' | 'brisket' | 'short-ribs' | 'roast' | 'ground' | 'patties' | 'stew' | 'bones'

/** Carcass section a cut comes from (used by the cut sheet and shop illustrations). */
export type Primal = 'chuck' | 'rib' | 'loin' | 'sirloin' | 'round' | 'brisket' | 'plate' | 'flank' | 'shank'

export interface BeefProduct {
  id: string
  slug: string
  name: string
  cut: CutId
  category: CutCategory
  primal: Primal
  /** Ear tag of the animal this beef came from; links to its passport */
  sourceTagId: string
  packDate: string
  /** Average weight of one pack, lb */
  packWeightLb: number
  /** Pieces per pack, e.g. 2 steaks */
  piecesPerPack: number
  /** e.g. '1¼" thick' or '1 lb chub' */
  packNote: string
  pricePerLb: number
  /** Packs in the freezer */
  stock: number
  agedDays: number
  description: string
  cookingGuide: { method: string; steps: string[]; doneness?: string }
  pairsWith: string[]
  /** Real photo URLs; empty = illustrated placeholder */
  photos: string[]
  featured?: boolean
}

export interface ProductReview {
  id: string
  productId: string
  rating: 1 | 2 | 3 | 4 | 5
  name: string
  city: string
  date: string
  title: string
  body: string
  verified: boolean
}

export interface BoxItem {
  productId: string
  packs: number
}

export interface Bundle {
  id: string
  name: string
  description: string
  items: BoxItem[]
  /** Off the price of buying the packs one by one */
  discount: number
  /** Shown as a gift box in the Gifts section */
  gift?: boolean
}

export interface SubscriptionPlan {
  size: SubscriptionSize
  label: string
  /** About this many pounds per box */
  lb: number
  price: number
  serves: string
  contents: string
}

/** The signed-in customer (mock sign-in: nothing leaves the browser). */
export interface Account {
  name: string
  email: string
  phone: string
  since: string
}

export interface Address {
  id: string
  label: string
  name: string
  street: string
  city: string
  state: string
  zip: string
  isDefault: boolean
}

/** A corporate or bulk gifting request from the Gifts page. */
export interface GiftInquiry {
  id: string
  company: string
  contact: string
  email: string
  phone: string
  quantity: number
  budget: string
  neededBy: string
  message: string
  createdAt: string
}

export type SubscriptionSize = 'small' | 'medium' | 'large'
export type SubscriptionFrequency = 'monthly' | 'every-2-months'

export interface Subscription {
  id: string
  orderId?: string
  size: SubscriptionSize
  frequency: SubscriptionFrequency
  feedPreference: FeedProgramId | 'any'
  status: 'active' | 'paused'
  /** A Ranch Goods box (dog chews, bone broth) instead of a beef Ranch Box */
  box?: GoodsBoxId
  nextShip: string
  skipped: string[]
  createdAt: string
}

export interface GiftCard {
  id: string
  code: string
  amount: number
  /** Unspent amount */
  balance: number
  fromName: string
  recipientName: string
  recipientEmail: string
  message: string
  sendOn: string
  createdAt: string
  orderId?: string
}

// ---------------------------------------------------------------------------
// Cut sheets
// ---------------------------------------------------------------------------

export type CutStyle = 'steaks' | 'roasts' | 'ground'
export type SteakThickness = '0.75' | '1' | '1.25' | '1.5'

export interface PrimalChoice {
  style: CutStyle
  thickness: SteakThickness
  steaksPerPack: number
  /** Roast size, lb */
  roastLb: number
}

export type CutExtra = 'soupBones' | 'shortRibs' | 'organs' | 'fat'

export interface CutSheet {
  id: string
  name: string
  /** The claimed share this sheet is for (a claim id), if any */
  claimId?: string
  /** Animal the share is from, when linked to a claim */
  tagId?: string
  size: ShareSize
  primals: Record<Primal, PrimalChoice>
  groundPackLb: 1 | 2
  patties: boolean
  extras: Record<CutExtra, boolean>
  /** Preset the sheet started from, until the customer changes something */
  preset?: string
  /** Special instructions for the processor */
  notes: string
  updatedAt: string
}
