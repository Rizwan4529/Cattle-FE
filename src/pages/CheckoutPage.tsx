import { type ComponentProps, type FormEvent, type ReactNode, useId, useState } from 'react'
import { ChevronLeft, CreditCard, Gift, LoaderCircle, Lock, ShieldCheck, Tag, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BeefDeliveryChoice, ShareHandoffChoice, ZipChecker } from '@/components/beef/BeefDelivery'
import { FarmDeliveryChoice } from '@/components/soilfuel/FarmDelivery'
import { bulkTripCost } from '@/lib/soilFuel'
import { ShareTotals } from '@/components/beef/ShareCart'
import { FulfillmentChoice, OrderTotals } from '@/components/cart/OrderSummary'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ranch } from '@/config/ranch'
import type { GiftCard, ShareClaim, Subscription } from '@/data/beefTypes'
import { stateForZip, US_STATES } from '@/data/geo'
import type { Order } from '@/data/types'
import { cardBrand, depositPercent, expiryValid, formatCardNumber, formatExpiry, luhnValid, newOrderNumber } from '@/lib/checkout'
import { zoneForZip } from '@/lib/delivery'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { toOrderItems } from '@/lib/shop'
import { useCheckoutSummary } from '@/lib/useCheckoutSummary'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { segmentsFor, SHARE_LABELS } from '@/lib/yield'
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
  isGift: boolean
  giftTo: string
  giftMessage: string
  card: string
  expiry: string
  cvc: string
  cardName: string
  agree: boolean
}
type Field = keyof Form | 'slot'
type Errors = Partial<Record<Field, string>>

/** Field order on screen, so focus goes to the first problem. */
const ORDER: Field[] = ['name', 'phone', 'email', 'slot', 'street', 'city', 'state', 'zip', 'giftTo', 'card', 'expiry', 'cvc', 'cardName', 'agree']

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

const randomCode = () =>
  `CRW-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '7')}`

