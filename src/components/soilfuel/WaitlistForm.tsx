import { type FormEvent, useId, useState } from 'react'
import { BellRing, Check } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '@/components/forms/FormField'
import { EMAIL, fieldAria, focusFirstError } from '@/lib/forms'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { soilFuelConfig } from '@/config/soilFuel'
import type { Division, FuelProductId, SoilProductId } from '@/data/soilFuelTypes'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

type Interest = SoilProductId | FuelProductId

/** Launch-season waitlist: first pick and launch pricing. Saved to the owner's list. */
export function WaitlistForm({ division, className }: { division: Division; className?: string }) {
  const id = useId()
  const join = useRanchStore((s) => s.joinWaitlist)
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const products = (division === 'soil' ? soilFuelConfig.soil.products : soilFuelConfig.fuel.products).filter((p) => enabled[p.id])
  const { launch } = soilFuelConfig.soil
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [zip, setZip] = useState('')
  const [interests, setInterests] = useState<Interest[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!EMAIL.test(email.trim())) found.email = 'Enter your email so we can tell you when it’s ready.'
    if (zip && !/^\d{5}$/.test(zip)) found.zip = 'Enter a 5-digit ZIP, or leave it blank.'
    if (!interests.length) found.interests = 'Pick at least one product.'
    setErrors(found)
    if (focusFirstError(id, ['email', 'zip', 'interests'], found)) return
    const added = join({ name: name.trim(), email: email.trim(), zip, interests })
    if (!added) {
      toast('You’re already on the list', { description: `We’ll email ${email.trim()} when ${launch.season.toLowerCase()} orders open.` })
    } else {
      toast.success('You’re on the list', { description: `We’ll email ${email.trim()} before ${launch.season}.` })
    }
    setDone(email.trim())
    setName('')
    setEmail('')
    setZip('')
    setInterests([])
  }

  return (
    <section aria-labelledby={`${id}-title`} className={cn('grid gap-5 rounded-2xl bg-leather p-5 text-leather-foreground sm:p-8', className)}>
      <div>
        <h2 id={`${id}-title`} className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <BellRing className="size-7 text-tag" aria-hidden />
          {launch.open ? 'Pre-order for the season' : `Get first pick in ${launch.season}`}
        </h2>
        <p className="mt-2 max-w-[60ch] text-lg text-leather-foreground/85">{launch.note}</p>
      </div>
      {done && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-leather-foreground/10 px-4 py-3">
          <Check className="size-5 shrink-0 text-tag" aria-hidden />
          Thanks! {done} is on the list.
        </p>
      )}
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-3 [&_label]:text-leather-foreground [&_.text-destructive]:text-tag">
        <FormField id={`${id}-name`} label="Name (optional)">
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="h-11 bg-card text-foreground"
          />
        </FormField>
        <FormField id={`${id}-email`} label="Email" error={errors.email}>
          <Input
            {...fieldAria(`${id}-email`, errors.email)}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-11 bg-card text-foreground"
          />
        </FormField>
        <FormField id={`${id}-zip`} label="ZIP (optional)" error={errors.zip}>
          <Input
            {...fieldAria(`${id}-zip`, errors.zip)}
            inputMode="numeric"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            autoComplete="postal-code"
            className="h-11 bg-card text-foreground"
          />
        </FormField>
        <fieldset className="grid gap-2 sm:col-span-3" aria-describedby={errors.interests ? `${id}-interests-error` : undefined}>
          <legend className="mb-2 font-medium">Tell me about</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {products.map((p, i) => (
              <label key={p.id} className="flex min-h-11 items-center gap-2">
                <Checkbox
                  id={i === 0 ? `${id}-interests` : undefined}
                  checked={interests.includes(p.id)}
                  onCheckedChange={(on) => setInterests((x) => (on ? [...x, p.id] : x.filter((y) => y !== p.id)))}
                  className="border-leather-foreground/60 bg-card"
                />
                {p.name}
              </label>
            ))}
          </div>
          {errors.interests && (
            <p id={`${id}-interests-error`} className="text-sm font-medium text-tag">
              {errors.interests}
            </p>
          )}
        </fieldset>
        <Button type="submit" size="lg" className="bg-tag text-tag-foreground hover:bg-tag/90 sm:col-span-3 sm:justify-self-start">
          <BellRing aria-hidden />
          Join the list
        </Button>
      </form>
    </section>
  )
}
