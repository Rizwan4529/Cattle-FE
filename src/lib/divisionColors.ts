import type { RanchDivision } from './manurePlanner'

/**
 * Chart colors for the five ways the ranch earns money. Validated with the
 * dataviz palette checker (light on #FBF8F2, dark on #25211C) in this order:
 * Beef, Ranch Goods, Soil, Fuel, Live cattle (all pass CVD separation and
 * 3:1 contrast). Every color matches the same channel on Sales by channel.
 *
 * Put `DIVISION_VARS` on a wrapper, then use `divisionColor(key)`.
 */
export const DIVISION_VARS =
  '[--div-beef:#A23B2A] [--div-goods:#7A5BA8] [--div-soil:#A65A1B] [--div-fuel:#9E3C9E] [--div-live:#3F8F5A] dark:[--div-beef:#C24E36] dark:[--div-goods:#8F72C4] dark:[--div-soil:#C06A28] dark:[--div-fuel:#B556B5] dark:[--div-live:#3E9A60]'

export const divisionColor = (key: RanchDivision) => `var(--div-${key})`
