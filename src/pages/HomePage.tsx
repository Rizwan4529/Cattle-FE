import { BadgeCheck, Phone, ShieldCheck, Trees } from 'lucide-react'
import { Link } from 'react-router'
import { FeaturedLots } from '@/components/home/FeaturedLots'
import { HeroScanCard } from '@/components/home/HeroScanCard'
import { HowItWorksSteps } from '@/components/home/HowItWorksSteps'
import { MarketTicker } from '@/components/home/MarketTicker'
import { StatsStrip } from '@/components/home/StatsStrip'
import { Button } from '@/components/ui/button'
import { ranch, ranchPhoneHref } from '@/config/ranch'
import { usePageTitle } from '@/lib/usePageTitle'

const PROMISES = [
  { icon: ShieldCheck, text: 'Beef Quality Assurance (BQA) certified' },
  { icon: BadgeCheck, text: 'Age and source verified' },
  { icon: Trees, text: 'Cattle stay on our pasture until sold' },
]

export default function HomePage() {
  usePageTitle()

  return (
    <>
      <section className="bg-card">
        <div className="container-page grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
          <div>
            <h1 className="text-5xl font-bold sm:text-6xl xl:text-7xl">
              Ranch-direct cattle. Every animal tagged, scanned, and verified.
            </h1>
            <p className="mt-6 max-w-xl text-xl text-muted-foreground">
              Buy straight from {ranch.name} in {ranch.location.stateName}. Each head comes with its weights, shots, and
              camera scans, so you know what you're getting before the trailer backs up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/cattle">Browse cattle</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2.5">
              {PROMISES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <Icon className="size-5 shrink-0 text-success" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <HeroScanCard />
        </div>
      </section>

      <StatsStrip />
      <MarketTicker />
      <FeaturedLots />
      <HowItWorksSteps />

      <section className="container-page py-14 lg:py-20">
        <div className="grid items-center gap-6 rounded-2xl bg-primary p-8 text-primary-foreground sm:p-10 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Rather talk it over?</h2>
            <p className="mt-2 max-w-xl text-lg text-primary-foreground/85">
              Call {ranch.owner} directly to hear what's ready to ship and what's coming, or to set up a time to see
              the cattle in person.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <a href={ranchPhoneHref}>
              <Phone aria-hidden />
              {ranch.phone}
            </a>
          </Button>
        </div>
      </section>
    </>
  )
}
