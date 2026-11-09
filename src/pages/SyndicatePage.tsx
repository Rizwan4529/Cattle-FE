import { type ReactNode, useCallback, useId, useState } from 'react'
import { ChevronLeft, Download, Printer, Search, Send, UserRound } from 'lucide-react'
import Papa from 'papaparse'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { LotStatusBadge } from '@/components/lots/LotStatusBadge'
import { LotSheet } from '@/components/syndicate/LotSheet'
import { SendHistory } from '@/components/syndicate/SendHistory'
import { SendProgress } from '@/components/syndicate/SendProgress'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { auctionPartners, marketChannels } from '@/data/partners'
import type { ExportFormat } from '@/data/types'
import { downloadText } from '@/lib/chuteScan'
import { formatCurrency, formatNumber } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import { getLotStats } from '@/lib/lots'
import { auctionCsv, EXPORT_FORMAT_LABELS, EXPORT_FORMATS, exportFileName, planReplies, recipientById, standardCsv } from '@/lib/syndication'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const STATES = [...new Set(auctionPartners.map((p) => p.state))].sort()

function Step({
  id,
  title,
  description,
  children,
  aside,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-5 rounded-2xl border bg-card p-5 sm:p-6 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={id} className="text-2xl font-bold">
            {title}
          </h2>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

const toggleIn = (set: Set<string>, id: string, on: boolean) => {
  const next = new Set(set)
  if (on) next.add(id)
  else next.delete(id)
  return next
}

/** Preview of a CSV: its header and first rows, scrollable sideways. */
function CsvPreview({ csv, rows = 3 }: { csv: string; rows?: number }) {
  const parsed = Papa.parse<string[]>(csv).data
  const [header, ...body] = parsed
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm whitespace-nowrap tabular-nums">
        <caption className="sr-only">First rows of the file</caption>
        <thead className="bg-muted">
          <tr>
            {header?.map((h) => (
              <th key={h} scope="col" className="border-r px-2.5 py-1.5 font-semibold last:border-r-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.slice(0, rows).map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => (
                <td key={j} className="max-w-56 truncate border-r px-2.5 py-1.5 last:border-r-0">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {body.length > rows && <p className="border-t px-2.5 py-1.5 text-sm text-muted-foreground">and {body.length - rows} more rows</p>}
    </div>
  )
}

/**
 * Send lots to sale barns, video auctions, and buyer networks: pick the lots,
 * pick who gets them, pick the file, send. The CSV downloads and the lot
 * sheet prints for real; the delivery and the replies are simulated.
 */
export default function SyndicatePage() {
  usePageTitle('Send to auction partners')
  const id = useId()
  const [params] = useSearchParams()
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
  const logSend = useRanchStore((s) => s.logSend)

  const sendable = lots.filter((l) => !l.draft && l.status !== 'sold')
  const [lotIds, setLotIds] = useState<Set<string>>(
    () => new Set((params.get('lots') ?? '').split(',').filter((x) => sendable.some((l) => l.id === x))),
  )
  const [partners, setPartners] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [state, setState] = useState('all')
  const [format, setFormat] = useState<ExportFormat>('auction-csv')
  const [sending, setSending] = useState<{ recipients: string[]; summary: string } | null>(null)

  const chosenLots = sendable.filter((l) => lotIds.has(l.id))
  const head = chosenLots.reduce((n, l) => n + l.tagIds.length, 0)
  const q = query.trim().toLowerCase()
  const shownPartners = auctionPartners.filter(
    (p) => (state === 'all' || p.state === state) && (!q || `${p.name} ${p.city}`.toLowerCase().includes(q)),
  )
  const allShownPicked = shownPartners.length > 0 && shownPartners.every((p) => partners.has(p.id))
  const csv = format === 'auction-csv' ? auctionCsv(chosenLots, animals) : format === 'standard-csv' ? standardCsv(chosenLots, animals) : ''
  const missing = [chosenLots.length === 0 && 'pick at least one lot', partners.size === 0 && 'pick who gets it'].filter(Boolean)
  const summary = `${chosenLots.length} ${chosenLots.length === 1 ? 'lot' : 'lots'} (${head} head) as ${EXPORT_FORMAT_LABELS[format].replace(/^\w/, (c) => c.toLowerCase())}`

  const download = () => {
    if (format === 'lot-sheet') return
    const name = exportFileName(format)
    downloadText(name, csv)
    toast.success('CSV downloaded', { description: name })
  }

  const send = () => {
    setSending({ recipients: [...partners], summary: `${summary}, to ${partners.size} ${partners.size === 1 ? 'partner' : 'partners'}.` })
  }

  const onDelivered = useCallback(() => {
    if (!sending) return
    const sentAt = Date.now()
    logSend({
      id: `send-${sentAt.toString(36)}`,
      createdAt: new Date(sentAt).toISOString(),
      lotIds: [...lotIds],
      format,
      recipients: planReplies(sending.recipients, sentAt),
    })
  }, [sending, lotIds, format, logSend])

  return (
    <div className="container-page pb-16 print:max-w-none print:px-0 print:pb-0">
      <div className="pt-4 print:hidden">
        <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Owner dashboard
        </Link>
      </div>
      <div className="flex flex-col gap-4 pt-4 pb-8 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-5xl">Send to auction partners</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Send your lots to sale barns, video auctions, and buyer networks in one go. They get a file they can use as-is, and the cattle stay on the
            ranch until they sell.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border bg-card px-3 py-1 font-medium sm:self-auto">
          <UserRound className="size-4 text-primary" aria-hidden />
          Logged in as Owner
        </span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] print:block">
        <div className="grid min-w-0 gap-6 print:block">
          {/* 1. Lots */}
          <Step
            id={`${id}-lots`}
            title="1. Pick the lots"
            description="Lots for sale now. Drafts and sold lots aren't sent."
            aside={
              sendable.length > 0 && (
                <Button variant="ghost" onClick={() => setLotIds(lotIds.size === sendable.length ? new Set() : new Set(sendable.map((l) => l.id)))}>
                  {lotIds.size === sendable.length ? 'Clear all' : 'Select all'}
                </Button>
              )
            }
          >
            {sendable.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed p-6 text-center text-muted-foreground">
                No lots for sale right now.{' '}
                <Link to="/dashboard/lots/new" className="font-medium text-primary underline-offset-4 hover:underline">
                  Build a lot
                </Link>{' '}
                first.
              </p>
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {sendable.map((l) => {
                  const s = getLotStats(l, animals)
                  const checkId = `${id}-lot-${l.id}`
                  const on = lotIds.has(l.id)
                  return (
                    <li key={l.id}>
                      <label
                        htmlFor={checkId}
                        className={cn(
                          'flex h-full cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-muted',
                          on && 'border-primary bg-primary/5',
                        )}
                      >
                        <Checkbox id={checkId} checked={on} onCheckedChange={(v) => setLotIds(toggleIn(lotIds, l.id, v === true))} className="mt-1" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            Lot {l.number}
                            {l.status === 'pending' && <LotStatusBadge status="pending" className="h-6" />}
                          </span>
                          <span className="block font-heading text-lg leading-snug font-bold">{l.title}</span>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {s.headCount} head, {formatNumber(s.avgWeight)} lb average, {formatCurrency(l.pricePerHead)}/{priceUnit(l.class)}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </Step>

          {/* 2. Partners */}
          <Step id={`${id}-partners`} title="2. Pick who gets them" description={`${partners.size} picked.`}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-q`}>Search sale barns</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id={`${id}-q`}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                    placeholder="Name or town"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-state`}>State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id={`${id}-state`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold">Sale barns and video auctions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={shownPartners.length === 0}
                  onClick={() => {
                    const next = new Set(partners)
                    for (const p of shownPartners) {
                      if (allShownPicked) next.delete(p.id)
                      else next.add(p.id)
                    }
                    setPartners(next)
                  }}
                >
                  {allShownPicked ? `Clear these ${shownPartners.length}` : `Select all ${shownPartners.length} shown`}
                </Button>
              </div>
              {shownPartners.length === 0 ? (
                <p className="rounded-xl border-2 border-dashed p-6 text-center text-muted-foreground">No sale barns match.</p>
              ) : (
                <ul className="grid max-h-96 divide-y overflow-y-auto rounded-xl border">
                  {shownPartners.map((p) => {
                    const checkId = `${id}-p-${p.id}`
                    const on = partners.has(p.id)
                    return (
                      <li key={p.id} className={cn('flex items-center gap-3 px-3', on && 'bg-primary/5')}>
                        <Checkbox id={checkId} checked={on} onCheckedChange={(v) => setPartners(toggleIn(partners, p.id, v === true))} />
                        <label htmlFor={checkId} className="flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col justify-center py-1.5">
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {p.kind === 'video-auction' ? 'Video auction, ' : ''}
                            {p.city}, {p.state}
                          </span>
                        </label>
                        <a
                          href={`tel:+1${p.phone.replace(/\D/g, '')}`}
                          className="shrink-0 py-3 text-sm whitespace-nowrap text-primary underline-offset-4 hover:underline"
                        >
                          <span className="sr-only">Call {p.name} at </span>
                          {p.phone}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="grid gap-2">
              <h3 className="text-xl font-bold">Marketplaces and buyer networks</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {marketChannels.map((c) => {
                  const checkId = `${id}-c-${c.id}`
                  const on = partners.has(c.id)
                  return (
                    <li key={c.id}>
                      <label
                        htmlFor={checkId}
                        className={cn(
                          'flex h-full cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-muted',
                          on && 'border-primary bg-primary/5',
                        )}
                      >
                        <Checkbox
                          id={checkId}
                          checked={on}
                          onCheckedChange={(v) => setPartners(toggleIn(partners, c.id, v === true))}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-semibold">{c.name}</span>
                          <span className="block text-sm text-muted-foreground">{c.description}</span>
                          <span className="mt-1 block text-sm font-medium">{c.reach}</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Step>

          {/* 3. Format */}
          <Step id={`${id}-format`} title="3. Pick the file">
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="grid gap-2 md:grid-cols-3">
              {EXPORT_FORMATS.map((f) => (
                <Label
                  key={f.value}
                  htmlFor={`${id}-f-${f.value}`}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                >
                  <RadioGroupItem id={`${id}-f-${f.value}`} value={f.value} className="mt-0.5" />
                  <span>
                    <span className="block font-semibold">{f.label}</span>
                    <span className="text-sm text-muted-foreground">{f.description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>

            {chosenLots.length === 0 ? (
              <p className="text-muted-foreground">Pick a lot to see the file.</p>
            ) : format === 'lot-sheet' ? (
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    Preview: {chosenLots.length} {chosenLots.length === 1 ? 'page' : 'pages'}
                  </p>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer aria-hidden />
                    Print lot sheet
                  </Button>
                </div>
                <div className="max-h-[40rem] overflow-auto rounded-xl bg-muted p-3 sm:p-5">
                  <LotSheet lots={chosenLots} animals={animals} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium break-all">Preview: {exportFileName(format)}</p>
                  <Button variant="outline" onClick={download}>
                    <Download aria-hidden />
                    Download CSV
                  </Button>
                </div>
                <CsvPreview csv={csv} />
              </div>
            )}
          </Step>
        </div>

        {/* 4. Send */}
        <aside
          aria-labelledby={`${id}-send`}
          className="grid content-start gap-4 rounded-2xl border bg-card p-5 sm:p-6 xl:sticky xl:top-28 xl:self-start print:hidden"
        >
          <h2 id={`${id}-send`} className="text-2xl font-bold">
            4. Send
          </h2>
          <dl className="grid grid-cols-3 gap-3 tabular-nums">
            {[
              ['Lots', chosenLots.length],
              ['Head', head],
              ['Partners', partners.size],
            ].map(([label, value]) => (
              <div key={label} className="border-t pt-2">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-heading text-3xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-muted-foreground">As {EXPORT_FORMAT_LABELS[format].replace(/^\w/, (c) => c.toLowerCase())}.</p>
          <Button size="lg" onClick={send} disabled={missing.length > 0} className="text-lg">
            <Send aria-hidden />
            Send to {partners.size || ''} {partners.size === 1 ? 'partner' : 'partners'}
          </Button>
          {missing.length > 0 ? (
            <p className="text-sm text-muted-foreground">To send, {missing.join(' and ')}.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Partners get the file with your phone number. Replies show in the send history below.</p>
          )}
          {partners.size > 0 && (
            <p className="text-sm">
              Sending to:{' '}
              {[...partners]
                .slice(0, 4)
                .map((p) => recipientById.get(p)?.name)
                .join(', ')}
              {partners.size > 4 && `, and ${partners.size - 4} more`}.
            </p>
          )}
        </aside>
      </div>

      <div className="mt-12 print:hidden">
        <SendHistory />
      </div>

      {/* Only the lot sheet prints. */}
      {format === 'lot-sheet' && chosenLots.length > 0 && (
        <div className="hidden print:block">
          <LotSheet lots={chosenLots} animals={animals} />
        </div>
      )}

      {sending && (
        <SendProgress
          open
          recipients={sending.recipients.map((r) => recipientById.get(r)!).filter(Boolean)}
          summary={sending.summary}
          onDelivered={onDelivered}
          onClose={() => {
            setSending(null)
            toast.success('Lots sent', { description: 'Replies will show in the send history as partners open the file.' })
            document.getElementById('history-heading')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />
      )}
    </div>
  )
}
