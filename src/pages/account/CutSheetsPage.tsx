import { ClipboardList, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { estimateCuts, presetById } from '@/lib/cutSheet'
import { formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { SHARE_LABELS } from '@/lib/yield'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

/** Rough take-home weight for a share size from a typical steer, for the list's quick summary. */
const TYPICAL_LB = { whole: 520, half: 260, quarter: 130, eighth: 65 } as const

export default function CutSheetsPage() {
  usePageTitle('Cut sheets')
  const sheets = useRanchStore((s) => s.cutSheets)

  return (
    <>
      <AccountHeader
        title="Cut sheets"
        description="How you want your beef cut. Edit a sheet any time before your beef goes to the processor."
        actions={
          <Button asChild>
            <Link to="/beef/cut-sheet">
              <Plus aria-hidden />
              New cut sheet
            </Link>
          </Button>
        }
      />
      {sheets.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <ClipboardList className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-lg">No saved cut sheets yet. Start from a favorite like Steak Lover or Family Freezer.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sheets.map((sheet) => {
            const e = estimateCuts(sheet, TYPICAL_LB[sheet.size])
            return (
              <li key={sheet.id}>
                <Link
                  to={`/beef/cut-sheet/${sheet.id}`}
                  className="grid gap-2 rounded-2xl border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="font-heading text-xl font-bold">{sheet.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {SHARE_LABELS[sheet.size]} share{sheet.tagId ? ` of ${sheet.tagId}` : ', not linked to a claim yet'}.{' '}
                    {sheet.preset ? `${presetById(sheet.preset)?.name}. ` : ''}Saved {formatDate(sheet.updatedAt)}.
                  </span>
                  <span className="text-sm">
                    Roughly {e.lb.steak} lb steaks, {e.lb.roast} lb roasts, {e.lb.ground} lb ground.
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
