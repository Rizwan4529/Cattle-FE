import { describe, expect, it } from 'vitest'
import { compareLiveVsBeef, PROFIT_DEFAULTS } from './profit'

describe('compareLiveVsBeef (economics sheet defaults)', () => {
  const r = compareLiveVsBeef(PROFIT_DEFAULTS)

  it('finishes a 700 lb feeder at 1,300 lb', () => {
    expect(r.finishedLb).toBe(1300)
    expect(r.hangingLb).toBe(806)
    expect(r.takeHomeLb).toBe(520)
  })

  it('costs $2,450 for the feeder and $612 for the gain', () => {
    expect(r.feederCost).toBe(2450)
    expect(r.gainCost).toBe(612)
    expect(r.costToFinish).toBe(3062)
  })

  it('sells live for $2,808, a $254 loss', () => {
    expect(r.live).toEqual({ revenue: 2808, net: -254 })
  })

  it('nets more as beef at $9 and $11 per take-home lb', () => {
    expect(r.beef.map((b) => b.net)).toEqual([-247, 793, 1833])
    expect(r.beef[2].vsLive).toBe(2087)
  })

  it('finds the breakeven prices', () => {
    expect(r.breakevenLivePerLb).toBe(2.36)
    expect(r.breakevenBeefPerLb).toBe(7.48)
  })

  it('responds to every input', () => {
    const cheaper = compareLiveVsBeef({ ...PROFIT_DEFAULTS, feederPricePerCwt: 300, processing: 700 })
    expect(cheaper.live.net).toBeGreaterThan(r.live.net)
    expect(cheaper.beef[0].net).toBeGreaterThan(r.beef[0].net)
  })
})
