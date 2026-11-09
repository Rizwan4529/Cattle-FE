import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { EarTag } from '@/components/cattle/EarTag'
import { PageHeader } from '@/components/PageHeader'
import { ranch } from '@/config/ranch'
import { depositPercent } from '@/lib/checkout'
import { usePageTitle } from '@/lib/usePageTitle'

interface Step {
  title: string
  text: ReactNode
  link?: { to: string; label: string }
}

const BUYER_STEPS: Step[] = [
  {
    title: 'Find a lot and check the records',
    text: 'Every lot lists head count, weights, price per head and per hundredweight. Open any ear tag to see that animal’s shots, weights, and camera scans since birth.',
    link: { to: '/cattle', label: 'Browse cattle' },
  },
  {
    title: 'Buy it now or make an offer',
    text: `Buy now holds the lot at the asking price. Or make an offer, for the whole lot or part of it, and ${ranch.owner} calls you back within a day.`,
  },
  {
    title: `Pay a ${depositPercent} deposit`,
    text: 'The deposit holds the cattle for you. Nothing else is due until they load.',
    link: { to: '/faq#payment', label: 'How payment works' },
  },
  {
    title: 'See them, and get the paperwork',
    text: 'Come look the cattle over before loading. If they aren’t as described, you walk away and the deposit is refunded. The ranch arranges the health certificate and brand inspection.',
    link: { to: '/faq#inspection', label: 'Inspection and health papers' },
  },
  {
    title: 'Pick up or have them delivered',
    text: 'Haul them yourself (loading chute and scale on site), or the ranch books a hauler. The balance is due at loading.',
    link: { to: '/faq#freight', label: 'Freight and shrink' },
  },
]

const SELLER_STEPS: Step[] = [
  {
    title: 'Tag every calf',
    text: `Each calf gets a ${ranch.tagPrefix} ear tag and an electronic ID at birth. Shots and weights are recorded against that number for life.`,
  },
  {
    title: 'Run them through the camera chute',
    text: 'The tunnel reads the tag and records weight, frame score, body condition, and photos in seconds. The readings come out as a spreadsheet, one row per animal.',
    link: { to: '/scan', label: 'Watch the chute scan' },
  },
  {
    title: 'Group them into lots',
    text: 'Pick animals from the herd or straight from a scan. Title, price, and highlights are suggested from the records; nothing goes public until it’s published.',
    link: { to: '/dashboard/lots/new', label: 'Open the lot builder' },
  },
  {
    title: 'List online and send to partners',
    text: 'Lots go up on this site and, in one step, to sale barns, video auctions, and order buyers as a ready-to-use file or a printed lot sheet.',
    link: { to: '/dashboard/syndicate', label: 'Send to auction partners' },
  },
  {
    title: 'Answer offers and load out',
    text: 'Accept, counter, or decline offers from the dashboard. Sold lots come off the site everywhere at once, and the cattle stay home until pickup.',
    link: { to: '/dashboard?tab=offers', label: 'See the offers inbox' },
  },
]

function Steps({ id, title, intro, steps }: { id: string; title: string; intro: string; steps: Step[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="grid scroll-mt-28 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div>
        <h2 id={`${id}-heading`} className="text-3xl font-bold sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">{intro}</p>
      </div>
      <ol className="grid gap-8">
        {steps.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-4">
            <EarTag tagId={String(i + 1)} srLabel="Step" className="w-full" />
            <div>
              <h3 className="text-2xl font-bold">{s.title}</h3>
              <p className="mt-1 text-lg">{s.text}</p>
              {s.link && (
                <Link
                  to={s.link.to}
                  className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {s.link.label}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function HowItWorksPage() {
  usePageTitle('How it works')
  return (
    <div className="container-page pb-16">
      <PageHeader
        title="How it works"
        description="Buying cattle here works like buying from a neighbor, with every animal's paperwork in your hand before you decide."
      />
      <nav aria-label="On this page" className="mb-12 flex flex-wrap gap-3">
        <a href="#buyers" className="inline-flex min-h-11 items-center rounded-full border bg-card px-5 font-semibold hover:bg-muted">
          For buyers
        </a>
        <a href="#sellers" className="inline-flex min-h-11 items-center rounded-full border bg-card px-5 font-semibold hover:bg-muted">
          For the ranch
        </a>
      </nav>

      <div className="grid gap-20">
        <Steps id="buyers" title="Buying cattle" intro="Five steps from finding a lot to hauling it home." steps={BUYER_STEPS} />
        <Steps
          id="sellers"
          title="How the ranch lists them"
          intro="Behind every listing: the tag, the scan, and the records. This is the owner's side of the site."
          steps={SELLER_STEPS}
        />
        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Still have questions?</h2>
          <p className="mt-2 text-lg">
            Read the{' '}
            <Link to="/faq" className="font-semibold text-primary underline-offset-4 hover:underline">
              questions buyers ask most
            </Link>
            , or{' '}
            <Link to="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
              get in touch
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
