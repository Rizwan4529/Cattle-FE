import { Beef, Bone, Flame, Shovel, Sprout, Tractor, Wheat } from 'lucide-react'
import { Link } from 'react-router'
import { LoopGraphic } from '@/components/soilfuel/LoopGraphic'
import { byproductsConfig } from '@/config/byproducts'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { DIVISION_VARS, divisionColor } from '@/lib/divisionColors'
import { cn } from '@/lib/utils'

const WAYS = [
  {
    key: 'beef' as const,
    icon: Beef,
    title: 'Beef',
    text: 'Shares of one animal you choose, and steaks and boxes from the freezer.',
    to: '/beef',
    cta: 'Claim your beef',
    on: true,
  },
  {
    key: 'goods' as const,
    icon: Bone,
    title: 'Ranch Goods',
    text: 'Hides, tallow, bones, and chews: the rest of the animal, traced to its ear tag.',
    to: '/ranch-goods',
    cta: 'Shop Ranch Goods',
    on: byproductsConfig.enabled,
  },
  {
    key: 'soil' as const,
    icon: Shovel,
    title: 'Soil',
    text: 'Manure and our own alfalfa, composted and screened. By the bag or the truckload.',
    to: '/soil',
    cta: 'Shop soil',
    on: soilFuelConfig.soilEnabled,
  },
  {
    key: 'fuel' as const,
    icon: Flame,
    title: 'Fuel',
    text: 'Pressed, sun-dried fire logs and briquettes for fire pits and campfires.',
    to: '/fuel',
    cta: 'Shop fuel',
    on: soilFuelConfig.fuelEnabled,
  },
]

const LOOP = [
  { label: 'Pasture', detail: 'Native grass and alfalfa', icon: Wheat },
  { label: 'Cattle', detail: 'Raised and tagged here', icon: Tractor },
  { label: 'Beef', detail: 'And Ranch Goods', icon: Beef },
  { label: 'Manure + hay', detail: 'From pens and feed ground', icon: Sprout },
  { label: 'Compost', detail: 'Back on the pasture', icon: Shovel },
]

/** "One ranch, four ways it pays": Beef, Ranch Goods, Soil, and Fuel, and the loop that ties them together. */
export function FourWaysSection() {
  const ways = WAYS.filter((w) => w.on)
  return (
    <section aria-labelledby="four-ways-heading" className={cn('bg-card py-14 lg:py-20', DIVISION_VARS)}>
      <div className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <div>
            <h2 id="four-ways-heading" className="text-3xl font-bold sm:text-4xl">
              One ranch, {ways.length === 4 ? 'four' : ways.length} ways it pays
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              {ranch.tagline} The cattle graze the pasture, the beef feeds families, and what the herd leaves behind goes back into the ground as
              compost, or into a fire pit as fuel.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {ways.map(({ key, icon: Icon, title, text, to, cta }) => (
              <li key={key} className="relative grid content-start gap-2 rounded-2xl border bg-background p-5">
                <span aria-hidden className="absolute inset-x-5 top-0 h-1 rounded-b-full" style={{ background: divisionColor(key) }} />
                <Icon className="size-7 text-primary" aria-hidden />
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-muted-foreground">{text}</p>
                <Link to={to} className="mt-1 inline-flex min-h-10 items-center font-semibold text-primary underline-offset-4 hover:underline">
                  {cta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <LoopGraphic
          steps={LOOP}
          branch={soilFuelConfig.fuelEnabled ? { from: 3, label: 'Fuel logs', detail: 'Branch off: pressed and sun-dried', icon: Flame } : undefined}
          center={!soilFuelConfig.fuelEnabled ? <p className="font-heading text-xl font-bold">{ranch.name}</p> : undefined}
          label="How the ranch loops: pasture, cattle, beef, manure and hay, compost, and back to pasture, with fuel logs branching off manure and hay"
        />
      </div>
    </section>
  )
}
