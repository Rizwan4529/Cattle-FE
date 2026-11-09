import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    }),
    { name: 'ranch-preferences' },
  ),
)
