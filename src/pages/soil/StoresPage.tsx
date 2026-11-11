import { type FormEvent, useId, useState } from 'react'
import { CheckCircle2, ChevronLeft, Clock, MapPin, Phone, Star } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { FormField } from '@/components/forms/FormField'
import { EMAIL, fieldAria, focusFirstError, validPhone } from '@/lib/forms'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { dealers } from '@/data/dealers'
import type { Dealer, DealerKind, Division } from '@/data/soilFuelTypes'
import { type DealerFilter, findDealers, zipPoint } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const ALL_PRODUCTS = [...soilFuelConfig.soil.products, ...soilFuelConfig.fuel.products]
const productName = (id: string) => ALL_PRODUCTS.find((p) => p.id === id)?.name ?? id
const kindLabel = (k: DealerKind) => soilFuelConfig.dealerKinds.find((x) => x.value === k)?.label ?? k

/** Eastern Colorado, where the stockists are. */
const BOUNDS = { north: 41.0, south: 37.9, west: -106.3, east: -102.1 }
const pos = (pt: { lat: number; lng: number }) => ({
  left: `${((pt.lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100}%`,
  top: `${((BOUNDS.north - pt.lat) / (BOUNDS.north - BOUNDS.south)) * 100}%`,
})
const TOWNS = [
  { name: 'Denver', lat: 39.74, lng: -104.99 },
  { name: 'Colorado Springs', lat: 38.83, lng: -104.82 },
  { name: 'Fort Collins', lat: 40.59, lng: -105.08 },
  { name: 'Pueblo', lat: 38.25, lng: -104.61 },
]
const xy = (lat: number, lng: number) =>
  `${((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100} ${((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * 100}`

