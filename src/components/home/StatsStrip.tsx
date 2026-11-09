import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { siteActivity } from '@/data/market'
import { formatNumber } from '@/lib/format'
import { useLotRows } from '@/lib/useLotRows'

/** Counts up from zero the first time it scrolls into view. */
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, value, { duration: 1.1, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [inView, reduce, value])

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(reduce ? value : shown)}
      {suffix}
    </span>
  )
}

export function StatsStrip() {
  const rows = useLotRows()
  const listed = rows.filter((r) => r.lot.status !== 'sold')
  const head = listed.reduce((s, r) => s + r.stats.headCount, 0)
  const avgWeight = head ? Math.round(listed.reduce((s, r) => s + r.stats.avgWeight * r.stats.headCount, 0) / head) : 0

  const stats = [
    { label: 'Head available', value: head },
    { label: 'Lots listed', value: listed.length },
    { label: 'Average weight', value: avgWeight, suffix: ' lb' },
    { label: 'Buyers this month', value: siteActivity.buyersThisMonth },
  ]

  return (
    <section aria-label="Ranch at a glance" className="border-b bg-background">
      <div className="container-page py-8">
        <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex size-2.5" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
          On the ranch today
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-l-4 border-primary/70 pl-4">
              <dt className="text-muted-foreground">{s.label}</dt>
              <dd className="font-heading text-4xl font-bold sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
