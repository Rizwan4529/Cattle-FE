import { Handshake, Phone, ScrollText, Sprout, Tags } from 'lucide-react'
import { Link } from 'react-router'
import { FarrellStory } from '@/components/about/FarrellStory'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { formatNumber } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

const HISTORY = ranch.story.timeline

const VALUES = [
  {
    icon: Tags,
    title: 'Every animal has a record',
    text: 'Shots, weights, and camera scans are kept by ear tag from birth. You see the same records we do.',
  },
  {
    icon: Sprout,
    title: 'Sold from the pasture',
    text: 'Cattle stay on grass at home until they load, so they ship calm and fresh, not off a sale barn floor.',
  },
  {
    icon: ScrollText,
    title: 'Plain prices',
    text: 'Every lot shows the price per head and per hundredweight. No commission, no auction-day surprises.',
  },
  {
    icon: Handshake,
    title: 'A handshake still counts',
    text: `${ranch.owner} answers the phone. If cattle aren't as described when you come to look, you don't take them.`,
  },
]

const PHOTOS = [
  { coat: 'black', pose: 'grazing', seed: 'about-1', caption: 'Spring pairs on native shortgrass' },
  { coat: 'black-baldy', pose: 'standing', seed: 'about-2', caption: 'Bred heifers by the alfalfa meadow' },
  { coat: 'hereford', pose: 'grazing', seed: 'about-3', caption: 'The Hereford cows that started it all' },
] as const

export default function AboutPage() {
  usePageTitle('About CROWDER and Farrell')
  const head = useRanchStore((s) => s.animals.length)
  const years = new Date().getFullYear() - ranch.established

  return (
    <div className="pb-16">
      <section className="container-page grid gap-8 pt-8 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:pt-12">
        <div>
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
            On the same {ranch.location.county} grass since {ranch.established}
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg">
            {ranch.name} is a family cow-calf and stocker operation outside {ranch.location.city}, {ranch.location.stateName}. {ranch.family} has
            raised beef cattle here for {years} years, and {ranch.owner} still checks the cows every morning. {ranch.tagline}
          </p>
          <p className="mt-4 max-w-[60ch] text-lg text-muted-foreground">
            This website is how we sell now: cattle, beef, ranch goods, soil, and fuel, straight from the ranch, with every animal's record out in the
            open.
          </p>
        </div>
        <figure className="overflow-hidden rounded-2xl border shadow-sm">
          <div className="aspect-4/3">
            <CattleImage coat="black" sex="cow" withCalf seed="about-hero" pose="grazing" alt="A black cow and calf grazing on the ranch" />
          </div>
          <figcaption className="border-t bg-card px-4 py-3 text-muted-foreground">Fall-calving pairs on the north pasture</figcaption>
        </figure>
      </section>

      <section aria-label="The ranch in numbers" className="border-y bg-card">
        <dl className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            [`Since ${ranch.established}`, `${years} years in the family`],
            [`${formatNumber(ranch.acres)} acres`, 'Shortgrass prairie and irrigated alfalfa'],
            [`${head} head`, 'On the records today'],
            [`${ranch.story.generations} generations`, 'Working the same ground'],
          ].map(([value, label]) => (
            <div key={value}>
              <dt className="sr-only">{label}</dt>
              <dd className="font-heading text-3xl font-bold sm:text-4xl">{value}</dd>
              <dd className="text-muted-foreground">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="container-page grid gap-16 pt-14">
        <FarrellStory />

        <section aria-labelledby="story-heading" className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <h2 id="story-heading" className="text-3xl font-bold sm:text-4xl">
              How we got here
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Forty-some years of small changes, each one about knowing the cattle, and the land, better.
            </p>
          </div>
          <ol className="grid gap-6">
            {HISTORY.map((h) => (
              <li key={h.year} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-4">
                <EarTag tagId={h.year} srLabel="Year" className="w-full" />
                <p className="pt-1 text-lg">{h.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="values-heading" className="grid gap-8">
          <h2 id="values-heading" className="text-3xl font-bold sm:text-4xl">
            What we hold to
          </h2>
          <ul className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {VALUES.map((v) => {
              const Icon = v.icon
              return (
                <li key={v.title} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
                  <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold">{v.title}</h3>
                    <p className="mt-1 text-lg">{v.text}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="photos-heading" className="grid gap-6">
          <h2 id="photos-heading" className="text-3xl font-bold sm:text-4xl">
            Around the place
          </h2>
          <ul className="grid gap-5 sm:grid-cols-3">
            {PHOTOS.map((p) => (
              <li key={p.seed}>
                <figure className="overflow-hidden rounded-xl border bg-card">
                  <div className="aspect-4/3">
                    <CattleImage coat={p.coat} sex="cow" seed={p.seed} pose={p.pose} alt={p.caption} />
                  </div>
                  <figcaption className="px-4 py-3 text-muted-foreground">{p.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="visit-heading"
          className="grid gap-5 rounded-2xl bg-leather p-6 text-leather-foreground sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
        >
          <div>
            <h2 id="visit-heading" className="text-3xl font-bold sm:text-4xl">
              Come see the cattle
            </h2>
            <p className="mt-2 max-w-[60ch] text-lg text-leather-foreground/85">
              Buyers are welcome at the ranch by appointment ({ranch.hours}). Call ahead and we'll have the lot you're after penned up.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-tag text-tag-foreground hover:bg-tag/90">
              <a href={ranchPhoneHref}>
                <Phone aria-hidden />
                Call {ranch.phone}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-leather-foreground/40 bg-transparent text-leather-foreground hover:bg-leather-foreground/10 hover:text-leather-foreground"
            >
              <Link to="/cattle">Browse cattle</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
