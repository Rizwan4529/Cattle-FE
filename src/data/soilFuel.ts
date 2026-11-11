/**
 * Seed records for CROWDER Soil & Fuel: stock on hand, compliance progress,
 * inbox requests, and production batches. All mock data; Reset demo data
 * brings these back.
 */

import { soilFuelConfig } from '@/config/soilFuel'
import { deliveredQuote, roadMiles, soilProduct } from '@/lib/soilFuel'
import type {
  CompostBatch,
  DealerApplication,
  FuelBatch,
  FuelInquiry,
  FuelProductId,
  FuelStock,
  ProApplication,
  SoilFuelCompliance,
  SoilProductId,
  SoilStock,
  TempReading,
  TruckloadQuote,
  WaitlistSignup,
} from './soilFuelTypes'

export const seedSoilStock: SoilStock = {
  'garden-blend': { bags: 180, yards: 22 },
  'lawn-topdress': { bags: 60, yards: 35 },
  'ag-bulk': { bags: 0, yards: 140 },
  'potting-mix': { bags: 26, yards: 6 },
}

/** Finished fuel on hand, in bundles */
export const seedFuelStock: FuelStock = {
  'fuel-logs': 210,
  briquettes: 95,
  'campfire-bundle': 18,
  'cow-chip-gift': 64,
}

/** Per-product on/off switches (owner only); everything starts on. */
export const seedSoilFuelEnabled: Record<SoilProductId | FuelProductId, boolean> = Object.fromEntries(
  [...soilFuelConfig.soil.products, ...soilFuelConfig.fuel.products].map((p) => [p.id, true]),
) as Record<SoilProductId | FuelProductId, boolean>

export const seedSoilFuelCompliance: SoilFuelCompliance = {
  'fertilizer-registration': {
    state: 'in-progress',
    note: 'Soil amendment registration filed with the state. Waiting on review.',
    updatedAt: '2026-10-14',
  },
  'soil-label': {
    state: 'in-progress',
    note: 'Draft bag label done; no nutrient claims until the guaranteed analysis is back.',
    updatedAt: '2026-10-21',
  },
  'lab-testing': { state: 'not-started', note: 'Pick a lab and send samples from WR-2 before launch.', updatedAt: '2026-09-30' },
  'compost-permit': { state: 'cleared', note: 'County confirmed our volume is under the permit threshold.', updatedAt: '2026-08-19' },
  'air-quality': { state: 'not-started', note: 'Call CDPHE about burning manure fuel outdoors.', updatedAt: '2026-09-30' },
  'fuel-label': { state: 'in-progress', note: 'Outdoor-use label drafted.', updatedAt: '2026-10-28' },
  'fire-safety': { state: 'cleared', note: 'Fire-ban reminder printed on every bundle.', updatedAt: '2026-10-28' },
}

// ---------------------------------------------------------------- Inbox seeds

const quote = (q: Omit<TruckloadQuote, 'miles' | 'estimate'>): TruckloadQuote => {
  const est = deliveredQuote(soilProduct(q.productId), q.zip, q.loads)
  return { ...q, miles: roadMiles(q.zip) ?? 0, estimate: est.total }
}

export const seedTruckloadQuotes: TruckloadQuote[] = [
  quote({
    id: 'quote-seed-1',
    name: 'Luis Ortega',
    business: 'Greenway Landscape Co.',
    kind: 'landscaper',
    email: 'luis@greenwaylandscape.example',
    phone: '(720) 555-0175',
    zip: '80134',
    productId: 'lawn-topdress',
    loads: 2,
    window: 'two-weeks',
    notes: 'Two HOA common areas after fall aeration. Can you split the drop between two sites a mile apart?',
    status: 'new',
    createdAt: '2026-11-05T16:20:00.000Z',
  }),
  quote({
    id: 'quote-seed-2',
    name: 'Dana Whitfield',
    business: 'Plum Creek Golf Club',
    kind: 'golf-course',
    email: 'superintendent@plumcreekgolf.example',
    phone: '(303) 555-0108',
    zip: '80104',
    productId: 'lawn-topdress',
    loads: 3,
    window: 'spring',
    notes: 'Fairway topdressing in April. Need a lab report before we commit.',
    status: 'quoted',
    quoted: 4890,
    createdAt: '2026-10-29T14:05:00.000Z',
  }),
  quote({
    id: 'quote-seed-3',
    name: 'Ray Lindqvist',
    business: 'Kiowa Creek Hay',
    kind: 'farm',
    email: 'ray@kiowacreekhay.example',
    phone: '(303) 555-0166',
    zip: '80117',
    productId: 'ag-bulk',
    loads: 6,
    window: 'month',
    notes: '120 acres of hay ground going into winter.',
    status: 'won',
    quoted: 3950,
    createdAt: '2026-10-12T19:40:00.000Z',
  }),
]

