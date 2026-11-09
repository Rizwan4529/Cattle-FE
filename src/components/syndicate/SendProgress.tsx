import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CircleCheck, LoaderCircle, Package, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Recipient } from '@/lib/syndication'
import { cn } from '@/lib/utils'

const PACKAGE_MS = 1400
const PER_RECIPIENT_MS = 320

/**
 * The send, step by step: the file is packaged, each partner is ticked off
 * as it goes out, then everything is delivered. Calls `onDelivered` once, at
 * the end, so the history only shows finished sends.
 */
export function SendProgress({
  open,
  recipients,
  summary,
  onDelivered,
  onClose,
}: {
  open: boolean
  recipients: Recipient[]
  /** e.g. "2 lots, 11 head, as an auction-ready CSV" */
  summary: string
  onDelivered: () => void
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const [elapsed, setElapsed] = useState(0)
  const delivered = useRef(false)
  const sendMs = Math.min(4000, recipients.length * PER_RECIPIENT_MS)
  const total = PACKAGE_MS + sendMs + 300
  const done = elapsed >= total

  useEffect(() => {
    if (!open) return
    const start = performance.now()
    const timer = setInterval(() => {
      const t = (performance.now() - start) * (reduce ? 3 : 1)
      setElapsed(t)
      if (t >= total) {
        clearInterval(timer)
        if (!delivered.current) {
          delivered.current = true
          onDelivered()
        }
      }
    }, 50)
    return () => clearInterval(timer)
  }, [open, total, reduce, onDelivered])

  const packP = Math.min(1, elapsed / PACKAGE_MS)
  const sentCount = elapsed < PACKAGE_MS ? 0 : Math.min(recipients.length, Math.floor(((elapsed - PACKAGE_MS) / sendMs) * recipients.length) + 1)
  const steps = [
    { icon: Package, label: 'Packaging lot data', state: packP < 1 ? 'active' : 'done' },
    {
      icon: Send,
      label: `Sending to ${recipients.length} ${recipients.length === 1 ? 'partner' : 'partners'}`,
      state: packP < 1 ? 'waiting' : done ? 'done' : 'active',
    },
    { icon: CircleCheck, label: 'Delivered', state: done ? 'done' : 'waiting' },
  ] as const

  return (
    <Dialog open={open} onOpenChange={(o) => !o && done && onClose()}>
      <DialogContent
        className="p-6 sm:max-w-lg"
        showCloseButton={done}
        onEscapeKeyDown={(e) => !done && e.preventDefault()}
        onPointerDownOutside={(e) => !done && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{done ? 'Sent' : 'Sending your lots'}</DialogTitle>
          <DialogDescription className="text-base">{summary}</DialogDescription>
        </DialogHeader>

        <ol className="grid gap-3" aria-live="polite">
          {steps.map((s) => {
            const Icon = s.state === 'active' ? LoaderCircle : s.icon
            return (
              <li key={s.label} className={cn('flex items-center gap-3', s.state === 'waiting' && 'text-muted-foreground')}>
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-full border-2',
                    s.state === 'done' && 'border-success bg-success text-success-foreground',
                    s.state === 'active' && 'border-primary text-primary',
                  )}
                >
                  <Icon className={cn('size-5', s.state === 'active' && !reduce && 'animate-spin')} aria-hidden />
                </span>
                <span className={cn(s.state !== 'waiting' && 'font-semibold')}>{s.label}</span>
              </li>
            )
          })}
        </ol>

        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Send progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(1, elapsed / total) * 100)}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(1, elapsed / total) * 100}%` }} />
        </div>

        <ul className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border p-2">
          {recipients.map((r, i) => {
            const sent = i < sentCount
            return (
              <motion.li
                key={r.id}
                className="flex items-center gap-2 rounded px-2 py-1.5"
                animate={{ opacity: sent || done ? 1 : 0.45 }}
                transition={{ duration: 0.2 }}
              >
                {sent || done ? (
                  <CircleCheck className="size-4 shrink-0 text-success" aria-label="Delivered" />
                ) : (
                  <span className="size-4 shrink-0 rounded-full border-2" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground">{r.detail}</span>
              </motion.li>
            )
          })}
        </ul>

        <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
          <Button size="lg" onClick={onClose} disabled={!done}>
            {done ? 'Done' : 'Sending…'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
