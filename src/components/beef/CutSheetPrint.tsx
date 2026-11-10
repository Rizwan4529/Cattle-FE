import { BrandMark } from '@/components/layout/RanchBrand'
import { beefConfig } from '@/config/beef'
import { ranch } from '@/config/ranch'
import type { CutSheet } from '@/data/beefTypes'
import { cutSheetRows, type CutEstimate } from '@/lib/cutSheet'
import { formatNumber, formatToday } from '@/lib/format'
import { SHARE_LABELS } from '@/lib/yield'

/**
 * The processor-ready cut sheet. Hidden on screen; it's what prints when the
 * customer chooses Print, in light colors whatever the screen theme.
 */
export function CutSheetPrint({
  sheet,
  estimate,
  takeHomeLb,
  owner,
}: {
  sheet: CutSheet
  estimate: CutEstimate
  takeHomeLb: number
  owner?: string
}) {
  const rows = cutSheetRows(sheet)
  return (
    <div className="theme-paper hidden bg-white text-foreground print:block">
      <header className="flex items-start justify-between gap-4 border-b-2 border-leather pb-3">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 text-primary" />
          <div>
            <p className="font-heading text-xl leading-tight font-bold">{ranch.name}</p>
            <p className="text-sm">
              {ranch.location.city}, {ranch.location.state}. {ranch.phone}
            </p>
          </div>
        </div>
        <p className="text-right text-sm">
          <span className="font-heading text-lg font-bold">Processor cut sheet</span>
          <br />
          {beefConfig.processor.name}
          <br />
          Printed {formatToday()}
        </p>
      </header>

      <dl className="mt-4 grid grid-cols-4 gap-4 text-sm">
        {[
          ['Customer', owner ?? '________________'],
          ['Animal', sheet.tagId ?? '________'],
          ['Share', SHARE_LABELS[sheet.size]],
          ['Take-home, est.', `${formatNumber(takeHomeLb)} lb`],
        ].map(([k, v]) => (
          <div key={k} className="border-b pb-1">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <table className="mt-5 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-leather">
            <th scope="col" className="w-48 py-1.5 pr-3">
              Section
            </th>
            <th scope="col" className="py-1.5">
              Instructions
            </th>
            <th scope="col" className="w-16 py-1.5 text-center">
              Done
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.section} className="border-b">
              <th scope="row" className="py-1.5 pr-3 align-top font-semibold">
                {r.section}
              </th>
              <td className="py-1.5 align-top">{r.instructions}</td>
              <td className="py-1.5 text-center align-top">☐</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-sm">
        <strong>Estimate:</strong> about {estimate.lb.steak} lb steaks, {estimate.lb.roast} lb roasts, {estimate.lb.ground} lb ground
        {estimate.pattyLb ? ` (${estimate.pattyLb} lb as patties)` : ''}, {estimate.lb.other} lb other. Actual weights depend on the animal.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
        <p className="border-t pt-1">Customer signature and date</p>
        <p className="border-t pt-1">Processor, received by</p>
      </div>
    </div>
  )
}
