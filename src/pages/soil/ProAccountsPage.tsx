import { type FormEvent, useId, useState } from 'react'
import { CheckCircle2, ChevronLeft, Flag, Store, Tractor, Trees } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { FormField } from '@/components/forms/FormField'
import { EMAIL, fieldAria, focusFirstError, validPhone } from '@/lib/forms'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import type { ProBuyerKind, SoilProductId, SoilUnit } from '@/data/soilFuelTypes'
import { formatNumber, formatPrice } from '@/lib/format'
import { proPrice, proTierFor } from '@/lib/soilFuel'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const { soil } = soilFuelConfig

const WHO = [
  { icon: Trees, title: 'Landscapers', body: 'Topdress after aeration and build new beds, by the yard or the load.' },
  { icon: Flag, title: 'Golf courses', body: 'Screened topdress for fairways, tees, and sports fields.' },
  { icon: Tractor, title: 'Farms', body: 'Ag-Grade Bulk by the truckload for hay ground, crops, and orchards.' },
  { icon: Store, title: 'Garden centers', body: 'Bagged Garden Blend and Potting Mix by the pallet, at dealer pricing.' },
]

function ApplyForm() {
  const id = useId()
  const submit = useRanchStore((s) => s.submitProApplication)
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const products = soil.products.filter((p) => enabled[p.id])
  const [business, setBusiness] = useState('')
  const [kind, setKind] = useState<ProBuyerKind>('landscaper')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [yards, setYards] = useState('')
  const [interests, setInterests] = useState<SoilProductId[]>([])
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<string | null>(null)
  const yardsN = Number(yards)
  const tier = yardsN > 0 ? proTierFor(yardsN) : null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!business.trim()) found.business = 'Enter your business name.'
    if (!contact.trim()) found.contact = 'Enter your name.'
    if (!EMAIL.test(email.trim())) found.email = 'Enter an email we can reply to.'
    if (!validPhone(phone)) found.phone = 'Enter a 10-digit phone number.'
    if (!city.trim()) found.city = 'Enter your town.'
    if (!(yardsN > 0)) found.yards = 'Give us a rough number of cubic yards a year.'
    if (!interests.length) found.interests = 'Pick at least one product.'
    setErrors(found)
    if (focusFirstError(id, ['business', 'contact', 'email', 'phone', 'city', 'yards', 'interests'], found)) return
    submit({
      business: business.trim(),
      kind,
      contact: contact.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      yardsPerYear: yardsN,
      interests,
      message: message.trim(),
    })
    setSent(business.trim())
    toast.success('Application sent', { description: `${ranch.owner} will set up your account within two business days.` })
    setBusiness('')
    setContact('')
    setEmail('')
    setPhone('')
    setCity('')
    setYards('')
    setInterests([])
    setMessage('')
  }

  return (
    <section id="apply" aria-labelledby={`${id}-title`} className="grid scroll-mt-28 gap-5 rounded-2xl border bg-card p-5 sm:p-8">
      <div>
        <h2 id={`${id}-title`} className="text-3xl font-bold">
          Apply for a pro account
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">We’ll confirm your tier and set up invoicing. No fee, no minimum to apply.</p>
      </div>
      {sent && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-success/15 px-4 py-3 font-medium">
          <CheckCircle2 className="size-5 text-success" aria-hidden />
          Thanks, {sent}. We’ll be in touch within two business days.
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
        <FormField id={`${id}-kind`} label="Kind of business">
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
          <Input
            {...fieldAria(`${id}-city`, errors.city)}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
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
        <FormField
          id={`${id}-yards`}
          label="Cubic yards a year, roughly"
          error={errors.yards}
          hint={tier ? `That’s our ${tier.label} tier: ${tier.off ? `${Math.round(tier.off * 100)}% off list` : 'list prices'}.` : undefined}
        >
          <Input
            {...fieldAria(`${id}-yards`, errors.yards)}
            type="number"
            inputMode="numeric"
            min={0}
            value={yards}
            onChange={(e) => setYards(e.target.value)}
            className="h-11 max-w-48 tabular-nums"
          />
        </FormField>
        <fieldset className="grid content-start gap-2" aria-describedby={errors.interests ? `${id}-interests-error` : undefined}>
          <legend className="mb-2 text-sm font-medium">Products you’d buy</legend>
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
          Send application
        </Button>
      </form>
    </section>
  )
}

/** Pro accounts: volume tier pricing for commercial buyers, and the application form. */
export default function ProAccountsPage() {
  usePageTitle('Pro accounts')
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const products = soil.products.filter((p) => enabled[p.id])
  const [unit, setUnit] = useState<Exclude<SoilUnit, 'truckload'>>('yard')

  return (
    <div className="container-page grid gap-12 pb-16">
      <div>
        <div className="pt-4">
          <Link to="/soil" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
            <ChevronLeft className="size-4" aria-hidden />
            {soil.brand}
          </Link>
        </div>
        <PageHeader
          className="pt-2 lg:pt-4"
          title="Pro accounts"
          description="Volume pricing for landscapers, golf courses, farms, and garden centers. The more you buy in a year, the less each yard costs."
          actions={
            <Button asChild size="lg">
              <a href="#apply">Apply now</a>
            </Button>
          }
        />
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {WHO.map(({ icon: Icon, title, body }) => (
            <li key={title} className="grid content-start gap-2 rounded-2xl border bg-card p-5">
              <Icon className="size-7 text-primary" aria-hidden />
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>

      <section aria-labelledby="tiers-heading" className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="tiers-heading" className="text-3xl font-bold">
              Price by tier
            </h2>
            <p className="mt-1 text-muted-foreground">Your tier is set by the cubic yards you expect to buy in a year.</p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            value={unit}
            onValueChange={(v) => v && setUnit(v as typeof unit)}
            aria-label="Show prices per"
          >
            {(['bag', 'yard', 'ton'] as const).map((u) => (
              <ToggleGroupItem key={u} value={u} className="h-11 px-4">
                Per {soil.units[u].label.toLowerCase()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-card" tabIndex={0} role="region" aria-label="Pro prices by tier, scrollable table">
          <table className="w-full min-w-[40rem] text-left tabular-nums">
            <caption className="sr-only">Price per {soil.units[unit].label.toLowerCase()} for each product at each pro tier</caption>
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Product
                </th>
                {soil.proTiers.map((t) => (
                  <th key={t.id} scope="col" className="px-4 py-3 text-right font-semibold">
                    <span className="block">{t.label}</span>
                    <span className="block text-sm font-normal text-muted-foreground">
                      {t.minYards ? `${formatNumber(t.minYards)}+ yd³/yr` : 'Any amount'}
                      {t.off ? `, ${Math.round(t.off * 100)}% off` : ''}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <th scope="row" className="px-4 py-3 font-medium">
                    <Link to={`/soil/${p.id}`} className="underline-offset-4 hover:underline">
                      {p.name}
                    </Link>
                  </th>
                  {soil.proTiers.map((t, i) => (
                    <td key={t.id} className={cn('px-4 py-3 text-right', i === soil.proTiers.length - 1 && 'font-semibold')}>
                      {formatPrice(proPrice(p, unit, t))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2">
          {soil.proTiers.map((t) => (
            <li key={t.id}>
              <span className="font-semibold text-foreground">{t.label}:</span> {t.fits}.
            </li>
          ))}
        </ul>
        {!soilFuelConfig.estimatesConfirmed && <p className="text-sm text-muted-foreground">{soilFuelConfig.placeholderNote}</p>}
      </section>

      <ApplyForm />
    </div>
  )
}
