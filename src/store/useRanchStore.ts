import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_TODAY, animals as seedAnimals } from '@/data/animals'
import { lots as seedLots } from '@/data/lots'
import { seedOffers } from '@/data/offers'
import type { Animal, CartItem, Lot, Offer, Order, SendRecord } from '@/data/types'

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
}

export type AnimalPatch = Partial<Pick<Animal, 'estWeight' | 'frameScore' | 'bcs' | 'notes'>>

const isOpen = (o: Offer) => o.status === 'pending' || o.status === 'countered'

export type NewOffer = Pick<Offer, 'lotId' | 'buyerName' | 'operation' | 'phone' | 'email' | 'pricePerHead' | 'headCount' | 'message'>

interface RanchActions {
  /** Saves an offer as pending and marks an available lot "Offer pending". */
  submitOffer: (offer: NewOffer) => Offer
  addToCart: (lotId: string) => void
  removeFromCart: (lotId: string) => void
  clearCart: () => void
  /**
   * Adds or replaces a lot, plus any animals not already in the herd (e.g. from a chute scan).
   * Animals taken from another unsold lot move out of it; a lot left empty is removed.
   */
  saveLot: (lot: Lot, newAnimals?: Animal[]) => void
  /** Checkout: saves the order, marks its lots sold, declines open offers on them, and empties those lots from the cart. */
  placeOrder: (order: Order) => void
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
  resetDemo: () => void
}

export type RanchState = RanchData & RanchActions

const seed = (): RanchData => ({
  animals: structuredClone(seedAnimals),
  lots: structuredClone(seedLots),
  offers: structuredClone(seedOffers),
  cart: [],
  orders: [],
  sends: [],
})

export const useRanchStore = create<RanchState>()(
  persist(
    (set) => ({
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
        set((s) => (s.cart.some((i) => i.lotId === lotId) ? s : { cart: [...s.cart, { lotId, addedAt: new Date().toISOString() }] })),

      removeFromCart: (lotId) => set((s) => ({ cart: s.cart.filter((i) => i.lotId !== lotId) })),

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
            cart: s.cart.filter((i) => !emptied.has(i.lotId)),
          }
        }),

      placeOrder: (order) =>
        set((s) => {
          const sold = new Set(order.lotIds)
          const now = new Date().toISOString()
          return {
            orders: [order, ...s.orders],
            lots: s.lots.map((l) => (sold.has(l.id) ? { ...l, status: 'sold' as const } : l)),
            offers: s.offers.map((o) => (sold.has(o.lotId) && isOpen(o) ? { ...o, status: 'declined' as const, respondedAt: now } : o)),
            cart: s.cart.filter((i) => !sold.has(i.lotId)),
          }
        }),

      logSend: (send) => set((s) => ({ sends: [send, ...s.sends] })),

      deleteLot: (lotId) =>
        set((s) => ({
          lots: s.lots.filter((l) => l.id !== lotId),
          cart: s.cart.filter((i) => i.lotId !== lotId),
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
            cart: s.cart.filter((i) => i.lotId !== offer.lotId),
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

      resetDemo: () => set(seed()),
    }),
    {
      name: 'ranch-demo-data',
      version: 1,
      // A changed data shape starts fresh from the seed data.
      migrate: () => seed(),
      partialize: ({ animals, lots, offers, cart, orders, sends }): RanchData => ({
        animals,
        lots,
        offers,
        cart,
        orders,
        sends,
      }),
    },
  ),
)
