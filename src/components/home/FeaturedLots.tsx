import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { LotCard } from '@/components/lots/LotCard'
import { Button } from '@/components/ui/button'
import { ranch } from '@/config/ranch'
import { useLotRows } from '@/lib/useLotRows'

/**
 * Featured lots in a swipeable row. Uses native scroll snapping, so touch,
 * trackpad, and keyboard scrolling all work; the arrow buttons page by one card.
 */
export function FeaturedLots() {
  const rows = useLotRows().filter((r) => r.lot.featured && r.lot.status !== 'sold')
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const updateEdges = () => {
    const el = trackRef.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [])

  const page = (dir: 1 | -1) => {
    const el = trackRef.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 24), behavior: 'smooth' })
  }

  if (!rows.length) return null

  return (
    <section aria-labelledby="featured-heading" className="container-page py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="featured-heading" className="text-4xl font-bold sm:text-5xl">
            Featured this week
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">Picked by {ranch.owner} from what's on the ranch right now.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => page(-1)} disabled={edges.start} aria-label="Previous lots">
            <ChevronLeft className="size-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => page(1)} disabled={edges.end} aria-label="More lots">
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        tabIndex={0}
        aria-label="Featured lots, scroll sideways for more"
        className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {rows.map(({ lot, stats }) => (
          <li key={lot.id} className="flex w-[85%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
            <LotCard lot={lot} stats={stats} className="w-full" />
          </li>
        ))}
      </ul>

      <Link
        to="/cattle"
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-lg font-semibold text-primary underline-offset-4 hover:underline"
      >
        Browse all cattle
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </section>
  )
}
