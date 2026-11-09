import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { CattleImage, type CattleImageProps } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { Button } from '@/components/ui/button'
import type { Animal, Lot } from '@/data/types'
import { formatWeight } from '@/lib/format'
import { SEX_LABELS } from '@/lib/labels'
import { lotIllustration, type LotStats } from '@/lib/lots'
import { cn } from '@/lib/utils'

type GalleryItem =
  | { kind: 'photo'; id: string; caption: string; tagId?: string; image: CattleImageProps }
  | { kind: 'video'; id: 'video'; caption: string; tagId?: undefined; image: CattleImageProps }

const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

function buildItems(lot: Lot, stats: LotStats, animals: Animal[]): GalleryItem[] {
  const lotImage = lotIllustration(lot, stats)
  const items: GalleryItem[] = [
    { kind: 'photo', id: 'lot', caption: `${lot.title} in the ${lot.location.pasture.toLowerCase()}`, image: { ...lotImage, pose: 'standing' } },
  ]
  animals.slice(0, 3).forEach((a, i) => {
    items.push({
      kind: 'photo',
      id: a.tagId,
      tagId: a.tagId,
      caption: `${a.breed} ${SEX_LABELS[a.sex].toLowerCase()}, ${formatWeight(a.estWeight)}`,
      image: {
        coat: a.coatColor,
        sex: a.sex,
        withCalf: Boolean(a.calfAtSide),
        photos: a.photos,
        seed: a.tagId,
        pose: i === 1 && a.sex !== 'bull' ? 'grazing' : 'standing',
        alt: `${a.tagId}, ${a.breed} ${SEX_LABELS[a.sex].toLowerCase()}`,
      },
    })
  })
  items.push({ kind: 'video', id: 'video', caption: lot.video.caption, image: { ...lotImage, seed: `${lot.id}-video` } })
  return items
}

/**
 * Stand-in for the ranch's walk-through video: plays a slow pan across the
 * illustration with a working timeline, clearly labeled as a sample.
 */
function VideoPlaceholder({ item, duration }: { item: GalleryItem; duration: number }) {
  const reduce = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const done = time >= duration

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setTime((t) => {
        if (t + 0.25 >= duration) {
          setPlaying(false)
          return duration
        }
        return t + 0.25
      })
    }, 250)
    return () => clearInterval(timer)
  }, [playing, duration])

  const progress = time / duration
  const toggle = () => {
    if (done) setTime(0)
    setPlaying((p) => !p)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-leather">
      <div
        className="h-full w-full transition-transform duration-300 ease-linear"
        style={reduce ? undefined : { transform: `scale(${1 + progress * 0.18}) translateX(${progress * -6}%)` }}
      >
        <CattleImage {...item.image} />
      </div>
      <div className={cn('absolute inset-0 bg-black/35 transition-opacity', playing && 'opacity-0')} aria-hidden />
      <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">Sample video</span>

      {!playing && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 m-auto grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          aria-label={done ? 'Replay video' : time ? 'Resume video' : 'Play video'}
        >
          {done ? <RotateCcw className="size-8" /> : <Play className="ml-1 size-9 fill-current" />}
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3 text-white">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          className="text-white hover:bg-white/15 hover:text-white"
          aria-label={playing ? 'Pause video' : 'Play video'}
        >
          {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
        </Button>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30"
          role="progressbar"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        >
          <div className="h-full rounded-full bg-tag" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums">
          {formatTime(time)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

export function LotGallery({ lot, stats, animals }: { lot: Lot; stats: LotStats; animals: Animal[] }) {
  const items = buildItems(lot, stats, animals)
  const [index, setIndex] = useState(0)
  const current = items[Math.min(index, items.length - 1)]
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length)

  return (
    <section aria-label="Photos and video" className="grid gap-3">
      <div
        className="relative aspect-4/3 overflow-hidden rounded-2xl border bg-muted sm:aspect-16/10"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1)
          if (e.key === 'ArrowRight') go(1)
        }}
      >
        {current.kind === 'video' ? (
          <VideoPlaceholder key={current.id} item={current} duration={lot.video.durationSec} />
        ) : (
          <>
            <CattleImage {...current.image} />
            {current.tagId && <EarTag tagId={current.tagId} className="absolute top-3 left-3" />}
          </>
        )}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => go(-1)}
          className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-background/85 shadow-sm"
          aria-label="Previous photo"
        >
          <ChevronLeft className="size-6" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => go(1)}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-background/85 shadow-sm"
          aria-label="Next photo"
        >
          <ChevronRight className="size-6" />
        </Button>
      </div>

      <p className="text-muted-foreground" aria-live="polite">
        <span className="sr-only">
          Item {index + 1} of {items.length}:{' '}
        </span>
        {current.tagId && <strong className="font-semibold text-foreground">{current.tagId}. </strong>}
        {current.caption}
      </p>

      <ul className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item, i) => (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-current={i === index}
              aria-label={item.kind === 'video' ? `Video: ${item.caption}` : item.tagId ? `Photo of ${item.tagId}` : 'Photo of the whole lot'}
              className={cn(
                'relative block aspect-4/3 w-24 overflow-hidden rounded-lg border-2 border-transparent opacity-75 transition hover:opacity-100 sm:w-28',
                i === index && 'border-primary opacity-100',
              )}
            >
              <CattleImage {...item.image} alt="" />
              {item.kind === 'video' && (
                <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                  <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold">
                    <Play className="size-3 fill-current" aria-hidden />
                    {formatTime(lot.video.durationSec)}
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
