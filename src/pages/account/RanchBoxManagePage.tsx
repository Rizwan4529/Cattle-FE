import { useId } from 'react'
import { PauseCircle, PlayCircle, Repeat, SkipForward, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId, Subscription, SubscriptionFrequency, SubscriptionSize } from '@/data/beefTypes'
import { SUBSCRIPTION_PLANS } from '@/data/shop'
import { formatCurrency, formatDate } from '@/lib/format'
import { FREQUENCY_LABELS, subscriptionPlan } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const id = useId()
  const update = useRanchStore((s) => s.updateSubscription)
  const skip = useRanchStore((s) => s.skipNextBox)
  const cancel = useRanchStore((s) => s.cancelSubscription)
  const plan = subscriptionPlan(sub.size)
  const paused = sub.status === 'paused'

  const change = (patch: Partial<Pick<Subscription, 'size' | 'frequency' | 'feedPreference'>>, what: string) => {
    update(sub.id, patch)
    toast.success(`${what} updated`, { description: 'Takes effect from your next box.' })
  }

  return (
    <li className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Repeat className="size-6 text-primary" aria-hidden />
            Ranch Box, {plan.label}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {formatCurrency(plan.price)} {FREQUENCY_LABELS[sub.frequency].toLowerCase()}, about {plan.lb} lb. Started {formatDate(sub.createdAt)}.
          </p>
        </div>
        <Badge variant={paused ? 'secondary' : 'default'} className="h-7 px-3 text-sm">
          {paused ? 'Paused' : 'Active'}
        </Badge>
      </div>

      <p className="rounded-lg bg-muted px-4 py-3 text-lg">
        {paused ? (
          'Paused. No boxes ship until you resume.'
        ) : (
          <>
            Next box ships <strong className="font-semibold">{formatDate(sub.nextShip)}</strong>.
          </>
        )}
        {sub.skipped.length > 0 && <span className="block text-sm text-muted-foreground">Skipped: {sub.skipped.map(formatDate).join(', ')}</span>}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-size`}>Box size</Label>
          <Select value={sub.size} onValueChange={(v) => change({ size: v as SubscriptionSize }, 'Box size')}>
            <SelectTrigger id={`${id}-size`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_PLANS.map((p) => (
                <SelectItem key={p.size} value={p.size}>
                  {p.label}, {formatCurrency(p.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-freq`}>How often</Label>
          <Select value={sub.frequency} onValueChange={(v) => change({ frequency: v as SubscriptionFrequency }, 'Schedule')}>
            <SelectTrigger id={`${id}-freq`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FREQUENCY_LABELS) as SubscriptionFrequency[]).map((f) => (
                <SelectItem key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-feed`}>Feed program</Label>
          <Select value={sub.feedPreference} onValueChange={(v) => change({ feedPreference: v as FeedProgramId | 'any' }, 'Feed program')}>
            <SelectTrigger id={`${id}-feed`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Surprise me</SelectItem>
              {beefConfig.feedPrograms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!paused && (
          <Button
            variant="outline"
            onClick={() => {
              skip(sub.id)
              toast.success('Next box skipped', { description: 'Your following box ships on the next regular date.' })
            }}
          >
            <SkipForward aria-hidden />
            Skip next box
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            update(sub.id, { status: paused ? 'active' : 'paused' })
            toast.success(paused ? 'Ranch Box resumed' : 'Ranch Box paused')
          }}
        >
          {paused ? <PlayCircle aria-hidden /> : <PauseCircle aria-hidden />}
          {paused ? 'Resume' : 'Pause'}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              <XCircle aria-hidden />
              Cancel subscription
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-heading text-2xl">Cancel your Ranch Box?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                No more boxes will ship. You can always start a new one. Want a break instead? Pause it and resume whenever you like.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="lg">Keep it</AlertDialogCancel>
              <AlertDialogAction
                size="lg"
                variant="destructive"
                onClick={() => {
                  cancel(sub.id)
                  toast('Ranch Box cancelled')
                }}
              >
                Cancel subscription
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  )
}

export default function RanchBoxManagePage() {
  usePageTitle('Ranch Box')
  const subscriptions = useRanchStore((s) => s.subscriptions)
  return (
    <>
      <AccountHeader title="Ranch Box" description="Change, skip, or pause your subscription. Changes apply from the next box." />
      {subscriptions.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <p className="text-lg">You don’t have a Ranch Box yet. Our beef at your door every month or two, picked by the Harmon family.</p>
          <Button asChild>
            <Link to="/shop/ranch-box">Start a Ranch Box</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-5">
          {subscriptions.map((s) => (
            <SubscriptionCard key={s.id} sub={s} />
          ))}
        </ul>
      )}
    </>
  )
}
