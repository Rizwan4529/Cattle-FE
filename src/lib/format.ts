import { DEMO_TODAY } from '@/data/animals'

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
const num = new Intl.NumberFormat('en-US')

/** $2,275 (or $2,275.50 with cents) */
export const formatCurrency = (value: number, cents = false) => (cents ? usd2 : usd0).format(value)

/** $355.47/cwt */
export const formatCwt = (pricePerCwt: number) => `${usd2.format(pricePerCwt)}/cwt`

/** 642 lb */
export const formatWeight = (lb: number) => `${num.format(Math.round(lb))} lb`

export const formatNumber = (value: number) => num.format(value)

const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)

/** Nov 6, 2026 */
export const formatDate = (iso: string) => toDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Today's date on this device, e.g. for "Printed Nov 9, 2026" (local time, not UTC). */
export const formatToday = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Nov 6 */
export const formatShortDate = (iso: string) => toDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** "8 mo" or "2 yr 3 mo", measured to the demo's "today" */
export function formatAge(birthDate: string, asOf = DEMO_TODAY) {
  const b = toDate(birthDate)
  const t = toDate(asOf)
  const months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth()) - (t.getDate() < b.getDate() ? 1 : 0)
  if (months < 24) return `${months} mo`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest ? `${years} yr ${rest} mo` : `${years} yr`
}

/** $/cwt from a price per head and weight in lb */
export const pricePerCwt = (pricePerHead: number, weightLb: number) => (weightLb > 0 ? pricePerHead / (weightLb / 100) : 0)

/** Whole days from a date to the demo's "today" */
export const daysSince = (iso: string, asOf = DEMO_TODAY) => Math.round((toDate(asOf).getTime() - toDate(iso).getTime()) / 86_400_000)

/** A unit price: whole dollars when it's whole ($46), cents when it isn't ($7.50). */
export const formatPrice = (value: number) => formatCurrency(value, !Number.isInteger(Math.round(value * 100) / 100))
