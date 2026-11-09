import { TrendingDown, TrendingUp } from 'lucide-react'
import { marketQuotes, type MarketQuote } from '@/data/market'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

function Quote({ q }: { q: MarketQuote }) {
  const up = q.change >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <li className="flex shrink-0 items-baseline gap-2 px-6 whitespace-nowrap">
      <span className="font-semibold">{q.label}</span>
      <span className="text-sm text-leather-foreground/65">{q.detail}</span>
      <span className="font-heading text-lg font-bold tabular-nums">{formatCurrency(q.price, true)}</span>
      <span className={cn('inline-flex items-center gap-1 self-center text-sm font-semibold tabular-nums', up ? 'text-leather-up' : 'text-leather-down')}>
        <Icon className="size-4" aria-hidden />
        <span className="sr-only">{up ? 'up' : 'down'}</span>
        {up ? '+' : '−'}
        {Math.abs(q.change).toFixed(2)}
      </span>
    </li>
  )
}

/**
 * Scrolling market prices ($/cwt). The list is rendered twice so the loop is
 * seamless; the copy is hidden from screen readers. With reduced motion the
 * strip stops and can be scrolled by hand.
 */
export function MarketTicker() {
  return (
    <section aria-label="Market prices, sample data" className="bg-leather text-leather-foreground">
      <div className="flex items-stretch">
        <div className="flex shrink-0 flex-col justify-center border-r border-leather-foreground/15 px-4 py-3 sm:px-6">
          <span className="font-heading text-lg leading-tight font-bold">Market $/cwt</span>
          <span className="text-xs text-tag">Sample data</span>
        </div>
        <div className="group relative flex-1 overflow-hidden motion-reduce:overflow-x-auto">
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-leather to-transparent" />
          <div className="flex w-max animate-[ticker_45s_linear_infinite] py-3 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
            <ul className="flex">
              {marketQuotes.map((q) => (
                <Quote key={q.id} q={q} />
              ))}
            </ul>
            <ul className="flex motion-reduce:hidden" aria-hidden>
              {marketQuotes.map((q) => (
                <Quote key={q.id} q={q} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
