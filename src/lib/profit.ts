/**
 * "Sell live vs. sell as beef": what one steer nets either way. Defaults come
 * from the ranch's cattle economics sheet; every input is editable on the
 * calculator page. Pure functions, tested in profit.test.ts.
 *
 * Nets leave out interest, vet, death loss, packaging, labor, marketing, and
 * shipping, and prices move every week.
 */

export interface ProfitInputs {
  /** Feeder steer bought (or valued) at this weight, lb */
  feederLb: number
  /** Feeder price, $/cwt */
  feederPricePerCwt: number
  /** Weight added while finishing, lb */
  gainLb: number
  /** Cost of gain, $/lb */
  costPerLbGain: number
  /** Fed (finished) cattle price, $/lb live */
  fedPricePerLb: number
  /** Hanging weight as a share of live */
  dressingPercent: number
  /** Take-home beef as a share of live */
  takeHomePercent: number
  /** Kill, cut, wrap, and freeze for the whole animal, $ */
  processing: number
  /** Beef prices per take-home lb to compare */
  beefPrices: number[]
}

export const PROFIT_DEFAULTS: ProfitInputs = {
  feederLb: 700,
  feederPricePerCwt: 350,
  gainLb: 600,
  costPerLbGain: 1.02,
  fedPricePerLb: 2.16,
  dressingPercent: 0.62,
  takeHomePercent: 0.4,
  processing: 825,
  beefPrices: [7, 9, 11],
}

const round2 = (n: number) => Math.round(n * 100) / 100

export interface ProfitResult {
  finishedLb: number
  hangingLb: number
  takeHomeLb: number
  feederCost: number
  gainCost: number
  /** Feeder + gain: what the finished steer cost to raise */
  costToFinish: number
  live: { revenue: number; net: number }
  beef: { pricePerLb: number; revenue: number; net: number; vsLive: number }[]
  /** Live price ($/lb) that covers the cost to finish */
  breakevenLivePerLb: number
  /** Beef price ($/take-home lb) that covers the cost to finish plus processing */
  breakevenBeefPerLb: number
}

export function compareLiveVsBeef(i: ProfitInputs): ProfitResult {
  const finishedLb = i.feederLb + i.gainLb
  const hangingLb = Math.round(finishedLb * i.dressingPercent)
  const takeHomeLb = Math.round(finishedLb * i.takeHomePercent)
  const feederCost = round2((i.feederLb / 100) * i.feederPricePerCwt)
  const gainCost = round2(i.gainLb * i.costPerLbGain)
  const costToFinish = round2(feederCost + gainCost)
  const liveRevenue = round2(finishedLb * i.fedPricePerLb)
  const liveNet = round2(liveRevenue - costToFinish)
  return {
    finishedLb,
    hangingLb,
    takeHomeLb,
    feederCost,
    gainCost,
    costToFinish,
    live: { revenue: liveRevenue, net: liveNet },
    beef: i.beefPrices.map((p) => {
      const revenue = round2(takeHomeLb * p)
      const net = round2(revenue - costToFinish - i.processing)
      return { pricePerLb: p, revenue, net, vsLive: round2(net - liveNet) }
    }),
    breakevenLivePerLb: finishedLb ? round2(costToFinish / finishedLb) : 0,
    breakevenBeefPerLb: takeHomeLb ? round2((costToFinish + i.processing) / takeHomeLb) : 0,
  }
}
