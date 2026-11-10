import { useId, useState } from 'react'
import { CheckCheck, Inbox, Mail, Phone, Reply, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { byproductsConfig } from '@/config/byproducts'
import { BUSINESS_KINDS } from '@/data/goods'
import type { WholesaleInquiry } from '@/data/goodsTypes'
import { formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

type Filter = 'open' | 'handled' | 'all'

const STATUS: Record<WholesaleInquiry['status'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'New', variant: 'default' },
  replied: { label: 'Replied', variant: 'secondary' },
  handled: { label: 'Handled', variant: 'outline' },
}

function InquiryCard({ inquiry }: { inquiry: WholesaleInquiry }) {
  const id = useId()
  const update = useRanchStore((s) => s.updateWholesaleInquiry)
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const kind = BUSINESS_KINDS.find((k) => k.value === inquiry.kind)?.label
  const categories = inquiry.categories.map((c) => byproductsConfig.categories.find((x) => x.id === c)?.name ?? c).join(', ')

  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">
            {inquiry.business}
            <Badge variant={STATUS[inquiry.status].variant}>{STATUS[inquiry.status].label}</Badge>
          </h2>
          <p className="text-muted-foreground">
            {kind}. {inquiry.contact}, {formatDate(inquiry.createdAt)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${inquiry.email}`}>
              <Mail aria-hidden />
              {inquiry.email}
            </a>
          </Button>
          {inquiry.phone && (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, '')}`}>
                <Phone aria-hidden />
                {inquiry.phone}
              </a>
            </Button>
          )}
        </div>
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Wants</dt>
          <dd className="font-semibold">{categories}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">How much</dt>
          <dd className="font-semibold">{inquiry.volume}</dd>
        </div>
      </dl>
      {inquiry.message && <p className="rounded-lg bg-muted px-4 py-3">{inquiry.message}</p>}
      {inquiry.reply && (
        <p className="border-l-4 border-primary pl-4">
          <span className="block text-sm font-semibold text-muted-foreground">Your reply</span>
          {inquiry.reply}
        </p>
      )}

      {replying ? (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return setError('Write a reply first.')
            update(inquiry.id, { reply: text.trim(), status: 'replied' })
            toast.success(`Reply sent to ${inquiry.contact}`, { description: `Emailed to ${inquiry.email}.` })
            setReplying(false)
            setText('')
          }}
        >
          <Label htmlFor={`${id}-reply`}>Reply to {inquiry.contact}</Label>
          <Textarea
            id={`${id}-reply`}
            rows={3}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError('')
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-reply-error` : undefined}
            autoFocus
          />
          {error && (
            <p id={`${id}-reply-error`} className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              <Reply aria-hidden />
              Send reply
            </Button>
            <Button type="button" variant="ghost" onClick={() => setReplying(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {inquiry.status !== 'handled' && (
            <Button variant="outline" onClick={() => setReplying(true)}>
              <Reply aria-hidden />
              {inquiry.reply ? 'Reply again' : 'Reply'}
            </Button>
          )}
          {inquiry.status === 'handled' ? (
            <Button
              variant="ghost"
              onClick={() => {
                update(inquiry.id, { status: inquiry.reply ? 'replied' : 'new' })
                toast(`${inquiry.business} reopened`)
              }}
            >
              <Undo2 aria-hidden />
              Reopen
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                update(inquiry.id, { status: 'handled' })
                toast.success(`${inquiry.business} marked handled`)
              }}
            >
              <CheckCheck aria-hidden />
              Mark handled
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

/** Makers & Wholesale inquiries from the Ranch Goods wholesale page. */
export default function WholesaleInboxPage() {
  usePageTitle('Wholesale inquiries')
  const inquiries = useRanchStore((s) => s.wholesaleInquiries)
  const [filter, setFilter] = useState<Filter>('open')
  const shown = inquiries
    .filter((w) => (filter === 'all' ? true : filter === 'handled' ? w.status === 'handled' : w.status !== 'handled'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const open = inquiries.filter((w) => w.status !== 'handled').length

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Wholesale inquiries</h1>
          <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
            Soap makers, pet-treat shops, leatherworkers, and garden centers asking about volume.
          </p>
        </div>
        <ToggleGroup type="single" variant="outline" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} aria-label="Show">
          <ToggleGroupItem value="open" className="h-10 px-4">
            Open ({open})
          </ToggleGroupItem>
          <ToggleGroupItem value="handled" className="h-10 px-4">
            Handled
          </ToggleGroupItem>
          <ToggleGroupItem value="all" className="h-10 px-4">
            All
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {shown.length ? (
        <ul className="grid gap-4">
          {shown.map((w) => (
            <InquiryCard key={w.id} inquiry={w} />
          ))}
        </ul>
      ) : (
        <div className="grid justify-items-start gap-2 rounded-2xl border border-dashed bg-card p-6">
          <Inbox className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-lg font-semibold">{filter === 'handled' ? 'Nothing handled yet.' : 'You’re all caught up.'}</p>
          <p className="text-muted-foreground">New inquiries from the Makers & Wholesale page land here.</p>
        </div>
      )}
    </div>
  )
}
