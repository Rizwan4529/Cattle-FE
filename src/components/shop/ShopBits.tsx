import { Heart, Minus, Plus, Star } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { feedProgram } from '@/config/beef'
import type { BeefProduct } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

/**
 * "From animal HCR-2692 · Grain-finished · Angus": the line on every product
 * that ties the beef to one animal, linking to its passport.
 */
export function TraceLine({
  product,
  animal,
  className,
  linkClassName,
}: {
  product: BeefProduct
  animal?: Animal
  className?: string
  linkClassName?: string
}) {
  const program = animal?.feedProgram ? feedProgram(animal.feedProgram).short : undefined
  return (
    <p className={cn('text-sm', className)}>
      From animal{' '}
      <Link to={`/animal/${product.sourceTagId}`} className={cn('font-semibold text-primary underline underline-offset-4', linkClassName)}>
        {product.sourceTagId}
      </Link>
      {program && <> · {program}</>}
      {animal && <> · {animal.breed}</>}
    </p>
  )
}

/** Star rating, read as "4.5 out of 5 stars". */
export function Stars({ rating, size = 'sm', className }: { rating: number; size?: 'sm' | 'lg'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)))
        return (
          <span key={i} className={cn('relative', size === 'lg' ? 'size-6' : 'size-4')}>
            <Star className="absolute inset-0 size-full text-muted-foreground/40" aria-hidden />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn('fill-tag text-tag', size === 'lg' ? 'size-6' : 'size-4')} aria-hidden />
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** − 2 + quantity control. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  className,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  /** e.g. "Ribeye steaks packs", read by screen readers */
  label: string
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex items-center rounded-lg border bg-background', className)}>
      <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`One fewer`}>
        <Minus aria-hidden />
      </Button>
      <span className="min-w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`One more`}>
        <Plus aria-hidden />
      </Button>
    </div>
  )
}

/** Heart toggle that saves a product to the account's favorites. */
export function FavoriteButton({ productId, name, className }: { productId: string; name: string; className?: string }) {
  const on = useRanchStore((s) => s.favorites.includes(productId))
  const toggle = useRanchStore((s) => s.toggleFavorite)
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
      title={on ? 'In your favorites' : 'Save to favorites'}
      onClick={() => {
        toggle(productId)
        toast(on ? `${name} removed from favorites` : `${name} saved to favorites`, {
          description: on ? undefined : 'Reorder it in one click from your account.',
        })
      }}
      className={cn('size-10 rounded-full border bg-card/90 shadow-sm backdrop-blur-sm hover:bg-card', className)}
    >
      <Heart className={cn('size-5', on && 'fill-primary text-primary')} aria-hidden />
    </Button>
  )
}
