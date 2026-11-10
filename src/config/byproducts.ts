/**
 * Ranch Goods settings: categories and their legal flags, what one animal
 * yields of each byproduct, and what it sells for.
 *
 * ⚠ PLACEHOLDER ESTIMATES. Every yield, price, cost, and recovery rate below
 * is a rough estimate for a ~1,300 lb finished steer, NOT the ranch's real
 * numbers. Sale prices are the U.S. retail averages from the rancher's
 * byproduct mockup. The rancher must confirm each one (with the processor
 * and tannery) before these figures are shown as fact. The dashboard labels
 * them "estimate" until `estimatesConfirmed` is true.
 */

import type { CutExtra } from '@/data/beefTypes'
import type { ByproductPartId, ComplianceFlags, GoodsCategoryId, GoodsUse } from '@/data/goodsTypes'

export interface GoodsCategory extends ComplianceFlags {
  id: GoodsCategoryId
  name: string
  /** One line under the category heading */
  description: string
  /** Turn off to hide the whole category from the storefront */
  enabled: boolean
}

export interface ByproductPart {
  id: ByproductPartId
  name: string
  /** What it becomes, in a few words */
  becomes: string
  /** Raw amount from one animal (lb or count, see rawUnit). PLACEHOLDER. */
  rawPerAnimal: number
  rawUnit: 'lb' | 'each'
  /** Sellable units per raw unit: 0.75 = 40 lb fat renders to 30 lb tallow; 2 = one pizzle makes two sticks. PLACEHOLDER. */
  sellableRatio: number
  /** What one sellable unit is */
  sellUnit: string
  /** Blended retail price per sellable unit. PLACEHOLDER (mockup retail averages). */
  price: number
  /** Cost to make one unit sellable: tanning, rendering, drying, packing. PLACEHOLDER. */
  cost: number
  /** Share the ranch gets back from the processor today, 0–1. PLACEHOLDER. */
  recoveryRate: number
  /** Only animals with horns have this part */
  hornedOnly?: boolean
  /** Only steers and bulls have this part */
  malesOnly?: boolean
  /** Cut-sheet extra that takes this part from the ranch's share when a buyer asks for it */
  cutSheetExtra?: CutExtra
  /** How the estimate was reached, shown next to the number */
  basis: string
}

export interface PriceTier {
  min: number
  /** Inclusive; open-ended when missing */
  max?: number
  /** Share off the list price */
  off: number
}

