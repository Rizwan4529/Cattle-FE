import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Side } from '@/components/layout/nav'
import type { BeefDeliveryMethod } from '@/lib/delivery'

export type ThemePreference = 'light' | 'dark' | 'system'

/** Where the buyer wants cattle hauled. Used by the freight estimator and the cart. */
export interface FreightDestination {
  /** State abbreviation, e.g. "KS" */
  state: string
  /** Set when the buyer entered a ZIP instead of choosing a state */
  zip?: string
}

interface PreferencesState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  freightDestination: FreightDestination | null
  setFreightDestination: (destination: FreightDestination | null) => void
  /** How the buyer wants to get the cattle; chosen in the cart, confirmed at checkout */
  fulfillment: Fulfillment
  setFulfillment: (fulfillment: Fulfillment) => void
  /** Last side of the site visited (Buy Beef or Buy Cattle); shared pages keep it */
  side: Side
  setSide: (side: Side) => void
  /** Demo setting: "Mike from Omaha just claimed a quarter" toasts on the beef pages */
  claimActivity: boolean
  setClaimActivity: (on: boolean) => void
  /** Remembered so the next claim form is filled in */
  claimant: Claimant | null
  setClaimant: (claimant: Claimant) => void
  /** Buy Beef delivery: ZIP checked, how Butcher Shop beef arrives, and the pickup slot */
  beefZip: string
  setBeefZip: (zip: string) => void
  beefDelivery: BeefDeliveryMethod
  setBeefDelivery: (method: BeefDeliveryMethod) => void
  pickupSlot: { date: string; slot: string } | null
  setPickupSlot: (slot: { date: string; slot: string } | null) => void
  /** How claimed shares are handed over once ready */
  shareHandoff: 'pickup' | 'local'
  setShareHandoff: (handoff: 'pickup' | 'local') => void
  /** Soil & Fuel: picked up at the ranch, or delivered on the ranch truck */
  farmDelivery: 'pickup' | 'truck'
  setFarmDelivery: (method: 'pickup' | 'truck') => void
}

export interface Claimant {
  firstName: string
  city: string
  state: string
}

export type Fulfillment = 'pickup' | 'delivery'

/**
 * Per-device preferences, kept separate from demo data so "Reset demo data"
 * does not change them. The storage key is also read by the inline script in
 * index.html to avoid a light/dark flash on load.
 */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      freightDestination: null,
      setFreightDestination: (freightDestination) => set({ freightDestination }),
      fulfillment: 'pickup',
      setFulfillment: (fulfillment) => set({ fulfillment }),
      side: 'cattle',
      setSide: (side) => set({ side }),
      claimActivity: true,
      setClaimActivity: (claimActivity) => set({ claimActivity }),
      claimant: null,
      setClaimant: (claimant) => set({ claimant }),
      beefZip: '',
      setBeefZip: (beefZip) => set({ beefZip }),
      beefDelivery: 'pickup',
      setBeefDelivery: (beefDelivery) => set({ beefDelivery }),
      pickupSlot: null,
      setPickupSlot: (pickupSlot) => set({ pickupSlot }),
      shareHandoff: 'pickup',
      setShareHandoff: (shareHandoff) => set({ shareHandoff }),
      farmDelivery: 'pickup',
      setFarmDelivery: (farmDelivery) => set({ farmDelivery }),
    }),
    { name: 'ranch-preferences' },
  ),
)
