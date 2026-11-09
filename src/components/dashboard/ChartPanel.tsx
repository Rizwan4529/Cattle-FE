import { type ReactNode, useState } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * A chart with its title, a one-line takeaway, and a switch to see the same
 * numbers as a table (for screen readers, printing, and exact figures).
 */
export function ChartPanel({
  id,
  title,
  summary,
  chart,
  table,
  className,
}: {
  id: string
  title: string
  summary: ReactNode
  chart: ReactNode
  table: ReactNode
  className?: string
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <section aria-labelledby={id} className={className}>
      <div className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="grid items-start gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <h2 id={id} className="text-2xl font-bold">
              {title}
            </h2>
            <p className="mt-1 text-muted-foreground">{summary}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="-ml-2 justify-self-start sm:-mr-2 sm:ml-0"
          >
            {asTable ? <ChartColumn aria-hidden /> : <Table2 aria-hidden />}
            {asTable ? 'Show chart' : 'Show table'}
          </Button>
        </div>
        <div className="min-w-0 flex-1">{asTable ? table : chart}</div>
      </div>
    </section>
  )
}

/** Plain two- or three-column table used as a chart's table view. */
export function ChartTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted">
          <tr>
            {columns.map((c, i) => (
              <th key={c} scope="col" className={i === 0 ? 'px-3 py-2 font-semibold' : 'px-3 py-2 text-right font-semibold'}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])} className="border-t">
              {r.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-3 py-2 font-medium">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-3 py-2 text-right">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Shared tooltip shell so all three charts look the same. */
export function TooltipBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-semibold">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-muted-foreground tabular-nums">
          {l}
        </p>
      ))}
    </div>
  )
}
