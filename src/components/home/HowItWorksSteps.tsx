import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Camera, ClipboardList, HandCoins, Tag } from 'lucide-react'
import { Link } from 'react-router'
import { EarTag } from '@/components/cattle/EarTag'

const STEPS = [
  {
    title: 'Tag',
    icon: Tag,
    text: 'Every calf gets our ear tag and an electronic ID at birth. That number follows it for life.',
  },
  {
    title: 'Scan',
    icon: Camera,
    text: 'Cattle walk through our camera chute. It records weight, frame, body condition, and photos in seconds.',
  },
  {
    title: 'List',
    icon: ClipboardList,
    text: 'Animals are grouped into lots with every record attached, so you see exactly what you are buying.',
  },
  {
    title: 'Sell',
    icon: HandCoins,
    text: 'Buy it now or make an offer. The cattle stay on our pasture until pickup or delivery.',
  },
]

/** Tag → Scan → List → Sell. A line draws through the steps as they come into view. */
export function HowItWorksSteps() {
  const reduce = useReducedMotion()

  return (
    <section aria-labelledby="how-heading" className="border-y bg-card">
      <div className="container-page py-14 lg:py-20">
        <div className="max-w-2xl">
          <h2 id="how-heading" className="text-4xl font-bold sm:text-5xl">
            From pasture to your trailer
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">Four steps, and every one leaves a record you can check before you buy.</p>
        </div>

        <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
          {/* The alley the steps sit on */}
          <motion.span
            aria-hidden
            className="absolute top-8 bottom-8 left-[1.6rem] w-1 origin-top rounded-full bg-primary/30 md:top-8 md:right-[12%] md:bottom-auto md:left-[12%] md:h-1 md:w-auto md:origin-left"
            initial={reduce ? false : { scaleX: 0, scaleY: 0 }}
            whileInView={{ scaleX: 1, scaleY: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.li
                key={step.title}
                className="relative grid grid-cols-[3.5rem_1fr] content-start items-start gap-4 md:grid-cols-1 md:justify-items-center md:text-center"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: 0.15 + i * 0.25, duration: 0.4 }}
              >
                <EarTag tagId={String(i + 1)} srLabel="Step" size="lg" className="w-14 px-0 text-3xl sm:text-3xl" />
                <div>
                  <h3 className="flex items-center gap-2 text-3xl font-bold md:justify-center">
                    <Icon className="size-6 text-primary" aria-hidden />
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground md:mx-auto md:max-w-[16rem]">{step.text}</p>
                </div>
              </motion.li>
            )
          })}
        </ol>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/scan"
            className="inline-flex min-h-11 items-center gap-1.5 text-lg font-semibold text-primary underline-offset-4 hover:underline"
          >
            Watch a chute scan
            <ArrowRight className="size-5" aria-hidden />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex min-h-11 items-center gap-1.5 text-lg font-semibold text-primary underline-offset-4 hover:underline sm:ml-6"
          >
            How buying works
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
