import { useEffect, useRef } from 'react'
import { Download, FileSpreadsheet, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Animal } from '@/data/types'
import { csvFileName, formatClock, RESCAN_BELOW, scanTimestamp } from '@/lib/chuteScan'
import { formatNumber } from '@/lib/format'
import { COAT_LABELS, SEX_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

const COLUMNS = ['Tag', 'Electronic ID', 'Sex', 'Breed', 'Coat', 'Weight (lb)', 'Frame', 'BCS', 'Confidence', 'Time'] as const

/**
 * The scan file as it's written: one row per animal, newest at the bottom,
 * drawn like a spreadsheet so it reads as the CSV it will download as.
 */
export function ScanLog({ rows, onDownload }: { rows: Animal[]; onDownload: () => void }) {
  const scroller = useRef<HTMLDivElement>(null)

  // Follow new rows, without moving the page itself.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [rows.length])

  return (
    <section aria-labelledby="scan-log-heading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="scan-log-heading" className="text-3xl font-bold sm:text-4xl">
            Scan file
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <FileSpreadsheet className="size-4 shrink-0" aria-hidden />
            <span className="break-all">
              {csvFileName()}, {rows.length} {rows.length === 1 ? 'row' : 'rows'}
            </span>
          </p>
        </div>
        <Button variant="outline" onClick={onDownload} disabled={rows.length === 0}>
          <Download aria-hidden />
          Download CSV
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed px-4 py-10 text-center text-muted-foreground">
          Rows appear here as each animal clears the tunnel.
        </p>
      ) : (
        <div ref={scroller} className="relative max-h-[30rem] overflow-auto rounded-xl border bg-card" tabIndex={0} aria-label="Scan file rows">
          <table className="w-full min-w-[60rem] border-collapse text-left tabular-nums">
            <caption className="sr-only">One row per scanned animal, in the order they came through.</caption>
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th scope="col" className="w-12 border-r border-b px-3 py-2.5 text-right text-sm font-medium text-muted-foreground">
                  <span className="sr-only">Row</span>
                </th>
                {COLUMNS.map((c) => (
                  <th key={c} scope="col" className="border-r border-b px-3 py-2.5 text-sm font-semibold whitespace-nowrap last:border-r-0">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => {
                const low = a.scanConfidence < RESCAN_BELOW
                return (
                  <tr key={a.tagId} className={cn('row-arrive border-b last:border-b-0', low && 'bg-warning/10')}>
                    <td className="border-r px-3 py-2.5 text-right text-sm text-muted-foreground">{i + 1}</td>
                    <th scope="row" className="border-r px-3 py-2.5 font-heading text-lg font-bold whitespace-nowrap">
                      {a.tagId}
                    </th>
                    <td className="border-r px-3 py-2.5 whitespace-nowrap text-muted-foreground">{a.eid}</td>
                    <td className="border-r px-3 py-2.5">{SEX_LABELS[a.sex]}</td>
                    <td className="border-r px-3 py-2.5 whitespace-nowrap">{a.breed}</td>
                    <td className="border-r px-3 py-2.5 whitespace-nowrap">{COAT_LABELS[a.coatColor]}</td>
                    <td className="border-r px-3 py-2.5 text-right font-semibold">{formatNumber(a.estWeight)}</td>
                    <td className="border-r px-3 py-2.5 text-right">{a.frameScore}</td>
                    <td className="border-r px-3 py-2.5 text-right">{a.bcs}</td>
                    <td className="border-r px-3 py-2.5 whitespace-nowrap">
                      <span className={cn('inline-flex items-center gap-1.5', low && 'font-semibold text-warning-foreground dark:text-warning')}>
                        {low && <TriangleAlert className="size-4" aria-hidden />}
                        {a.scanConfidence.toFixed(1)}%{low && <span>, rescan</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{formatClock(scanTimestamp(i))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
