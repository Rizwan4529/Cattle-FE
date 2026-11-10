import { type FormEvent, useId, useState } from 'react'
import { BellRing, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId } from '@/data/beefTypes'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

type Choice = FeedProgramId | 'any'

const choiceText = (c: Choice) =>
  c === 'any' ? 'any animal' : `a new ${beefConfig.feedPrograms.find((p) => p.id === c)!.short.toLowerCase()} animal`

/** "Tell me when a new grass-finished animal opens." Saved to the store (no email is really sent). */
export function NotifyMe({ defaultProgram = 'grass-finished', title, className }: { defaultProgram?: Choice; title?: string; className?: string }) {
  const id = useId()
  const subscribe = useRanchStore((s) => s.subscribeNotify)
  const signups = useRanchStore((s) => s.notifySignups)
  const [email, setEmail] = useState('')
  const [program, setProgram] = useState<Choice>(defaultProgram)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ email: string; program: Choice } | null>(null)

  const already = signups.find((s) => s.feedProgram === program)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter your email so we can tell you.')
      document.getElementById(`${id}-email`)?.focus()
      return
    }
    setError('')
    subscribe({ email: email.trim(), feedProgram: program })
    setDone({ email: email.trim(), program })
    toast.success('You’re on the list', { description: `We’ll email ${email.trim()} when ${choiceText(program)} opens.` })
  }

  return (
    <section aria-labelledby={`${id}-title`} className={cn('grid gap-4 rounded-2xl border bg-card p-5 sm:p-6', className)}>
      <div className="flex items-start gap-3">
        <BellRing className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 id={`${id}-title`} className="text-2xl font-bold">
            {title ?? 'Get first pick of the next animal'}
          </h2>
          <p className="mt-1 text-muted-foreground">Shares go fast. We’ll email you the day a new animal opens, before anyone else hears.</p>
        </div>
      </div>

      {done ? (
        <p role="status" className="flex items-start gap-3 rounded-xl bg-success/12 p-4">
          <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <span>
            Done. We’ll email <strong className="font-semibold">{done.email}</strong> when {choiceText(done.program)} opens.{' '}
            <button type="button" onClick={() => setDone(null)} className="font-medium text-primary underline underline-offset-4">
              Add another
            </button>
          </span>
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] sm:items-end">
          <div className="grid content-start gap-2">
            <Label htmlFor={`${id}-email`}>Email</Label>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-email-error` : undefined}
            />
          </div>
          <div className="grid content-start gap-2">
            <Label htmlFor={`${id}-program`}>Tell me about</Label>
            <Select value={program} onValueChange={(v) => setProgram(v as Choice)}>
              <SelectTrigger id={`${id}-program`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {beefConfig.feedPrograms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.short}
                  </SelectItem>
                ))}
                <SelectItem value="any">Any animal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="lg">
            Notify me
          </Button>
          {error && (
            <p id={`${id}-email-error`} className="text-sm font-medium text-destructive sm:col-span-3">
              {error}
            </p>
          )}
          {already && !error && (
            <p className="text-sm text-muted-foreground sm:col-span-3">
              {already.email} is already on the {program === 'any' ? 'any-animal' : choiceText(program).replace(/^a new /, '')} list.
            </p>
          )}
        </form>
      )}
    </section>
  )
}
