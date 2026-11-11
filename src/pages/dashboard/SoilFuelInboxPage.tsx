import { useId, useState } from 'react'
import { Check, CheckCheck, Inbox, Mail, Phone, Reply, Trash2, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { soilFuelConfig } from '@/config/soilFuel'
import type { ApplicationStatus, DealerApplication, FuelInquiry, ProApplication, QuoteStatus, TruckloadQuote } from '@/data/soilFuelTypes'
import { formatDate, formatNumber, formatPrice } from '@/lib/format'
import { fuelProduct, proTierFor, soilProduct } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const { soil, fuel } = soilFuelConfig
const label = <T extends string>(list: { value: T; label: string }[], v: T) => list.find((x) => x.value === v)?.label ?? v
const productName = (id: string) => [...soil.products, ...fuel.products].find((p) => p.id === id)?.name ?? id

const QUOTE_STATUS: Record<QuoteStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'New', variant: 'default' },
  quoted: { label: 'Quoted', variant: 'secondary' },
  won: { label: 'Won', variant: 'outline' },
  lost: { label: 'Lost', variant: 'outline' },
}
const APP_STATUS: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'New', variant: 'default' },
  approved: { label: 'Approved', variant: 'secondary' },
  declined: { label: 'Declined', variant: 'outline' },
}

function Contact({ email, phone }: { email: string; phone?: string }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <Button asChild variant="outline" size="sm" className="max-w-full">
        <a href={`mailto:${email}`}>
          <Mail aria-hidden />
          <span className="truncate">{email}</span>
        </a>
      </Button>
      {phone && (
        <Button asChild variant="outline" size="sm">
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
            <Phone aria-hidden />
            {phone}
          </a>
        </Button>
      )}
    </div>
  )
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-sm text-muted-foreground">{k}</dt>
          <dd className="font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function QuoteCard({ q }: { q: TruckloadQuote }) {
  const id = useId()
  const update = useRanchStore((s) => s.updateTruckloadQuote)
  const [price, setPrice] = useState(String(q.quoted ?? q.estimate))
  const p = soilProduct(q.productId)
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold">
            {q.business || q.name}
            <Badge variant={QUOTE_STATUS[q.status].variant}>{QUOTE_STATUS[q.status].label}</Badge>
          </h3>
          <p className="text-muted-foreground">
            {label(soil.buyerKinds, q.kind)}. {q.name}, {formatDate(q.createdAt)}.
          </p>
        </div>
        <Contact email={q.email} phone={q.phone} />
      </div>
      <Facts
        rows={[
          ['Load', `${q.loads} × ${p.name}`],
          ['Deliver to', `${q.zip}, about ${q.miles} miles`],
          ['When', label(soil.delivery.windows, q.window)],
          ['Our estimate', formatPrice(q.estimate)],
          ...(q.quoted ? ([['Quoted', formatPrice(q.quoted)]] as [string, string][]) : []),
        ]}
      />
      {q.notes && <p className="rounded-lg bg-muted px-4 py-3">{q.notes}</p>}
      <div className="flex flex-wrap items-end gap-3">
        {(q.status === 'new' || q.status === 'quoted') && (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const n = Number(price)
              if (!(n > 0)) return
              update(q.id, { status: 'quoted', quoted: Math.round(n) })
              toast.success(`Quote sent to ${q.name}`, { description: `${formatPrice(Math.round(n))} delivered, emailed to ${q.email}.` })
            }}
          >
            <div className="grid gap-1">
              <Label htmlFor={`${id}-price`} className="text-sm">
                Delivered price
              </Label>
              <Input
                id={`${id}-price`}
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10 w-32 tabular-nums"
              />
            </div>
            <Button type="submit" className="h-10">
              <Reply aria-hidden />
              {q.status === 'quoted' ? 'Send new quote' : 'Send quote'}
            </Button>
          </form>
        )}
        {q.status === 'quoted' && (
          <>
            <Button
              variant="outline"
              className="h-10"
              onClick={() => {
                update(q.id, { status: 'won' })
                toast.success(`${q.business || q.name}: won`)
              }}
            >
              <Check aria-hidden />
              Mark won
            </Button>
            <Button
              variant="ghost"
              className="h-10"
              onClick={() => {
                update(q.id, { status: 'lost' })
                toast(`${q.business || q.name}: lost`)
              }}
            >
              <X aria-hidden />
              Mark lost
            </Button>
          </>
        )}
        {(q.status === 'won' || q.status === 'lost') && (
          <Button
            variant="ghost"
            className="h-10"
            onClick={() => {
              update(q.id, { status: 'quoted' })
              toast(`${q.business || q.name} reopened`)
            }}
          >
            <Undo2 aria-hidden />
            Reopen
          </Button>
        )}
      </div>
    </li>
  )
}

