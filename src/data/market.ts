/** Sample market data. Labeled "sample data" wherever it is shown. */

export interface MarketQuote {
  id: string
  label: string
  detail: string
  /** $/cwt */
  price: number
  /** Week-over-week change in $/cwt */
  change: number
}

export const marketQuotes: MarketQuote[] = [
  { id: 'feeder-steers-550', label: 'Feeder steers', detail: '500–600 lb', price: 378.4, change: 2.15 },
  { id: 'feeder-steers-750', label: 'Feeder steers', detail: '700–800 lb', price: 335.1, change: 1.4 },
  { id: 'feeder-heifers-550', label: 'Feeder heifers', detail: '500–600 lb', price: 349.75, change: -0.85 },
  { id: 'fed-live', label: 'Fed cattle', detail: 'Live, 5-area', price: 232.5, change: 0.6 },
  { id: 'fed-dressed', label: 'Fed cattle', detail: 'Dressed', price: 365.0, change: -1.25 },
  { id: 'cull-cows', label: 'Cull cows', detail: 'Breakers', price: 158.25, change: 0.95 },
  { id: 'cull-bulls', label: 'Cull bulls', detail: 'Yield grade 1–2', price: 192.4, change: -0.3 },
]

export interface MonthlySales {
  /** yyyy-mm */
  month: string
  head: number
  revenue: number
}

/** Ranch sales for the last 12 months (used by the dashboard). */
export const salesHistory: MonthlySales[] = [
  { month: '2025-12', head: 18, revenue: 39_600 },
  { month: '2026-01', head: 6, revenue: 14_100 },
  { month: '2026-02', head: 4, revenue: 16_800 },
  { month: '2026-03', head: 9, revenue: 31_950 },
  { month: '2026-04', head: 22, revenue: 51_700 },
  { month: '2026-05', head: 14, revenue: 33_880 },
  { month: '2026-06', head: 8, revenue: 19_440 },
  { month: '2026-07', head: 5, revenue: 12_750 },
  { month: '2026-08', head: 27, revenue: 63_450 },
  { month: '2026-09', head: 31, revenue: 70_680 },
  { month: '2026-10', head: 24, revenue: 59_520 },
  { month: '2026-11', head: 4, revenue: 10_200 },
]

/** Mock site activity for the home page stats strip. */
export const siteActivity = {
  buyersThisMonth: 37,
}
