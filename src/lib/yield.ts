/**
 * Beef yield and share math. Pure functions with no UI or store access, so
 * every number on the beef pages can be unit-tested (see yield.test.ts).
 *
 *   Live weight      the animal on the scale
 *   Hanging weight   the carcass after harvest (live × dressing %)
 *   Take-home weight packaged beef in your freezer (live × take-home %)
 *
 * Hanging weight is never called "meat": bone, fat, and moisture lost
 * while dry aging all come out before the beef is wrapped.
 */

import { type BeefConfig, beefConfig } from '@/config/beef'
import type { BeefProduct, CutCategory, FeedProgramId, PoolStatus, PoolUnit, SharePool, ShareSize } from '@/data/beefTypes'

export type YieldConfig = Pick<
  BeefConfig,
  | 'dressingPercent'
  | 'dressingRange'
  | 'takeHomePercent'
  | 'takeHomeRange'
  | 'pricePerHangingLb'
  | 'processing'
  | 'shareSizes'
  | 'depositRate'
  | 'feedPrograms'
  | 'breedPremium'
  | 'freezer'
>

const round2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, n))

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

/** Dressing % actually used: the config value, held inside its allowed range. */
export const dressingPercent = (cfg: YieldConfig = beefConfig) => clamp(cfg.dressingPercent, cfg.dressingRange)

/** Take-home % of live weight actually used, held inside its allowed range. */
export const takeHomePercent = (cfg: YieldConfig = beefConfig) => clamp(cfg.takeHomePercent, cfg.takeHomeRange)

export const hangingWeight = (liveLb: number, cfg: YieldConfig = beefConfig) => Math.round(liveLb * dressingPercent(cfg))

export const takeHomeWeight = (liveLb: number, cfg: YieldConfig = beefConfig) => Math.round(liveLb * takeHomePercent(cfg))

/** Low and high take-home estimates for an animal (or share of one), from the take-home range. */
export const takeHomeRange = (liveLb: number, cfg: YieldConfig = beefConfig, fraction = 1): [number, number] => [
  Math.round(liveLb * cfg.takeHomeRange[0] * fraction),
  Math.round(liveLb * cfg.takeHomeRange[1] * fraction),
]

// ---------------------------------------------------------------------------
// Shares
// ---------------------------------------------------------------------------

export const SHARE_FRACTION: Record<ShareSize, number> = { whole: 1, half: 0.5, quarter: 0.25, eighth: 0.125 }

export const SHARE_LABELS: Record<ShareSize, string> = { whole: 'Whole', half: 'Half', quarter: 'Quarter', eighth: 'Eighth' }

const SHARE_ORDER: ShareSize[] = ['whole', 'half', 'quarter', 'eighth']

/** Share sizes the ranch sells, largest first. Eighths only when switched on. */
export const availableShareSizes = (cfg: Pick<YieldConfig, 'shareSizes'> = beefConfig) => SHARE_ORDER.filter((s) => cfg.shareSizes[s])

const UNIT_FRACTION: Record<PoolUnit, number> = { quarter: 0.25, eighth: 0.125 }

/** Fill-meter segments in a pool: 4 for quarters, 8 for eighths. */
export const poolSegmentCount = (unit: PoolUnit) => Math.round(1 / UNIT_FRACTION[unit])

/** Segments a share takes in a pool, or 0 if the pool can't sell that size (an eighth in a quarter pool). */
export function segmentsFor(size: ShareSize, unit: PoolUnit) {
  const n = SHARE_FRACTION[size] / UNIT_FRACTION[unit]
  return Number.isInteger(n) ? n : 0
}

/** Price per hanging lb after the feed-program and breed adjustments. */
export function adjustedPricePerHangingLb(base: number, program: FeedProgramId, breed: string, cfg: YieldConfig = beefConfig) {
  const p = cfg.feedPrograms.find((f) => f.id === program)?.priceMultiplier ?? 1
  const b = cfg.breedPremium[breed] ?? 1
  return round2(base * p * b)
}

export interface ShareQuote {
  size: ShareSize
  fraction: number
  /** This share's hanging weight */
  hangingLb: number
  takeHomeLb: number
  takeHomeLow: number
  takeHomeHigh: number
  pricePerHangingLb: number
  /** Beef at the hanging-weight price */
  beef: number
  /** Cut, wrap, and freeze, plus this share of the kill fee */
  processing: number
  killFeeShare: number
  /** True when the ranch rolls processing into one price */
  processingIncluded: boolean
  total: number
  /** Paid when claiming */
  deposit: number
  /** Estimated; the final balance is figured on the actual hanging weight */
  balance: number
  /** Total ÷ estimated take-home lb: the number to compare with store prices */
  perTakeHomeLb: number
}

export interface QuoteInput {
  liveLb: number
  size: ShareSize
  feedProgram: FeedProgramId
  breed: string
  /** Pool's locked price, before adjustments. Defaults to the config price. */
  basePricePerHangingLb?: number
}

