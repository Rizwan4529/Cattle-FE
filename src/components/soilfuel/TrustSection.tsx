import { useId } from 'react'
import { Beef, BadgeCheck, Check, Flame, Recycle, Sprout, Tractor, Wheat, X } from 'lucide-react'
import { ranch } from '@/config/ranch'
import { soilFuelConfig } from '@/config/soilFuel'
import { LoopGraphic } from './LoopGraphic'

const STEPS = [
  { label: 'Our pasture', detail: 'Native grass and alfalfa', icon: Wheat },
  { label: 'Our cattle', detail: 'Graze it, every ear-tagged', icon: Beef },
  { label: 'Manure + hay', detail: 'From the pens and feed ground', icon: Tractor },
  { label: 'Hot composting', detail: '131 °F and up, turned often', icon: Flame },
  { label: 'Cured & screened', detail: 'Months of curing', icon: Recycle },
  { label: 'Your soil', detail: 'And back on our pasture', icon: Sprout },
]

/** "From our herd to your soil": what's in it, what's not, the loop, and (once confirmed) the lab-tested badge. */
export function TrustSection() {
  const id = useId()
  const { trust } = soilFuelConfig
  return (
    <section aria-labelledby={id} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-6">
        <div>
          <h2 id={id} className="text-3xl font-bold sm:text-4xl">
            From our herd to your soil
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            One ranch, start to finish. {ranch.owner} built an organic fertilizer business before {ranch.name}; this is the same craft, made only from
            our own animals and hay.
          </p>
        </div>
        {trust.labTested && (
          <p className="flex items-start gap-3 rounded-xl border-2 border-success/50 bg-success/10 p-4">
            <BadgeCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
            <span>
              <strong className="block text-lg">Lab tested</strong>
              {trust.labTestedNote}
            </span>
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xl font-bold">What’s in it</h3>
            <ul className="mt-3 grid gap-2">
              {trust.whatsIn.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-1 size-5 shrink-0 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold">What’s not</h3>
            <ul className="mt-3 grid gap-2">
              {trust.whatsNot.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <X className="mt-1 size-5 shrink-0 text-destructive" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <LoopGraphic
        steps={STEPS}
        label="How CROWDER Soil is made, from pasture back to soil"
        center={
          <p className="font-heading text-xl leading-tight font-bold">
            {soilFuelConfig.soil.brand}
            <span className="mt-1 block font-sans text-sm font-normal text-muted-foreground">Nothing leaves the loop</span>
          </p>
        }
      />
    </section>
  )
}
