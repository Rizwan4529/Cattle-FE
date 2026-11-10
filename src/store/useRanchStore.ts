import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { beefConfig } from '@/config/beef'
import { DEMO_TODAY, animals as seedAnimals } from '@/data/animals'
import type {
  Account,
  Address,
  BeefProduct,
  BoxItem,
  CutSheet,
  GiftCard,
  GiftInquiry,
  NotifySignup,
  ShareClaim,
  SharePool,
  Subscription,
} from '@/data/beefTypes'
import { lots as seedLots } from '@/data/lots'
import { seedOffers } from '@/data/offers'
import { buildSeedPools, CLAIMANTS } from '@/data/pools'
import { byproductRecoveries as seedRecoveries, goods as seedGoods, RECIPES, seedBatches, seedCompliance, seedWholesaleInquiries } from '@/data/goods'
import type {
  ByproductBatch,
  ByproductPartId,
  ByproductRecovery,
  ByproductSettings,
  ComplianceStatus,
  GoodsCategoryId,
  GoodsProduct,
  PartSettings,
  WholesaleInquiry,
} from '@/data/goodsTypes'
import { byproductsConfig } from '@/config/byproducts'
import { batchUnits, defaultSettings } from '@/lib/byproducts'
import { products as seedProducts } from '@/data/products'
import type { Animal, CartItem, GiftCardCartItem, Lot, Offer, Order, SendRecord, ShareCartItem, SubscriptionCartItem } from '@/data/types'
import { advancePool as stepPool, type NewPoolInput, newPool, scheduleHarvest as bookHarvest } from '@/lib/poolAdmin'
import { isClaimable, poolSegments, quoteShare, segmentsClaimed, segmentsFor, segmentsLeft } from '@/lib/yield'

/**
 * The demo's "database". Everything here is saved to localStorage, so the
 * cart, offers, edits, imported herd data, new lots, orders, and partner
 * sends survive a page refresh. "Reset demo data" restores the seed data.
 */

interface RanchData {
  animals: Animal[]
  lots: Lot[]
  offers: Offer[]
  cart: CartItem[]
  orders: Order[]
  sends: SendRecord[]
  /** Buy Beef: one share pool per animal raised for beef */
  pools: SharePool[]
  /** Butcher Shop stock */
  products: BeefProduct[]
  notifySignups: NotifySignup[]
  /** Saved cut sheets (this device) */
  cutSheets: CutSheet[]
  /** Ranch Box subscriptions bought on this device */
  subscriptions: Subscription[]
  /** Gift cards bought on this device */
  giftCards: GiftCard[]
  /** Corporate and bulk gifting requests */
  giftInquiries: GiftInquiry[]
  /** Mock sign-in for the customer account pages */
  account: Account | null
  addresses: Address[]
  /** Favorite Butcher Shop products, by id */
  favorites: string[]
  /** Emails signed up for the ranch newsletter */
  newsletter: string[]
  /** Ranch Goods stock (one-of-a-kind items drop to 0 when sold) */
  goods: GoodsProduct[]
  /** Owner's paperwork progress per Ranch Goods category */
  compliance: Record<GoodsCategoryId, ComplianceStatus>
  /** What came back from the processor for each harvested animal */
  byproductRecoveries: ByproductRecovery[]
  /** Makers & Wholesale requests (owner inbox) */
  wholesaleInquiries: WholesaleInquiry[]
  /** Owner's own byproduct yields, prices, costs, and recovery rates (start from the config's estimates) */
  byproductSettings: ByproductSettings
  /** Raw byproducts turned into stock */
  byproductBatches: ByproductBatch[]
}

/** What else an order creates besides the order itself. */
export interface OrderExtras {
  /** Share claims to add to their pools */
  claims?: { poolId: string; claim: ShareClaim }[]
  subscriptions?: Subscription[]
  giftCards?: GiftCard[]
  /** Cart lines paid for in this order (they leave the cart) */
  paidLineIds?: string[]
}

export type AnimalPatch = Partial<Pick<Animal, 'estWeight' | 'frameScore' | 'bcs' | 'notes'>>

const isOpen = (o: Offer) => o.status === 'pending' || o.status === 'countered'

export type NewOffer = Pick<Offer, 'lotId' | 'buyerName' | 'operation' | 'phone' | 'email' | 'pricePerHead' | 'headCount' | 'message'>

