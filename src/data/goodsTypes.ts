/**
 * Types for Ranch Goods (SPEC-BYPRODUCTS): everything from the animal that
 * isn't beef: tallow, bones, dog chews, hides, horn and craft goods, garden
 * meal. Prices and yields live in `config/byproducts.ts`; the catalog in
 * `data/goods.ts`.
 */

export type GoodsCategoryId = 'tallow' | 'bones' | 'dog-chews' | 'hides' | 'craft' | 'garden'

/** What a shopper wants it for (the "use" filter). */
export type GoodsUse = 'cooking' | 'pets' | 'crafts' | 'garden' | 'home'

/** Parts of the animal that become ranch goods. Matches the Whole Animal regions on the diagram. */
export type ByproductPartId = 'hide' | 'horns' | 'hooves' | 'fat' | 'bones' | 'organs' | 'tail' | 'tendons' | 'ears' | 'trachea' | 'pizzle'

/** Legal requirements before a category can be sold. Owner-only: shoppers never see these. */
export interface ComplianceFlags {
  /** Edible: must come from a USDA- or state-inspected source */
  requiresInspection: boolean
  /** Pet food and treats: state commercial feed registration and labels */
  requiresFeedRegistration: boolean
  /** Garden meal: state fertilizer registration and guaranteed analysis */
  requiresFertilizerRegistration: boolean
}

export type ComplianceState = 'not-started' | 'in-progress' | 'cleared'

/** The owner's progress on one category's paperwork (editable in the dashboard). */
export interface ComplianceStatus {
  state: ComplianceState
  note: string
  updatedAt: string
}

/** Which illustration a product card draws. */
export type GoodsArt =
  | 'tallow'
  | 'pail'
  | 'suet'
  | 'soap'
  | 'soup-bones'
  | 'marrow'
  | 'oxtail'
  | 'liver'
  | 'heart'
  | 'bully-stick'
  | 'tendon'
  | 'ear'
  | 'trachea'
  | 'hoof'
  | 'knuckle'
  | 'hide-rug'
  | 'raw-hide'
  | 'rawhide'
  | 'leather'
  | 'scraps'
  | 'horn'
  | 'drinking-horn'
  | 'bone-blanks'
  | 'sinew'
  | 'glue'
  | 'bone-meal'
  | 'blood-meal'
  | 'hoof-meal'

export interface GoodsProduct {
  id: string
  name: string
  category: GoodsCategoryId
  description: string
  /** Price per unit */
  price: number
  /** What one unit is: 'lb', 'each', 'bag', 'sq ft'… */
  unit: string
  uses: GoodsUse[]
  /** Part of the animal it's made from. None = sourced from the processor (e.g. blood meal). */
  part?: ByproductPartId
  /**
   * One specific item from one animal (a hide, a horn): quantity 1, and it's
   * marked sold once bought.
   */
  unique?: boolean
  /** Ear tags of the animals it came from; link to their passports. Empty = earlier harvests. */
  sourceTagIds: string[]
  /** Units on hand (0 = sold out; a sold unique item has 0) */
  stock: number
  /** Gets the Makers & Wholesale volume discount */
  bulk?: boolean
  /** Overrides the category's compliance flags (e.g. soap isn't food) */
  compliance?: Partial<ComplianceFlags>
  /** Extra facts shown on the product page, e.g. size and color of a hide */
  details?: string[]
  art: GoodsArt
  /** Hide color for rug art: matches the source animal's coat */
  coat?: 'black' | 'red' | 'hereford' | 'charolais'
  featured?: boolean
}

/**
 * What came back from the processor for one harvested animal, in each part's
 * raw unit (lb or count). A part missing or at 0 was left with the processor.
 */
export interface ByproductRecovery {
  tagId: string
  recovered: Partial<Record<ByproductPartId, number>>
  note?: string
}

/** Ranch Goods subscription boxes (they ride on the Ranch Box subscription system). */
export type GoodsBoxId = 'dog-chew-box' | 'bone-broth-box'

export interface GoodsBoxSize {
  label: string
  price: number
  /** Who it suits, e.g. "Dogs under 30 lb" */
  serves: string
  contents: string
}

export interface GoodsBoxPlan {
  id: GoodsBoxId
  name: string
  description: string
  sizes: Record<'small' | 'medium' | 'large', GoodsBoxSize>
  /** Items a box draws from (shown as "What's inside") */
  includes: string[]
  art: GoodsArt
}

/** A soap maker, pet-treat shop, leatherworker, or garden center asking for volume pricing. */
export interface WholesaleInquiry {
  id: string
  business: string
  kind: 'soap-candle' | 'pet-treats' | 'leather-craft' | 'garden-center' | 'other'
  contact: string
  email: string
  phone: string
  /** Categories they're interested in */
  categories: GoodsCategoryId[]
  /** e.g. "50 lb tallow a month" */
  volume: string
  message: string
  status: 'new' | 'replied' | 'handled'
  reply?: string
  createdAt: string
}