export const seedProApplications: ProApplication[] = [
  {
    id: 'pro-seed-1',
    business: 'Mile High Lawn & Garden',
    kind: 'landscaper',
    contact: 'Tasha Greene',
    email: 'tasha@milehighlawn.example',
    phone: '(303) 555-0141',
    city: 'Denver',
    yardsPerYear: 60,
    interests: ['lawn-topdress', 'garden-blend'],
    message: 'Residential crew of six. We topdress about 80 lawns a year.',
    status: 'new',
    createdAt: '2026-11-03T15:00:00.000Z',
  },
  {
    id: 'pro-seed-2',
    business: 'Sunset Ridge Sod Farm',
    kind: 'farm',
    contact: 'Owen Marsh',
    email: 'owen@sunsetridgesod.example',
    phone: '(970) 555-0177',
    city: 'Brighton',
    yardsPerYear: 500,
    interests: ['ag-bulk', 'lawn-topdress'],
    message: 'Looking for a steady supply to rebuild fields between sod harvests.',
    status: 'approved',
    createdAt: '2026-10-08T17:30:00.000Z',
  },
]

export const seedDealerApplications: DealerApplication[] = [
  {
    id: 'dealer-app-seed-1',
    business: 'Black Forest Feed & Seed',
    kind: 'feed-store',
    contact: 'Ellen Price',
    email: 'ellen@blackforestfeed.example',
    phone: '(719) 555-0184',
    city: 'Black Forest',
    interests: ['soil', 'fuel'],
    message: 'Customers keep asking for local compost. We’d take a pallet of bags and some fire logs to start.',
    status: 'new',
    createdAt: '2026-11-01T18:10:00.000Z',
  },
]

export const seedWaitlist: WaitlistSignup[] = [
  {
    id: 'wait-seed-1',
    name: 'Priya N.',
    email: 'priya@example.com',
    zip: '80304',
    interests: ['garden-blend', 'potting-mix'],
    createdAt: '2026-10-30T02:15:00.000Z',
  },
  { id: 'wait-seed-2', name: 'Greg F.', email: 'gregf@example.com', zip: '80132', interests: ['fuel-logs'], createdAt: '2026-11-02T22:40:00.000Z' },
  {
    id: 'wait-seed-3',
    name: 'Amy L.',
    email: 'amy.l@example.com',
    zip: '80524',
    interests: ['lawn-topdress'],
    createdAt: '2026-11-04T13:05:00.000Z',
  },
]

export const seedFuelInquiries: FuelInquiry[] = [
  {
    id: 'fuel-inq-seed-1',
    business: 'Eleven Mile Camp Store',
    kind: 'campground',
    contact: 'Marty Kowalski',
    email: 'marty@elevenmilecamp.example',
    phone: '(719) 555-0158',
    interests: ['campfire-bundle', 'fuel-logs'],
    volume: 'About 40 cases of bundles a month, May to September',
    message: 'Campers ask for something besides pine. A ranch story would sell at the gate.',
    status: 'new',
    createdAt: '2026-11-04T20:30:00.000Z',
  },
  {
    id: 'fuel-inq-seed-2',
    business: 'Rocky Mountain Outfitter Supply',
    kind: 'retailer',
    contact: 'Jen Alvarez',
    email: 'jen@rmoutfitter.example',
    interests: ['cow-chip-gift', 'briquettes'],
    volume: 'Two pallets of gift packs for the holidays',
    message: 'Three western gift shops. The cow chip packs would be a hit.',
    status: 'replied',
    reply: 'Thanks, Jen. We can do one pallet of gift packs by December 1. Price sheet attached.',
    createdAt: '2026-10-24T16:45:00.000Z',
  },
]

// ---------------------------------------------------------------- Production seeds

