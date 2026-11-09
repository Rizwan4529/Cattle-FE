import { type ComponentProps, type FormEvent, type ReactNode, useId, useState } from 'react'
import { ChevronLeft, CreditCard, LoaderCircle, Lock, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { FulfillmentChoice, OrderTotals } from '@/components/cart/OrderSummary'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ranch } from '@/config/ranch'
import { stateForZip, US_STATES } from '@/data/geo'
import type { Order } from '@/data/types'
import { cardBrand, depositPercent, expiryValid, formatCardNumber, formatExpiry, luhnValid, newOrderNumber, summarizeCart } from '@/lib/checkout'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/store/usePreferences'
import { useRanchStore } from '@/store/useRanchStore'

interface Form {
  name: string
  operation: string
  phone: string
  email: string
  street: string
  city: string
  state: string
  zip: string
  card: string
  expiry: string
  cvc: string
  cardName: string
  agree: boolean
}
type Field = keyof Form
type Errors = Partial<Record<Field, string>>

/** Field order on screen, so focus goes to the first problem. */
const ORDER: Field[] = ['name', 'phone', 'email', 'street', 'city', 'state', 'zip', 'card', 'expiry', 'cvc', 'cardName', 'agree']

function Section({ id, title, children, description }: { id: string; title: string; children: ReactNode; description?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div>
        <h2 id={id} className="text-2xl font-bold">
          {title}
        </h2>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export default function CheckoutPage() {
  usePageTitle('Checkout')
  const id = useId()
  const navigate = useNavigate()
  const cart = useRanchStore((s) => s.cart)
  const lots = useRanchStore((s) => s.lots)
  const animals = useRanchStore((s) => s.animals)
  const placeOrder = useRanchStore((s) => s.placeOrder)
  const fulfillment = usePreferences((s) => s.fulfillment)
  const setFulfillment = usePreferences((s) => s.setFulfillment)
  const destination = usePreferences((s) => s.freightDestination)
  const setDestination = usePreferences((s) => s.setFreightDestination)
  const summary = summarizeCart(cart, lots, animals, fulfillment, destination)

  const [form, setForm] = useState<Form>({
    name: '',
    operation: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: destination?.state ?? '',
    zip: destination?.zip ?? '',
    card: '',
    expiry: '',
    cvc: '',
    cardName: '',
    agree: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [processing, setProcessing] = useState(false)

  const set = <K extends Field>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const digits = form.card.replace(/\D/g, '')
  const brand = cardBrand(digits)
  const delivery = fulfillment === 'delivery'

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.name.trim()) e.name = 'Enter your name.'
    const phone = form.phone.replace(/\D/g, '')
    if (!(phone.length === 10 || (phone.length === 11 && phone.startsWith('1')))) e.phone = 'Enter a 10-digit phone number so the ranch can call you.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter your email for the receipt.'
    if (delivery) {
      if (!form.street.trim()) e.street = 'Enter the street address or road for delivery.'
      if (!form.city.trim()) e.city = 'Enter the town.'
      if (!form.state) e.state = 'Choose a state.'
      if (!/^\d{5}$/.test(form.zip)) e.zip = 'Enter a 5-digit ZIP code.'
      else if (form.state && stateForZip(form.zip)?.abbr !== form.state) e.zip = `That ZIP isn't in ${form.state}. Check the ZIP or the state.`
    }
    if (!luhnValid(digits)) e.card = 'Check the card number. For this demo, use 4242 4242 4242 4242.'
    if (!expiryValid(form.expiry)) e.expiry = 'Enter a future month and year, like 04 / 29.'
    if (!(brand === 'American Express' ? /^\d{4}$/ : /^\d{3}$/).test(form.cvc))
      e.cvc = `Enter the ${brand === 'American Express' ? '4' : '3'}-digit code.`
    if (!form.cardName.trim()) e.cardName = 'Enter the name on the card.'
    if (!form.agree) e.agree = 'Check the box to confirm you understand the deposit and balance.'
    return e
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (processing) return
    const found = validate()
    setErrors(found)
    const first = ORDER.find((f) => found[f])
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    setProcessing(true)
    // A short pause, as a real payment would take.
    setTimeout(() => {
      const number = newOrderNumber()
      const order: Order = {
        id: `order-${number.toLowerCase()}`,
        number,
        createdAt: new Date().toISOString(),
        buyer: {
          name: form.name.trim(),
          operation: form.operation.trim() || undefined,
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: delivery ? `${form.street.trim()}, ${form.city.trim()}, ${form.state} ${form.zip}` : '',
        },
        fulfillment,
        lotIds: summary.lines.map((l) => l.lot.id),
        subtotal: summary.subtotal,
        freight: summary.freight?.cost ?? 0,
        deposit: summary.deposit,
        balance: summary.balance,
      }
      placeOrder(order)
      toast.success(`Order ${number} placed`, { description: `${formatCurrency(order.deposit)} deposit (demo, nothing was charged).` })
      navigate(`/order/${order.id}`, { replace: true })
    }, 1400)
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p id={`${id}-${f}-error`} className="text-sm font-medium text-destructive">
        {errors[f]}
      </p>
    ) : null
  const input = (f: Field, label: string, props: ComponentProps<typeof Input> = {}, className?: string) => (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={`${id}-${f}`}>{label}</Label>
      <Input
        id={`${id}-${f}`}
        value={form[f] as string}
        onChange={(e) => set(f, e.target.value)}
        aria-invalid={Boolean(errors[f])}
        aria-describedby={errors[f] ? `${id}-${f}-error` : undefined}
        {...props}
      />
      {err(f)}
    </div>
  )

  if (summary.lines.length === 0) {
    return (
      <div className="container-page max-w-2xl py-16 text-center">
        <h1 className="text-4xl font-bold">Nothing to check out</h1>
        <p className="mt-3 text-lg text-muted-foreground">Your cart is empty, or the lots in it have sold.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/cattle">Browse cattle</Link>
          </Button>
          {cart.length > 0 && (
            <Button asChild size="lg" variant="outline">
              <Link to="/cart">Go to cart</Link>
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link to="/cart" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Back to cart
        </Link>
      </div>
      <div className="pt-4 pb-6">
        <h1 className="text-4xl font-bold sm:text-5xl">Checkout</h1>
      </div>

      <p role="note" className="mb-8 flex items-start gap-3 rounded-2xl border-2 border-dashed border-warning bg-warning/10 p-4 text-lg">
        <ShieldCheck className="mt-1 size-6 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
        <span>
          <strong className="font-semibold">Demo — no real payment.</strong> Nothing is charged and no card details leave this page. Use the test card{' '}
          <span className="font-semibold whitespace-nowrap tabular-nums">4242 4242 4242 4242</span> with any future date and any 3-digit code.
        </span>
      </p>

      <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid min-w-0 content-start gap-6">
          <Section id={`${id}-you`} title="1. Your details" description="The ranch calls you to confirm and set the loading day.">
            <div className="grid gap-5 sm:grid-cols-2">
              {input('name', 'Your name', { autoComplete: 'name' })}
              {input('operation', 'Ranch or operation (optional)', { autoComplete: 'organization' })}
              {input('phone', 'Phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
              {input('email', 'Email', { type: 'email', autoComplete: 'email' })}
            </div>
          </Section>

          <Section id={`${id}-how`} title="2. Pickup or delivery">
            <FulfillmentChoice value={fulfillment} onChange={setFulfillment} />
            {delivery ? (
              <div className="grid gap-5 sm:grid-cols-6">
                {input('street', 'Street address or road', { autoComplete: 'street-address' }, 'sm:col-span-6')}
                {input('city', 'Town', { autoComplete: 'address-level2' }, 'sm:col-span-3')}
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor={`${id}-state`}>State</Label>
                  <Select
                    value={form.state}
                    onValueChange={(v) => {
                      set('state', v)
                      if (!form.zip) setDestination({ state: v })
                    }}
                  >
                    <SelectTrigger
                      id={`${id}-state`}
                      className="w-full"
                      aria-invalid={Boolean(errors.state)}
                      aria-describedby={errors.state ? `${id}-state-error` : undefined}
                    >
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.abbr} value={s.abbr}>
                          {s.abbr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err('state')}
                </div>
                {input(
                  'zip',
                  'ZIP code',
                  {
                    inputMode: 'numeric',
                    autoComplete: 'postal-code',
                    onChange: (e) => {
                      const zip = e.target.value.replace(/\D/g, '').slice(0, 5)
                      set('zip', zip)
                      const st = zip.length === 5 ? stateForZip(zip) : undefined
                      // Keep the freight estimate in step with the delivery ZIP.
                      if (st) {
                        setDestination({ state: st.abbr, zip })
                        if (!form.state) set('state', st.abbr)
                      }
                    },
                  },
                  'sm:col-span-2',
                )}
              </div>
            ) : (
              <p className="rounded-lg bg-muted px-4 py-3">
                Pick up at {ranch.location.address}, {ranch.location.city}, {ranch.location.state}. Pickup windows:{' '}
                {summary.lines
                  .map((l) => `Lot ${l.lot.number}, ${formatShortDate(l.lot.pickupWindow.start)} to ${formatShortDate(l.lot.pickupWindow.end)}`)
                  .join('; ')}
                .
              </p>
            )}
          </Section>

          <Section
            id={`${id}-pay`}
            title={`3. Pay the ${depositPercent} deposit`}
            description={`${formatCurrency(summary.deposit)} today holds the cattle for you. The balance is paid when they load, after you've seen them.`}
          >
            <div className="grid gap-5 rounded-xl border bg-background p-4 sm:grid-cols-6 sm:p-5">
              <div className="grid gap-2 sm:col-span-6">
                <Label htmlFor={`${id}-card`}>Card number</Label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id={`${id}-card`}
                    value={form.card}
                    onChange={(e) => set('card', formatCardNumber(e.target.value))}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="pr-40 pl-10 tabular-nums"
                    aria-invalid={Boolean(errors.card)}
                    aria-describedby={[errors.card ? `${id}-card-error` : '', `${id}-card-brand`].filter(Boolean).join(' ')}
                  />
                  <span
                    id={`${id}-card-brand`}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                    aria-live="polite"
                  >
                    {brand ?? ''}
                  </span>
                </div>
                {err('card')}
              </div>
              {input(
                'expiry',
                'Expires (MM / YY)',
                { inputMode: 'numeric', autoComplete: 'cc-exp', onChange: (e) => set('expiry', formatExpiry(e.target.value)) },
                'sm:col-span-2',
              )}
              {input(
                'cvc',
                'Security code',
                { inputMode: 'numeric', autoComplete: 'cc-csc', onChange: (e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4)) },
                'sm:col-span-2',
              )}
              {input('cardName', 'Name on card', { autoComplete: 'cc-name' }, 'sm:col-span-2')}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-agree`} className="flex cursor-pointer items-start gap-3 font-normal">
                <Checkbox
                  id={`${id}-agree`}
                  checked={form.agree}
                  onCheckedChange={(v) => set('agree', v === true)}
                  className="mt-0.5"
                  aria-invalid={Boolean(errors.agree)}
                  aria-describedby={errors.agree ? `${id}-agree-error` : undefined}
                />
                <span>
                  I understand the {formatCurrency(summary.deposit)} deposit is paid now and the {formatCurrency(summary.balance)} balance is due at{' '}
                  {delivery ? 'delivery' : 'pickup'}. If the cattle aren't as described, the deposit is refunded in full.
                </span>
              </Label>
              {err('agree')}
            </div>
          </Section>
        </div>

        <aside
          aria-labelledby={`${id}-summary`}
          className="grid content-start gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-28 lg:self-start"
        >
          <h2 id={`${id}-summary`} className="text-2xl font-bold">
            Your order
          </h2>
          <ul className="grid gap-2">
            {summary.lines.map(({ lot, stats }) => (
              <li key={lot.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm text-muted-foreground">Lot {lot.number}</span>
                  <span className="font-semibold">{lot.title}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(stats.lotTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t pt-4">
            <OrderTotals summary={summary} fulfillment={fulfillment} />
          </div>
          <Button type="submit" size="lg" className="text-lg" disabled={processing}>
            {processing ? <LoaderCircle className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
            {processing ? 'Processing…' : `Pay ${formatCurrency(summary.deposit)} deposit`}
          </Button>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {processing ? 'Confirming your deposit. This is a demo; nothing is charged.' : 'Demo checkout. No card is charged.'}
          </p>
        </aside>
      </form>
    </div>
  )
}
