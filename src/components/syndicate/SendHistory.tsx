import { Fragment, useEffect, useRef, useState } from 'react'
import { ChevronDown, CircleCheck, Eye, Hand, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DeliveryStatus } from '@/data/types'
import { DELIVERY_LABELS, EXPORT_FORMAT_LABELS, recipientById, statusAt } from '@/lib/syndication'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const STATUS_STYLE: Record<DeliveryStatus, { icon: typeof Eye; className: string }> = {
  delivered: { icon: CircleCheck, className: 'border-border bg-transparent text-foreground' },
  viewed: { icon: Eye, className: 'border-primary/40 bg-primary/10 text-foreground' },
  interested: { icon: Hand, className: 'bg-success text-success-foreground' },
}

const sentOn = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { icon: Icon, className } = STATUS_STYLE[status]
  return (
    <Badge variant="outline" className={cn('h-7 gap-1.5 px-2.5 text-sm font-semibold', className)}>
      <Icon aria-hidden />
      {DELIVERY_LABELS[status]}
    </Badge>
  )
}

/**
 * Every send, newest first. Partners' replies (opened the file, asked about
 * the cattle) come in over the next few seconds; the table keeps time while
 * any are still due, and a toast announces each partner that's interested.
 */
export function SendHistory() {
  const sends = useRanchStore((s) => s.sends)
  const lots = useRanchStore((s) => s.lots)
  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState<string | null>(null)
  const announced = useRef<Set<string> | null>(null)

  const pending = sends.some((s) =>
    s.recipients.some((r) => (r.viewedAt && Date.parse(r.viewedAt) > now) || (r.interestedAt && Date.parse(r.interestedAt) > now)),
  )

  useEffect(() => {
    if (!pending) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [pending])

  // Announce new interest, but not replies that had already arrived before the page opened.
  useEffect(() => {
    const interested = sends.flatMap((s) =>
      s.recipients.filter((r) => statusAt(r, now) === 'interested').map((r) => ({ key: `${s.id}:${r.id}`, s, r })),
    )
    if (!announced.current) {
      announced.current = new Set(interested.map((i) => i.key))
      return
    }
    for (const { key, s, r } of interested) {
      if (announced.current.has(key)) continue
      announced.current.add(key)
      const lotNames = s.lotIds.map((id) => `Lot ${lots.find((l) => l.id === id)?.number ?? '?'}`).join(', ')
      const phone = recipientById.get(r.id)?.phone
      toast.success(`${r.name} is interested`, { description: `About ${lotNames}.${phone ? ` Call them at ${phone}.` : ''}` })
    }
  }, [now, sends, lots])

  return (
    <section aria-labelledby="history-heading" className="grid gap-4">
      <div>
        <h2 id="history-heading" className="text-3xl font-bold">
          Send history
        </h2>
        <p className="mt-1 text-muted-foreground">Who got what, and who has opened it or asked about the cattle.</p>
      </div>

      {sends.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed p-10 text-center text-lg text-muted-foreground">
          Nothing sent yet. Sends show up here with each partner's replies.
        </p>
      ) : (
        <div className="relative overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[46rem] text-left">
            <caption className="sr-only">Sends to auction partners, newest first. Open a row to see each partner.</caption>
            <thead className="bg-muted">
              <tr className="[&_th]:px-4 [&_th]:py-2.5 [&_th]:font-semibold">
                <th scope="col">Sent</th>
                <th scope="col">Lots</th>
                <th scope="col">Format</th>
                <th scope="col">Replies</th>
                <th scope="col">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sends.map((s) => {
                const statuses = s.recipients.map((r) => statusAt(r, now))
                const count = (st: DeliveryStatus) => statuses.filter((x) => x === st).length
                const expanded = open === s.id
                const detailsId = `send-${s.id}`
                return (
                  <Fragment key={s.id}>
                    <tr className="border-t [&_td]:px-4 [&_td]:py-3">
                      <td className="whitespace-nowrap">
                        <time dateTime={s.createdAt}>{sentOn(s.createdAt)}</time>
                      </td>
                      <td>{s.lotIds.map((id) => `Lot ${lots.find((l) => l.id === id)?.number ?? '(removed)'}`).join(', ')}</td>
                      <td>{EXPORT_FORMAT_LABELS[s.format]}</td>
                      <td>
                        <span className="tabular-nums">
                          {s.recipients.length} delivered, {count('viewed') + count('interested')} opened,{' '}
                          <strong className={cn('font-semibold', count('interested') > 0 && 'text-success')}>{count('interested')} interested</strong>
                        </span>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpen(expanded ? null : s.id)}
                          aria-expanded={expanded}
                          aria-controls={detailsId}
                        >
                          {expanded ? 'Hide' : 'Partners'}
                          <ChevronDown className={cn('transition-transform', expanded && 'rotate-180')} aria-hidden />
                        </Button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr id={detailsId} className="bg-muted/40">
                        <td colSpan={5} className="px-4 py-3">
                          <ul className="grid gap-2 md:grid-cols-2">
                            {s.recipients.map((r, i) => {
                              const info = recipientById.get(r.id)
                              return (
                                <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-card px-3 py-2">
                                  <span className="min-w-0 flex-1">
                                    <span className="block font-semibold">{r.name}</span>
                                    {info && <span className="text-sm text-muted-foreground">{info.detail}</span>}
                                  </span>
                                  <StatusBadge status={statuses[i]} />
                                  {statuses[i] === 'interested' && info?.phone && (
                                    <Button asChild size="sm" variant="outline">
                                      <a href={`tel:+1${info.phone.replace(/\D/g, '')}`}>
                                        <Phone aria-hidden />
                                        Call
                                      </a>
                                    </Button>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