interface RanchActions {
  /** Saves an offer as pending and marks an available lot "Offer pending". */
  submitOffer: (offer: NewOffer) => Offer
  addToCart: (lotId: string) => void
  removeFromCart: (lotId: string) => void
  /** Adds a share claim to the cart; the deposit is paid at checkout. */
  addShareToCart: (item: Omit<ShareCartItem, 'kind' | 'id' | 'addedAt'>) => ShareCartItem
  removeShareFromCart: (id: string) => void
  /** Adds packs of a Butcher Shop product (merging with packs already in the cart). */
  addProductToCart: (productId: string, qty?: number) => void
  addBundleToCart: (bundleId: string) => void
  addBoxToCart: (items: BoxItem[]) => void
  addSubscriptionToCart: (input: Omit<SubscriptionCartItem, 'kind' | 'id' | 'addedAt'>) => void
  addGiftCardToCart: (input: Omit<GiftCardCartItem, 'kind' | 'id' | 'addedAt'>) => void
  /** Adds units of a Ranch Goods item (merging with the same item already in the cart; one-of-a-kind stays at 1). */
  addGoodsToCart: (goodsId: string, qty?: number) => void
  /** Sets the quantity of a product, bundle, or Ranch Goods line (0 removes it). */
  setCartQty: (lineId: string, qty: number) => void
  /** Removes any line that has an id (everything but cattle lots). */
  removeCartLine: (lineId: string) => void
  clearCart: () => void
  /**
   * Adds or replaces a lot, plus any animals not already in the herd (e.g. from a chute scan).
   * Animals taken from another unsold lot move out of it; a lot left empty is removed.
   */
  saveLot: (lot: Lot, newAnimals?: Animal[]) => void
  /**
   * Checkout: saves the order, marks its lots sold, declines open offers on them, adds its share
   * claims to their pools (a pool that fills becomes "Fully claimed"), and empties the cart.
   */
  placeOrder: (order: Order, extras?: OrderExtras) => void
  submitGiftInquiry: (inquiry: Omit<GiftInquiry, 'id' | 'createdAt'>) => GiftInquiry
  signIn: (account: Omit<Account, 'since'>) => void
  signOut: () => void
  /** Adds or replaces an address; making one the default clears the others. */
  saveAddress: (address: Address) => void
  deleteAddress: (id: string) => void
  toggleFavorite: (productId: string) => void
  /** Pause, resume, cancel, or change a Ranch Box subscription. */
  updateSubscription: (id: string, patch: Partial<Pick<Subscription, 'size' | 'frequency' | 'feedPreference' | 'status'>>) => void
  /** Skips the next box: the following ship date moves out a month (or two). */
  skipNextBox: (id: string) => void
  cancelSubscription: (id: string) => void
  /** Puts an order's Butcher Shop items back in the cart. Returns how many lines were added. */
  reorder: (orderId: string) => number
  /** Owner: opens a share pool for an animal (it joins the beef program). */
  createPool: (input: NewPoolInput) => SharePool
  /** Owner: gives an open pool more days. */
  extendPool: (poolId: string, days: number) => void
  /** Owner: stops taking claims now; claimants roll over or are refunded, as they chose. */
  closePool: (poolId: string) => void
  /** Owner: books the processor for a full pool. */
  scheduleHarvest: (poolId: string, date: string) => void
  /** Owner: moves a pool to its next stage (harvest → dry aging → cut & wrap → ready → shipped). */
  advancePool: (poolId: string) => void
  /** Demo: a week passes. Full pools get a harvest date; everything after harvest moves one stage. Returns how many pools moved. */
  simulateWeek: () => number
  setProductStock: (productId: string, stock: number) => void
  /** Returns false if the email was already signed up. */
  subscribeNewsletter: (email: string) => boolean
  /**
   * Demo activity: a neighbor claims a share of an open pool. Never takes a pool's last open
   * segment, nor segments held in this visitor's cart. Returns what happened, or null.
   */
  simulateClaim: () => { claim: ShareClaim; pool: SharePool } | null
  subscribeNotify: (signup: Omit<NotifySignup, 'id' | 'createdAt'>) => NotifySignup
  /** Adds or replaces a cut sheet. */
  saveCutSheet: (sheet: CutSheet) => void
  deleteCutSheet: (id: string) => void
  /** Records a send to auction partners (newest first). */
  logSend: (send: SendRecord) => void
  /** Takes a lot down. Its animals stay in the herd; offers on it stay in the inbox. */
  deleteLot: (lotId: string) => void
  /** CSV import: new animals are added; existing tags get the patch (new readings). */
  importAnimals: (added: Animal[], updates: { tagId: string; patch: Partial<Animal> }[]) => void
  /** Inline edits from the herd table. Lot numbers update everywhere, since they're derived. */
  updateAnimal: (tagId: string, patch: AnimalPatch) => void
  /** Closes the sale at the offer (or counter) price: the lot is sold and other open offers on it are declined. */
  acceptOffer: (offerId: string) => void
  counterOffer: (offerId: string, pricePerHead: number) => void
  /** A lot with no open offers left goes back to available. */
  declineOffer: (offerId: string) => void
  /** Makes a draft lot public. */
  publishLot: (lotId: string) => void
  submitWholesaleInquiry: (inquiry: Omit<WholesaleInquiry, 'id' | 'createdAt' | 'status'>) => WholesaleInquiry
  /** Owner: reply to or mark a wholesale inquiry handled. */
  updateWholesaleInquiry: (id: string, patch: Partial<Pick<WholesaleInquiry, 'status' | 'reply'>>) => void
  /** Owner: edits one part's yield, price, cost, or recovery rate. */
  updateByproductPart: (part: ByproductPartId, patch: Partial<PartSettings>) => void
  setHeadPerYear: (head: number) => void
  /** Owner: back to the config's placeholder estimates. */
  resetByproductSettings: () => void
  /** Owner: records how much of a part came back from the processor for one harvested animal. */
  setRecovery: (tagId: string, part: ByproductPartId, amount: number) => void
  /** Owner: turns raw byproduct into stock (e.g. 40 lb fat → 30 lb tallow). Returns the batch, or null if nothing was made. */
  convertBatch: (input: { recipeId: string; rawUsed: number; ratio: number }) => ByproductBatch | null
  /** Owner: sets a Ranch Goods item's stock. */
  setGoodsStock: (goodsId: string, stock: number) => void
  /** Owner: updates a category's compliance progress. */
  setComplianceStatus: (category: GoodsCategoryId, patch: Partial<Omit<ComplianceStatus, 'updatedAt'>>) => void
  resetDemo: () => void
}

