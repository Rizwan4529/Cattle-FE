import { type FormEvent, useId, useState } from 'react'
import { BadgeCheck, Check, ChevronDown, Mail, Phone, ShieldCheck, Snowflake, Tractor, X } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Countdown } from '@/components/beef/Countdown'
import { CutImage } from '@/components/beef/CutImage'
import { FeedProgramCards } from '@/components/beef/FeedProgramCards'
import { FillMeter } from '@/components/beef/FillMeter'
import { PoolCard } from '@/components/beef/PoolCard'
import { AllNaturalBadge, FarrellQuote, StoryPoints } from '@/components/about/FarrellStory'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { BundleCard } from '@/components/shop/BundleCard'
import { Stars } from '@/components/shop/ShopBits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { beefConfig } from '@/config/beef'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { BEEF_FAQ } from '@/data/beefFaq'
import { BUNDLES, CUTS, REVIEWS } from '@/data/shop'
import { beefTitle, leftLabel, poolPhase, poolRows, useNow } from '@/lib/beef'
import { formatCurrency } from '@/lib/format'
import { useClaimActivity } from '@/lib/useClaimActivity'
import { usePageTitle } from '@/lib/usePageTitle'
import { segmentsLeft } from '@/lib/yield'
import { heldSegments, useRanchStore } from '@/store/useRanchStore'
import { WholeAnimalExplorer } from '@/components/goods/WholeAnimal'
import { FourWaysSection } from '@/components/home/FourWaysSection'
import { byproductsConfig } from '@/config/byproducts'

const STEPS = [
  { title: 'Pick your animal', body: 'Choose by feed program and breed. Every animal has an ear tag and a record you can read.' },
  { title: 'Claim a share', body: 'A whole, half, or quarter. A deposit holds it, and your name goes on its fill meter.' },
  { title: 'We harvest when it’s full', body: 'Nothing is harvested until every share is claimed. Then we book the processor.' },
  {
    title: 'Dry-aged, cut your way, delivered',
    body: `Aged ${beefConfig.dryAgeDays.min}–${beefConfig.dryAgeDays.max} days, cut to your cut sheet, frozen, and picked up or delivered.`,
  },
]

const COMPARE: { topic: string; ours: string; theirs: string }[] = [
  { topic: 'Where it came from', ours: 'One animal, raised here. Look it up by its ear tag.', theirs: 'Many farms and feedlots, mixed together.' },
  { topic: 'How it’s cut', ours: 'Your cut sheet: thickness, roast size, how much ground.', theirs: 'The same preset packs for everyone.' },
  { topic: 'What you pay', ours: 'Price per pound shown up front, on every share and pack.', theirs: 'Box prices that hide the price per pound.' },
  { topic: 'How it’s raised', ours: 'You choose grass-finished, grain-finished, or in between.', theirs: 'Usually not said.' },
  { topic: 'Who you talk to', ours: `${ranch.owner}, on his own phone.`, theirs: 'A call center.' },
]

