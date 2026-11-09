import { motion } from 'framer-motion'
import { Download, PackagePlus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Animal } from '@/data/types'
import { RESCAN_BELOW } from '@/lib/chuteScan'
import { formatNumber } from '@/lib/format'

/** Shown when the run finishes: what came through, and what to do with it. */
export function ScanSummary({
  rows,
  groupLabel,
  onCreateLot,
  onDownload,
  onRestart,
}: {
  rows: Animal[]
  groupLabel: string
  onCreateLot: () => void
  onDownload: () => void
  onRestart: () => void
}) {
  const weights = rows.map((a) => a.estWeight)
  const avg = Math.round(weights.reduce((s, w) => s + w, 0) / rows.length)
  const avgConfidence = rows.reduce((s, a) => s + a.scanConfidence, 0) / rows.length
  const rescan = rows.filter((a) => a.scanConfidence < RESCAN_BELOW)

  const stats = [
    { label: 'Average weight', value: `${formatNumber(avg)} lb` },
    {
      label: 'Weight range',
      value: `${formatNumber(Math.min(...weights))}–${formatNumber(Math.max(...weights))} lb`,
    },
    { label: 'Average confidence', value: `${avgConfidence.toFixed(1)}%` },
    {
      label: 'Need a rescan',
      value:
        rescan.length === 0 ? (
          'None'
        ) : rescan.length <= 2 ? (
          <span className="flex flex-wrap gap-x-3">
            {rescan.map((a) => (
              <span key={a.tagId} className="whitespace-nowrap">
                {a.tagId}
              </span>
            ))}
          </span>
        ) : (
          `${rescan.length} head`
        ),
    },
  ]

  return (
    <motion.section
      aria-labelledby="scan-summary-heading"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="grid gap-6 rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
    >
      <div className="grid gap-4">
        <div>
          <h2 id="scan-summary-heading" className="text-3xl font-bold sm:text-4xl">
            {rows.length} {groupLabel.toLowerCase()} scanned
          </h2>
          <p className="mt-1 text-lg text-muted-foreground">
            Every animal has a weight, frame score, and body condition on its record. Turn them into a lot, or download the file.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0 border-t pt-2">
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="font-heading text-2xl font-bold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:w-72 lg:grid-cols-1">
        <Button size="lg" onClick={onCreateLot}>
          <PackagePlus aria-hidden />
          Create lot from scan
        </Button>
        <Button size="lg" variant="outline" onClick={onDownload}>
          <Download aria-hidden />
          Download CSV
        </Button>
        <Button variant="ghost" onClick={onRestart} className="sm:col-span-2 lg:col-span-1">
          <RotateCcw aria-hidden />
          Scan another group
        </Button>
      </div>
    </motion.section>
  )
}