function ApplicationActions({ status, name, onSet }: { status: ApplicationStatus; name: string; onSet: (s: ApplicationStatus) => void }) {
  return status === 'new' ? (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => {
          onSet('approved')
          toast.success(`${name} approved`, { description: 'Welcome email sent with pricing.' })
        }}
      >
        <Check aria-hidden />
        Approve
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          onSet('declined')
          toast(`${name} declined`)
        }}
      >
        <X aria-hidden />
        Decline
      </Button>
    </div>
  ) : (
    <Button
      variant="ghost"
      className="justify-self-start"
      onClick={() => {
        onSet('new')
        toast(`${name} moved back to new`)
      }}
    >
      <Undo2 aria-hidden />
      Undo
    </Button>
  )
}

function ProCard({ a }: { a: ProApplication }) {
  const update = useRanchStore((s) => s.updateProApplication)
  const tier = proTierFor(a.yardsPerYear)
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold">
            {a.business}
            <Badge variant={APP_STATUS[a.status].variant}>{APP_STATUS[a.status].label}</Badge>
          </h3>
          <p className="text-muted-foreground">
            {label(soil.buyerKinds, a.kind)} in {a.city}. {a.contact}, {formatDate(a.createdAt)}.
          </p>
        </div>
        <Contact email={a.email} phone={a.phone} />
      </div>
      <Facts
        rows={[
          ['Yards a year', formatNumber(a.yardsPerYear)],
          ['Tier', `${tier.label}${tier.off ? `, ${Math.round(tier.off * 100)}% off` : ''}`],
          ['Wants', a.interests.map(productName).join(', ')],
        ]}
      />
      {a.message && <p className="rounded-lg bg-muted px-4 py-3">{a.message}</p>}
      <ApplicationActions status={a.status} name={a.business} onSet={(s) => update(a.id, s)} />
    </li>
  )
}

function DealerCard({ a }: { a: DealerApplication }) {
  const update = useRanchStore((s) => s.updateDealerApplication)
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold">
            {a.business}
            <Badge variant={APP_STATUS[a.status].variant}>{APP_STATUS[a.status].label}</Badge>
          </h3>
          <p className="text-muted-foreground">
            {label(soilFuelConfig.dealerKinds, a.kind)} in {a.city}. {a.contact}, {formatDate(a.createdAt)}.
          </p>
        </div>
        <Contact email={a.email} phone={a.phone} />
      </div>
      <Facts rows={[['Would stock', a.interests.map((d) => (d === 'soil' ? soil.brand : fuel.brand)).join(' and ')]]} />
      {a.message && <p className="rounded-lg bg-muted px-4 py-3">{a.message}</p>}
      <ApplicationActions status={a.status} name={a.business} onSet={(s) => update(a.id, s)} />
    </li>
  )
}

function FuelInquiryCard({ q }: { q: FuelInquiry }) {
  const id = useId()
  const update = useRanchStore((s) => s.updateFuelInquiry)
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold">
            {q.business}
            <Badge variant={q.status === 'new' ? 'default' : q.status === 'replied' ? 'secondary' : 'outline'}>
              {q.status === 'new' ? 'New' : q.status === 'replied' ? 'Replied' : 'Handled'}
            </Badge>
          </h3>
          <p className="text-muted-foreground">
            {label(fuel.buyerKinds, q.kind)}. {q.contact}, {formatDate(q.createdAt)}.
          </p>
        </div>
        <Contact email={q.email} phone={q.phone} />
      </div>
      <Facts
        rows={[
          ['Wants', q.interests.map((i) => fuelProduct(i).name).join(', ')],
          ['How much', q.volume],
        ]}
      />
      {q.message && <p className="rounded-lg bg-muted px-4 py-3">{q.message}</p>}
      {q.reply && (
        <p className="border-l-4 border-primary pl-4">
          <span className="block text-sm font-semibold text-muted-foreground">Your reply</span>
          {q.reply}
        </p>
      )}
      {replying ? (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return setError('Write a reply first.')
            update(q.id, { reply: text.trim(), status: 'replied' })
            toast.success(`Reply sent to ${q.contact}`, { description: `Emailed to ${q.email}.` })
            setReplying(false)
            setText('')
          }}
        >
          <Label htmlFor={`${id}-reply`}>Reply to {q.contact}</Label>
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
          {q.status !== 'handled' && (
            <Button variant="outline" onClick={() => setReplying(true)}>
              <Reply aria-hidden />
              {q.reply ? 'Reply again' : 'Reply'}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              update(q.id, { status: q.status === 'handled' ? (q.reply ? 'replied' : 'new') : 'handled' })
              toast.success(q.status === 'handled' ? `${q.business} reopened` : `${q.business} marked handled`)
            }}
          >
            {q.status === 'handled' ? <Undo2 aria-hidden /> : <CheckCheck aria-hidden />}
            {q.status === 'handled' ? 'Reopen' : 'Mark handled'}
          </Button>
        </div>
      )}
    </li>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid justify-items-start gap-2 rounded-2xl border border-dashed bg-card p-6">
      <Inbox className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-lg font-semibold">Nothing here yet.</p>
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