function HeroPool() {
  const now = useNow(15_000)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const cart = useRanchStore((s) => s.cart)
  const held = heldSegments(cart, pools)
  // The open animal closest to filling: the most persuasive thing on the page.
  const row = poolRows(pools, animals, now, held)
    .filter((r) => poolPhase(r.pool, now) === 'open' && r.sizes.length)
    .sort((a, b) => segmentsLeft(a.pool, held.get(a.pool.id)) - segmentsLeft(b.pool, held.get(b.pool.id)))[0]

  if (!row) {
    return (
      <div className="grid gap-4 rounded-3xl border bg-background p-6 shadow-sm">
        <div className="aspect-video overflow-hidden rounded-2xl">
          <CutImage cut="ribeye" alt="A ribeye steak on butcher paper" />
        </div>
        <p className="text-lg">Every animal is claimed right now. The Butcher Shop has steaks, roasts, and ground beef ready to ship.</p>
        <Button asChild>
          <Link to="/shop">Shop cuts</Link>
        </Button>
      </div>
    )
  }

  const { pool, animal, fromQuote } = row
  return (
    <article className="grid gap-5 rounded-3xl border bg-background p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-primary">Filling now</p>
        <Countdown deadline={pool.deadline} />
      </div>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
        <CattleImage
          coat={animal.coatColor}
          sex={animal.sex}
          seed={animal.tagId}
          photos={animal.photos}
          alt={`${beefTitle(animal)}, ear tag ${animal.tagId}`}
        />
        <EarTag tagId={animal.tagId} className="absolute top-3 left-3" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{beefTitle(animal)}</h2>
        <p className="mt-1 font-semibold text-primary">Harvest locks in when this animal fills: {leftLabel(pool, held.get(pool.id))}.</p>
      </div>
      <FillMeter pool={pool} size="lg" held={held.get(pool.id) ?? 0} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p>
          <span className="text-sm text-muted-foreground">A {fromQuote.size} is </span>
          <span className="font-heading text-2xl font-bold tabular-nums">{formatCurrency(fromQuote.total)}</span>
          <span className="block text-sm text-muted-foreground tabular-nums">
            About {fromQuote.takeHomeLb} lb of beef, {formatCurrency(fromQuote.perTakeHomeLb, true)}/lb
          </span>
        </p>
        <Button asChild size="lg">
          <Link to={`/beef/${animal.tagId}`}>Claim a share</Link>
        </Button>
      </div>
    </article>
  )
}

