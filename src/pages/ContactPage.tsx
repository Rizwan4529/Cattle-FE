import { type FormEvent, useId, useState } from 'react'
import { CircleCheck, Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ranch, ranchPhoneHref, ranchPlace } from '@/config/ranch'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const TOPICS = [
  { value: 'buying', label: 'Buying cattle' },
  { value: 'lot', label: 'A lot I saw' },
  { value: 'visit', label: 'Coming to see the cattle' },
  { value: 'selling', label: 'Selling to the ranch' },
  { value: 'other', label: 'Something else' },
]

interface Form {
  name: string
  phone: string
  email: string
  topic: string
  message: string
}
type Errors = Partial<Record<keyof Form, string>>

/** Stylized map of the ranch's corner of the county; a placeholder until a real map is added. */
function MapPlaceholder() {
  return (
    <svg
      viewBox="0 0 400 240"
      role="img"
      aria-label={`Map placeholder showing the ranch near ${ranch.location.city}`}
      className="block h-auto w-full"
    >
      <rect width="400" height="240" className="fill-scene-hill" />
      {/* Fields */}
      {[
        [20, 20, 110, 70],
        [150, 18, 90, 80],
        [260, 26, 120, 64],
        [24, 132, 120, 86],
        [262, 140, 116, 80],
      ].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="6" className="fill-scene-ground" opacity="0.7" />
      ))}
      {/* Creek */}
      <path d="M0 196 C60 170 110 214 170 186 S280 150 400 176" fill="none" className="stroke-chart-5" strokeWidth="5" opacity="0.6" />
      {/* Roads */}
      <path d="M0 112 H400" className="stroke-card" strokeWidth="10" />
      <path d="M200 0 V240" className="stroke-card" strokeWidth="8" />
      <text x="12" y="106" className="fill-foreground/70" fontSize="12" fontWeight="600">
        {ranch.location.address.replace(/^\d+\s+/, '')}
      </text>
      <text x="206" y="232" className="fill-foreground/70" fontSize="12" fontWeight="600">
        to {ranch.location.city}
      </text>
      {/* Pin */}
      <g transform="translate(232 112)">
        <path d="M0 0 C-14 -18 -16 -26 -16 -32 A16 16 0 0 1 16 -32 C16 -26 14 -18 0 0 Z" className="fill-primary stroke-card" strokeWidth="2" />
        <circle cy="-32" r="6" className="fill-card" />
      </g>
    </svg>
  )
}

