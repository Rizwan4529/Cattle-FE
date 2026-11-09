import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ScanLine } from 'lucide-react'
import { Link } from 'react-router'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { formatAge, formatShortDate, formatWeight } from '@/lib/format'
import { SEX_LABELS } from '@/lib/labels'
import { useRanchStore } from '@/store/useRanchStore'

const FEATURED_TAG = 'HCR-2417'

/**
 * The hero's proof point: one real animal's scan record. On load a scan line
 * sweeps the photo once and the readings appear in order, the same way the
 * chute camera fills them in.
 */
export function HeroScanCard() {
  const animal = useRanchStore((s) => s.animals.find((a) => a.tagId === FEATURED_TAG) ?? s.animals[0])
  const lot = useRanchStore((s) => s.lots.find((l) => l.tagIds.includes(animal.tagId)))
  const reduce = useReducedMotion()

  const shots = animal.health.filter((h) => h.type === 'vaccination').length
  const readings = [
    { label: 'Weight', value: formatWeight(animal.estWeight) },
    { label: 'Frame score', value: String(animal.frameScore) },
    { label: 'Body condition', value: `${animal.bcs} of 9` },
    { label: 'Camera confidence', value: `${animal.scanConfidence}%` },
    { label: 'Age', value: formatAge(animal.birthDate) },
    { label: 'Shots on record', value: String(shots) },
  ]

  return (
    <figure className="overflow-hidden rounded-2xl border bg-card shadow-lg shadow-foreground/5">
      <div className="relative aspect-16/10 overflow-hidden">
        <CattleImage
          coat={animal.coatColor}
          sex={animal.sex}
          seed="hero-2417"
          pose="standing"
          alt={`Illustration of ${animal.breed} ${animal.sex} ${animal.tagId}`}
        />
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-tag/25 to-tag/60"
            style={{ boxShadow: '0 2px 0 0 var(--tag)' }}
            initial={{ top: '-35%' }}
            animate={{ top: '105%' }}
            transition={{ duration: 1.6, delay: 0.3, ease: 'easeInOut' }}
          />
        )}
        <EarTag tagId={animal.tagId} className="absolute top-3 left-3" />
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-sm font-medium">
          <ScanLine className="size-4 text-primary" aria-hidden />
          Scanned {formatShortDate(animal.scanDate)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
        {readings.map((r, i) => (
          <motion.div
            key={r.label}
            className="bg-card px-4 py-3"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.12, duration: 0.3 }}
          >
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">{r.value}</dd>
          </motion.div>
        ))}
      </dl>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
        <span className="text-muted-foreground">
          {animal.breed} {SEX_LABELS[animal.sex].toLowerCase()}
          {lot && `, in Lot ${lot.number}`}
        </span>
        <Link
          to={`/animal/${animal.tagId}`}
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
        >
          See its full record
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </figcaption>
    </figure>
  )
}