export type RanchState = RanchData & RanchActions

function seed(): RanchData {
  const pools = buildSeedPools(seedAnimals)
  // Pools already past harvest mark their animal harvested, so it leaves the head count.
  const harvested = new Map(pools.filter((p) => p.hangingWeight && p.harvestDate).map((p) => [p.tagId, p]))
  return {
    animals: structuredClone(seedAnimals).map((a) => {
      const p = harvested.get(a.tagId)
      return p
        ? {
            ...a,
            harvest: { date: p.harvestDate!, hangingWeight: p.hangingWeight!, agedDays: p.agingDays ?? 21, processor: beefConfig.processor.name },
          }
        : a
    }),
    lots: structuredClone(seedLots),
    offers: structuredClone(seedOffers),
    cart: [],
    orders: [],
    sends: [],
    pools,
    products: structuredClone(seedProducts),
    notifySignups: [],
    cutSheets: [],
    subscriptions: [],
    giftCards: [],
    giftInquiries: [],
    account: null,
    addresses: [],
    favorites: [],
    newsletter: [],
    goods: structuredClone(seedGoods),
    compliance: structuredClone(seedCompliance),
    byproductRecoveries: structuredClone(seedRecoveries),
    wholesaleInquiries: structuredClone(seedWholesaleInquiries),
    byproductSettings: defaultSettings(byproductsConfig),
    byproductBatches: structuredClone(seedBatches),
  }
}

/** yyyy-mm-dd, `months` later */
function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Fill-meter segments this visitor's cart is holding in each pool. */
export function heldSegments(cart: CartItem[], pools: SharePool[]) {
  const held = new Map<string, number>()
  for (const item of cart) {
    if (item.kind !== 'share') continue
    const pool = pools.find((p) => p.id === item.poolId)
    if (pool) held.set(pool.id, (held.get(pool.id) ?? 0) + segmentsFor(item.size, pool.unit))
  }
  return held
}

/** Cart filter: drops lot lines for these lots, keeps everything else. */
const notInLots = (lotIds: Set<string>) => (i: CartItem) => i.kind !== 'lot' || !lotIds.has(i.lotId)