export default function CheckoutPage() {
  usePageTitle('Checkout')
  const id = useId()
  const navigate = useNavigate()
  const cart = useRanchStore((s) => s.cart)
  const placeOrder = useRanchStore((s) => s.placeOrder)
  const account = useRanchStore((s) => s.account)
  const addresses = useRanchStore((s) => s.addresses)
  const fulfillment = usePreferences((s) => s.fulfillment)
  const setFulfillment = usePreferences((s) => s.setFulfillment)
  const destination = usePreferences((s) => s.freightDestination)
  const setDestination = usePreferences((s) => s.setFreightDestination)
  const setBeefZip = usePreferences((s) => s.setBeefZip)
  const beefZip = usePreferences((s) => s.beefZip)
  const pickupSlot = usePreferences((s) => s.pickupSlot)
  const shareHandoff = usePreferences((s) => s.shareHandoff)

  const [codeInput, setCodeInput] = useState('')
  const [code, setCode] = useState('')
  const t = useCheckoutSummary(code)
  const { cattle, shares, shop, hasLots, hasShares, hasShop, hasShopBeef } = t
  const hasGoods = shop.lines.some((l) => ['goods', 'soil', 'fuel'].includes(l.item.kind))
  const { hasFarm, farmDelivery } = t
  const paysToday = hasShares || hasShop

  const home = addresses.find((a) => a.isDefault)
  const [form, setForm] = useState<Form>(() => ({
    name: account?.name ?? '',
    operation: '',
    phone: account?.phone ?? '',
    email: account?.email ?? '',
    street: home?.street ?? '',
    city: home?.city ?? '',
    state: home?.state ?? destination?.state ?? '',
    zip: home?.zip ?? (beefZip || destination?.zip || ''),
    isGift: false,
    giftTo: '',
    giftMessage: '',
    card: '',
    expiry: '',
    cvc: '',
    cardName: '',
    agree: false,
  }))
  const [errors, setErrors] = useState<Errors>({})
  const [processing, setProcessing] = useState(false)

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const digits = form.card.replace(/\D/g, '')
  const brand = cardBrand(digits)
  const cattleDelivery = hasLots && fulfillment === 'delivery'
  const beefDelivered = hasShopBeef && t.delivery.method !== 'pickup'
  const shareDelivered = hasShares && shareHandoff === 'local' && Boolean(t.zone)
  const farmTruck = hasFarm && farmDelivery.method === 'truck'
  const needsAddress = cattleDelivery || beefDelivered || shareDelivered || farmTruck

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.name.trim()) e.name = 'Enter your name.'
    const phone = form.phone.replace(/\D/g, '')
    if (!(phone.length === 10 || (phone.length === 11 && phone.startsWith('1')))) e.phone = 'Enter a 10-digit phone number so the ranch can call you.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter your email for the receipt.'
    if (hasShopBeef && t.delivery.method === 'pickup' && !pickupSlot?.slot) e.slot = 'Choose a pickup day and time.'
    if (needsAddress) {
      if (!form.street.trim()) e.street = 'Enter the street address or road for delivery.'
      if (!form.city.trim()) e.city = 'Enter the town.'
      if (!form.state) e.state = 'Choose a state.'
      if (!/^\d{5}$/.test(form.zip)) e.zip = 'Enter a 5-digit ZIP code.'
      else if (form.state && stateForZip(form.zip)?.abbr !== form.state) e.zip = `That ZIP isn't in ${form.state}. Check the ZIP or the state.`
      else if (hasShopBeef && t.delivery.method === 'local' && !zoneForZip(form.zip))
        e.zip = 'Local delivery doesn’t reach this ZIP. Choose shipping or pickup.'
      else if (farmTruck && bulkTripCost(form.zip) === null) e.zip = 'The ranch truck doesn’t reach this ZIP. Choose pickup for Soil & Fuel.'
    }
    if (form.isGift && !form.giftTo.trim()) e.giftTo = 'Who is the gift for?'
    // No card needed when a gift card covers everything due today.
    if (t.payToday > 0) {
      if (!luhnValid(digits)) e.card = 'Check the card number. For this demo, use 4242 4242 4242 4242.'
      if (!expiryValid(form.expiry)) e.expiry = 'Enter a future month and year, like 04 / 29.'
      if (!(brand === 'American Express' ? /^\d{4}$/ : /^\d{3}$/).test(form.cvc))
        e.cvc = `Enter the ${brand === 'American Express' ? '4' : '3'}-digit code.`
      if (!form.cardName.trim()) e.cardName = 'Enter the name on the card.'
    }
    if (!form.agree) e.agree = 'Check the box to confirm what’s paid today and what’s due later.'
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
      const createdAt = new Date().toISOString()
      const order: Order = {
        id: `order-${number.toLowerCase()}`,
        number,
        createdAt,
        buyer: {
          name: form.name.trim(),
          operation: form.operation.trim() || undefined,
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: needsAddress ? `${form.street.trim()}, ${form.city.trim()}, ${form.state} ${form.zip}` : '',
        },
        fulfillment: hasLots ? fulfillment : 'pickup',
        lotIds: cattle.lines.map((l) => l.lot.id),
        subtotal: cattle.subtotal,
        freight: cattle.freight?.cost ?? 0,
        deposit: t.payToday,
        balance: t.dueLater,
        shares: shares.lines.map((l) => ({
          claimId: l.item.id,
          poolId: l.pool.id,
          tagId: l.animal.tagId,
          size: l.item.size,
          deposit: l.quote.deposit,
          estimatedTotal: l.quote.total,
          estimatedBalance: l.quote.balance,
        })),
        items: hasShop ? toOrderItems(shop.lines) : undefined,
        beefDelivery: hasShopBeef
          ? { method: t.delivery.method, cost: t.deliveryCost, pickup: t.delivery.method === 'pickup' && pickupSlot ? pickupSlot : undefined }
          : undefined,
        shareHandoff: hasShares ? (shareDelivered ? 'local' : 'pickup') : undefined,
        farmDelivery: hasFarm ? { method: farmDelivery.method, cost: farmDelivery.cost, miles: farmDelivery.miles } : undefined,
        discount:
          t.promo?.ok && (t.promoDiscount || t.giftCardAmount || t.promo.freeShipping)
            ? { code: t.promo.code, amount: t.promo.kind === 'gift-card' ? t.giftCardAmount : t.promoDiscount, kind: t.promo.kind }
            : undefined,
        gift: form.isGift ? { to: form.giftTo.trim(), message: form.giftMessage.trim() } : undefined,
      }
      const subscriptions: Subscription[] = shop.lines.flatMap(({ item }) =>
        item.kind === 'subscription'
          ? [
              {
                id: item.id,
                orderId: order.id,
                size: item.size,
                frequency: item.frequency,
                feedPreference: item.feedPreference,
                box: item.box,
                status: 'active' as const,
                nextShip: item.firstShip,
                skipped: [],
                createdAt,
              },
            ]
          : [],
      )
      const giftCards: GiftCard[] = shop.lines.flatMap(({ item }) =>
        item.kind === 'gift-card'
          ? [
              {
                id: item.id,
                code: randomCode(),
                amount: item.amount,
                balance: item.amount,
                fromName: item.fromName,
                recipientName: item.recipientName,
                recipientEmail: item.recipientEmail,
                message: item.message,
                sendOn: item.sendOn,
                createdAt,
                orderId: order.id,
              },
            ]
          : [],
      )
      const claims = shares.lines.map((l) => {
        const claim: ShareClaim = {
          id: l.item.id,
          size: l.item.size,
          segments: segmentsFor(l.item.size, l.pool.unit),
          firstName: l.item.firstName,
          city: l.item.city,
          state: l.item.state,
          claimedAt: createdAt,
          ifUnfilled: l.item.ifUnfilled,
          byproductRightsAcceptedAt: l.item.byproductRightsAcceptedAt,
          deposit: l.quote.deposit,
          fromThisDevice: true,
          orderId: order.id,
        }
        return { poolId: l.pool.id, claim }
      })
      placeOrder(order, { claims, subscriptions, giftCards, paidLineIds: shop.lines.map((l) => l.item.id) })
      toast.success(`Order ${number} placed`, { description: `${formatCurrency(order.deposit, true)} paid today (demo, nothing was charged).` })
      navigate(`/order/${order.id}`, { replace: true })
    }, 1400)
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p id={`${id}-${f}-error`} className="text-sm font-medium text-destructive">
        {errors[f]}
      </p>
    ) : null
  const input = (f: keyof Form, label: string, props: ComponentProps<typeof Input> = {}, className?: string) => (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={`${id}-${f}`}>{label}</Label>
      <Input
        id={`${id}-${f}`}
        value={form[f] as string}
        onChange={(e) => set(f, e.target.value as never)}
        aria-invalid={Boolean(errors[f])}
        aria-describedby={errors[f] ? `${id}-${f}-error` : undefined}
        {...props}
      />
      {err(f)}
    </div>
  )

  if (shop.problems.length > 0) {
    return (
      <div className="container-page max-w-2xl py-16 text-center">
        <h1 className="text-4xl font-bold">A few things in your cart are running low</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {shop.problems.map((l) => `${l.title}: ${l.problem?.toLowerCase()}`).join('. ')}. Adjust your cart, then check out.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/cart">Go to cart</Link>
        </Button>
      </div>
    )
  }

  if (!hasLots && !hasShares && !hasShop) {
    return (
      <div className="container-page max-w-2xl py-16 text-center">
        <h1 className="text-4xl font-bold">Nothing to check out</h1>
        <p className="mt-3 text-lg text-muted-foreground">Your cart is empty, or what was in it has sold.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/beef">Claim your beef</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/shop">Butcher Shop</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
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

  let step = 0
  const next = () => ++step

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
          <Section
            id={`${id}-you`}
            title={`${next()}. Your details`}
            description={
              hasLots ? 'The ranch calls you to confirm and set the loading day.' : 'For your receipt and updates as your beef moves along.'
            }
          >
            {!account && (
              <p className="text-sm text-muted-foreground">
                Have an account?{' '}
                <Link to="/account/sign-in?next=/checkout" className="font-medium text-primary underline underline-offset-4">
                  Sign in
                </Link>{' '}
                to fill this in.
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              {input('name', 'Your name', { autoComplete: 'name' })}
              {hasLots && input('operation', 'Ranch or operation (optional)', { autoComplete: 'organization' })}
              {input('phone', 'Phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
              {input('email', 'Email', { type: 'email', autoComplete: 'email' })}
            </div>
          </Section>

          {(hasShopBeef || hasShares || hasFarm) && (
            <Section id={`${id}-beef`} title={`${next()}. ${hasShopBeef || hasShares ? 'Getting your order' : 'Getting your Soil & Fuel'}`}>
              <ZipChecker summary={t} />
              {hasShopBeef && (
                <div className="grid gap-3" id={`${id}-slot`} tabIndex={-1}>
                  <h3 className="text-lg font-bold">{hasGoods ? 'Shop order' : 'Butcher Shop order'}</h3>
                  <BeefDeliveryChoice summary={t} />
                  {err('slot')}
                </div>
              )}
              {hasFarm && (
                <div className="grid gap-3">
                  <h3 className="text-lg font-bold">Soil & Fuel</h3>
                  <FarmDeliveryChoice summary={t} />
                </div>
              )}
              {hasShares && (
                <div className="grid gap-3">
                  <h3 className="text-lg font-bold">{shares.lines.length > 1 ? 'Your shares' : 'Your share'}, once it’s cut and wrapped</h3>
                  <ShareHandoffChoice summary={t} />
                </div>
              )}
            </Section>
          )}

          {hasLots && (
            <Section id={`${id}-how`} title={`${next()}. ${hasShares || hasShopBeef ? 'Cattle pickup or delivery' : 'Pickup or delivery'}`}>
              <FulfillmentChoice value={fulfillment} onChange={setFulfillment} />
              {!cattleDelivery && (
                <p className="rounded-lg bg-muted px-4 py-3">
                  Pick up at {ranch.location.address}, {ranch.location.city}, {ranch.location.state}. Pickup windows:{' '}
                  {cattle.lines
                    .map((l) => `Lot ${l.lot.number}, ${formatShortDate(l.lot.pickupWindow.start)} to ${formatShortDate(l.lot.pickupWindow.end)}`)
                    .join('; ')}
                  .
                </p>
              )}
            </Section>
          )}

          {needsAddress && (
            <Section id={`${id}-address`} title={`${next()}. Delivery address`}>
              <div className="grid gap-5 sm:grid-cols-6">
                {input('street', 'Street address or road', { autoComplete: 'street-address' }, 'sm:col-span-6')}
                {input('city', 'Town', { autoComplete: 'address-level2' }, 'sm:col-span-3')}
                <div className="grid content-start gap-2 sm:col-span-1">
                  <Label htmlFor={`${id}-state`}>State</Label>
                  <Select value={form.state} onValueChange={(v) => set('state', v)}>
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
                      // Keep freight and beef delivery prices in step with the delivery ZIP.
                      if (st) {
                        setDestination({ state: st.abbr, zip })
                        setBeefZip(zip)
                        if (!form.state) set('state', st.abbr)
                      }
                    },
                  },
                  'sm:col-span-2',
                )}
              </div>
              {addresses.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Saved:</span>
                  {addresses.map((a) => (
                    <Button
                      key={a.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm((f) => ({ ...f, street: a.street, city: a.city, state: a.state, zip: a.zip }))
                        setBeefZip(a.zip)
                      }}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
            </Section>
          )}

          {hasShopBeef && (
            <Section id={`${id}-gift`} title={`${next()}. Is it a gift?`}>
              <Label htmlFor={`${id}-isGift`} className="flex cursor-pointer items-start gap-3 font-normal">
                <Checkbox id={`${id}-isGift`} checked={form.isGift} onCheckedChange={(v) => set('isGift', v === true)} className="mt-0.5" />
                <span>
                  <span className="block font-semibold">Yes, pack it as a gift</span>
                  <span className="text-sm text-muted-foreground">We add a printed card with your message and leave the prices out of the box.</span>
                </span>
              </Label>
              {form.isGift && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {input('giftTo', 'Gift for')}
                  <div className="grid content-start gap-2 sm:col-span-2">
                    <Label htmlFor={`${id}-giftMessage`}>Message on the card</Label>
                    <Textarea
                      id={`${id}-giftMessage`}
                      value={form.giftMessage}
                      maxLength={240}
                      rows={3}
                      onChange={(e) => set('giftMessage', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">{240 - form.giftMessage.length} characters left</p>
                  </div>
                </div>
              )}
            </Section>
          )}

          <Section
            id={`${id}-pay`}
            title={
              hasLots && !paysToday ? `${next()}. Pay the ${depositPercent} deposit` : `${next()}. Pay ${formatCurrency(t.payToday, true)} today`
            }
            description={
              paysToday
                ? [
                    hasShares && 'Share deposits lock in your price per pound.',
                    hasShop && 'Shop items are paid in full.',
                    hasLots && `The cattle need a ${depositPercent} deposit.`,
                    t.dueLater > 0 && `About ${formatCurrency(t.dueLater, true)} is due later.`,
                  ]
                    .filter(Boolean)
                    .join(' ')
                : `${formatCurrency(cattle.deposit)} today holds the cattle for you. The balance is paid when they load, after you've seen them.`
            }
          >
            {t.payToday > 0 ? (
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
            ) : (
              <p className="rounded-lg bg-success/12 px-4 py-3 font-medium">Your gift card covers everything due today, so no card is needed.</p>
            )}

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
                  I understand {formatCurrency(t.payToday, true)} is paid now
                  {t.dueLater > 0 ? <> and about {formatCurrency(t.dueLater, true)} is due later</> : null}
                  {hasShares && ', with beef balances figured on the actual hanging weight'}.{' '}
                  {hasLots && "If the cattle aren't as described, the deposit is refunded in full. "}
                  {hasShares && 'If an animal isn’t fully claimed by its deadline, my share rolls over or is refunded, as I chose.'}
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
            {shares.lines.map(({ item, animal, quote }) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm text-muted-foreground">{SHARE_LABELS[item.size]} share, deposit</span>
                  <span className="font-semibold">{animal.tagId}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(quote.deposit, true)}</span>
              </li>
            ))}
            {shop.lines.map((l) => (
              <li key={l.item.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  {l.qty > 1 && <span className="block text-sm text-muted-foreground">{l.qty} ×</span>}
                  <span className="font-semibold">{l.title}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(l.total, true)}</span>
              </li>
            ))}
            {cattle.lines.map(({ lot, stats }) => (
              <li key={lot.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm text-muted-foreground">Lot {lot.number}</span>
                  <span className="font-semibold">{lot.title}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(stats.lotTotal)}</span>
              </li>
            ))}
          </ul>

          {hasShares && (
            <div className="border-t pt-4">
              <ShareTotals summary={shares} />
            </div>
          )}
          {hasShop && (
            <dl className="grid gap-2 border-t pt-4 tabular-nums">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{hasGoods ? 'Shop items' : 'Butcher Shop and gifts'}</dt>
                <dd className="font-semibold">{formatCurrency(shop.subtotal, true)}</dd>
              </div>
              {hasShopBeef && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">{t.delivery.label}</dt>
                  <dd className="font-semibold">{t.deliveryCost ? formatCurrency(t.deliveryCost, true) : 'Free'}</dd>
                </div>
              )}
              {hasFarm && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">{farmDelivery.method === 'truck' ? 'Soil & Fuel, ranch truck' : 'Soil & Fuel, pickup'}</dt>
                  <dd className="font-semibold">{farmDelivery.cost ? formatCurrency(farmDelivery.cost, true) : 'Free'}</dd>
                </div>
              )}
            </dl>
          )}
          {hasLots && (
            <div className="border-t pt-4">
              <OrderTotals summary={cattle} fulfillment={fulfillment} />
            </div>
          )}

          {paysToday && (
            <div className="grid gap-2 border-t pt-4">
              {t.promo?.ok ? (
                <div className="flex items-start justify-between gap-3 rounded-lg bg-success/12 px-3 py-2">
                  <p className="min-w-0 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Tag className="size-4" aria-hidden />
                      {t.promo.code}
                    </span>
                    {t.promo.message}
                    {(t.promoDiscount > 0 || t.giftCardAmount > 0) && (
                      <span className="block font-semibold tabular-nums">−{formatCurrency(t.promoDiscount || t.giftCardAmount, true)}</span>
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${t.promo.code}`}
                    onClick={() => {
                      setCode('')
                      setCodeInput('')
                    }}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
              ) : (
                <>
                  <Label htmlFor={`${id}-code`}>Promo code or gift card</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${id}-code`}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          setCode(codeInput)
                        }
                      }}
                      autoCapitalize="characters"
                      aria-describedby={t.promo && !t.promo.ok ? `${id}-code-error` : undefined}
                      aria-invalid={Boolean(t.promo && !t.promo.ok)}
                    />
                    <Button type="button" variant="outline" onClick={() => setCode(codeInput)}>
                      Apply
                    </Button>
                  </div>
                  {t.promo && !t.promo.ok && (
                    <p id={`${id}-code-error`} className="text-sm font-medium text-destructive">
                      {t.promo.message}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {paysToday && (
            <dl className="grid gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-semibold">Pay today</dt>
                <dd className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(t.payToday, true)}</dd>
              </div>
              {t.dueLater > 0 && (
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <dt>Due later, estimated</dt>
                  <dd className="tabular-nums">{formatCurrency(t.dueLater, true)}</dd>
                </div>
              )}
            </dl>
          )}
          <Button type="submit" size="lg" className="text-lg" disabled={processing}>
            {processing ? <LoaderCircle className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
            {processing
              ? 'Processing…'
              : paysToday
                ? `Pay ${formatCurrency(t.payToday, true)} today`
                : `Pay ${formatCurrency(cattle.deposit)} deposit`}
          </Button>
          {form.isGift && (
            <p className="flex items-center gap-2 text-sm">
              <Gift className="size-4 text-primary" aria-hidden />
              Packed as a gift{form.giftTo ? ` for ${form.giftTo}` : ''}.
            </p>
          )}
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {processing ? 'Confirming your payment. This is a demo; nothing is charged.' : 'Demo checkout. No card is charged.'}
          </p>
        </aside>
      </form>
    </div>
  )
}
