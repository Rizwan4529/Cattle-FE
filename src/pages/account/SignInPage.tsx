import { type FormEvent, useId, useState } from 'react'
import { LogIn, ShieldCheck } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

/** Mock sign-in: no password check and nothing leaves the browser. */
export default function SignInPage() {
  usePageTitle('Sign in')
  const id = useId()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')?.startsWith('/') ? params.get('next')! : '/account'
  const account = useRanchStore((s) => s.account)
  const lastOrder = useRanchStore((s) => s.orders[0])
  const signIn = useRanchStore((s) => s.signIn)
  const [name, setName] = useState(lastOrder?.buyer.name ?? '')
  const [email, setEmail] = useState(lastOrder?.buyer.email ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  if (account) return <Navigate to={next} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    if (!name.trim()) found.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Enter your email.'
    setErrors(found)
    if (found.name || found.email) {
      document.getElementById(`${id}-${found.name ? 'name' : 'email'}`)?.focus()
      return
    }
    signIn({ name: name.trim(), email: email.trim(), phone: lastOrder?.buyer.phone ?? '' })
    toast.success(`Welcome, ${name.trim().split(' ')[0]}`)
    navigate(next, { replace: true })
  }

  return (
    <div className="container-page grid max-w-lg gap-6 py-12">
      <div>
        <h1 className="text-4xl font-bold sm:text-5xl">Sign in</h1>
        <p className="mt-3 text-lg text-muted-foreground">See your orders, follow your shares from pasture to freezer, and manage your Ranch Box.</p>
      </div>
      <p role="note" className="flex items-start gap-3 rounded-xl border-2 border-dashed border-warning bg-warning/10 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-warning-foreground dark:text-warning" aria-hidden />
        <span>
          <strong className="font-semibold">Demo sign-in.</strong> Any password works, and nothing is sent anywhere. Your account lives in this
          browser.
        </span>
      </p>
      <form onSubmit={submit} noValidate className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-name`}>Your name</Label>
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
          />
          {errors.name && (
            <p id={`${id}-name-error`} className="text-sm font-medium text-destructive">
              {errors.name}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-email`}>Email</Label>
          <Input
            id={`${id}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${id}-email-error` : undefined}
          />
          {errors.email && (
            <p id={`${id}-email-error`} className="text-sm font-medium text-destructive">
              {errors.email}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-password`}>Password</Label>
          <Input
            id={`${id}-password`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" size="lg" className="text-lg">
          <LogIn aria-hidden />
          Sign in
        </Button>
        <p className="text-sm text-muted-foreground">New here? Signing in creates your account.</p>
      </form>
    </div>
  )
}