export const useRanchStore = create<RanchState>()(
  persist(
    (set, get) => ({
      ...seed(),

      submitOffer: (input) => {
        const offer: Offer = {
          ...input,
          id: `offer-${Date.now().toString(36)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          fromThisDevice: true,
        }
        set((s) => ({
          offers: [offer, ...s.offers],
          lots: s.lots.map((l) => (l.id === input.lotId && l.status === 'available' ? { ...l, status: 'pending' } : l)),
        }))
        return offer
      },

      addToCart: (lotId) =>
        set((s) =>
          s.cart.some((i) => i.kind === 'lot' && i.lotId === lotId)
            ? s
            : { cart: [...s.cart, { kind: 'lot', lotId, addedAt: new Date().toISOString() }] },
        ),

      removeFromCart: (lotId) => set((s) => ({ cart: s.cart.filter(notInLots(new Set([lotId]))) })),

      addShareToCart: (input) => {
        const item: ShareCartItem = { ...input, kind: 'share', id: uid('share'), addedAt: new Date().toISOString() }
        set((s) => ({ cart: [...s.cart, item] }))
        return item
      },

      removeShareFromCart: (id) => get().removeCartLine(id),

      addProductToCart: (productId, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((i) => i.kind === 'product' && i.productId === productId)
          if (existing) return { cart: s.cart.map((i) => (i === existing && i.kind === 'product' ? { ...i, qty: i.qty + qty } : i)) }
          return { cart: [...s.cart, { kind: 'product', id: uid('product'), productId, qty, addedAt: new Date().toISOString() }] }
        }),

      addBundleToCart: (bundleId) =>
        set((s) => {
          const existing = s.cart.find((i) => i.kind === 'bundle' && i.bundleId === bundleId)
          if (existing) return { cart: s.cart.map((i) => (i === existing && i.kind === 'bundle' ? { ...i, qty: i.qty + 1 } : i)) }
          return { cart: [...s.cart, { kind: 'bundle', id: uid('bundle'), bundleId, qty: 1, addedAt: new Date().toISOString() }] }
        }),

      addBoxToCart: (items) => set((s) => ({ cart: [...s.cart, { kind: 'box', id: uid('box'), items, addedAt: new Date().toISOString() }] })),

      addSubscriptionToCart: (input) =>
        set((s) => ({ cart: [...s.cart, { ...input, kind: 'subscription', id: uid('sub'), addedAt: new Date().toISOString() }] })),

      addGiftCardToCart: (input) =>
        set((s) => ({ cart: [...s.cart, { ...input, kind: 'gift-card', id: uid('gift'), addedAt: new Date().toISOString() }] })),

      addGoodsToCart: (goodsId, qty = 1) =>
        set((s) => {
          const g = s.goods.find((x) => x.id === goodsId)
          if (!g || g.stock <= 0) return s
          const cap = g.unique ? 1 : g.stock
          const existing = s.cart.find((i) => i.kind === 'goods' && i.goodsId === goodsId)
          if (existing) return { cart: s.cart.map((i) => (i === existing && i.kind === 'goods' ? { ...i, qty: Math.min(cap, i.qty + qty) } : i)) }
          return { cart: [...s.cart, { kind: 'goods', id: uid('goods'), goodsId, qty: Math.min(cap, qty), addedAt: new Date().toISOString() }] }
        }),

      setCartQty: (lineId, qty) =>
        set((s) => ({
          cart: s.cart.flatMap((i) => {
            if (!('id' in i) || i.id !== lineId || (i.kind !== 'product' && i.kind !== 'bundle' && i.kind !== 'goods')) return [i]
            const cap = i.kind === 'goods' && s.goods.find((g) => g.id === i.goodsId)?.unique ? 1 : 99
            return qty > 0 ? [{ ...i, qty: Math.min(cap, Math.round(qty)) }] : []
          }),
        })),

      removeCartLine: (lineId) => set((s) => ({ cart: s.cart.filter((i) => !('id' in i) || i.id !== lineId) })),

      clearCart: () => set({ cart: [] }),

      saveLot: (lot, newAnimals = []) =>
        set((s) => {
          const known = new Set(s.animals.map((a) => a.tagId))
          const moving = new Set(lot.tagIds)
          const others = s.lots
            .filter((l) => l.id !== lot.id)
            .map((l) => (l.status === 'sold' ? l : { ...l, tagIds: l.tagIds.filter((t) => !moving.has(t)) }))
          const emptied = new Set(others.filter((l) => l.tagIds.length === 0).map((l) => l.id))
          return {
            animals: [...s.animals, ...newAnimals.filter((a) => !known.has(a.tagId))],
            lots: [...others.filter((l) => !emptied.has(l.id)), lot],
            cart: s.cart.filter(notInLots(emptied)),
          }
        }),

      placeOrder: (order, { claims = [], subscriptions = [], giftCards = [], paidLineIds = [] } = {}) =>
        set((s) => {
          const sold = new Set(order.lotIds)
          const now = new Date().toISOString()
          const paid = new Set([...(order.shares?.map((sh) => sh.claimId) ?? []), ...paidLineIds])
          // Packs leave the freezer as soon as they're bought.
          const taken = new Map<string, number>()
          for (const item of order.items ?? []) for (const p of item.packs ?? []) taken.set(p.productId, (taken.get(p.productId) ?? 0) + p.packs)
          // Ranch Goods too: a one-of-a-kind hide or horn drops to 0 and shows as sold.
          const goodsTaken = new Map<string, number>()
          for (const item of order.items ?? []) for (const g of item.goods ?? []) goodsTaken.set(g.goodsId, (goodsTaken.get(g.goodsId) ?? 0) + g.qty)
          return {
            goods: goodsTaken.size
              ? s.goods.map((g) => (goodsTaken.has(g.id) ? { ...g, stock: Math.max(0, g.stock - goodsTaken.get(g.id)!) } : g))
              : s.goods,
            orders: [order, ...s.orders],
            products: taken.size
              ? s.products.map((p) => (taken.has(p.id) ? { ...p, stock: Math.max(0, p.stock - taken.get(p.id)!) } : p))
              : s.products,
            subscriptions: [...subscriptions, ...s.subscriptions],
            // A gift card used at checkout loses what it paid for.
            giftCards: [
              ...giftCards,
              ...s.giftCards.map((g) =>
                order.discount?.kind === 'gift-card' && g.code === order.discount.code
                  ? { ...g, balance: Math.max(0, Math.round((g.balance - order.discount.amount) * 100) / 100) }
                  : g,
              ),
            ],
            lots: s.lots.map((l) => (sold.has(l.id) ? { ...l, status: 'sold' as const } : l)),
            offers: s.offers.map((o) => (sold.has(o.lotId) && isOpen(o) ? { ...o, status: 'declined' as const, respondedAt: now } : o)),
            pools: s.pools.map((p) => {
              const mine = claims.filter((c) => c.poolId === p.id).map((c) => c.claim)
              if (!mine.length) return p
              const next = { ...p, claims: [...p.claims, ...mine] }
              // Harvest locks in the moment the last share is claimed.
              return segmentsClaimed(next) >= poolSegments(next)
                ? { ...next, status: 'full' as const, history: [...p.history, { status: 'full' as const, at: now }] }
                : next
            }),
            // A share line's id becomes its claim id at checkout.
            cart: s.cart.filter((i) => (i.kind === 'lot' ? !sold.has(i.lotId) : !paid.has(i.id))),
          }
        }),

      simulateClaim: () => {
        const s = get()
        const now = Date.now()
        const held = heldSegments(s.cart, s.pools)
        // Leave at least one segment open in every pool, so a visitor always has something to claim.
        const candidates = s.pools.filter((p) => isClaimable(p, now) && segmentsLeft(p, held.get(p.id) ?? 0) >= 2)
        if (!candidates.length) return null
        const pool = candidates[Math.floor(Math.random() * candidates.length)]
        const left = segmentsLeft(pool, held.get(pool.id) ?? 0)
        const size = pool.unit === 'quarter' && left >= 3 && Math.random() < 0.3 ? 'half' : pool.unit
        const taken = new Set(pool.claims.map((c) => c.firstName))
        const people = CLAIMANTS.filter((c) => !taken.has(c.firstName))
        const who = people[Math.floor(Math.random() * people.length)] ?? CLAIMANTS[0]
        const animal = s.animals.find((a) => a.tagId === pool.tagId)
        const quote =
          animal &&
          quoteShare({
            liveLb: animal.estWeight,
            size,
            feedProgram: pool.feedProgram,
            breed: animal.breed,
            basePricePerHangingLb: pool.pricePerHangingLb,
          })
        const claim: ShareClaim = {
          id: uid('claim'),
          size,
          segments: segmentsFor(size, pool.unit),
          ...who,
          claimedAt: new Date(now).toISOString(),
          ifUnfilled: Math.random() < 0.5 ? 'roll-over' : 'refund',
          byproductRightsAcceptedAt: new Date(now).toISOString(),
          deposit: quote?.deposit ?? 0,
        }
        set((st) => ({ pools: st.pools.map((p) => (p.id === pool.id ? { ...p, claims: [...p.claims, claim] } : p)) }))
        return { claim, pool }
      },

      submitGiftInquiry: (input) => {
        const inquiry: GiftInquiry = { ...input, id: uid('inquiry'), createdAt: new Date().toISOString() }
        set((s) => ({ giftInquiries: [inquiry, ...s.giftInquiries] }))
        return inquiry
      },

      signIn: (input) => set((s) => ({ account: { ...input, since: s.account?.since ?? new Date().toISOString() } })),

      signOut: () => set({ account: null }),

      saveAddress: (address) =>
        set((s) => {
          const exists = s.addresses.some((a) => a.id === address.id)
          let list = exists ? s.addresses.map((a) => (a.id === address.id ? address : a)) : [...s.addresses, address]
          if (address.isDefault) list = list.map((a) => ({ ...a, isDefault: a.id === address.id }))
          // There's always one default address.
          if (!list.some((a) => a.isDefault)) list = list.map((a, i) => ({ ...a, isDefault: i === 0 }))
          return { addresses: list }
        }),

      deleteAddress: (id) =>
        set((s) => {
          const left = s.addresses.filter((a) => a.id !== id)
          if (left.length && !left.some((a) => a.isDefault)) left[0] = { ...left[0], isDefault: true }
          return { addresses: left }
        }),

      toggleFavorite: (productId) =>
        set((s) => ({ favorites: s.favorites.includes(productId) ? s.favorites.filter((f) => f !== productId) : [...s.favorites, productId] })),

      updateSubscription: (id, patch) => set((s) => ({ subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      skipNextBox: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((x) =>
            x.id === id ? { ...x, skipped: [...x.skipped, x.nextShip], nextShip: addMonths(x.nextShip, x.frequency === 'monthly' ? 1 : 2) } : x,
          ),
        })),

      cancelSubscription: (id) => set((s) => ({ subscriptions: s.subscriptions.filter((x) => x.id !== id) })),

      reorder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId)
        let added = 0
        for (const item of order?.items ?? []) {
          const p = item.ref && get().products.find((x) => x.id === item.ref)
          if (item.kind === 'product' && p && p.stock > 0) {
            get().addProductToCart(p.id, Math.min(item.qty, p.stock))
            added++
          } else if (item.kind === 'bundle' && item.ref) {
            for (let i = 0; i < item.qty; i++) get().addBundleToCart(item.ref)
            added++
          } else if (item.kind === 'box' && item.packs) {
            get().addBoxToCart(item.packs)
            added++
          } else if (item.kind === 'goods' && item.ref) {
            const g = get().goods.find((x) => x.id === item.ref)
            if (g && g.stock > 0) {
              get().addGoodsToCart(g.id, Math.min(item.qty, g.stock))
              added++
            }
          }
        }
        return added
      },

      createPool: (input) => {
        const pool = newPool(input, Date.now())
        set((s) => ({
          pools: [...s.pools, pool],
          animals: s.animals.map((a) =>
            a.tagId === input.tagId ? { ...a, feedProgram: input.feedProgram, finishDate: a.finishDate ?? pool.deadline.slice(0, 10) } : a,
          ),
        }))
        return pool
      },

      extendPool: (poolId, days) =>
        set((s) => ({
          pools: s.pools.map((p) =>
            p.id === poolId
              ? { ...p, deadline: new Date(Math.max(Date.now(), new Date(p.deadline).getTime()) + days * 86_400_000).toISOString() }
              : p,
          ),
        })),

      closePool: (poolId) =>
        set((s) => ({ pools: s.pools.map((p) => (p.id === poolId && p.status === 'open' ? { ...p, deadline: new Date().toISOString() } : p)) })),

      scheduleHarvest: (poolId, date) => set((s) => ({ pools: s.pools.map((p) => (p.id === poolId ? bookHarvest(p, date, Date.now()) : p)) })),

      advancePool: (poolId) =>
        set((s) => {
          const pool = s.pools.find((p) => p.id === poolId)
          if (!pool) return s
          const { pool: next, harvested } = stepPool(
            pool,
            s.animals.find((a) => a.tagId === pool.tagId),
            Date.now(),
          )
          return {
            pools: s.pools.map((p) => (p.id === poolId ? next : p)),
            animals: harvested ? s.animals.map((a) => (a.tagId === pool.tagId ? { ...a, harvest: harvested } : a)) : s.animals,
          }
        }),

      simulateWeek: () => {
        const s = get()
        const now = Date.now()
        const nextWeek = new Date(now + 7 * 86_400_000).toISOString().slice(0, 10)
        let moved = 0
        const harvests = new Map<string, NonNullable<Animal['harvest']>>()
        const pools = s.pools.map((p) => {
          if (p.status === 'full') {
            moved++
            return bookHarvest(p, nextWeek, now)
          }
          if (p.status === 'open' || p.status === 'shipped') return p
          const { pool, harvested } = stepPool(
            p,
            s.animals.find((a) => a.tagId === p.tagId),
            now,
          )
          if (harvested) harvests.set(p.tagId, harvested)
          if (pool !== p) moved++
          return pool
        })
        set({ pools, animals: s.animals.map((a) => (harvests.has(a.tagId) ? { ...a, harvest: harvests.get(a.tagId) } : a)) })
        return moved
      },

      setProductStock: (productId, stock) =>
        set((s) => ({ products: s.products.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, Math.round(stock)) } : p)) })),

      subscribeNewsletter: (email) => {
        const e = email.trim().toLowerCase()
        if (get().newsletter.includes(e)) return false
        set((s) => ({ newsletter: [...s.newsletter, e] }))
        return true
      },

      saveCutSheet: (sheet) =>
        set((s) => {
          const saved = { ...sheet, updatedAt: new Date().toISOString() }
          return {
            cutSheets: s.cutSheets.some((c) => c.id === sheet.id) ? s.cutSheets.map((c) => (c.id === sheet.id ? saved : c)) : [saved, ...s.cutSheets],
          }
        }),

      deleteCutSheet: (id) => set((s) => ({ cutSheets: s.cutSheets.filter((c) => c.id !== id) })),

      subscribeNotify: (input) => {
        const signup: NotifySignup = { ...input, id: uid('notify'), createdAt: new Date().toISOString() }
        set((s) => ({
          notifySignups: [signup, ...s.notifySignups.filter((n) => !(n.email === input.email && n.feedProgram === input.feedProgram))],
        }))
        return signup
      },

      logSend: (send) => set((s) => ({ sends: [send, ...s.sends] })),

      deleteLot: (lotId) =>
        set((s) => ({
          lots: s.lots.filter((l) => l.id !== lotId),
          cart: s.cart.filter(notInLots(new Set([lotId]))),
        })),

      importAnimals: (added, updates) =>
        set((s) => {
          const patches = new Map(updates.map((u) => [u.tagId, u.patch]))
          const known = new Set(s.animals.map((a) => a.tagId))
          return {
            animals: [
              ...s.animals.map((a) => (patches.has(a.tagId) ? { ...a, ...patches.get(a.tagId) } : a)),
              ...added.filter((a) => !known.has(a.tagId)),
            ],
          }
        }),

      updateAnimal: (tagId, patch) =>
        set((s) => ({
          animals: s.animals.map((a) => (a.tagId === tagId ? { ...a, ...patch } : a)),
        })),

      acceptOffer: (offerId) =>
        set((s) => {
          const offer = s.offers.find((o) => o.id === offerId)
          if (!offer || !isOpen(offer)) return s
          const now = new Date().toISOString()
          const price = offer.status === 'countered' ? (offer.counterPricePerHead ?? offer.pricePerHead) : offer.pricePerHead
          return {
            offers: s.offers.map((o) =>
              o.id === offerId
                ? { ...o, status: 'accepted', acceptedPricePerHead: price, respondedAt: now }
                : o.lotId === offer.lotId && isOpen(o)
                  ? { ...o, status: 'declined', respondedAt: now }
                  : o,
            ),
            lots: s.lots.map((l) => (l.id === offer.lotId ? { ...l, status: 'sold' } : l)),
            cart: s.cart.filter(notInLots(new Set([offer.lotId]))),
          }
        }),

      counterOffer: (offerId, pricePerHead) =>
        set((s) => {
          const offer = s.offers.find((o) => o.id === offerId)
          if (!offer || offer.status !== 'pending') return s
          return {
            offers: s.offers.map((o) =>
              o.id === offerId ? { ...o, status: 'countered', counterPricePerHead: pricePerHead, respondedAt: new Date().toISOString() } : o,
            ),
            lots: s.lots.map((l) => (l.id === offer.lotId && l.status === 'available' ? { ...l, status: 'pending' } : l)),
          }
        }),

      declineOffer: (offerId) =>
        set((s) => {
          const offer = s.offers.find((o) => o.id === offerId)
          if (!offer || !isOpen(offer)) return s
          const offers = s.offers.map((o) => (o.id === offerId ? { ...o, status: 'declined' as const, respondedAt: new Date().toISOString() } : o))
          const stillOpen = offers.some((o) => o.lotId === offer.lotId && isOpen(o))
          return {
            offers,
            lots: s.lots.map((l) => (l.id === offer.lotId && l.status === 'pending' && !stillOpen ? { ...l, status: 'available' } : l)),
          }
        }),

      publishLot: (lotId) =>
        set((s) => ({
          lots: s.lots.map((l) => (l.id === lotId ? { ...l, draft: false, listedAt: DEMO_TODAY } : l)),
        })),

      submitWholesaleInquiry: (input) => {
        const inquiry: WholesaleInquiry = { ...input, id: uid('wholesale'), status: 'new', createdAt: new Date().toISOString() }
        set((s) => ({ wholesaleInquiries: [inquiry, ...s.wholesaleInquiries] }))
        return inquiry
      },

      updateWholesaleInquiry: (id, patch) =>
        set((s) => ({ wholesaleInquiries: s.wholesaleInquiries.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      updateByproductPart: (part, patch) =>
        set((s) => ({
          byproductSettings: {
            ...s.byproductSettings,
            parts: { ...s.byproductSettings.parts, [part]: { ...s.byproductSettings.parts[part], ...patch } },
          },
        })),

      setHeadPerYear: (head) => set((s) => ({ byproductSettings: { ...s.byproductSettings, headPerYear: Math.max(0, Math.round(head)) } })),

      resetByproductSettings: () => set({ byproductSettings: defaultSettings(byproductsConfig) }),

      setRecovery: (tagId, part, amount) =>
        set((s) => {
          const value = Math.max(0, Math.round(amount * 10) / 10)
          const exists = s.byproductRecoveries.some((r) => r.tagId === tagId)
          return {
            byproductRecoveries: exists
              ? s.byproductRecoveries.map((r) => (r.tagId === tagId ? { ...r, recovered: { ...r.recovered, [part]: value } } : r))
              : [...s.byproductRecoveries, { tagId, recovered: { [part]: value } }],
          }
        }),

      convertBatch: ({ recipeId, rawUsed, ratio }) => {
        const recipe = RECIPES.find((x) => x.id === recipeId)
        const units = batchUnits(rawUsed, ratio)
        if (!recipe || rawUsed <= 0 || units <= 0) return null
        const batch: ByproductBatch = {
          id: uid('batch'),
          part: recipe.part,
          recipeId,
          goodsId: recipe.goodsId,
          rawUsed: Math.round(rawUsed * 10) / 10,
          ratio,
          units,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          byproductBatches: [batch, ...s.byproductBatches],
          goods: s.goods.map((g) => (g.id === recipe.goodsId ? { ...g, stock: g.stock + units } : g)),
        }))
        return batch
      },

      setGoodsStock: (goodsId, stock) =>
        set((s) => ({
          goods: s.goods.map((g) => (g.id === goodsId ? { ...g, stock: Math.max(0, Math.min(g.unique ? 1 : Infinity, Math.round(stock))) } : g)),
        })),

      setComplianceStatus: (category, patch) =>
        set((s) => ({ compliance: { ...s.compliance, [category]: { ...s.compliance[category], ...patch, updatedAt: new Date().toISOString() } } })),

      resetDemo: () => set(seed()),
    }),
    {
      name: 'ranch-demo-data',
      version: 3,
      // A changed data shape starts fresh from the seed data.
      migrate: () => seed(),
      partialize: ({
        animals,
        lots,
        offers,
        cart,
        orders,
        sends,
        pools,
        products,
        notifySignups,
        cutSheets,
        subscriptions,
        giftCards,
        giftInquiries,
        account,
        addresses,
        favorites,
        newsletter,
        goods,
        compliance,
        byproductRecoveries,
        wholesaleInquiries,
        byproductSettings,
        byproductBatches,
      }): RanchData => ({
        animals,
        lots,
        offers,
        cart,
        orders,
        sends,
        pools,
        products,
        notifySignups,
        cutSheets,
        subscriptions,
        giftCards,
        giftInquiries,
        account,
        addresses,
        favorites,
        newsletter,
        goods,
        compliance,
        byproductRecoveries,
        wholesaleInquiries,
        byproductSettings,
        byproductBatches,
      }),
    },
  ),
)