function Newsletter() {
  const id = useId()
  const subscribe = useRanchStore((s) => s.subscribeNewsletter)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter your email address.')
      return document.getElementById(`${id}-email`)?.focus()
    }
    setError('')
    const fresh = subscribe(email)
    setDone(email.trim())
    toast.success(fresh ? 'You’re signed up' : 'You’re already on the list', { description: 'Ranch notes come once a month. Unsubscribe any time.' })
  }

  return (
    <section aria-labelledby={`${id}-title`} className="container-page py-14 lg:py-20">
      <div className="grid items-center gap-6 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div>
          <h2 id={`${id}-title`} className="text-3xl font-bold sm:text-4xl">
            Notes from the ranch
          </h2>
          <p className="mt-2 max-w-xl text-lg text-primary-foreground/85">
            Once a month: which animals are opening next, a recipe for a cut you haven’t tried, and what’s happening on the place. First pick on new
            animals goes to this list.
          </p>
        </div>
        {done ? (
          <p role="status" className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-4 text-lg">
            <Check className="size-6 shrink-0" aria-hidden />
            Thanks. Watch for the next one at {done}.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-2">
            <Label htmlFor={`${id}-email`} className="text-primary-foreground">
              Email
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-email-error` : undefined}
                className="bg-card text-foreground dark:bg-card"
              />
              <Button type="submit" size="lg" variant="secondary">
                <Mail aria-hidden />
                Sign up
              </Button>
            </div>
            {error && (
              <p id={`${id}-email-error`} className="font-medium">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}

export default function BeefHomePage() {
  usePageTitle()
  useClaimActivity()
  const now = useNow(30_000)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const products = useRanchStore((s) => s.products)
  const cart = useRanchStore((s) => s.cart)
  const held = heldSegments(cart, pools)
  const filling = poolRows(pools, animals, now, held)
    .filter((r) => poolPhase(r.pool, now) === 'open')
    .sort((a, b) => segmentsLeft(a.pool, held.get(a.pool.id)) - segmentsLeft(b.pool, held.get(b.pool.id)))
    .slice(0, 3)
  const reviews = REVIEWS.filter((r) => r.rating === 5).slice(0, 3)
  const faq = BEEF_FAQ[0].questions.slice(0, 4)

  return (
    <>
      <section className="bg-card">
        <div className="container-page grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_minmax(0,1fr)] lg:gap-14 lg:py-16">
          <div>
            <h1 className="text-5xl leading-[1.05] font-bold sm:text-6xl xl:text-7xl">Beef from one ranch. One animal. You choose which.</h1>
            <p className="mt-6 max-w-xl text-xl text-muted-foreground">
              Claim a share of a steer you can look up by its ear tag, or pick steaks and boxes from our freezer. Raised by the{' '}
              {ranch.family.replace(/^The /, '')} near {ranch.location.city}, {ranch.location.stateName}, since {ranch.established}.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-lg">
                <Link to="/beef">Claim your beef</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link to="/shop">Shop cuts</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2.5">
              {[
                { icon: BadgeCheck, text: 'Every share and every pack traced to one animal' },
                ...(beefConfig.claims.noAddedHormones ? [{ icon: ShieldCheck, text: 'No added hormones, no routine antibiotics' }] : []),
                { icon: Snowflake, text: `Dry-aged ${beefConfig.dryAgeDays.min}–${beefConfig.dryAgeDays.max} days, then cut the way you ask` },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <Icon className="size-5 shrink-0 text-success" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <HeroPool />
        </div>
      </section>

      <section aria-labelledby="how-heading" className="container-page py-14 lg:py-20">
        <h2 id="how-heading" className="text-3xl font-bold sm:text-4xl">
          How a share works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid content-start gap-3 rounded-2xl border bg-card p-5">
              <EarTag tagId={String(i + 1)} srLabel="Step" className="w-12 justify-self-start" />
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {filling.length > 0 && (
        <section aria-labelledby="filling-heading" className="bg-card py-14 lg:py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="filling-heading" className="text-3xl font-bold sm:text-4xl">
                  Animals filling now
                </h2>
                <p className="mt-2 text-lg text-muted-foreground">Names on the meter are neighbors who’ve claimed a share.</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/beef">See every animal</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filling.map((row) => (
                <li key={row.pool.id} className="grid">
                  <PoolCard row={row} now={now} held={held.get(row.pool.id) ?? 0} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {beefConfig.sellByTheCut && (
        <section aria-labelledby="cuts-heading" className="container-page py-14 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="cuts-heading" className="text-3xl font-bold sm:text-4xl">
                Or shop by the cut
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">Every pack is labeled with the ear tag of the animal it came from.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/shop">The whole Butcher Shop</Link>
            </Button>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CUTS.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/shop?cut=${c.id}`}
                  className="group grid overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="block aspect-4/3 overflow-hidden">
                    <CutImage cut={c.id} alt="" className="transition-transform duration-500 group-hover:scale-[1.04]" />
                  </span>
                  <span className="grid gap-0.5 p-3">
                    <span className="font-heading text-lg font-bold">{c.label}</span>
                    <span className="text-sm text-muted-foreground">{c.blurb}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="programs-heading" className="bg-card py-14 lg:py-20">
        <div className="container-page">
          <h2 id="programs-heading" className="text-3xl font-bold sm:text-4xl">
            You choose how it was raised
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Three ways we finish our cattle. Each tastes different; none is better than the others.
          </p>
          <FeedProgramCards className="mt-8" />
        </div>
      </section>

      {beefConfig.sellByTheCut && (
        <section aria-labelledby="boxes-heading" className="container-page py-14 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="boxes-heading" className="text-3xl font-bold sm:text-4xl">
              Boxes we put together
            </h2>
            <Button asChild variant="outline">
              <Link to="/shop/build-a-box">Build your own box</Link>
            </Button>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {BUNDLES.filter((b) => !b.gift).map((b) => (
              <li key={b.id} className="grid">
                <BundleCard bundle={b} products={products} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="compare-heading" className="bg-card py-14 lg:py-20">
        <div className="container-page">
          <h2 id="compare-heading" className="text-3xl font-bold sm:text-4xl">
            Why not mail-order steaks?
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Mail-order is convenient. We’re convenient too, and you know exactly what you’re eating.
          </p>
          <div
            className="mt-8 overflow-x-auto rounded-2xl border bg-background"
            tabIndex={0}
            role="region"
            aria-label="Comparison with mail-order steaks, scrollable table"
          >
            <table className="w-full min-w-[40rem] text-left">
              <caption className="sr-only">{ranch.name} compared with typical mail-order steaks</caption>
              <thead>
                <tr className="border-b [&_th]:px-5 [&_th]:py-4">
                  <th scope="col" className="w-1/4">
                    <span className="sr-only">Topic</span>
                  </th>
                  <th scope="col" className="font-heading text-xl font-bold text-primary">
                    {ranch.name}
                  </th>
                  <th scope="col" className="font-heading text-xl font-bold text-muted-foreground">
                    Typical mail-order steaks
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.topic} className="border-b last:border-b-0 [&_td]:px-5 [&_td]:py-4 [&_td]:align-top">
                    <th scope="row" className="px-5 py-4 align-top font-semibold">
                      {row.topic}
                    </th>
                    <td>
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                        {row.ours}
                      </span>
                    </td>
                    <td className="text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <X className="mt-0.5 size-5 shrink-0" aria-hidden />
                        {row.theirs}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {byproductsConfig.enabled && (
        <section aria-labelledby="whole-heading" className="container-page py-14 lg:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 id="whole-heading" className="text-3xl font-bold sm:text-4xl">
                One animal, nothing wasted
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Beef is most of it, but not all. Tap any part to see what it becomes and what’s in Ranch Goods from it now.
              </p>
            </div>
            <Button asChild variant="outline" size="lg">
              <Link to="/nothing-wasted">Nose to tail, explained</Link>
            </Button>
          </div>
          <WholeAnimalExplorer />
        </section>
      )}

      <FourWaysSection />

      <section aria-labelledby="rancher-heading" className="bg-leather py-14 text-leather-foreground lg:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="aspect-4/3 overflow-hidden rounded-3xl">
            <CattleImage coat="black" sex="cow" withCalf pose="grazing" seed="meet-the-rancher" alt="Cows and calves grazing on the ranch" />
          </div>
          <div>
            <h2 id="rancher-heading" className="text-3xl font-bold sm:text-4xl">
              Meet the rancher
            </h2>
            <p className="mt-4 text-lg text-leather-foreground/85">
              {ranch.family} has run cattle on {ranch.acres.toLocaleString()} acres in {ranch.location.county} since {ranch.established}. For most of
              that time, every calf left on a truck to a sale barn, and we never knew who ate the beef.
            </p>
            <h3 className="mt-8 font-heading text-2xl font-bold">{ranch.story.heading}</h3>
            <p className="mt-2 text-lg text-leather-foreground/85">{ranch.story.lede}</p>
            <AllNaturalBadge className="mt-4 border-leather-foreground/30 bg-leather-foreground/10 text-leather-foreground" />
            <StoryPoints onDark headingLevel={4} className="mt-6 gap-y-5 sm:grid-cols-1" />
            <FarrellQuote onDark className="mt-8" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <a href={ranchPhoneHref}>
                  <Phone aria-hidden />
                  Call {ranch.owner.split(' ')[0]}, {ranch.phone}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-leather-foreground/40 bg-transparent text-leather-foreground hover:bg-leather-foreground/10"
              >
                <Link to="/about">
                  <Tractor aria-hidden />
                  Farrell’s story
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="reviews-heading" className="container-page py-14 lg:py-20">
        <h2 id="reviews-heading" className="text-3xl font-bold sm:text-4xl">
          What families say
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => {
            const p = products.find((x) => x.id === r.productId)
            return (
              <li key={r.id} className="grid content-start gap-3 rounded-2xl border bg-card p-6">
                <Stars rating={r.rating} size="lg" />
                <p className="font-heading text-xl font-bold">{r.title}</p>
                <p className="text-lg">“{r.body}”</p>
                <p className="text-sm text-muted-foreground">
                  {r.name}, {r.city}
                  {p && (
                    <>
                      {' '}
                      on{' '}
                      <Link to={`/shop/${p.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                        {p.name}
                      </Link>
                    </>
                  )}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="faq-heading" className="bg-card py-14 lg:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div>
            <h2 id="faq-heading" className="text-3xl font-bold sm:text-4xl">
              Questions families ask
            </h2>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/faq#buying-beef">All beef questions</Link>
            </Button>
          </div>
          <div className="divide-y rounded-2xl border bg-background">
            {faq.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-lg font-semibold hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="max-w-[70ch] px-5 pb-5 text-lg">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  )
}
