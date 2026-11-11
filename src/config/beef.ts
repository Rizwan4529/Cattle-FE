/**
 * Beef storefront settings: the business rules behind every beef price,
 * weight, share, delivery option, and promo code. Branding (name, colors,
 * phone) stays in ranch.ts; this file is the one to edit when the ranch's
 * prices or policies change.
 *
 * Defaults follow the ranch's cattle economics sheet: 62% dressing, 40%
 * take-home, $7.10 per hanging lb (about $11 per take-home lb).
 */

import type { FeedProgramId, PoolUnit, ShareSize } from '@/data/beefTypes'

export interface FeedProgram {
  id: FeedProgramId
  name: string
  /** Shorter label for badges and filters */
  short: string
  description: string
  flavor: string
  /** 1 (lean) to 5 (heavily marbled) */
  marbling: 1 | 2 | 3 | 4 | 5
  /** Applied to the price per hanging lb */
  priceMultiplier: number
  /** Typical age at harvest */
  finishAge: string
}

export interface DeliveryZone {
  id: string
  name: string
  /** First three digits of the ZIP codes this zone covers */
  zipPrefixes: string[]
  fee: number
  freeOver: number
  /** Delivery day(s) */
  days: string
}

export type PromoCode =
  | { code: string; kind: 'percent'; value: number; description: string; minSubtotal?: number }
  | { code: string; kind: 'amount'; value: number; description: string; minSubtotal?: number }
  | { code: string; kind: 'free-shipping'; description: string; minSubtotal?: number }

export const beefConfig = {
  /** Hanging (carcass) weight as a share of live weight */
  dressingPercent: 0.62,
  dressingRange: [0.6, 0.65] as const,
  /** Packaged, take-home beef as a share of LIVE weight */
  takeHomePercent: 0.4,
  takeHomeRange: [0.38, 0.43] as const,

  /** Before feed-program and breed adjustments */
  pricePerHangingLb: 7.1,

  processing: {
    /** 'itemized' shows processing as its own line; 'included' rolls it into the share price */
    mode: 'itemized' as 'itemized' | 'included',
    perHangingLb: 1.0,
    /** Charged once per animal and split across its shares */
    killFee: 95,
  },

  shareSizes: { whole: true, half: true, quarter: true, eighth: false } as Record<ShareSize, boolean>,
  /** Shown to the owner next to the eighth-share switch */
  eighthWarning:
    'Some states limit how many people can split one animal, or require each buyer to own at least a quarter. Check your state rules before offering eighths.',
  /** Smallest share new pools are divided into */
  defaultPoolUnit: 'quarter' as PoolUnit,

  /** Share of the estimated price paid when claiming */
  depositRate: 0.25,
  /** Days a new pool stays open */
  poolDeadlineDays: 30,
  dryAgeDays: { min: 14, max: 21 },

  /** A typical finished steer, used when no animal is chosen yet (e.g. the pound helper on the browse page) */
  typicalLiveWeight: 1300,

  feedPrograms: [
    {
      id: 'grass-finished',
      name: 'Grass-fed & grass-finished',
      short: 'Grass-finished',
      description: 'On pasture its whole life, then finished on spring and fall grass. No grain, ever.',
      flavor: 'Lean and beefy, with a clean, slightly earthy taste. Cook it a little less than you would grain-finished beef.',
      marbling: 2,
      priceMultiplier: 1.1,
      finishAge: '24 to 30 months',
    },
    {
      id: 'grain-finished',
      name: 'Grain-finished (corn)',
      short: 'Grain-finished',
      description: 'Raised on pasture, then finished for the last 120 to 150 days on corn and hay grown on the ranch.',
      flavor: 'Rich and buttery, with the most marbling. The classic steakhouse steak.',
      marbling: 5,
      priceMultiplier: 1.0,
      finishAge: '18 to 22 months',
    },
    {
      id: 'forage-grain',
      name: 'Hay & forage-fed, grain-finished',
      short: 'Forage + grain',
      description: 'Pasture and our own hay through winter, with a short grain finish for the last 60 to 90 days.',
      flavor: 'In between: tender and well marbled, but with more of the beefy taste of grass.',
      marbling: 4,
      priceMultiplier: 1.0,
      finishAge: '20 to 24 months',
    },
  ] satisfies FeedProgram[],

  /** Price multipliers for breeds that cost more to raise. Anything not listed is 1. */
  breedPremium: { 'Wagyu cross': 1.25 } as Record<string, number>,

  /**
   * "Know your animal" claims. Only switch on what the ranch can stand behind;
   * the site shows nothing that's set to false.
   */
  claims: {
    noAddedHormones: true,
    noRoutineAntibiotics: true,
    raisedOnRanch: true,
    dryAged: true,
  },

  processor: {
    name: 'High Plains Custom Meats',
    city: 'Elizabeth, CO',
    inspection: 'USDA-inspected',
  },

  /** Sell individual cuts in the Butcher Shop */
  sellByTheCut: true,
  sellByTheCutNote: 'Selling individual cuts needs USDA- or state-inspected processing and labeling. Shares can be custom-exempt; cuts can’t.',

  freezer: {
    /** Pounds of packaged beef per cubic foot of freezer space */
    lbsPerCuFt: { min: 35, max: 40 },
    /** Common chest-freezer sizes, cu ft */
    sizes: [5, 7, 9, 15, 20, 25],
  },

  delivery: {
    localZones: [
      { id: 'elbert', name: 'Elbert & Douglas counties', zipPrefixes: ['801'], fee: 0, freeOver: 0, days: 'Tuesdays and Fridays' },
      { id: 'denver', name: 'Denver metro', zipPrefixes: ['800', '802'], fee: 15, freeOver: 150, days: 'Fridays' },
      {
        id: 'front-range',
        name: 'Colorado Springs & northern Front Range',
        zipPrefixes: ['808', '809', '805', '806'],
        fee: 35,
        freeOver: 300,
        days: 'Every other Saturday',
      },
    ] satisfies DeliveryZone[],
    pickup: {
      place: 'The ranch store, 24180 County Road 45',
      days: ['Thursday', 'Friday', 'Saturday'],
      slots: ['9:00–11:00 am', '1:00–3:00 pm', '4:00–6:00 pm'],
    },
    shipping: {
      /** Frozen, packed in dry ice, 2-day ground. Cost by box weight. */
      tiers: [
        { maxLb: 10, cost: 24 },
        { maxLb: 25, cost: 39 },
        { maxLb: 50, cost: 59 },
        { maxLb: Infinity, cost: 89 },
      ],
      freeOver: 199,
      note: 'Ships frozen on dry ice, Monday to Wednesday so it never sits in a warehouse over a weekend.',
    },
  },

  promoCodes: [
    { code: 'WELCOME10', kind: 'percent', value: 0.1, description: '10% off your first beef order' },
    { code: 'FREESHIP', kind: 'free-shipping', description: 'Free frozen shipping, any order size' },
    { code: 'RANCH25', kind: 'amount', value: 25, minSubtotal: 150, description: '$25 off beef orders of $150 or more' },
  ] satisfies PromoCode[],

  /** Butcher Shop box rules */
  box: { targetLb: 15, discount: 0.1 },

  guarantee: {
    title: 'The Farrell family guarantee',
    body: 'If any cut from our ranch isn’t the best beef you’ve had, call us. We’ll replace it or refund it, no forms and no arguing.',
  },
}

export type BeefConfig = typeof beefConfig

export const feedProgram = (id: FeedProgramId) => beefConfig.feedPrograms.find((p) => p.id === id)!