/** Everything shown next to a share price: weights, the money breakdown, deposit, and $/take-home lb. */
export function quoteShare(input: QuoteInput, cfg: YieldConfig = beefConfig): ShareQuote {
  const fraction = SHARE_FRACTION[input.size]
  const pricePerHangingLb = adjustedPricePerHangingLb(input.basePricePerHangingLb ?? cfg.pricePerHangingLb, input.feedProgram, input.breed, cfg)
  const hangingLb = Math.round(hangingWeight(input.liveLb, cfg) * fraction)
  const takeHomeLb = Math.round(takeHomeWeight(input.liveLb, cfg) * fraction)
  const [takeHomeLow, takeHomeHigh] = takeHomeRange(input.liveLb, cfg, fraction)
  const beef = round2(hangingLb * pricePerHangingLb)
  const killFeeShare = round2(cfg.processing.killFee * fraction)
  const processing = round2(hangingLb * cfg.processing.perHangingLb + killFeeShare)
  const total = round2(beef + processing)
  const deposit = round2(total * cfg.depositRate)
  return {
    size: input.size,
    fraction,
    hangingLb,
    takeHomeLb,
    takeHomeLow,
    takeHomeHigh,
    pricePerHangingLb,
    beef,
    processing,
    killFeeShare,
    processingIncluded: cfg.processing.mode === 'included',
    total,
    deposit,
    balance: round2(total - deposit),
    perTakeHomeLb: takeHomeLb ? round2(total / takeHomeLb) : 0,
  }
}

export interface BalanceInput {
  /** Whole-carcass hanging weight from the processor */
  actualHangingLb: number
  size: ShareSize
  /** Adjusted price per hanging lb locked at claim time */
  pricePerHangingLb: number
  depositPaid: number
}

/** The real balance once the carcass is weighed: the share's actual hanging lb at the locked price, plus processing, less the deposit. */
export function balanceDue(input: BalanceInput, cfg: YieldConfig = beefConfig) {
  const fraction = SHARE_FRACTION[input.size]
  const hangingLb = Math.round(input.actualHangingLb * fraction)
  const beef = round2(hangingLb * input.pricePerHangingLb)
  const processing = round2(hangingLb * cfg.processing.perHangingLb + cfg.processing.killFee * fraction)
  const total = round2(beef + processing)
  return { hangingLb, beef, processing, total, balance: round2(total - input.depositPaid) }
}

// ---------------------------------------------------------------------------
// What's in the box, and what it would cost cut by cut
// ---------------------------------------------------------------------------

/** Typical split of take-home beef from a share cut the standard way. */
export const STANDARD_CUT_MIX: Record<CutCategory, number> = { steak: 0.25, roast: 0.2, ground: 0.45, other: 0.1 }

/** Fallback retail $/lb if the shop has nothing in a category. */
const FALLBACK_RETAIL: Record<CutCategory, number> = { steak: 28, roast: 13, ground: 9, other: 7 }

/** Approximate pounds by category for a given take-home weight. */
export function cutMixEstimate(takeHomeLb: number, mix: Record<CutCategory, number> = STANDARD_CUT_MIX): Record<CutCategory, number> {
  return {
    steak: Math.round(takeHomeLb * mix.steak),
    roast: Math.round(takeHomeLb * mix.roast),
    ground: Math.round(takeHomeLb * mix.ground),
    other: Math.round(takeHomeLb * mix.other),
  }
}

/** What a pound of take-home beef would cost bought as individual cuts: shop prices weighted by the standard mix. */
export function retailValuePerTakeHomeLb(products: Pick<BeefProduct, 'category' | 'pricePerLb'>[]) {
  let value = 0
  for (const cat of Object.keys(STANDARD_CUT_MIX) as CutCategory[]) {
    const prices = products.filter((p) => p.category === cat).map((p) => p.pricePerLb)
    const avg = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : FALLBACK_RETAIL[cat]
    value += avg * STANDARD_CUT_MIX[cat]
  }
  return round2(value)
}

/** "vs. buying these cuts individually: save $X". Never negative. */
export function savingsVsIndividual(quote: Pick<ShareQuote, 'takeHomeLb' | 'total'>, products: Pick<BeefProduct, 'category' | 'pricePerLb'>[]) {
  return Math.max(0, Math.round(quote.takeHomeLb * retailValuePerTakeHomeLb(products) - quote.total))
}

// ---------------------------------------------------------------------------
// "I want about 300 lb of beef"
// ---------------------------------------------------------------------------

export const WHY_SHARES =
  'The whole animal is harvested and cut at once, so selling it in even shares gives every family a fair mix of steaks, roasts, and ground beef.'

