import { type FormEvent, useId, useState } from 'react'
import { CheckCircle2, ChevronLeft, MapPin, Truck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { FormField } from '@/components/forms/FormField'
import { EMAIL, fieldAria, focusFirstError, validPhone } from '@/lib/forms'
import { PageHeader } from '@/components/PageHeader'
import { QtyStepper } from '@/components/shop/ShopBits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { CO_ZIP3, CO_ZIP5 } from '@/data/coloradoZips'
import type { DeliveryWindow, ProBuyerKind, SoilProductId, TruckloadQuote } from '@/data/soilFuelTypes'
import { formatNumber, formatPrice } from '@/lib/format'
import { deliveredQuote, soilProduct, soilUnitPrice, truckloadTons, truckloadYards } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const { soil } = soilFuelConfig
const ORDER = ['product', 'zip', 'name', 'email', 'phone']

export default function TruckloadPage() {
  usePageTitle('Truckload quote')
  const id = useId()
  const [params] = useSearchParams()
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const submit = useRanchStore((s) => s.submitTruckloadQuote)
  const products = soil.products.filter((p) => enabled[p.id])
  const fromUrl = products.find((p) => p.id === params.get('product'))?.id
  const [productId, setProductId] = useState<SoilProductId>(fromUrl ?? (products.find((p) => p.id === 'ag-bulk') ?? products[0])?.id ?? 'ag-bulk')
  const [loads, setLoads] = useState(() => Math.min(20, Math.max(1, Number(params.get('loads')) || 1)))
  const [zip, setZip] = useState('')
  const [when, setWhen] = useState<DeliveryWindow>('two-weeks')
  const [kind, setKind] = useState<ProBuyerKind>('farm')
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<TruckloadQuote | null>(null)

  const p = soilProduct(productId)
  const q = deliveredQuote(p, zip, loads)
  const place = /^\d{5}$/.test(zip) ? (CO_ZIP5[zip] ?? CO_ZIP3[zip.slice(0, 3)])?.area : undefined

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!products.some((x) => x.id === productId)) found.product = 'Choose a product.'
    if (!/^\d{5}$/.test(zip)) found.zip = 'Enter the 5-digit ZIP where the load goes.'
    else if (!q.available) found.zip = q.reason ?? 'We can’t deliver there.'
    if (!name.trim()) found.name = 'Enter your name.'
    if (!EMAIL.test(email.trim())) found.email = 'Enter an email for the quote.'
    if (!validPhone(phone)) found.phone = 'Enter a 10-digit phone number; the driver calls before delivery.'
    setErrors(found)
    if (focusFirstError(id, ORDER, found)) return
    const quote = submit({
      name: name.trim(),
      business: business.trim(),
      kind,
      email: email.trim(),
      phone: phone.trim(),
      zip,
      productId,
      loads,
      window: when,
      miles: q.miles ?? 0,
      estimate: q.total,
      notes: notes.trim(),
    })
    setSent(quote)
    toast.success('Quote request sent', { description: `${ranch.owner} will confirm the delivered price within one business day.` })
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (sent) {
    const sp = soilProduct(sent.productId)
    return (
      <div className="container-page grid max-w-3xl gap-6 py-12">
        <CheckCircle2 className="size-12 text-success" aria-hidden />
        <h1 className="text-4xl font-bold">Quote request sent</h1>
        <p className="text-lg">
          {sent.loads} {sent.loads === 1 ? 'truckload' : 'truckloads'} of {sp.name} to {sent.zip}, about {sent.miles} miles from the ranch. Our
          estimate was <strong>{formatPrice(sent.estimate)}</strong> delivered. {ranch.owner} will email {sent.email} to confirm the price and a
          delivery day, usually within one business day.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setSent(null)}>Price another load</Button>
          <Button asChild variant="outline">
            <Link to="/soil">Back to {soil.brand}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link to="/soil" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          {soil.brand}
        </Link>
      </div>
      <PageHeader
        className="pt-2 lg:pt-4"
        title="Truckload quote"
        description={`For farms, landscapers, and golf courses. A load is ${soil.truckload.yards} cubic yards (up to ${soil.truckload.maxTons} tons), end-dumped where you want it. See an estimate now; we confirm the price by email.`}
      />

      <form onSubmit={onSubmit} noValidate className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-6">
          <fieldset className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
            <legend className="float-left w-full text-xl font-bold sm:col-span-2">The load</legend>
            <FormField id={`${id}-product`} label="Product" error={errors.product}>
              <Select value={productId} onValueChange={(v) => setProductId(v as SoilProductId)}>
                <SelectTrigger {...fieldAria(`${id}-product`, errors.product)} className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid content-start gap-2">
              <span className="text-sm font-medium" id={`${id}-loads-label`}>
                Truckloads
              </span>
              <QtyStepper value={loads} onChange={setLoads} min={1} max={20} label="Number of truckloads" className="justify-self-start" />
              <p className="text-sm text-muted-foreground">
                {formatNumber(truckloadYards(p) * loads)} yd³, about {formatNumber(truckloadTons(p) * loads)} tons
              </p>
            </div>
            <FormField id={`${id}-zip`} label="Delivery ZIP code" error={errors.zip} hint={place ? `${place}, Colorado` : 'Where the load is going'}>
              <Input
                {...fieldAria(`${id}-zip`, errors.zip)}
                inputMode="numeric"
                autoComplete="postal-code"
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value.replace(/\D/g, '').slice(0, 5))
                  if (errors.zip) setErrors((x) => ({ ...x, zip: '' }))
                }}
                placeholder="e.g. 80134"
                className="h-11 max-w-40"
              />
            </FormField>
            <div className="grid content-start gap-2">
              <span className="text-sm font-medium" id={`${id}-window`}>
                When you need it
              </span>
              <RadioGroup value={when} onValueChange={(v) => setWhen(v as DeliveryWindow)} aria-labelledby={`${id}-window`} className="grid gap-1">
                {soil.delivery.windows.map((w) => (
                  <Label key={w.value} className="flex min-h-10 items-center gap-2 font-normal">
                    <RadioGroupItem value={w.value} />
                    {w.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </fieldset>

          <fieldset className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
            <legend className="float-left w-full text-xl font-bold sm:col-span-2">About you</legend>
            <FormField id={`${id}-kind`} label="You are a">
              <Select value={kind} onValueChange={(v) => setKind(v as ProBuyerKind)}>
                <SelectTrigger id={`${id}-kind`} className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {soil.buyerKinds.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id={`${id}-business`} label="Business or farm (optional)">
              <Input
                id={`${id}-business`}
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                autoComplete="organization"
                className="h-11"
              />
            </FormField>
            <FormField id={`${id}-name`} label="Your name" error={errors.name}>
              <Input
                {...fieldAria(`${id}-name`, errors.name)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="h-11"
              />
            </FormField>
            <FormField id={`${id}-email`} label="Email" error={errors.email}>
              <Input
                {...fieldAria(`${id}-email`, errors.email)}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11"
              />
            </FormField>
            <FormField id={`${id}-phone`} label="Phone" error={errors.phone}>
              <Input
                {...fieldAria(`${id}-phone`, errors.phone)}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="h-11"
              />
            </FormField>
            <FormField id={`${id}-notes`} label="Anything we should know (optional)" className="sm:col-span-2">
              <Textarea
                id={`${id}-notes`}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, where to dump it, split between sites…"
              />
            </FormField>
          </fieldset>
        </div>

        <aside aria-labelledby={`${id}-estimate`} className="grid gap-4 rounded-2xl border-2 border-primary/30 bg-card p-5 lg:sticky lg:top-28">
          <h2 id={`${id}-estimate`} className="flex items-center gap-2 text-2xl font-bold">
            <Truck className="size-6 text-primary" aria-hidden />
            Your estimate
          </h2>
          <dl className="grid gap-2" aria-live="polite">
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt className="text-muted-foreground">
                {loads} × {p.name}
              </dt>
              <dd className="font-semibold tabular-nums">{formatPrice(q.product)}</dd>
              <dd className="basis-full text-sm text-muted-foreground">
                {formatPrice(soilUnitPrice(p, 'truckload'))} a load, {Math.round(soil.truckload.discount * 100)}% off the ton price
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
                Delivery{q.miles !== null && q.available ? `, ~${q.miles} mi` : ''}
              </dt>
              <dd className="font-semibold tabular-nums">{q.available ? formatPrice(q.delivery) : '–'}</dd>
              {q.available && (
                <dd className="basis-full text-sm text-muted-foreground">
                  {formatPrice(soil.delivery.base)} + {formatPrice(soil.delivery.perMile)}/mile, per load
                </dd>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t pt-3">
              <dt className="font-semibold">Delivered</dt>
              <dd className="font-heading text-3xl font-bold tabular-nums">{q.available ? formatPrice(q.total) : '–'}</dd>
            </div>
          </dl>
          {!q.available && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{q.reason}</p>}
          <p className="text-sm text-muted-foreground">
            A mock estimate: nothing is charged. {!soilFuelConfig.estimatesConfirmed && soilFuelConfig.placeholderNote}
          </p>
          <Button type="submit" size="lg">
            Request this quote
          </Button>
        </aside>
      </form>
    </div>
  )
}
