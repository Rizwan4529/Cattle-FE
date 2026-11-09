import type { AnimalSex, CoatColor, LotClass, LotStatus, PricingMode } from '@/data/types'

export const LOT_CLASS_LABELS: Record<LotClass, string> = {
  steers: 'Steers',
  heifers: 'Heifers',
  bred: 'Bred heifers',
  pairs: 'Cow-calf pairs',
  bulls: 'Bulls',
}

/** Pairs are priced per pair; everything else per head. */
export const priceUnit = (lotClass: LotClass) => (lotClass === 'pairs' ? 'pair' : 'head')

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  available: 'Available',
  pending: 'Offer pending',
  sold: 'Sold',
}

export const PRICING_MODE_LABELS: Record<PricingMode, string> = {
  'buy-now': 'Buy It Now',
  offer: 'Make an Offer',
  both: 'Buy It Now or Offer',
}

export const SEX_LABELS: Record<AnimalSex, string> = {
  steer: 'Steer',
  heifer: 'Heifer',
  cow: 'Cow',
  bull: 'Bull',
}

export const COAT_LABELS: Record<CoatColor, string> = {
  black: 'Black',
  red: 'Red',
  hereford: 'Red, white face',
  'black-baldy': 'Black, white face',
  charolais: 'White / cream',
  smoke: 'Smoke (gray)',
}
