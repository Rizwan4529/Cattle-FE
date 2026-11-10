import { type FormEvent, type ReactNode, useId, useState } from 'react'
import { Check, ChevronLeft, Dog, Droplets, Factory, Scissors, Sprout } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { GoodsBuyControl } from '@/components/goods/GoodsBits'
import { GoodsImage } from '@/components/goods/GoodsImage'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { byproductsConfig } from '@/config/byproducts'
import { ranch } from '@/config/ranch'
import { BUSINESS_KINDS } from '@/data/goods'
import type { GoodsCategoryId, WholesaleInquiry } from '@/data/goodsTypes'
import { goodsUrl, isListed, visibleCategories } from '@/lib/byproducts'
import { formatCurrency } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const EMAIL = /^\S+@\S+\.\S+$/

const WHO = [
  { icon: Droplets, title: 'Soap & candle makers', body: 'Rendered tallow by the pound or the 5 lb pail, and raw suet to render yourself.' },
  { icon: Dog, title: 'Pet-treat shops', body: 'Single-ingredient chews with a ranch name and ear tag behind every batch.' },
  { icon: Scissors, title: 'Leatherworkers & makers', body: 'Salted hides, rawhide, veg-tan leather by the foot, horn, and bone blanks.' },
  { icon: Sprout, title: 'Garden centers', body: 'Bone meal and hoof & horn meal in 1 lb bags, or ask about bulk sacks.' },
]

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

type FormState = Omit<WholesaleInquiry, 'id' | 'createdAt' | 'status' | 'reply'>
const blank: FormState = { business: '', kind: 'soap-candle', contact: '', email: '', phone: '', categories: [], volume: '', message: '' }

