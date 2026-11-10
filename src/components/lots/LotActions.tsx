import { useState } from 'react'
import { Check, Clock, HandCoins, ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Lot } from '@/data/types'
import { formatCurrency } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import type { LotStats } from '@/lib/lots'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'
import { MakeOfferDialog } from './MakeOfferDialog'

/**
 * Buy It Now / Make an Offer buttons for a lot. Which buttons appear depends
 * on the lot's pricing mode and status; a lone action is paired with "View lot".
 */
export function LotActions({
  lot,
  stats,
  size = 'default',
  onLotPage = false,
  className,
}: {
  lot: Lot
  stats: LotStats
  /** "lg" for the lot page's buy box */
  size?: 'default' | 'lg'
  /** On the lot's own page there is no "View lot" link to pair with a lone action */
  onLotPage?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  const [offerOpen, setOfferOpen] = useState(false)
  const inCart = useRanchStore((s) => s.cart.some((i) => i.kind === 'lot' && i.lotId === lot.id))
  const addToCart = useRanchStore((s) => s.addToCart)
  const myOffer = useRanchStore((s) => s.offers.find((o) => o.lotId === lot.id && o.fromThisDevice && o.status === 'pending'))
  const lotUrl = `/lots/${lot.id}`

  if (lot.status === 'sold') {
    return (
      <div className={className}>
        <Button asChild variant="outline" size={size} className="w-full">
          {onLotPage ? <Link to="/cattle?status=available">Browse available cattle</Link> : <Link to={lotUrl}>View sold lot</Link>}
        </Button>
      </div>
    )
  }

  const canBuy = lot.pricingMode !== 'offer'
  const canOffer = lot.pricingMode !== 'buy-now'

  const buy = () => {
    addToCart(lot.id)
    toast.success(`Lot ${lot.number} added to your cart`, {
      description: `${stats.headCount} ${lot.class === 'pairs' ? 'pairs' : 'head'}, ${formatCurrency(stats.lotTotal)}`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <div className={cn('grid gap-3', className)}>
      {myOffer && (
        <p className="flex items-start gap-2 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span>
            Your offer of {formatCurrency(myOffer.pricePerHead)}/{priceUnit(lot.class)} is waiting for the ranch's reply.
          </span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {canBuy &&
          (inCart ? (
            <Button asChild variant="secondary" size={size} className={cn(onLotPage && !canOffer && 'col-span-2')}>
              <Link to="/cart">
                <Check aria-hidden />
                In your cart
              </Link>
            </Button>
          ) : (
            <Button onClick={buy} size={size} className={cn(onLotPage && !canOffer && 'col-span-2')}>
              <ShoppingCart aria-hidden />
              Buy now
            </Button>
          ))}
        {canOffer && (
          <Button
            variant={canBuy ? 'outline' : 'default'}
            size={size}
            onClick={() => setOfferOpen(true)}
            className={cn(onLotPage && !canBuy && 'col-span-2')}
          >
            <HandCoins aria-hidden />
            Make offer
          </Button>
        )}
        {!(canBuy && canOffer) && !onLotPage && (
          <Button asChild variant="outline" size={size}>
            <Link to={lotUrl}>View lot</Link>
          </Button>
        )}
      </div>
      {canOffer && <MakeOfferDialog lot={lot} stats={stats} open={offerOpen} onOpenChange={setOfferOpen} />}
    </div>
  )
}
