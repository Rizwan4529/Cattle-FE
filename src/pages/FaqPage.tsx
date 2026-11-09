import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { depositPercent } from '@/lib/checkout'
import { usePageTitle } from '@/lib/usePageTitle'

interface Topic {
  id: string
  title: string
  questions: { q: string; a: string }[]
}

const TOPICS: Topic[] = [
  {
    id: 'inspection',
    title: 'Inspection',
    questions: [
      {
        q: 'Can I see the cattle before I buy?',
        a: `Yes. Call ${ranch.phone} and come out by appointment (${ranch.hours}). We'll have the lot penned so you can look them over and watch them move.`,
      },
      {
        q: "What if they aren't as described when I get there?",
        a: "Then don't take them. If the cattle don't match the listing, the deposit is refunded in full, no argument. That's the point of every animal having a record.",
      },
      {
        q: 'How accurate are the camera weights?',
        a: 'The chute camera is usually within 2 to 3 percent of a scale weight, and each scan shows how sure the camera was. Cattle are weighed on our scale at loading, and you get the ticket.',
      },
    ],
  },
  {
    id: 'health',
    title: 'Health papers',
    questions: [
      {
        q: 'What health records come with the cattle?',
        a: "Every shot, wormer, and treatment, with the product and date, is on each animal's record. Open any ear tag to see it, and print it for your files.",
      },
      {
        q: 'Do you provide a health certificate for out-of-state buyers?',
        a: 'Yes. Our veterinarian writes the Certificate of Veterinary Inspection (CVI) before cattle cross a state line. It is included in the price.',
      },
      {
        q: 'Have any of the cattle been treated for sickness?',
        a: "Any treatment is on the animal's record with the product, date, and withdrawal period. Cattle still inside a withdrawal period are not listed for sale.",
      },
    ],
  },
  {
    id: 'brand',
    title: 'Brand inspection',
    questions: [
      {
        q: 'Do I need a brand inspection?',
        a: `${ranch.location.stateName} doesn't require one, but some states do when cattle come in, mostly in the West. Tell us where they're going and we'll arrange it before loading.`,
      },
      {
        q: 'Are your cattle branded?',
        a: `Our cattle carry the ${ranch.initials} brand on the left hip, plus our ${ranch.tagPrefix} ear tag and an electronic ID. The tag number on the listing is the one in the animal's ear.`,
      },
    ],
  },
  {
    id: 'freight',
    title: 'Freight and pickup',
    questions: [
      {
        q: 'Can you deliver?',
        a: 'Yes. We book a hauler we trust and add the freight to your balance. The cart shows an estimate for your ZIP code before you buy.',
      },
      {
        q: 'Can I haul them myself?',
        a: "Of course. We have a loading chute that fits a gooseneck or a pot, and a scale for the loading weights. Pick a day inside the lot's pickup window.",
      },
      {
        q: 'What is shrink?',
        a: 'Cattle lose some weight on the truck, mostly water and fill: about 2 percent on a short haul and more on a long one. The freight estimate shows the expected shrink for your distance.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    questions: [
      {
        q: 'How does payment work?',
        a: `A ${depositPercent} deposit by card at checkout holds the cattle. The balance is due at loading, by check or wire. This website is a demo, so no real payment is taken.`,
      },
      {
        q: 'How do offers work?',
        a: `Make an offer on the whole lot or, where allowed, part of it. ${ranch.owner} accepts, counters, or declines, usually within a day, and calls you either way.`,
      },
      {
        q: 'Are cattle priced by the head or by weight?',
        a: 'By the head, with the price per hundredweight shown so you can compare with sale barn reports. If the average weight at loading comes in more than 4 percent under the listing, the price is adjusted by the difference.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns and disputes',
    questions: [
      {
        q: 'What if an animal gets sick or dies before pickup?',
        a: "Cattle are our responsibility until they're loaded. If something happens before then, we replace the animal with a matching one or refund its share of the price.",
      },
      {
        q: 'What about after they leave the ranch?',
        a: 'Ownership and risk pass to you at loading. If something seems wrong in the first 48 hours, call us anyway. We stand behind our cattle and want to hear about it.',
      },
      {
        q: 'What if we disagree about something?',
        a: `Call ${ranch.owner} first; most things are settled on the phone. Anything left is settled by a neutral livestock market representative both sides agree on.`,
      },
    ],
  },
]

export default function FaqPage() {
  usePageTitle('Questions and answers')
  return (
    <div className="container-page pb-16">
      <PageHeader title="Questions and answers" description="What buyers ask most about inspection, paperwork, freight, and payment." />

      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Topics" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:grid lg:gap-1">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border bg-card px-4 font-medium hover:bg-muted lg:w-full lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-3"
                >
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-12">
          {TOPICS.map((t) => (
            <section key={t.id} id={t.id} aria-labelledby={`${t.id}-heading`} className="grid scroll-mt-28 gap-3">
              <h2 id={`${t.id}-heading`} className="text-3xl font-bold">
                {t.title}
              </h2>
              <div className="divide-y rounded-2xl border bg-card">
                {t.questions.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-lg font-semibold hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="max-w-[70ch] px-5 pb-5 text-lg">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-2xl bg-leather p-6 text-leather-foreground sm:p-8">
            <h2 className="text-2xl font-bold">Didn't find your answer?</h2>
            <p className="mt-2 text-lg text-leather-foreground/85">
              Call{' '}
              <a href={ranchPhoneHref} className="font-semibold text-tag underline-offset-4 hover:underline">
                {ranch.phone}
              </a>{' '}
              or{' '}
              <Link to="/contact" className="font-semibold text-tag underline-offset-4 hover:underline">
                send a message
              </Link>
              . {ranch.hours}.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