/** yyyy-mm-dd, `n` days after `iso` */
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * A believable windrow temperature curve: heats to the 140s–150s in a few
 * days, dips after each turning, then cools toward the air temperature as it
 * cures. Deterministic so the demo looks the same every time.
 */
function tempLog(start: string, days: number, every = 3, seed = 1): TempReading[] {
  const out: TempReading[] = []
  let s = seed
  const noise = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280 - 0.5
  }
  for (let d = 0; d <= days; d += every) {
    const heat = d < 6 ? 72 + d * 13 : d < 40 ? 150 - (d % 9 === 0 ? 14 : 0) - (d - 6) * 0.3 : Math.max(82, 140 - (d - 40) * 2.2)
    out.push({ date: addDays(start, d), f: Math.round(heat + noise() * 8) })
  }
  return out
}

const turns = (start: string, days: number[]) =>
  days.map((d, i) => ({ date: addDays(start, d), note: i === 0 ? 'First turn after mixing' : undefined }))

export const seedCompostBatches: CompostBatch[] = [
  {
    id: 'compost-seed-1',
    windrow: 'WR-1',
    startDate: '2026-05-11',
    manureTons: 82,
    hayTons: 12,
    status: 'bagged',
    temps: tempLog('2026-05-11', 96, 4, 3),
    turns: turns('2026-05-11', [3, 9, 15, 21, 28, 35]),
    curingDays: 60,
    finishedTons: 44,
    converted: { productId: 'garden-blend', bags: 420, yards: 40, date: '2026-09-02' },
  },
  {
    id: 'compost-seed-2',
    windrow: 'WR-2',
    startDate: '2026-07-06',
    manureTons: 90,
    hayTons: 14,
    status: 'screened',
    temps: tempLog('2026-07-06', 96, 4, 7),
    turns: turns('2026-07-06', [3, 8, 14, 20, 27, 33]),
    curingDays: 60,
    finishedTons: 48,
  },
  {
    id: 'compost-seed-3',
    windrow: 'WR-3',
    startDate: '2026-08-31',
    manureTons: 76,
    hayTons: 11,
    status: 'curing',
    temps: tempLog('2026-08-31', 66, 3, 11),
    turns: turns('2026-08-31', [3, 9, 15, 22, 29]),
    curingDays: 60,
  },
  {
    id: 'compost-seed-4',
    windrow: 'WR-4',
    startDate: '2026-10-12',
    manureTons: 88,
    hayTons: 13,
    status: 'composting',
    temps: tempLog('2026-10-12', 24, 2, 5),
    turns: turns('2026-10-12', [3, 9, 16, 22]),
    curingDays: 60,
  },
  {
    id: 'compost-seed-5',
    windrow: 'WR-5',
    startDate: '2026-11-03',
    manureTons: 40,
    hayTons: 6,
    status: 'mixing',
    temps: tempLog('2026-11-03', 3, 1, 9),
    turns: [],
    curingDays: 60,
  },
]

const moisture = (start: string, from: number, to: number, days: number, every: number) =>
  Array.from({ length: Math.floor(days / every) + 1 }, (_, i) => ({
    date: addDays(start, i * every),
    pct: Math.round(to + (from - to) * Math.exp((-3 * i * every) / days)),
  }))

export const seedFuelBatches: FuelBatch[] = [
  {
    id: 'fuel-seed-1',
    productId: 'fuel-logs',
    startDate: '2026-06-22',
    collectedTons: 9,
    hayShare: 0.15,
    pressedCount: 2600,
    status: 'packed',
    moisture: moisture('2026-06-22', 68, 12, 35, 5),
    converted: { bundles: 420, date: '2026-08-10' },
  },
  {
    id: 'fuel-seed-2',
    productId: 'briquettes',
    startDate: '2026-08-17',
    collectedTons: 6,
    hayShare: 0.1,
    pressedCount: 7800,
    status: 'curing',
    moisture: moisture('2026-08-17', 65, 11, 42, 6),
  },
  {
    id: 'fuel-seed-3',
    productId: 'fuel-logs',
    startDate: '2026-10-05',
    collectedTons: 7,
    hayShare: 0.15,
    pressedCount: 2100,
    status: 'drying',
    moisture: moisture('2026-10-05', 70, 26, 30, 5),
  },
]