export const byproductsConfig = {
  /** Master switch for Ranch Goods (nav entry, pages, cross-sells) */
  enabled: true,

  /** Flip to true once the rancher has checked every number in `parts`. */
  estimatesConfirmed: false,
  placeholderNote: 'Estimate. Confirm with your processor and tannery before relying on it.',

  /** Shown to shoppers at the foot of Ranch Goods pages. No legal warnings here; those are owner-only. */
  consumerNote: 'Prices and availability vary with each harvest. One-of-a-kind items, like hides and horns, sell once.',

  categories: [
    {
      id: 'tallow',
      name: 'Tallow & Fat',
      description: 'For soap, candles, cooking, and leather care.',
      enabled: true,
      requiresInspection: true,
      requiresFeedRegistration: false,
      requiresFertilizerRegistration: false,
    },
    {
      id: 'bones',
      name: 'Bones & Specialty Cuts',
      description: 'Stock bones, marrow, oxtail, and organ meat.',
      enabled: true,
      requiresInspection: true,
      requiresFeedRegistration: false,
      requiresFertilizerRegistration: false,
    },
    {
      id: 'dog-chews',
      name: 'Dog Chews',
      description: 'Single-ingredient beef chews.',
      enabled: true,
      requiresInspection: false,
      requiresFeedRegistration: true,
      requiresFertilizerRegistration: false,
    },
    {
      id: 'hides',
      name: 'Hides & Leather',
      description: 'Hair-on hides, rawhide, and leather.',
      enabled: true,
      requiresInspection: false,
      requiresFeedRegistration: false,
      requiresFertilizerRegistration: false,
    },
    {
      id: 'craft',
      name: 'Horn, Bone & Craft',
      description: 'For makers, carvers, and knife builders.',
      enabled: true,
      requiresInspection: false,
      requiresFeedRegistration: false,
      requiresFertilizerRegistration: false,
    },
    {
      id: 'garden',
      name: 'Garden',
      description: 'Slow-release organic fertilizer.',
      enabled: true,
      requiresInspection: false,
      requiresFeedRegistration: false,
      requiresFertilizerRegistration: true,
    },
  ] as GoodsCategory[],

  /** Use filter labels */
  uses: {
    cooking: 'Cooking',
    pets: 'Pets',
    crafts: 'Crafts',
    garden: 'Garden',
    home: 'Home',
  } satisfies Record<GoodsUse, string>,

  /** What one finished animal yields. ALL PLACEHOLDERS: see the note at the top of this file. */
  parts: [
    {
      id: 'hide',
      name: 'Hide',
      becomes: 'Hair-on rug, rawhide, leather',
      rawPerAnimal: 1,
      rawUnit: 'each',
      sellableRatio: 1,
      sellUnit: 'hide',
      price: 175,
      cost: 120,
      recoveryRate: 1,
      basis: 'One hide (~65 lb green). Sold as a tanned rug at $175; tanning about $120.',
    },
    {
      id: 'horns',
      name: 'Horns',
      becomes: 'Cleaned horns, drinking horns, horn meal',
      rawPerAnimal: 2,
      rawUnit: 'each',
      sellableRatio: 1,
      sellUnit: 'horn',
      price: 20,
      cost: 4,
      recoveryRate: 1,
      hornedOnly: true,
      basis: 'Two horns, only on horned animals (Angus are naturally polled). Cleaned horn $20.',
    },
    {
      id: 'hooves',
      name: 'Hooves',
      becomes: 'Dried dog chews, hoof meal',
      rawPerAnimal: 4,
      rawUnit: 'each',
      sellableRatio: 1,
      sellUnit: 'hoof',
      price: 3,
      cost: 0.5,
      recoveryRate: 0.5,
      basis: 'Four hooves, dried. $3 each.',
    },
    {
      id: 'fat',
      name: 'Fat & suet',
      becomes: 'Rendered tallow, soap, suet',
      rawPerAnimal: 50,
      rawUnit: 'lb',
      sellableRatio: 0.75,
      sellUnit: 'lb tallow',
      price: 10,
      cost: 1.5,
      recoveryRate: 0.6,
      cutSheetExtra: 'fat',
      basis: 'About 50 lb of kidney and trim fat; renders to about 75% tallow. Tallow $10/lb, rendering ~$1.50/lb.',
    },
    {
      id: 'bones',
      name: 'Bones',
      becomes: 'Soup and marrow bones, knuckles, bone meal',
      rawPerAnimal: 35,
      rawUnit: 'lb',
      sellableRatio: 1,
      sellUnit: 'lb',
      price: 4.85,
      cost: 1,
      recoveryRate: 0.8,
      cutSheetExtra: 'soupBones',
      basis: 'About 25 lb soup bones ($4/lb) and 10 lb marrow bones ($7/lb) beyond bone-in cuts. Cutting and packing ~$1/lb.',
    },
    {
      id: 'organs',
      name: 'Organs',
      becomes: 'Liver and heart',
      rawPerAnimal: 15,
      rawUnit: 'lb',
      sellableRatio: 1,
      sellUnit: 'lb',
      price: 4.25,
      cost: 0.75,
      recoveryRate: 0.8,
      cutSheetExtra: 'organs',
      basis: 'About 11 lb liver ($4/lb) and 4 lb heart ($5/lb).',
    },
    {
      id: 'tail',
      name: 'Tail',
      becomes: 'Oxtail',
      rawPerAnimal: 2.5,
      rawUnit: 'lb',
      sellableRatio: 1,
      sellUnit: 'lb',
      price: 11,
      cost: 1,
      recoveryRate: 1,
      basis: 'About 2½ lb of oxtail at $11/lb.',
    },
    {
      id: 'tendons',
      name: 'Tendons',
      becomes: 'Tendon chews, sinew',
      rawPerAnimal: 4,
      rawUnit: 'lb',
      sellableRatio: 0.5,
      sellUnit: '1 lb bag',
      price: 24,
      cost: 3,
      recoveryRate: 0.5,
      basis: 'About 4 lb raw, half that once dried. Sold in 1 lb bags at $24.',
    },
    {
      id: 'ears',
      name: 'Ears',
      becomes: 'Dried cow ears',
      rawPerAnimal: 2,
      rawUnit: 'each',
      sellableRatio: 1,
      sellUnit: 'ear',
      price: 2.5,
      cost: 0.4,
      recoveryRate: 0.5,
      basis: 'Two ears, dried. $2.50 each.',
    },
    {
      id: 'trachea',
      name: 'Trachea',
      becomes: 'Joint-support chew',
      rawPerAnimal: 1,
      rawUnit: 'each',
      sellableRatio: 1,
      sellUnit: 'chew',
      price: 4,
      cost: 0.5,
      recoveryRate: 0.5,
      basis: 'One trachea, dried whole. $4.',
    },
    {
      id: 'pizzle',
      name: 'Pizzle',
      becomes: 'Bully sticks',
      rawPerAnimal: 1,
      rawUnit: 'each',
      sellableRatio: 2,
      sellUnit: '12 in stick',
      price: 5.5,
      cost: 1,
      recoveryRate: 0.5,
      malesOnly: true,
      basis: 'One per steer or bull, about two 12-inch sticks once dried. $5.50 each.',
    },
  ] as ByproductPart[],

  /** Makers & Wholesale volume discount on items marked `bulk` */
  priceTiers: [
    { min: 1, max: 4, off: 0 },
    { min: 5, max: 19, off: 0.1 },
    { min: 20, off: 0.2 },
  ] as PriceTier[],
}

export type ByproductsConfig = typeof byproductsConfig