export default function ContactPage() {
  usePageTitle('Contact')
  const id = useId()
  const [params] = useSearchParams()
  const lot = useRanchStore((s) => s.lots.find((l) => l.id === params.get('lot')))

  const [form, setForm] = useState<Form>({
    name: '',
    phone: '',
    email: '',
    topic: lot ? 'lot' : 'buying',
    message: lot ? `I'm interested in Lot ${lot.number}: ${lot.title}. ` : '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [sentTo, setSentTo] = useState<string | null>(null)

  const set = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key] || ((key === 'phone' || key === 'email') && errors.phone)) setErrors((e) => ({ ...e, [key]: undefined, phone: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Errors = {}
    if (!form.name.trim()) found.name = 'Enter your name.'
    const digits = form.phone.replace(/\D/g, '')
    const phoneOk = digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
    const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim())
    if (!phoneOk && !emailOk) found.phone = 'Leave a phone number or an email so we can get back to you.'
    else if (form.phone.trim() && !phoneOk) found.phone = 'Check the phone number: 10 digits.'
    if (form.email.trim() && !emailOk) found.email = 'Check the email address, or leave it blank.'
    if (form.message.trim().length < 5) found.message = 'Tell us a little about what you need.'
    setErrors(found)
    const first = (['name', 'phone', 'email', 'message'] as const).find((k) => found[k])
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const how = phoneOk ? `call you at ${form.phone.trim()}` : `email you at ${form.email.trim()}`
    toast.success('Message sent', { description: `${ranch.owner} will ${how}, usually the same day.` })
    setSentTo(how)
  }

  const fieldProps = (key: keyof Form, hint?: boolean) => ({
    id: `${id}-${key}`,
    value: form[key],
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${id}-${key}-error` : hint ? `${id}-${key}-hint` : undefined,
  })
  const error = (key: keyof Form) =>
    errors[key] ? (
      <p id={`${id}-${key}-error`} className="text-sm font-medium text-destructive">
        {errors[key]}
      </p>
    ) : null

  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${ranch.location.address}, ${ranch.location.city}, ${ranch.location.state} ${ranch.location.zip}`,
  )}`

  return (
    <div className="container-page pb-16">
      <PageHeader title="Get in touch" description={`The fastest way is a phone call. ${ranch.owner} answers the phone ${ranch.hours}.`} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="form-heading" className="rounded-2xl border bg-card p-5 sm:p-6">
          {sentTo ? (
            <div className="grid justify-items-start gap-4 py-6" role="status">
              <CircleCheck className="size-12 text-success" aria-hidden />
              <h2 id="form-heading" className="text-3xl font-bold">
                Thanks, {form.name.trim().split(' ')[0]}
              </h2>
              <p className="text-lg">
                Your message is on its way. {ranch.owner} will {sentTo}, usually the same day. In a hurry? Call{' '}
                <a href={ranchPhoneHref} className="font-semibold text-primary underline-offset-4 hover:underline">
                  {ranch.phone}
                </a>
                .
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSentTo(null)
                  setForm((f) => ({ ...f, message: '' }))
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5">
              <h2 id="form-heading" className="text-2xl font-bold">
                Send a message
              </h2>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-name`}>Your name</Label>
                <Input {...fieldProps('name')} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
                {error('name')}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid content-start gap-2">
                  <Label htmlFor={`${id}-phone`}>Phone</Label>
                  <Input
                    {...fieldProps('phone', true)}
                    onChange={(e) => set('phone', e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {error('phone') ?? (
                    <p id={`${id}-phone-hint`} className="text-sm text-muted-foreground">
                      Phone or email, whichever you check.
                    </p>
                  )}
                </div>
                <div className="grid content-start gap-2">
                  <Label htmlFor={`${id}-email`}>Email</Label>
                  <Input {...fieldProps('email')} onChange={(e) => set('email', e.target.value)} type="email" autoComplete="email" />
                  {error('email')}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-topic`}>What it's about</Label>
                <Select value={form.topic} onValueChange={(v) => set('topic', v)}>
                  <SelectTrigger id={`${id}-topic`} className="w-full sm:w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-message`}>Message</Label>
                <Textarea {...fieldProps('message')} onChange={(e) => set('message', e.target.value)} rows={5} />
                {error('message')}
              </div>
              <Button type="submit" size="lg" className="justify-self-start">
                Send message
              </Button>
            </form>
          )}
        </section>

        <aside aria-label="Ranch contact details" className="grid content-start gap-5">
          <Button asChild size="lg" className="h-16 text-xl">
            <a href={ranchPhoneHref}>
              <Phone className="size-6" aria-hidden />
              Call {ranch.phone}
            </a>
          </Button>
          <dl className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6">
            {[
              {
                icon: MapPin,
                label: 'Ranch',
                value: (
                  <>
                    {ranch.location.address}
                    <br />
                    {ranch.location.city}, {ranch.location.state} {ranch.location.zip}
                  </>
                ),
              },
              { icon: Clock, label: 'Hours', value: ranch.hours },
              {
                icon: Mail,
                label: 'Email',
                value: (
                  <a href={`mailto:${ranch.email}`} className="text-primary underline-offset-4 hover:underline">
                    {ranch.email}
                  </a>
                ),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="min-w-0">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  {label}
                </dt>
                <dd className="pl-7 font-semibold break-words">{value}</dd>
              </div>
            ))}
          </dl>
          <figure className="overflow-hidden rounded-2xl border bg-card">
            <MapPlaceholder />
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
              <span className="text-muted-foreground">{ranchPlace}</span>
              <a
                href={directions}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
              >
                Get directions
                <ExternalLink className="size-4" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </figcaption>
          </figure>
        </aside>
      </div>
    </div>
  )
}
