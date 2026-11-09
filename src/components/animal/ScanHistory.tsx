import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Animal } from '@/data/types'
import { formatDate, formatNumber } from '@/lib/format'

/** Every pass through the camera chute, newest first. */
export function ScanHistory({ animal }: { animal: Animal }) {
  const scans = [...animal.scans].sort((a, b) => b.date.localeCompare(a.date))
  if (!scans.length) {
    return <p className="text-muted-foreground">This animal hasn't been through the camera chute yet.</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-base">
        <caption className="sr-only">Camera chute scans for {animal.tagId}, newest first</caption>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="h-12 pl-4 font-semibold">Date</TableHead>
            <TableHead className="h-12 font-semibold">Station</TableHead>
            <TableHead className="h-12 text-right font-semibold">Est. weight</TableHead>
            <TableHead className="h-12 text-right font-semibold">Frame</TableHead>
            <TableHead className="h-12 text-right font-semibold">BCS</TableHead>
            <TableHead className="h-12 pr-4 font-semibold">Camera confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scans.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="py-3 pl-4 whitespace-nowrap">{formatDate(s.date)}</TableCell>
              <TableCell className="py-3 whitespace-nowrap text-muted-foreground">{s.station}</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{formatNumber(s.estWeight)} lb</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{s.frameScore}</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{s.bcs}</TableCell>
              <TableCell className="py-3 pr-4">
                <div className="flex min-w-40 items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-chart-2" style={{ width: `${s.confidence}%` }} />
                  </div>
                  <span className="w-14 text-right font-semibold tabular-nums">{s.confidence}%</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
