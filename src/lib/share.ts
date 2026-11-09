import { toast } from 'sonner'
import type { Lot } from '@/data/types'

export const lotUrl = (lot: Lot) => `${window.location.origin}/lots/${lot.id}`

export const canNativeShare = () => typeof navigator.share === 'function'

export async function copyLotLink(lot: Lot) {
  const url = lotUrl(lot)
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied', { description: url })
  } catch {
    toast.error("Couldn't copy the link", { description: `Copy it by hand: ${url}` })
  }
}

/** Opens the phone's share sheet where there is one; otherwise copies the link. */
export async function shareLot(lot: Lot) {
  if (!canNativeShare()) return copyLotLink(lot)
  try {
    await navigator.share({ title: `Lot ${lot.number}: ${lot.title}`, text: lot.description, url: lotUrl(lot) })
  } catch (err) {
    // Closing the share sheet is not an error.
    if ((err as Error).name !== 'AbortError') await copyLotLink(lot)
  }
}
