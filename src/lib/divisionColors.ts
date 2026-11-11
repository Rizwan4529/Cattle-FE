import type { RanchDivision } from './manurePlanner'

/**
 * Chart colors for the five ways the ranch earns money. Validated with the
 * dataviz palette checker (light on #FBF8F2, dark on #25211C) in this order:
 * Beef, Ranch Goods, Soil, Fuel, Live cattle. Beef, Ranch Goods, and Live
 * cattle match their colors on the Sales by channel page. Amber is under 3:1
 * on light cards, so every chart that uses it has labels and a table view.
 *
 * Put `DIVISION_VARS` on a wrapper, then use `divisionColor(key)`.
 */
export const DIVISION_VARS =
  '[--div-beef:#A23B2A] [--div-goods:#7A5BA8] [--div-soil:#D08C1A] [--div-fuel:#3A6EA5] [--div-live:#3F8F5A] dark:[--div-beef:#C24E36] dark:[--div-goods:#8F72C4] dark:[--div-soil:#B88418] dark:[--div-fuel:#3F7FC4] dark:[--div-live:#3E9A60]'

export const divisionColor = (key: RanchDivision) => `var(--div-${key})`
