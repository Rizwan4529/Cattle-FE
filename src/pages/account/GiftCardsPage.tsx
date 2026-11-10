import { Copy, CreditCard } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

export default function GiftCardsPage() {
  usePageTitle('Gift cards')
  const cards = useRanchStore((s) => s.giftCards)

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copied', { description: 'Paste it in “Promo code or gift card” at checkout.' })
    } catch {
      toast.error('Couldn’t copy. Select the code and copy it by hand.')
    }
  }

  return (
    <>
      <AccountHeader
        title="Gift cards"
        description="Gift cards you’ve bought. Any gift card code works at checkout, on anything due that day."
        actions={
          <Button asChild variant="outline">
            <Link to="/gifts">Send a gift card</Link>
          </Button>
        }
      />
      {cards.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <CreditCard className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-lg">No gift cards yet. They’re emailed on the day you choose and never expire.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {cards.map((g) => (
            <li key={g.id} className="grid gap-3 rounded-2xl border bg-leather p-5 text-leather-foreground">
              <div className="flex items-start justify-between gap-3">
                <p className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(g.balance, true)}</p>
                <p className="text-sm text-leather-foreground/80">of {formatCurrency(g.amount)}</p>
              </div>
              <p>
                For {g.recipientName} ({g.recipientEmail}), from {g.fromName}. Emailed {formatDate(g.sendOn)}.
              </p>
              {g.message && <p className="text-sm text-leather-foreground/80 italic">“{g.message}”</p>}
              <div className="flex flex-wrap items-center gap-3 border-t border-leather-foreground/20 pt-3">
                <code className="rounded-md bg-leather-foreground/10 px-3 py-1.5 font-semibold tracking-wide">{g.code}</code>
                <Button size="sm" variant="secondary" onClick={() => copy(g.code)}>
                  <Copy aria-hidden />
                  Copy code
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
