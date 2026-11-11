import { useState } from 'react'
import { CalendarCheck, PauseCircle, Repeat, ShoppingCart, SkipForward } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CutImage } from '@/components/beef/CutImage'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Choices } from '@/components/shop/Choices'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId, SubscriptionFrequency, SubscriptionSize } from '@/data/beefTypes'
import { SUBSCRIPTION_PLANS } from '@/data/shop'
import { formatCurrency } from '@/lib/format'
import { FREQUENCY_LABELS, shipDateLabel as dateLabel, shipDates, subscriptionPlan } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

export default function RanchBoxPage() {
  usePageTitle('Ranch Box subscription')
  const navigate = useNavigate()
  const addSubscriptionToCart = useRanchStore((s) => s.addSubscriptionToCart)
  const [dates] = useState(() => shipDates())
  const [size, setSize] = useState<SubscriptionSize>('medium')
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly')
  const [feed, setFeed] = useState<FeedProgramId | 'any'>('any')
  const [firstShip, setFirstShip] = useState(dates[0])
  const plan = subscriptionPlan(size)

  const add = () => {
    addSubscriptionToCart({ size, frequency, feedPreference: feed, firstShip })
    toast.success(`Ranch Box, ${plan.label}, added to your cart`, {
      description: `${formatCurrency(plan.price)} ${FREQUENCY_LABELS[frequency].toLowerCase()}. First box ships ${dateLabel(firstShip)}.`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="The Ranch Box"
        description="A box of our beef at your door every month or two, picked by the Farrell family from what’s in the freezer. Skip a box or pause any time from your account."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid min-w-0 content-start gap-8">
          <Choices
            legend="1. Box size"
            value={size}
            onChange={setSize}
            className="md:grid-cols-3"
            options={SUBSCRIPTION_PLANS.map((p) => ({
              value: p.size,
              label: `${p.label}, about ${p.lb} lb`,
              extra: formatCurrency(p.price),
              hint: `Feeds ${p.serves}. ${p.contents}.`,
            }))}
          />
          <Choices
            legend="2. How often"
            value={frequency}
            onChange={setFrequency}
            className="sm:grid-cols-2"
            options={(Object.keys(FREQUENCY_LABELS) as SubscriptionFrequency[]).map((f) => ({
              value: f,
              label: FREQUENCY_LABELS[f],
              hint: f === 'monthly' ? 'Most families start here.' : 'Good for smaller freezers.',
            }))}
          />
          <Choices
            legend="3. Feed program"
            value={feed}
            onChange={setFeed}
            className="sm:grid-cols-2"
            options={[
              { value: 'any' as const, label: 'Surprise me', hint: 'A mix of whatever’s best that month.' },
              ...beefConfig.feedPrograms.map((p) => ({ value: p.id, label: p.name, hint: p.flavor })),
            ]}
          />
          <Choices
            legend="4. First box ships"
            value={firstShip}
            onChange={setFirstShip}
            className="sm:grid-cols-2"
            options={dates.map((d, i) => ({ value: d, label: dateLabel(d), hint: i === 0 ? 'Soonest' : undefined }))}
          />
        </div>

        <aside aria-labelledby="sub-summary" className="grid content-start gap-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-28 lg:self-start">
          <div className="aspect-video overflow-hidden rounded-xl">
            <CutImage cut="ribeye" seed={`ranch-box-${size}`} alt="" />
          </div>
          <h2 id="sub-summary" className="text-2xl font-bold">
            Your Ranch Box
          </h2>
          <dl className="grid gap-2">
            {[
              ['Size', `${plan.label}, about ${plan.lb} lb`],
              ['How often', FREQUENCY_LABELS[frequency]],
              ['Feed program', feed === 'any' ? 'Surprise me' : beefConfig.feedPrograms.find((p) => p.id === feed)!.short],
              ['First box', dateLabel(firstShip)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t pt-3">
            <span className="font-heading text-3xl font-bold">{formatCurrency(plan.price)}</span>
            <span className="text-muted-foreground"> per box, shipping included</span>
          </p>
          <Button size="lg" onClick={add}>
            <ShoppingCart aria-hidden />
            Add subscription to cart
          </Button>
          <ul className="grid gap-2 text-sm">
            <li className="flex items-start gap-2">
              <SkipForward className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Skip any box from your account before it ships.
            </li>
            <li className="flex items-start gap-2">
              <PauseCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Pause or cancel any time. No fees.
            </li>
            <li className="flex items-start gap-2">
              <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              We email you three days before each box ships.
            </li>
            <li className="flex items-start gap-2">
              <Repeat className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Every pack carries the ear tag of the animal it came from.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Want to choose every cut?{' '}
            <Link to="/shop/build-a-box" className="font-medium text-primary underline underline-offset-4">
              Build your own box
            </Link>{' '}
            instead.
          </p>
        </aside>
      </div>
    </div>
  )
}
