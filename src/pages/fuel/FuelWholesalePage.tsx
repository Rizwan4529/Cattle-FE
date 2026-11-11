import { type FormEvent, useId, useState } from 'react'
import { CheckCircle2, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { FormField } from '@/components/forms/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import type { FuelBuyerKind, FuelProductId } from '@/data/soilFuelTypes'
import { formatNumber, formatPrice } from '@/lib/format'
import { EMAIL, fieldAria, focusFirstError } from '@/lib/forms'
import { fuelBundles, fuelPerBundle } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const { fuel } = soilFuelConfig

function InquiryForm() {
  const id = useId()
  const submit = useRanchStore((s) => s.submitFuelInquiry)
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const products = fuel.products.filter((p) => enabled[p.id])
  const [business, setBusiness] = useState('')
  const [kind, setKind] = useState<FuelBuyerKind>('campground')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interests, setInterests] = useState<FuelProductId[]>([])
  const [volume, setVolume] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!business.trim()) found.business = 'Enter your business name.'
    if (!contact.trim()) found.contact = 'Enter your name.'
    if (!EMAIL.test(email.trim())) found.email = 'Enter an email we can reply to.'
    if (!interests.length) found.interests = 'Pick at least one product.'
    if (!volume.trim()) found.volume = 'Give us a rough amount, like “20 cases a month in summer.”'
    setErrors(found)
    if (focusFirstError(id, ['business', 'contact', 'email', 'interests', 'volume'], found)) return
    submit({
      business: business.trim(),
      kind,
      contact: contact.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      interests,
      volume: volume.trim(),
      message: message.trim(),
    })
    setSent(contact.trim().split(' ')[0])
    toast.success('Inquiry sent', { description: `${ranch.owner} will reply with pallet pricing within two business days.` })
    setBusiness('')
    setContact('')
    setEmail('')
    setPhone('')
    setInterests([])
    setVolume('')
    setMessage('')
  }

  return (
    <section id="inquiry" aria-labelledby={`${id}-title`} className="grid scroll-mt-28 gap-5 rounded-2xl border bg-card p-5 sm:p-8">
      <div>
        <h2 id={`${id}-title`} className="text-3xl font-bold">
          Ask about wholesale
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Mixed pallets, standing orders for the camping season, and shelf cards with the ranch story.
        </p>
      </div>
      {sent && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-success/15 px-4 py-3 font-medium">
          <CheckCircle2 className="size-5 text-success" aria-hidden />
          Thanks, {sent}. We’ll reply within two business days.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField id={`${id}-business`} label="Business name" error={errors.business}>
          <Input
            {...fieldAria(`${id}-business`, errors.business)}
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            autoComplete="organization"
            className="h-11"
          />
        </FormField>
        <FormField id={`${id}-kind`} label="You are a">
          <Select value={kind} onValueChange={(v) => setKind(v as FuelBuyerKind)}>
            <SelectTrigger id={`${id}-kind`} className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fuel.buyerKinds.map((k) => (
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
        <FormField id={`${id}-phone`} label="Phone (optional)">
          <Input id={`${id}-phone`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="h-11" />
        </FormField>
        <FormField id={`${id}-volume`} label="How much, roughly" error={errors.volume}>
          <Input {...fieldAria(`${id}-volume`, errors.volume)} value={volume} onChange={(e) => setVolume(e.target.value)} className="h-11" />
        </FormField>
        <fieldset className="grid content-start gap-2 sm:col-span-2" aria-describedby={errors.interests ? `${id}-interests-error` : undefined}>
          <legend className="mb-2 text-sm font-medium">Products</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {products.map((p, i) => (
              <label key={p.id} className="flex min-h-10 items-center gap-2">
                <Checkbox
                  id={i === 0 ? `${id}-interests` : undefined}
                  checked={interests.includes(p.id)}
                  onCheckedChange={(on) => setInterests((x) => (on ? [...x, p.id] : x.filter((y) => y !== p.id)))}
                />
                {p.name}
              </label>
            ))}
          </div>
          {errors.interests && (
            <p id={`${id}-interests-error`} className="text-sm font-medium text-destructive">
              {errors.interests}
            </p>
          )}
        </fieldset>
        <FormField id={`${id}-message`} label="Anything else (optional)" className="sm:col-span-2">
          <Textarea id={`${id}-message`} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </FormField>
        <Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start">
          Send inquiry
        </Button>
      </form>
    </section>
  )
}

/** Fuel wholesale: bundle / case / pallet pricing and the bulk inquiry form for campgrounds, retailers, and institutions. */
export default function FuelWholesalePage() {
  usePageTitle('Fuel wholesale')
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const products = fuel.products.filter((p) => enabled[p.id])

  return (
    <div className="container-page grid gap-12 pb-16">
      <div>
        <div className="pt-4">
          <Link to="/fuel" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
            <ChevronLeft className="size-4" aria-hidden />
            {fuel.brand}
          </Link>
        </div>
        <PageHeader
          className="pt-2 lg:pt-4"
          title="Fuel wholesale"
          description="For campgrounds, outdoor and gift stores, schools, and camps. Buy by the case or the pallet; the price per bundle drops with each size."
          actions={
            <Button asChild size="lg">
              <a href="#inquiry">Ask about wholesale</a>
            </Button>
          }
        />
        <section aria-labelledby="fuel-tiers" className="grid gap-4">
          <h2 id="fuel-tiers" className="text-2xl font-bold">
            Bundle, case, and pallet prices
          </h2>
          <div className="overflow-x-auto rounded-2xl border bg-card" tabIndex={0} role="region" aria-label="Fuel prices by size, scrollable table">
            <table className="w-full min-w-[40rem] text-left tabular-nums">
              <caption className="sr-only">Price for a bundle, a case, and a pallet of each fuel product, and the price per bundle</caption>
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Product
                  </th>
                  {(['bundle', 'case', 'pallet'] as const).map((u) => (
                    <th key={u} scope="col" className="px-4 py-3 text-right font-semibold">
                      {fuel.units[u].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t align-top">
                    <th scope="row" className="px-4 py-3 font-medium">
                      <Link to={`/fuel/${p.id}`} className="underline-offset-4 hover:underline">
                        {p.name}
                      </Link>
                    </th>
                    {(['bundle', 'case', 'pallet'] as const).map((u) => (
                      <td key={u} className="px-4 py-3 text-right">
                        <span className="block font-semibold">{formatPrice(p.price[u])}</span>
                        <span className="block text-sm text-muted-foreground">
                          {u === 'bundle'
                            ? p.bundleContents.split(',')[0]
                            : `${formatNumber(fuelBundles(p, u))} bundles, ${formatPrice(fuelPerBundle(p, u))} each`}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!soilFuelConfig.estimatesConfirmed && <p className="text-sm text-muted-foreground">{soilFuelConfig.placeholderNote}</p>}
        </section>
      </div>
      <InquiryForm />
    </div>
  )
}
