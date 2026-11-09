import { type FormEvent, type ReactNode, useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ranch } from '@/config/ranch'
import type { Lot } from '@/data/types'
import { formatCurrency, formatCwt, pricePerCwt } from '@/lib/format'
import { priceUnit } from '@/lib/labels'
import type { LotStats } from '@/lib/lots'
import { useRanchStore } from '@/store/useRanchStore'

interface FormState {
  name: string
  operation: string
  phone: string
  email: string
  price: string
  head: string
  message: string
}

type Errors = Partial<Record<keyof FormState, string>>

/** Fields that show a hint line under the input */
const HINTED = new Set<keyof FormState>(['price', 'head', 'message'])

/** Checked in the order the fields appear, so focus lands on the first problem. */
function validate(form: FormState, lot: Lot, stats: LotStats): Errors {
  const errors: Errors = {}
  const price = Number(form.price)
  if (!form.price || !Number.isFinite(price) || price <= 0) errors.price = `Enter your offer in dollars per ${priceUnit(lot.class)}.`
  if (lot.allowPartial) {
    const head = Number(form.head)
    const min = lot.minHead ?? 1
    if (!Number.isInteger(head) || head < min || head > stats.headCount) {
      errors.head = `Choose between ${min} and ${stats.headCount} head.`
    }
  }
  if (!form.name.trim()) errors.name = 'Enter your name.'
  const digits = form.phone.replace(/\D/g, '')
  if (!(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))) {
    errors.phone = 'Enter a 10-digit phone number so the ranch can call you back.'
  }
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Check the email address, or leave it blank.'
  return errors
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** Offer form for one lot. Saves to the store as a pending offer. */
export function MakeOfferDialog({
  lot,
  stats,
  open,
  onOpenChange,
}: {
  lot: Lot
  stats: LotStats
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const submitOffer = useRanchStore((s) => s.submitOffer)
  const id = useId()
  const unit = priceUnit(lot.class)
  const [form, setForm] = useState<FormState>({
    name: '',
    operation: '',
    phone: '',
    email: '',
    price: '',
    head: String(stats.headCount),
    message: '',
  })
  const [errors, setErrors] = useState<Errors>({})

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const price = Number(form.price) || 0
  const head = lot.allowPartial ? Number(form.head) || 0 : stats.headCount
  const percentOfAsking = price ? Math.round((price / lot.pricePerHead) * 100) : null

  const fieldProps = (key: keyof FormState) => ({
    id: `${id}-${key}`,
    value: form[key],
    onChange: set(key),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${id}-${key}-error` : HINTED.has(key) ? `${id}-${key}-hint` : undefined,
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const found = validate(form, lot, stats)
    setErrors(found)
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0]
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    submitOffer({
      lotId: lot.id,
      buyerName: form.name.trim(),
      operation: form.operation.trim() || undefined,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      pricePerHead: price,
      headCount: head,
      message: form.message.trim() || undefined,
    })
    toast.success('Offer sent', {
      description: `Lot ${lot.number}: ${head} ${lot.class === 'pairs' ? 'pairs' : 'head'} at ${formatCurrency(price)}/${unit}. ${ranch.owner} will call you within a day.`,
    })
    setForm((f) => ({ ...f, price: '', message: '' }))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Make an offer on Lot {lot.number}</DialogTitle>
          <DialogDescription className="text-base">
            {lot.title}. Asking {formatCurrency(lot.pricePerHead)}/{unit}. The ranch reviews every offer and calls you back.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id={`${id}-price`}
              label={`Your offer ($/${unit})`}
              error={errors.price}
              hint={
                percentOfAsking
                  ? `${percentOfAsking}% of asking${unit === 'head' && stats.avgWeight ? `, about ${formatCwt(pricePerCwt(price, stats.avgWeight))}` : ''}`
                  : `Asking ${formatCurrency(lot.pricePerHead)}`
              }
            >
              <Input {...fieldProps('price')} type="number" inputMode="decimal" min={1} step={5} />
            </Field>

            {lot.allowPartial ? (
              <Field id={`${id}-head`} label="Number of head" error={errors.head} hint={`${lot.minHead ?? 1} to ${stats.headCount} head`}>
                <Input {...fieldProps('head')} type="number" inputMode="numeric" min={lot.minHead ?? 1} max={stats.headCount} />
              </Field>
            ) : (
              <div className="grid content-start gap-2">
                <span className="text-base font-medium">Number of {lot.class === 'pairs' ? 'pairs' : 'head'}</span>
                <p className="flex h-11 items-center rounded-lg bg-muted px-3 font-semibold">{stats.headCount}, whole lot only</p>
              </div>
            )}
          </div>

          {price > 0 && head > 0 && (
            <p className="rounded-lg bg-secondary px-4 py-3 text-secondary-foreground" aria-live="polite">
              Offer total: <strong className="font-heading text-xl">{formatCurrency(price * head)}</strong> for {head}{' '}
              {lot.class === 'pairs' ? 'pairs' : 'head'}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={`${id}-name`} label="Your name" error={errors.name}>
              <Input {...fieldProps('name')} autoComplete="name" />
            </Field>
            <Field id={`${id}-operation`} label="Ranch or operation (optional)">
              <Input {...fieldProps('operation')} autoComplete="organization" />
            </Field>
            <Field id={`${id}-phone`} label="Phone" error={errors.phone}>
              <Input {...fieldProps('phone')} type="tel" autoComplete="tel" inputMode="tel" />
            </Field>
            <Field id={`${id}-email`} label="Email (optional)" error={errors.email}>
              <Input {...fieldProps('email')} type="email" autoComplete="email" />
            </Field>
          </div>

          <Field id={`${id}-message`} label="Message (optional)" hint="Pickup timing, questions about the cattle, anything else.">
            <Textarea {...fieldProps('message')} rows={3} />
          </Field>

          <DialogFooter className="-mx-6 -mb-6 gap-2 px-6 py-4">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="lg">
              Send offer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
