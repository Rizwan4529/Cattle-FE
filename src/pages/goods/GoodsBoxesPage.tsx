import { useState } from 'react'
import { ChevronLeft, PauseCircle, ShoppingCart, SkipForward } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { GoodsImage } from '@/components/goods/GoodsImage'
import { PageHeader } from '@/components/PageHeader'
import { Choices } from '@/components/shop/Choices'
import { Button } from '@/components/ui/button'
import type { SubscriptionFrequency, SubscriptionSize } from '@/data/beefTypes'
import { GOODS_BOXES } from '@/data/goods'
import type { GoodsBoxPlan } from '@/data/goodsTypes'
import { formatCurrency } from '@/lib/format'
import { FREQUENCY_LABELS, shipDateLabel, shipDates } from '@/lib/shop'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const SIZES: SubscriptionSize[] = ['small', 'medium', 'large']

function BoxSection({ plan, dates }: { plan: GoodsBoxPlan; dates: string[] }) {
  const navigate = useNavigate()
  const goods = useRanchStore((s) => s.goods)
  const addSubscriptionToCart = useRanchStore((s) => s.addSubscriptionToCart)
  const [size, setSize] = useState<SubscriptionSize>('medium')
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly')
  const [firstShip, setFirstShip] = useState(dates[0])
  const chosen = plan.sizes[size]
  const includes = plan.includes.flatMap((id) => goods.find((g) => g.id === id) ?? [])

  const add = () => {
    addSubscriptionToCart({ size, frequency, feedPreference: 'any', firstShip, box: plan.id })
    toast.success(`${plan.name}, ${chosen.label}, added to your cart`, {
      description: `${formatCurrency(chosen.price)} ${FREQUENCY_LABELS[frequency].toLowerCase()}. First box ships ${shipDateLabel(firstShip)}.`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    })
  }

  return (
    <section id={plan.id} aria-labelledby={`${plan.id}-heading`} className="grid scroll-mt-28 gap-6 border-t pt-10 first:border-0 first:pt-0">
      <div className="max-w-3xl">
        <h2 id={`${plan.id}-heading`} className="text-3xl font-bold sm:text-4xl">
          {plan.name}
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">{plan.description}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid min-w-0 content-start gap-8">
          <Choices
            legend="1. Size"
            value={size}
            onChange={setSize}
            className="md:grid-cols-3"
            options={SIZES.map((s) => ({
              value: s,
              label: plan.sizes[s].label,
              extra: formatCurrency(plan.sizes[s].price),
              hint: `${plan.sizes[s].serves}. ${plan.sizes[s].contents}.`,
            }))}
          />
          <Choices
            legend="2. How often"
            value={frequency}
            onChange={setFrequency}
            className="sm:grid-cols-2"
            options={(Object.keys(FREQUENCY_LABELS) as SubscriptionFrequency[]).map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
          />
          <Choices
            legend="3. First box ships"
            value={firstShip}
            onChange={setFirstShip}
            className="sm:grid-cols-2"
            options={dates.map((d, i) => ({ value: d, label: shipDateLabel(d), hint: i === 0 ? 'Soonest' : undefined }))}
          />
        </div>

        <div
          aria-label={`Your ${plan.name}`}
          role="group"
          className="grid content-start gap-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-28 lg:self-start"
        >
          <div className="aspect-video overflow-hidden rounded-xl">
            <GoodsImage art={plan.art} seed={`${plan.id}-${size}`} alt="" />
          </div>
          <dl className="grid gap-2">
            {[
              ['Size', `${chosen.label} (${chosen.serves.toLowerCase()})`],
              ['How often', FREQUENCY_LABELS[frequency]],
              ['First box', shipDateLabel(firstShip)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm">{chosen.contents}.</p>
          <p className="border-t pt-3">
            <span className="font-heading text-3xl font-bold">{formatCurrency(chosen.price)}</span>
            <span className="text-muted-foreground"> per box, shipping included</span>
          </p>
          <Button size="lg" onClick={add}>
            <ShoppingCart aria-hidden />
            Add subscription to cart
          </Button>
          <div>
            <p className="text-sm font-semibold">Drawn from</p>
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {includes.map((g) => (
                <li key={g.id}>
                  <Link to={`/ranch-goods/${g.id}`} className="text-primary underline underline-offset-4">
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function GoodsBoxesPage() {
  usePageTitle('Dog Chew and Bone Broth Boxes')
  const [dates] = useState(() => shipDates())
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
        title="Ranch Goods boxes"
        description="Chews for the dog and bones for the stockpot, on the same schedule as a Ranch Box. Skip, pause, or cancel any time from your account."
      />
      <ul className="mb-10 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
        <li className="flex items-center gap-2">
          <SkipForward className="size-4 text-primary" aria-hidden />
          Skip any box before it ships
        </li>
        <li className="flex items-center gap-2">
          <PauseCircle className="size-4 text-primary" aria-hidden />
          Pause or cancel, no fees
        </li>
      </ul>
      <div className="grid gap-14">
        {GOODS_BOXES.map((plan) => (
          <BoxSection key={plan.id} plan={plan} dates={dates} />
        ))}
      </div>
    </div>
  )
}