export interface ShareRecommendation {
  size: ShareSize
  /** More than one whole animal, when someone asks for more than one can give */
  count: number
  takeHomeLb: number
  range: [number, number]
}

/** The share size whose take-home weight is closest to what the customer asked for. Ties go to the larger share. */
export function recommendShare(targetLb: number, liveLb: number, cfg: YieldConfig = beefConfig): ShareRecommendation {
  const whole = takeHomeWeight(liveLb, cfg)
  if (targetLb > whole * 1.5) {
    const count = Math.max(2, Math.round(targetLb / whole))
    const [lo, hi] = takeHomeRange(liveLb, cfg, count)
    return { size: 'whole', count, takeHomeLb: whole * count, range: [lo, hi] }
  }
  let best: ShareSize = 'whole'
  let bestGap = Infinity
  for (const size of availableShareSizes(cfg)) {
    const gap = Math.abs(whole * SHARE_FRACTION[size] - targetLb)
    // Sizes come largest first, so `<` keeps the larger one on a tie.
    if (gap < bestGap) {
      best = size
      bestGap = gap
    }
  }
  const f = SHARE_FRACTION[best]
  return { size: best, count: 1, takeHomeLb: Math.round(whole * f), range: takeHomeRange(liveLb, cfg, f) }
}

// ---------------------------------------------------------------------------
// Freezer space
// ---------------------------------------------------------------------------

const roundHalf = (n: number) => Math.ceil(n * 2) / 2

/** Cubic feet of freezer space for packaged beef, and the smallest common chest freezer that fits it. */
export function freezerSpace(lb: number, cfg: Pick<YieldConfig, 'freezer'> = beefConfig) {
  const { min, max } = cfg.freezer.lbsPerCuFt
  const low = roundHalf(lb / max)
  const high = roundHalf(lb / min)
  const suggested = cfg.freezer.sizes.find((s) => s >= high) ?? null
  return { low, high, suggested }
}

// ---------------------------------------------------------------------------
// Share pools
// ---------------------------------------------------------------------------

/** The beef journey, in order. */
export const POOL_STEPS: PoolStatus[] = ['open', 'full', 'harvest-scheduled', 'dry-aging', 'cut-wrap', 'ready']

export const POOL_STATUS_LABELS: Record<PoolStatus, string> = {
  open: 'Open',
  full: 'Fully claimed',
  'harvest-scheduled': 'Harvest scheduled',
  'dry-aging': 'Dry aging',
  'cut-wrap': 'Cut & wrap',
  ready: 'Ready for pickup',
  shipped: 'Shipped',
}

export const poolSegments = (pool: Pick<SharePool, 'unit'>) => poolSegmentCount(pool.unit)

export const segmentsClaimed = (pool: Pick<SharePool, 'claims'>) => pool.claims.reduce((n, c) => n + c.segments, 0)

/** Open segments, less any `held` (e.g. in this visitor's cart). */
export const segmentsLeft = (pool: Pick<SharePool, 'unit' | 'claims'>, held = 0) => Math.max(0, poolSegments(pool) - segmentsClaimed(pool) - held)

export const isPastDeadline = (pool: Pick<SharePool, 'deadline'>, now: number) => new Date(pool.deadline).getTime() <= now

/** Still taking claims: open and before its deadline. */
export const isClaimable = (pool: Pick<SharePool, 'status' | 'deadline'>, now: number) => pool.status === 'open' && !isPastDeadline(pool, now)

/** Can this share size be claimed in the pool right now? */
export function canClaim(pool: Pick<SharePool, 'status' | 'deadline' | 'unit' | 'claims'>, size: ShareSize, now: number, held = 0) {
  const need = segmentsFor(size, pool.unit)
  return need > 0 && isClaimable(pool, now) && need <= segmentsLeft(pool, held)
}

/** Share sizes that still fit in a pool, largest first. */
export function openSizes(
  pool: Pick<SharePool, 'status' | 'deadline' | 'unit' | 'claims'>,
  now: number,
  cfg: Pick<YieldConfig, 'shareSizes'> = beefConfig,
  held = 0,
) {
  return availableShareSizes(cfg).filter((s) => canClaim(pool, s, now, held))
}

export interface TimeLeft {
  expired: boolean
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function timeLeft(deadline: string, now: number): TimeLeft {
  const totalMs = Math.max(0, new Date(deadline).getTime() - now)
  const s = Math.floor(totalMs / 1000)
  return {
    expired: totalMs === 0,
    totalMs,
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

/** Which day of dry aging the carcass is on (1-based), held to the planned aging days. */
export function agingDay(pool: Pick<SharePool, 'history' | 'agingDays'>, now: number) {
  const start = pool.history.find((h) => h.status === 'dry-aging')?.at
  if (!start) return 0
  const day = Math.floor((now - new Date(start).getTime()) / 86_400_000) + 1
  return Math.min(Math.max(1, day), pool.agingDays ?? 21)
}