/** Map placeholder: dealer pins over a sketch of eastern Colorado. Pins are buttons that pick a store. */
function DealerMap({
  shown,
  selected,
  onSelect,
  you,
}: {
  shown: Dealer[]
  selected: string | null
  onSelect: (id: string) => void
  you?: { lat: number; lng: number }
}) {
  return (
    <figure className="grid gap-2">
      <div className="relative aspect-[21/20] overflow-hidden rounded-2xl border bg-scene-sky">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
          <rect width="100" height="100" className="fill-scene-hill" opacity="0.35" />
          {/* Mountains to the west */}
          <path d="M0 0 L22 0 L18 30 L24 55 L16 80 L20 100 L0 100 Z" className="fill-scene-ground" opacity="0.6" />
          {/* I-25 and I-70 */}
          <polyline
            points={`${xy(40.95, -104.98)} ${xy(39.74, -104.99)} ${xy(38.83, -104.82)} ${xy(37.95, -104.55)}`}
            fill="none"
            className="stroke-card"
            strokeWidth="1.4"
          />
          <polyline
            points={`${xy(39.72, -106.3)} ${xy(39.74, -104.99)} ${xy(39.26, -103.69)} ${xy(39.3, -102.1)}`}
            fill="none"
            className="stroke-card"
            strokeWidth="1.4"
          />
        </svg>
        {TOWNS.map((t) => (
          <span key={t.name} aria-hidden style={pos(t)} className="absolute translate-x-2 -translate-y-1/2 text-xs font-semibold text-foreground/70">
            {t.name}
          </span>
        ))}
        <span aria-hidden style={pos(ranch.location)} className="absolute -translate-x-1/2 -translate-y-1/2 text-primary" title={ranch.name}>
          <Star className="size-6 fill-current stroke-card" />
        </span>
        {you && (
          <span
            aria-hidden
            style={pos(you)}
            className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-chart-5 shadow"
          />
        )}
        {shown.map((d) => (
          <button
            key={d.id}
            type="button"
            style={pos(d)}
            onClick={() => onSelect(d.id)}
            aria-pressed={selected === d.id}
            aria-label={`${d.name}, ${d.city}`}
            className={cn(
              'absolute grid size-8 -translate-x-1/2 -translate-y-full place-items-center rounded-full focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none',
              selected === d.id ? 'z-10 text-primary' : 'text-foreground/80 hover:text-primary',
            )}
          >
            <MapPin className={cn('size-7 fill-card drop-shadow', selected === d.id && 'size-9 fill-primary/20')} aria-hidden />
          </button>
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="size-4 fill-primary text-primary" aria-hidden /> The ranch
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="size-4" aria-hidden /> A store
        </span>
        <span>Map preview; a live map comes with launch.</span>
      </figcaption>
    </figure>
  )
}

function DealerForm() {
  const id = useId()
  const submit = useRanchStore((s) => s.submitDealerApplication)
  const [business, setBusiness] = useState('')
  const [kind, setKind] = useState<DealerKind>('garden-center')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<Division[]>(['soil'])
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!business.trim()) found.business = 'Enter the store’s name.'
    if (!contact.trim()) found.contact = 'Enter your name.'
    if (!EMAIL.test(email.trim())) found.email = 'Enter an email we can reply to.'
    if (!validPhone(phone)) found.phone = 'Enter a 10-digit phone number.'
    if (!city.trim()) found.city = 'Enter the store’s town.'
    if (!interests.length) found.interests = 'Pick Soil, Fuel, or both.'
    setErrors(found)
    if (focusFirstError(id, ['business', 'contact', 'email', 'phone', 'city', 'interests'], found)) return
    submit({
      business: business.trim(),
      kind,
      contact: contact.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      interests,
      message: message.trim(),
    })
    setSent(business.trim())
    toast.success('Dealer application sent', { description: `${ranch.owner} will call with dealer pricing and pallet sizes.` })
    setBusiness('')
    setContact('')
    setEmail('')
    setPhone('')
    setCity('')
    setInterests(['soil'])
    setMessage('')
  }

  return (
    <section id="become-a-dealer" aria-labelledby={`${id}-title`} className="grid scroll-mt-28 gap-5 rounded-2xl border bg-card p-5 sm:p-8">
      <div>
        <h2 id={`${id}-title`} className="text-3xl font-bold">
          Become a dealer
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Garden centers, nurseries, feed stores, and hardware stores: stock CROWDER bags and fire logs at dealer pricing, by the pallet.
        </p>
      </div>
      {sent && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-success/15 px-4 py-3 font-medium">
          <CheckCircle2 className="size-5 text-success" aria-hidden />
          Thanks, {sent}. We’ll call within two business days.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField id={`${id}-business`} label="Store name" error={errors.business}>
          <Input
            {...fieldAria(`${id}-business`, errors.business)}
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            autoComplete="organization"
            className="h-11"
          />
        </FormField>
        <FormField id={`${id}-kind`} label="Kind of store">
          <Select value={kind} onValueChange={(v) => setKind(v as DealerKind)}>
            <SelectTrigger id={`${id}-kind`} className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {soilFuelConfig.dealerKinds.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id={`${id}-contact`} label="Your name" error={errors.contact}>
          <Input
            {...fieldAria(`${id}-contact`, errors.contact)}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            autoComplete="name"
            className="h-11"
          />
        </FormField>
        <FormField id={`${id}-city`} label="Town" error={errors.city}>
          <Input {...fieldAria(`${id}-city`, errors.city)} value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
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
        <fieldset className="grid content-start gap-2" aria-describedby={errors.interests ? `${id}-interests-error` : undefined}>
          <legend className="mb-2 text-sm font-medium">You’d stock</legend>
          {(['soil', 'fuel'] as const).map((d, i) => (
            <label key={d} className="flex min-h-10 items-center gap-2">
              <Checkbox
                id={i === 0 ? `${id}-interests` : undefined}
                checked={interests.includes(d)}
                onCheckedChange={(on) => setInterests((x) => (on ? [...x, d] : x.filter((y) => y !== d)))}
              />
              {d === 'soil' ? soilFuelConfig.soil.brand : soilFuelConfig.fuel.brand}
            </label>
          ))}
          {errors.interests && (
            <p id={`${id}-interests-error`} className="text-sm font-medium text-destructive">
              {errors.interests}
            </p>
          )}
        </fieldset>
        <FormField id={`${id}-message`} label="Anything else (optional)">
          <Textarea id={`${id}-message`} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </FormField>
        <Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start">
          Send dealer application
        </Button>
      </form>
    </section>
  )
}

/** "Find us in stores": the dealer locator (list, map placeholder, filters) and the Become a dealer form. */
export default function StoresPage() {
  usePageTitle('Find CROWDER in stores')
  const id = useId()
  const [zip, setZip] = useState('')
  const [kind, setKind] = useState<DealerKind | 'all'>('all')
  const [carries, setCarries] = useState<string>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const results = findDealers(dealers, { zip: zip.length === 5 ? zip : undefined, kind, carries: carries as DealerFilter['carries'] })
  const you = zip.length === 5 ? zipPoint(zip) : undefined

  const select = (dealerId: string) => {
    setSelected(dealerId)
    document.getElementById(`dealer-${dealerId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className="container-page grid gap-12 pb-16">
      <div>
        <div className="pt-4">
          <Link to="/soil" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
            <ChevronLeft className="size-4" aria-hidden />
            {soilFuelConfig.soil.brand}
          </Link>
        </div>
        <PageHeader
          className="pt-2 lg:pt-4"
          title="Find us in stores"
          description="CROWDER Soil bags and Fuel logs at garden centers, nurseries, and feed stores along the Front Range. Call ahead; stock moves fast in spring."
          actions={
            <Button asChild variant="outline" size="lg">
              <a href="#become-a-dealer">Become a dealer</a>
            </Button>
          }
        />

        <div className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-zip`}>Your ZIP code</Label>
            <Input
              id={`${id}-zip`}
              inputMode="numeric"
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="e.g. 80104"
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-kind`}>Kind of store</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as DealerKind | 'all')}>
              <SelectTrigger id={`${id}-kind`} className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any store</SelectItem>
                {soilFuelConfig.dealerKinds.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-carries`}>Carries</Label>
            <Select value={carries} onValueChange={setCarries}>
              <SelectTrigger id={`${id}-carries`} className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any product</SelectItem>
                {ALL_PRODUCTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p aria-live="polite" className="mt-3 text-muted-foreground">
          {results.length} {results.length === 1 ? 'store' : 'stores'}
          {zip.length === 5 ? (you ? `, nearest to ${zip} first` : `. ${zip} isn’t in Colorado, so stores are listed by town.`) : ''}
        </p>

        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-28 lg:order-2">
            <DealerMap shown={results.map((r) => r.dealer)} selected={selected} onSelect={select} you={you} />
          </div>
          {results.length ? (
            <ul className="grid gap-3 lg:order-1">
              {results.map(({ dealer: d, miles }) => (
                <li
                  key={d.id}
                  id={`dealer-${d.id}`}
                  className={cn('grid scroll-mt-28 gap-2 rounded-2xl border bg-card p-4', selected === d.id && 'border-2 border-primary')}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-xl font-bold">
                      <button type="button" onClick={() => setSelected(d.id)} className="text-left underline-offset-4 hover:underline">
                        {d.name}
                      </button>
                    </h2>
                    {miles !== null && <span className="font-semibold tabular-nums">{miles} mi</span>}
                  </div>
                  <p className="text-muted-foreground">
                    {kindLabel(d.kind)} · {d.address}, {d.city} {d.zip}
                  </p>
                  <p className="flex flex-wrap gap-x-4 gap-y-1">
                    <a
                      href={`tel:${d.phone.replace(/\D/g, '')}`}
                      className="inline-flex min-h-10 items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      <Phone className="size-4" aria-hidden />
                      {d.phone}
                    </a>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-4" aria-hidden />
                      {d.hours}
                    </span>
                  </p>
                  <ul className="flex flex-wrap gap-1.5" aria-label="Carries">
                    {d.carries.map((c) => (
                      <li key={c}>
                        <Badge variant="secondary">{productName(c)}</Badge>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6 lg:order-1">
              <p className="text-lg font-semibold">No stores match those filters.</p>
              <p className="text-muted-foreground">Try any store or any product, or buy straight from the ranch.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setKind('all')
                    setCarries('all')
                  }}
                >
                  Clear filters
                </Button>
                <Button asChild>
                  <Link to="/soil">Shop {soilFuelConfig.soil.brand}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DealerForm />
    </div>
  )
}
