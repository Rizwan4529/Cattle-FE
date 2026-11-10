import { type FormEvent, type ReactNode, useId, useState } from 'react'
import { Briefcase, Check, CreditCard, Gift } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { BundleCard } from '@/components/shop/BundleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ranch } from '@/config/ranch'
import { BUNDLES, GIFT_CARD_AMOUNTS, GIFT_CARD_LIMITS } from '@/data/shop'
import { formatCurrency } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const EMAIL = /^\S+@\S+\.\S+$/
const todayIso = () => new Date().toISOString().slice(0, 10)

function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

const aria = (id: string, error?: string) => ({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined })

function GiftCardForm() {
  const id = useId()
  const navigate = useNavigate()
  const addGiftCardToCart = useRanchStore((s) => s.addGiftCardToCart)
  const [today] = useState(todayIso)
  const [amount, setAmount] = useState(100)
  const [custom, setCustom] = useState('')
  const [form, setForm] = useState({ recipientName: '', recipientEmail: '', fromName: '', message: '', sendOn: today })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const value = custom ? Number(custom) : amount

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!(value >= GIFT_CARD_LIMITS.min && value <= GIFT_CARD_LIMITS.max))
      found.amount = `Choose an amount from ${formatCurrency(GIFT_CARD_LIMITS.min)} to ${formatCurrency(GIFT_CARD_LIMITS.max)}.`
    if (!form.recipientName.trim()) found.recipientName = 'Who is it for?'
    if (!EMAIL.test(form.recipientEmail.trim())) found.recipientEmail = 'Enter their email so we can send it.'
    if (!form.fromName.trim()) found.fromName = 'Enter your name so they know who it’s from.'
    if (!form.sendOn || form.sendOn < today) found.sendOn = 'Pick today or a later date.'
    setErrors(found)
    const first = ['amount', 'recipientName', 'recipientEmail', 'fromName', 'sendOn'].find((f) => found[f])
    if (first) return document.getElementById(`${id}-${first}`)?.focus()
    addGiftCardToCart({
      amount: value,
      ...form,
      recipientName: form.recipientName.trim(),
      recipientEmail: form.recipientEmail.trim(),
      fromName: form.fromName.trim(),
    })
    toast.success(`${formatCurrency(value)} gift card added to your cart`, {
      description: `For ${form.recipientName.trim()}, emailed ${form.sendOn === today ? 'today' : `on ${form.sendOn}`}.`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
    setForm({ recipientName: '', recipientEmail: '', fromName: form.fromName, message: '', sendOn: today })
    setCustom('')
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-semibold">Amount</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Gift card amounts">
          {GIFT_CARD_AMOUNTS.map((a) => (
            <Button
              key={a}
              type="button"
              variant={!custom && amount === a ? 'default' : 'outline'}
              aria-pressed={!custom && amount === a}
              onClick={() => {
                setAmount(a)
                setCustom('')
                setErrors((e) => ({ ...e, amount: '' }))
              }}
            >
              {formatCurrency(a)}
            </Button>
          ))}
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              {...aria(`${id}-amount`, errors.amount)}
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value.replace(/\D/g, '').slice(0, 4))
                setErrors((x) => ({ ...x, amount: '' }))
              }}
              placeholder="Other"
              aria-label="Other amount, in dollars"
              inputMode="numeric"
              className="w-28 pl-7"
            />
          </div>
        </div>
        {errors.amount && (
          <p id={`${id}-amount-error`} className="text-sm font-medium text-destructive">
            {errors.amount}
          </p>
        )}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${id}-recipientName`} label="Their name" error={errors.recipientName}>
          <Input
            {...aria(`${id}-recipientName`, errors.recipientName)}
            value={form.recipientName}
            onChange={(e) => set('recipientName', e.target.value)}
          />
        </Field>
        <Field id={`${id}-recipientEmail`} label="Their email" error={errors.recipientEmail}>
          <Input
            {...aria(`${id}-recipientEmail`, errors.recipientEmail)}
            type="email"
            value={form.recipientEmail}
            onChange={(e) => set('recipientEmail', e.target.value)}
          />
        </Field>
        <Field id={`${id}-fromName`} label="From" error={errors.fromName}>
          <Input
            {...aria(`${id}-fromName`, errors.fromName)}
            value={form.fromName}
            onChange={(e) => set('fromName', e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field id={`${id}-sendOn`} label="Send it on" error={errors.sendOn} hint="Pick a birthday or holiday; it arrives that morning.">
          <Input
            {...aria(`${id}-sendOn`, errors.sendOn)}
            type="date"
            min={today}
            value={form.sendOn}
            onChange={(e) => set('sendOn', e.target.value)}
          />
        </Field>
        <Field id={`${id}-message`} label="Message (optional)" className="sm:col-span-2" hint={`${200 - form.message.length} characters left`}>
          <Textarea id={`${id}-message`} value={form.message} maxLength={200} rows={3} onChange={(e) => set('message', e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground">Good for anything on the site: shares, cuts, boxes, and the Ranch Box. Never expires.</p>
        <Button type="submit" size="lg">
          <CreditCard aria-hidden />
          Add {value >= GIFT_CARD_LIMITS.min ? formatCurrency(value) : ''} gift card
        </Button>
      </div>
    </form>
  )
}

function CorporateForm() {
  const id = useId()
  const submitGiftInquiry = useRanchStore((s) => s.submitGiftInquiry)
  const blank = { company: '', contact: '', email: '', phone: '', quantity: '25', budget: '$75–$150', neededBy: '', message: '' }
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<string | null>(null)

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!form.company.trim()) found.company = 'Enter your company or group.'
    if (!form.contact.trim()) found.contact = 'Enter your name.'
    if (!EMAIL.test(form.email.trim())) found.email = 'Enter an email we can reply to.'
    if (!(Number(form.quantity) >= 5)) found.quantity = 'Corporate orders start at 5 gifts.'
    setErrors(found)
    const first = ['company', 'contact', 'email', 'quantity'].find((f) => found[f])
    if (first) return document.getElementById(`${id}-${first}`)?.focus()
    submitGiftInquiry({ ...form, quantity: Number(form.quantity) })
    setSent(form.contact.split(' ')[0])
    toast.success('Request sent', { description: `${ranch.owner} will email a quote within one business day.` })
    setForm(blank)
  }

  if (sent) {
    return (
      <div role="status" className="grid justify-items-start gap-3 rounded-2xl border bg-card p-6">
        <Check className="size-8 text-success" aria-hidden />
        <p className="text-xl font-semibold">Thanks, {sent}. Your request is in.</p>
        <p className="text-muted-foreground">
          {ranch.owner} will email a quote with box options and delivery dates within one business day. Need it sooner? Call {ranch.phone}.
        </p>
        <Button variant="outline" onClick={() => setSent(null)}>
          Send another request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
      <Field id={`${id}-company`} label="Company or group" error={errors.company}>
        <Input
          {...aria(`${id}-company`, errors.company)}
          value={form.company}
          onChange={(e) => set('company', e.target.value)}
          autoComplete="organization"
        />
      </Field>
      <Field id={`${id}-contact`} label="Your name" error={errors.contact}>
        <Input {...aria(`${id}-contact`, errors.contact)} value={form.contact} onChange={(e) => set('contact', e.target.value)} autoComplete="name" />
      </Field>
      <Field id={`${id}-email`} label="Email" error={errors.email}>
        <Input
          {...aria(`${id}-email`, errors.email)}
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          autoComplete="email"
        />
      </Field>
      <Field id={`${id}-phone`} label="Phone (optional)">
        <Input id={`${id}-phone`} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
      </Field>
      <Field id={`${id}-quantity`} label="How many gifts?" error={errors.quantity}>
        <Input
          {...aria(`${id}-quantity`, errors.quantity)}
          inputMode="numeric"
          value={form.quantity}
          onChange={(e) => set('quantity', e.target.value.replace(/\D/g, '').slice(0, 5))}
        />
      </Field>
      <Field id={`${id}-budget`} label="Budget per gift">
        <Input id={`${id}-budget`} value={form.budget} onChange={(e) => set('budget', e.target.value)} />
      </Field>
      <Field id={`${id}-neededBy`} label="Needed by (optional)">
        <Input id={`${id}-neededBy`} type="date" value={form.neededBy} onChange={(e) => set('neededBy', e.target.value)} />
      </Field>
      <Field
        id={`${id}-message`}
        label="Anything else? (optional)"
        className="sm:col-span-2"
        hint="Logo cards, ship to many addresses, a mix of boxes…"
      >
        <Textarea id={`${id}-message`} rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg">
          <Briefcase aria-hidden />
          Request a quote
        </Button>
      </div>
    </form>
  )
}

export default function GiftsPage() {
  usePageTitle('Gifts')
  const products = useRanchStore((s) => s.products)
  const gifts = BUNDLES.filter((b) => b.gift)

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Gifts"
        description="Beef they can trace to the animal it came from. Gift boxes ship frozen with a card; gift cards go by email on the day you choose."
      />

      <section aria-labelledby="gift-boxes" className="grid gap-5">
        <h2 id="gift-boxes" className="flex items-center gap-2 text-3xl font-bold">
          <Gift className="size-7 text-primary" aria-hidden />
          Gift boxes
        </h2>
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {gifts.map((b) => (
            <li key={b.id} className="grid">
              <BundleCard bundle={b} products={products} />
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">Add a gift message at checkout. We never put prices in the box.</p>
      </section>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="gift-cards" className="grid content-start gap-4">
          <h2 id="gift-cards" className="flex items-center gap-2 text-3xl font-bold">
            <CreditCard className="size-7 text-primary" aria-hidden />
            Gift cards
          </h2>
          <GiftCardForm />
        </section>
        <section aria-labelledby="corporate" className="grid content-start gap-4">
          <div>
            <h2 id="corporate" className="flex items-center gap-2 text-3xl font-bold">
              <Briefcase className="size-7 text-primary" aria-hidden />
              Corporate & bulk gifts
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">
              Thank clients, crews, or customers with beef from a ranch they can look up. Tell us what you need and we’ll put together a quote.
            </p>
          </div>
          <CorporateForm />
        </section>
      </div>
    </div>
  )
}