function InquiryForm() {
  const id = useId()
  const submit = useRanchStore((s) => s.submitWholesaleInquiry)
  const categories = visibleCategories(byproductsConfig)
  const [form, setForm] = useState<FormState>(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<string | null>(null)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const toggle = (c: GoodsCategoryId, on: boolean) => set('categories', on ? [...form.categories, c] : form.categories.filter((x) => x !== c))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!form.business.trim()) found.business = 'Enter your business name.'
    if (!form.contact.trim()) found.contact = 'Enter your name.'
    if (!EMAIL.test(form.email.trim())) found.email = 'Enter an email we can reply to.'
    if (!form.categories.length) found.categories = 'Pick at least one thing you’d like to buy.'
    if (!form.volume.trim()) found.volume = 'Give us a rough amount, like “40 lb tallow a month.”'
    setErrors(found)
    const first = ['business', 'contact', 'email', 'categories', 'volume'].find((f) => found[f])
    if (first) return document.getElementById(`${id}-${first}`)?.focus()
    submit({
      ...form,
      business: form.business.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      volume: form.volume.trim(),
      message: form.message.trim(),
    })
    setSent(form.contact.trim().split(' ')[0])
    toast.success('Inquiry sent', { description: `${ranch.owner} will reply with a price sheet within two business days.` })
    setForm(blank)
  }

  if (sent) {
    return (
      <div role="status" className="grid justify-items-start gap-3 rounded-2xl border bg-card p-6">
        <Check className="size-8 text-success" aria-hidden />
        <p className="text-xl font-semibold">Thanks, {sent}. Your inquiry is in.</p>
        <p className="text-muted-foreground">
          {ranch.owner} will reply with a price sheet and what we can set aside from upcoming harvests, usually within two business days. In a hurry?
          Call {ranch.phone}.
        </p>
        <Button variant="outline" onClick={() => setSent(null)}>
          Send another inquiry
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
      <Field id={`${id}-business`} label="Business name" error={errors.business}>
        <Input
          {...aria(`${id}-business`, errors.business)}
          value={form.business}
          onChange={(e) => set('business', e.target.value)}
          autoComplete="organization"
        />
      </Field>
      <Field id={`${id}-kind`} label="What kind of business?">
        <Select value={form.kind} onValueChange={(v) => set('kind', v as FormState['kind'])}>
          <SelectTrigger id={`${id}-kind`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      <Field id={`${id}-volume`} label="How much, how often?" error={errors.volume}>
        <Input
          {...aria(`${id}-volume`, errors.volume)}
          value={form.volume}
          onChange={(e) => set('volume', e.target.value)}
          placeholder="40 lb tallow a month"
        />
      </Field>
      <fieldset
        id={`${id}-categories`}
        tabIndex={-1}
        aria-describedby={errors.categories ? `${id}-categories-error` : undefined}
        className="grid gap-3 sm:col-span-2 focus-visible:outline-none"
      >
        <legend className="mb-1 text-sm font-medium">What would you like to buy?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {categories.map((c) => {
            const cid = `${id}-cat-${c.id}`
            return (
              <label
                key={c.id}
                htmlFor={cid}
                className="flex min-h-11 items-center gap-3 rounded-lg border bg-background px-3 py-2 has-[[data-state=checked]]:border-primary"
              >
                <Checkbox id={cid} checked={form.categories.includes(c.id)} onCheckedChange={(v) => toggle(c.id, v === true)} />
                <span>{c.name}</span>
              </label>
            )
          })}
        </div>
        {errors.categories && (
          <p id={`${id}-categories-error`} className="text-sm font-medium text-destructive">
            {errors.categories}
          </p>
        )}
      </fieldset>
      <Field id={`${id}-message`} label="Anything else? (optional)" className="sm:col-span-2" hint="Grades, packaging, delivery, a standing order…">
        <Textarea id={`${id}-message`} rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg">
          <Factory aria-hidden />
          Send inquiry
        </Button>
      </div>
    </form>
  )
}

export default function WholesalePage() {
  usePageTitle('Makers & Wholesale')
  const goods = useRanchStore((s) => s.goods)
  const bulk = goods.filter((g) => g.bulk && !g.unique && isListed(g, byproductsConfig))
  const tiers = byproductsConfig.priceTiers

  return (
    <div className="container-page pb-16">
      <div className="pt-4">
        <Link to="/ranch-goods" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Ranch Goods
        </Link>
      </div>
      <PageHeader
        className="pt-2 lg:pt-4"
        title="Makers & Wholesale"
        description="Tallow, hides, leather, and craft blanks from cattle raised on one ranch, priced by volume. Order online with the discount applied, or ask us to set aside stock from upcoming harvests."
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WHO.map(({ icon: Icon, title, body }) => (
          <li key={title} className="grid content-start gap-2 rounded-xl border bg-card p-5">
            <Icon className="size-7 text-primary" aria-hidden />
            <h2 className="font-heading text-xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="tiers-heading" className="mt-12 grid gap-4">
        <div>
          <h2 id="tiers-heading" className="text-3xl font-bold">
            Volume pricing
          </h2>
          <p className="mt-1 text-muted-foreground">
            The discount applies automatically in your cart:{' '}
            {tiers.map((t) => `${t.max ? `${t.min}–${t.max}` : `${t.min}+`} ${t.off ? `${Math.round(t.off * 100)}% off` : 'list price'}`).join(', ')}.
          </p>
        </div>
        <div className="relative overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[40rem] text-left">
            <caption className="sr-only">Price per unit at each quantity</caption>
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">
                  Item
                </th>
                {tiers.map((t) => (
                  <th key={t.min} scope="col" className="px-4 py-3 text-right font-medium">
                    {t.max ? `${t.min}–${t.max}` : `${t.min}+`}
                    <span className="block font-normal">{t.off ? `${Math.round(t.off * 100)}% off` : 'List'}</span>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  On hand
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Add to cart</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {bulk.map((g) => (
                <tr key={g.id} className="border-b last:border-0">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <Link to={goodsUrl(g)} className="flex items-center gap-3 font-semibold underline-offset-4 hover:underline">
                      <span className="block aspect-4/3 w-16 shrink-0 overflow-hidden rounded-md border">
                        <GoodsImage art={g.art} coat={g.coat} seed={g.id} alt="" />
                      </span>
                      <span>
                        {g.name}
                        <span className="block text-sm font-normal text-muted-foreground">per {g.unit}</span>
                      </span>
                    </Link>
                  </th>
                  {tiers.map((t) => (
                    <td key={t.min} className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(g.price * (1 - t.off), true)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right tabular-nums">{g.stock > 0 ? g.stock : 'Sold out'}</td>
                  <td className="px-4 py-3 text-right">
                    <GoodsBuyControl product={g} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          One-of-a-kind hides and horns sell at their listed price. For a standing order or more than we have on hand, send an inquiry below.
        </p>
      </section>

      <section aria-labelledby="inquiry-heading" className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
        <div>
          <h2 id="inquiry-heading" className="text-3xl font-bold">
            Wholesale inquiry
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tell us what you make and roughly how much you need. We harvest a few animals a month, so we’ll tell you honestly what we can supply and
            when.
          </p>
        </div>
        <InquiryForm />
      </section>

      <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">{byproductsConfig.consumerNote}</p>
    </div>
  )
}