const byNewest = <T extends { createdAt: string }>(list: T[]) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

/** Soil & Fuel inboxes: truckload quotes, pro and dealer applications, fuel wholesale inquiries, and the waitlist. */
export default function SoilFuelInboxPage() {
  usePageTitle('Soil & Fuel inbox')
  const quotes = useRanchStore((s) => s.truckloadQuotes)
  const pros = useRanchStore((s) => s.proApplications)
  const dealersApps = useRanchStore((s) => s.dealerApplications)
  const fuelInq = useRanchStore((s) => s.fuelInquiries)
  const waitlist = useRanchStore((s) => s.waitlist)
  const removeWait = useRanchStore((s) => s.removeWaitlist)
  const count = (list: { status: string }[]) => list.filter((x) => x.status === 'new').length
  const tabs = [
    { value: 'quotes', label: 'Truckload quotes', n: count(quotes) },
    { value: 'pro', label: 'Pro accounts', n: count(pros) },
    { value: 'dealers', label: 'Dealers', n: count(dealersApps) },
    { value: 'fuel', label: 'Fuel wholesale', n: count(fuelInq) },
    { value: 'waitlist', label: 'Waitlist', n: 0 },
  ]

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="text-4xl font-bold">Soil & Fuel inbox</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          Truckload quote requests, pro and dealer applications, fuel wholesale inquiries, and the launch waitlist.
        </p>
      </div>
      <Tabs defaultValue="quotes" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="min-h-10 flex-none px-4 text-base text-foreground/85">
              {t.label}
              {t.value === 'waitlist' ? ` (${waitlist.length})` : t.n ? ` (${t.n} new)` : ''}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="quotes">
          <h2 className="sr-only">Truckload quotes</h2>
          {quotes.length ? (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-4">
              {byNewest(quotes).map((q) => (
                <QuoteCard key={q.id} q={q} />
              ))}
            </ul>
          ) : (
            <Empty text="Requests from the truckload quote page land here." />
          )}
        </TabsContent>
        <TabsContent value="pro">
          <h2 className="sr-only">Pro account applications</h2>
          {pros.length ? (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-4">
              {byNewest(pros).map((a) => (
                <ProCard key={a.id} a={a} />
              ))}
            </ul>
          ) : (
            <Empty text="Applications from the Pro accounts page land here." />
          )}
        </TabsContent>
        <TabsContent value="dealers">
          <h2 className="sr-only">Dealer applications</h2>
          {dealersApps.length ? (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-4">
              {byNewest(dealersApps).map((a) => (
                <DealerCard key={a.id} a={a} />
              ))}
            </ul>
          ) : (
            <Empty text="Become-a-dealer forms from the store locator land here." />
          )}
        </TabsContent>
        <TabsContent value="fuel">
          <h2 className="sr-only">Fuel wholesale inquiries</h2>
          {fuelInq.length ? (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-4">
              {byNewest(fuelInq).map((q) => (
                <FuelInquiryCard key={q.id} q={q} />
              ))}
            </ul>
          ) : (
            <Empty text="Inquiries from the Fuel wholesale page land here." />
          )}
        </TabsContent>
        <TabsContent value="waitlist" className="grid gap-3">
          <h2 className="sr-only">Launch waitlist</h2>
          {waitlist.length ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground">
                  {waitlist.length} {waitlist.length === 1 ? 'person' : 'people'} waiting for {soil.launch.season}.
                </p>
                <Button asChild variant="outline">
                  <a href={`mailto:?bcc=${waitlist.map((w) => w.email).join(',')}&subject=${encodeURIComponent('CROWDER Soil & Fuel is ready')}`}>
                    <Mail aria-hidden />
                    Email everyone
                  </a>
                </Button>
              </div>
              <div className="overflow-x-auto rounded-2xl border bg-card" tabIndex={0} role="region" aria-label="Waitlist, scrollable table">
                <table className="w-full min-w-[36rem] text-left">
                  <thead className="bg-muted">
                    <tr>
                      {['Name', 'Email', 'ZIP', 'Interested in', 'Joined', ''].map((h, i) => (
                        <th key={h || i} scope="col" className="px-4 py-2 font-semibold">
                          {h || <span className="sr-only">Remove</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byNewest(waitlist).map((w) => (
                      <tr key={w.id} className="border-t">
                        <td className="px-4 py-2">{w.name || '–'}</td>
                        <td className="px-4 py-2">{w.email}</td>
                        <td className="px-4 py-2 tabular-nums">{w.zip || '–'}</td>
                        <td className="px-4 py-2">{w.interests.map(productName).join(', ')}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatDate(w.createdAt)}</td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Remove ${w.email}`}
                            onClick={() => {
                              removeWait(w.id)
                              toast(`${w.email} removed from the list`)
                            }}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <Empty text="Sign-ups from the Soil and Fuel pages land here." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
