/**
 * CROWDER Soil & Fuel settings: product lines, units, prices, application
 * rates, pro tiers, delivery pricing, compliance, and trust claims.
 *
 * ⚠ PLACEHOLDER ESTIMATES. Every price, density, application rate, burn time,
 * and delivery rate below is a rough figure for the demo, NOT the ranch's
 * real numbers. Product names are original working names for the owner to
 * confirm. Set `estimatesConfirmed: true` once Farrell has checked them; until
 * then the site labels prices and rates "estimate".
 *
 * Do not use the name Humalfa, or any of its logos, product names, images, or
 * testimonials, anywhere.
 */

import type {
  ComplianceRequirement,
  DealerKind,
  DeliveryWindow,
  FuelBuyerKind,
  FuelProduct,
  FuelUnit,
  ProBuyerKind,
  ProTier,
  SoilProduct,
  SoilUnit,
  SoilUse,
} from '@/data/soilFuelTypes'

export const soilFuelConfig = {
  /** Switch a whole division off to hide it from the site */
  soilEnabled: true,
  fuelEnabled: true,
  estimatesConfirmed: false,
  placeholderNote: 'Prices, rates, and burn times are estimates until the ranch confirms them.',

  soil: {
    brand: 'CROWDER Soil',
    tagline: 'Composted from our herd and our hay, back to your ground.',

    units: {
      bag: { label: 'Bag', plural: 'bags', short: 'bag' },
      yard: { label: 'Cubic yard', plural: 'cubic yards', short: 'yd³' },
      ton: { label: 'Ton', plural: 'tons', short: 'ton' },
      truckload: { label: 'Truckload', plural: 'truckloads', short: 'load' },
    } satisfies Record<SoilUnit, { label: string; plural: string; short: string }>,

    /** One truckload (end-dump). PLACEHOLDER. */
    truckload: { yards: 25, maxTons: 15, discount: 0.12 },
    /** Smallest bulk sale (yards or tons); jobs up to `bagJobYards` are easier in bags */
    bulkMin: 1,
    bagJobYards: 1,

    products: [
      {
        id: 'garden-blend',
        name: 'Garden Blend',
        tagline: 'Rich, crumbly compost for vegetable gardens and flower beds.',
        description:
          'Manure from our cattle, composted hot with alfalfa from our own hay meadows, then cured for months and screened. It loosens clay, holds water in sandy ground, and feeds the soil slowly all season.',
        madeOf: ['Cattle manure from our herd', 'Alfalfa and grass hay', 'Time: turned for weeks, cured for months'],
        bestUses: ['Vegetable gardens', 'Flower beds', 'Planting trees and shrubs', 'Mixing into tired soil'],
        rates: [
          { use: 'garden-bed', depthIn: 2, note: 'Spread 2 inches and dig or till it into the top 6 inches.' },
          { use: 'new-lawn', depthIn: 1, note: 'Spread 1 inch and till it in before seeding or sod.' },
          { use: 'topdress', depthIn: 0.25, note: 'A quarter inch raked over existing plants each spring.' },
          { use: 'field', tonsPerAcre: 6, note: 'About 6 tons an acre, worked in before planting.' },
        ],
        lbPerYard: 1100,
        bagCuFt: 1.5,
        price: { bag: 9.5, yard: 52, ton: 98 },
        requires: ['fertilizer-registration', 'soil-label', 'lab-testing', 'compost-permit'],
        art: 'garden-bag',
        featured: true,
      },
      {
        id: 'lawn-topdress',
        name: 'Lawn & Turf Topdress',
        tagline: 'Finely screened to settle into the grass, not sit on top of it.',
        description:
          'The same compost screened to a quarter inch, so it disappears into the lawn within a watering or two. Builds soil under turf without tearing anything up. Used by landscapers and golf courses as well as homeowners.',
        madeOf: ['Cattle manure from our herd', 'Alfalfa and grass hay', 'Screened to ¼ inch'],
        bestUses: ['Topdressing lawns after aeration', 'Overseeding', 'Sports fields and golf greens', 'Patching bare spots'],
        rates: [
          { use: 'topdress', depthIn: 0.25, note: 'A quarter inch after core aeration, raked or dragged in.' },
          { use: 'new-lawn', depthIn: 1, note: 'One inch tilled in before seeding or laying sod.' },
          { use: 'garden-bed', depthIn: 1.5, note: 'Fine enough for seed beds: 1½ inches mixed in.' },
          { use: 'field', tonsPerAcre: 4, note: 'About 4 tons an acre on hay or pasture ground.' },
        ],
        lbPerYard: 1000,
        bagCuFt: 1,
        price: { bag: 7.5, yard: 46, ton: 96 },
        requires: ['fertilizer-registration', 'soil-label', 'lab-testing', 'compost-permit'],
        art: 'topdress',
        featured: true,
      },
      {
        id: 'ag-bulk',
        name: 'Ag-Grade Bulk Compost',
        tagline: 'By the ton or the truckload, for fields, pasture, and orchards.',
        description:
          'Coarser screened compost for working ground. Builds organic matter, holds water in dry years, and cuts the fertilizer bill. Loaded at the ranch or delivered by the truckload.',
        madeOf: ['Cattle manure from our herd', 'Alfalfa and grass hay', 'Screened to 1 inch'],
        bestUses: ['Hay and pasture ground', 'Row crops', 'Orchards and vineyards', 'Reclaiming worn-out ground'],
        rates: [
          { use: 'field', tonsPerAcre: 8, note: 'About 8 tons an acre, spread with a manure spreader and worked in.' },
          { use: 'garden-bed', depthIn: 3, note: 'For new market-garden beds, 3 inches tilled in.' },
          { use: 'new-lawn', depthIn: 1, note: 'One inch tilled in before seeding large areas.' },
          { use: 'topdress', depthIn: 0.5, note: 'Half an inch on pasture in early spring.' },
        ],
        lbPerYard: 1200,
        bagCuFt: 1.5,
        price: { bag: 6.5, yard: 30, ton: 48 },
        requires: ['fertilizer-registration', 'soil-label', 'lab-testing', 'compost-permit'],
        art: 'bulk-pile',
      },
      {
        id: 'potting-mix',
        name: 'Potting & Raised Bed Mix',
        tagline: 'Ready to fill pots and raised beds, straight from the bag.',
        description:
          'Our compost blended with screened topsoil and pine bark fines, so it drains well and doesn’t pack down. Fill the bed and plant the same day.',
        madeOf: ['Composted cattle manure and alfalfa', 'Screened topsoil', 'Pine bark fines for drainage'],
        bestUses: ['Raised beds', 'Containers and pots', 'Starting seedlings', 'Patio gardens'],
        rates: [
          { use: 'garden-bed', depthIn: 10, note: 'Fill raised beds 10 to 12 inches deep; no mixing needed.' },
          { use: 'topdress', depthIn: 1, note: 'An inch on top of old raised beds each spring.' },
          { use: 'new-lawn', depthIn: 1, note: 'Works, but Lawn & Turf Topdress costs less for lawns.' },
          { use: 'field', tonsPerAcre: 6, note: 'Not made for fields; Ag-Grade Bulk costs far less.' },
        ],
        lbPerYard: 800,
        bagCuFt: 1.5,
        price: { bag: 12.5, yard: 68, ton: 175 },
        requires: ['fertilizer-registration', 'soil-label', 'lab-testing'],
        art: 'potting-bag',
        featured: true,
      },
    ] as SoilProduct[],

    uses: [
      { id: 'new-lawn', label: 'New lawn', hint: 'Before seed or sod' },
      { id: 'topdress', label: 'Topdress', hint: 'Over existing grass or beds' },
      { id: 'garden-bed', label: 'Garden bed', hint: 'Vegetables, flowers, raised beds' },
      { id: 'field', label: 'Field or pasture', hint: 'Acres, by the ton' },
    ] as { id: SoilUse; label: string; hint: string }[],

    /** Volume pricing for commercial buyers, by cubic yards a year. PLACEHOLDER. */
    proTiers: [
      { id: 'retail', label: 'Retail', minYards: 0, off: 0, fits: 'Homeowners and small jobs' },
      { id: 'pro', label: 'Pro', minYards: 20, off: 0.1, fits: 'Landscapers and small garden centers' },
      { id: 'contractor', label: 'Contractor', minYards: 100, off: 0.18, fits: 'Landscape contractors and golf courses' },
      { id: 'wholesale', label: 'Wholesale & ag', minYards: 400, off: 0.25, fits: 'Farms, sod growers, and dealers' },
    ] as ProTier[],

    buyerKinds: [
      { value: 'landscaper', label: 'Landscaper' },
      { value: 'golf-course', label: 'Golf course or sports field' },
      { value: 'farm', label: 'Farm or ranch' },
      { value: 'garden-center', label: 'Garden center or nursery' },
      { value: 'other', label: 'Something else' },
    ] as { value: ProBuyerKind; label: string }[],

    /** Delivered price for bulk and truckloads: base + per road mile from the ranch. PLACEHOLDER. */
    delivery: {
      base: 85,
      perMile: 4.5,
      /** Road miles ≈ straight-line miles × this */
      roadFactor: 1.25,
      /** Free delivery inside this many miles on truckloads */
      freeMiles: 0,
      /** Farthest we deliver; beyond it, "call us" */
      maxMiles: 200,
      /** Bulk yards and tons in the cart: one trip, priced the same way */
      bulkTripNote: 'Bulk yards and tons are loaded at the ranch, or delivered for the same base + per-mile price as a truckload.',
      windows: [
        { value: 'asap', label: 'As soon as you can' },
        { value: 'two-weeks', label: 'Within two weeks' },
        { value: 'month', label: 'Within a month' },
        { value: 'spring', label: 'Next spring' },
      ] as { value: DeliveryWindow; label: string }[],
    },

    /** Launch season for pre-orders and the waitlist. */
    launch: {
      open: false,
      season: 'Spring 2027',
      note: 'The first screened batches finish curing in March. Join the list for first pick and launch pricing.',
    },
  },

  fuel: {
    brand: 'CROWDER Fuel',
    tagline: 'Fire logs and briquettes pressed from what our cattle leave behind.',
    outdoorNote:
      'For outdoor use only: fire pits, campfires, and outdoor wood stoves. Burning manure fuel makes smoke and fine particles, so never burn it indoors or in a fireplace that vents into the house.',

    units: {
      bundle: { label: 'Bundle', plural: 'bundles' },
      case: { label: 'Case', plural: 'cases' },
      pallet: { label: 'Pallet', plural: 'pallets' },
    } satisfies Record<FuelUnit, { label: string; plural: string }>,

    products: [
      {
        id: 'fuel-logs',
        name: 'Pressed Fuel Logs',
        tagline: 'A slow, steady burn for fire pits and outdoor stoves.',
        description:
          'Dried manure mixed with hay and pressed into dense, even logs. They stack like firewood, light easily, and burn slow with a low, steady flame. A wood substitute from a ranch that doesn’t have trees to spare.',
        form: 'Pressed log',
        bundleContents: '6 logs, about 15 lb',
        bundleLb: 15,
        burnMinutes: [60, 90],
        burnPer: 'per log',
        bundlesPerCase: 8,
        casesPerPallet: 40,
        price: { bundle: 12.99, case: 92, pallet: 3200 },
        uses: ['Backyard fire pits', 'Outdoor wood stoves and chimineas', 'Ranch and camp fires', 'In place of firewood'],
        requires: ['air-quality', 'fuel-label', 'fire-safety'],
        art: 'fuel-logs',
      },
      {
        id: 'briquettes',
        name: 'Ranch Briquettes',
        tagline: 'Small, dense, and easy to start. Good for keeping a fire going.',
        description:
          'Dried manure ground fine and pressed into palm-size briquettes. Denser than the logs, so they burn longer for their size. Add a few to keep a fire going without tending it.',
        form: 'Briquette',
        bundleContents: 'Bag of 40, about 10 lb',
        bundleLb: 10,
        burnMinutes: [45, 60],
        burnPer: 'per handful of 6',
        bundlesPerCase: 10,
        casesPerPallet: 50,
        price: { bundle: 9.99, case: 89, pallet: 3900 },
        uses: ['Keeping a fire going', 'Outdoor stoves', 'Camp cooking fires', 'Fire starters for logs'],
        requires: ['air-quality', 'fuel-label', 'fire-safety'],
        art: 'briquettes',
      },
      {
        id: 'campfire-bundle',
        name: 'Campfire Bundle',
        tagline: 'One bundle, one evening fire. Logs, briquettes, and a starter.',
        description:
          'Four fuel logs, a bag of briquettes, and a natural fire starter, tied up with twine. Enough for a two- to three-hour campfire. Campgrounds sell them by the gate.',
        form: 'Logs + briquettes',
        bundleContents: '4 logs, 12 briquettes, 1 starter, about 13 lb',
        bundleLb: 13,
        burnMinutes: [120, 180],
        burnPer: 'per bundle',
        bundlesPerCase: 6,
        casesPerPallet: 48,
        price: { bundle: 14.99, case: 79, pallet: 3400 },
        uses: ['Campfires', 'Campground stores', 'Hunting and fishing camps', 'Backyard fires'],
        requires: ['air-quality', 'fuel-label', 'fire-safety'],
        art: 'campfire',
      },
      {
        id: 'cow-chip-gift',
        name: 'Cow Chip Gift Pack',
        tagline: 'Three sun-dried ranch chips, a story card, and a matchbook.',
        description:
          'Plains settlers burned dried cattle and bison chips where there was no wood. This gift box has three sun-dried chips from our pasture, a card with the history, and matches. Yes, they really burn.',
        form: 'Sun-dried chip',
        bundleContents: '3 chips in a gift box, about 2 lb',
        bundleLb: 2,
        burnMinutes: [20, 30],
        burnPer: 'per chip',
        bundlesPerCase: 12,
        casesPerPallet: 60,
        price: { bundle: 16.99, case: 168, pallet: 9200 },
        uses: ['Gag gifts and white elephants', 'Western gift shops', 'Cow chip toss contests', 'Campfire stories'],
        requires: ['fuel-label', 'fire-safety'],
        art: 'cow-chips',
        novelty: true,
      },
    ] as FuelProduct[],

    /** How it's made: the research sheet's production steps. */
    process: [
      {
        title: 'Collect',
        text: 'We gather manure from the pens and winter feeding ground, never from fields treated with chemicals, and pick out rocks and dirt.',
      },
      { title: 'Mix', text: 'Excess water drains off, then it’s mixed with chopped hay or straw so the logs hold together.' },
      { title: 'Press', text: 'A log press forms it into logs or briquettes of the same size and weight.' },
      { title: 'Sun-dry', text: 'Racks in the sun and Colorado’s dry air take it below 15% moisture. We turn them for even drying.' },
      { title: 'Cure', text: 'Dry logs cure on pallets in a covered, ventilated shed until they’re hard all the way through.' },
      { title: 'Pack', text: 'Bundled, labeled for outdoor use, and stacked on pallets for stores and campgrounds.' },
    ],

    storage: [
      'Keep it dry: under a roof or a tarp, off the ground on a pallet.',
      'Damp logs smoke more and burn poorly. Let them dry out before burning.',
      'Store away from the house, like firewood.',
    ],

    buyerKinds: [
      { value: 'campground', label: 'Campground or RV park' },
      { value: 'retailer', label: 'Store or retailer' },
      { value: 'institution', label: 'School, camp, or institution' },
      { value: 'other', label: 'Something else' },
    ] as { value: FuelBuyerKind; label: string }[],

    /** Seasons for drying (production) and selling, by month Jan–Dec, 0–1. PLACEHOLDER. */
    dryingMonths: [0.1, 0.15, 0.4, 0.7, 1, 1, 1, 1, 0.9, 0.6, 0.2, 0.1],
  },

  /** Trust section. Badges stay off until the owner confirms them. */
  trust: {
    /** Show "Lab tested" only once batches really are tested by an outside lab */
    labTested: false,
    labTestedNote: 'Every batch tested by an independent lab for pathogens and metals.',
    whatsIn: ['Manure from our own cattle', 'Alfalfa and grass hay from our meadows', 'Nothing else in the compost'],
    whatsNot: [
      'No biosolids or sewage sludge',
      'No food or yard waste from outside',
      'No synthetic fertilizer or dyes',
      'No manure from other farms or feedlots',
    ],
  },

  /** Owner-only requirements before selling. Shoppers never see these. */
  compliance: [
    {
      id: 'fertilizer-registration',
      division: 'soil',
      title: 'Fertilizer or soil amendment registration',
      detail:
        'Compost sold in Colorado is registered with the Colorado Department of Agriculture as a soil amendment, or as a fertilizer if the label claims nutrients.',
    },
    {
      id: 'soil-label',
      division: 'soil',
      title: 'Bag and bulk labels',
      detail: 'Product name, net weight or volume, ingredients, directions, and the guaranteed analysis if you list nutrients.',
    },
    {
      id: 'lab-testing',
      division: 'soil',
      title: 'Lab testing',
      detail: 'Pathogen (E. coli, Salmonella) and metals testing per batch. Needed before the "Lab tested" badge can go on.',
    },
    {
      id: 'compost-permit',
      division: 'soil',
      title: 'Compost site permit',
      detail: 'Check with CDPHE and the county about composting volume limits, runoff, and setbacks.',
    },
    {
      id: 'air-quality',
      division: 'fuel',
      title: 'Air-quality review',
      detail: 'Confirm with CDPHE and the county whether burning manure fuel is restricted. Outdoor use only either way.',
    },
    {
      id: 'fuel-label',
      division: 'fuel',
      title: 'Fuel labels',
      detail: 'What it is, net weight, burn directions, "outdoor use only", and storage notes on every bundle.',
    },
    {
      id: 'fire-safety',
      division: 'fuel',
      title: 'Fire safety wording',
      detail: 'Fire-ban reminder and safe-burning wording; check what campground buyers require.',
    },
  ] as ComplianceRequirement[],

  dealerKinds: [
    { value: 'garden-center', label: 'Garden center' },
    { value: 'nursery', label: 'Nursery' },
    { value: 'feed-store', label: 'Feed and ranch store' },
    { value: 'hardware', label: 'Hardware store' },
  ] as { value: DealerKind; label: string }[],

  /** Production Tracker targets. PLACEHOLDER: confirm against the compost permit and your own process. */
  production: {
    /** Windrow core temperature to hold during the hot phase, °F (the common 131 °F pathogen-kill rule) */
    tempTarget: { min: 131, max: 160 },
    /** Days at or above the minimum, with at least `minTurns` turnings */
    hotDays: 15,
    minTurns: 5,
    /** Curing after the hot phase */
    curingDays: 60,
    /** Fuel is dry enough to pack at or below this moisture, % */
    fuelTargetMoisture: 15,
    windrows: ['WR-1', 'WR-2', 'WR-3', 'WR-4', 'WR-5', 'WR-6'],
  },

  /** Low-stock alert levels for the Production Tracker */
  lowStock: { bags: 40, yards: 15, bundles: 30 },
}

export type SoilFuelConfig = typeof soilFuelConfig
