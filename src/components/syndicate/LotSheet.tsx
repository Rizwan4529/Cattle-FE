import { QRCodeSVG } from 'qrcode.react'
import { CattleImage } from '@/components/cattle/CattleImage'
import { BrandMark } from '@/components/layout/RanchBrand'
import { ranch } from '@/config/ranch'
import type { Animal, Lot } from '@/data/types'
import { formatCurrency, formatToday, formatCwt, formatNumber, formatShortDate } from '@/lib/format'
import { COAT_LABELS, LOT_CLASS_LABELS, PRICING_MODE_LABELS, priceUnit, SEX_LABELS } from '@/lib/labels'
import { getLotAnimals, getLotStats, lotIllustration } from '@/lib/lots'

/**
 * The printable lot sheet: one page per lot with the essentials a sale barn
 * or buyer needs, and a QR code back to the full listing. Shown on screen as
 * a preview; printing the page prints only this.
 */
export function LotSheet({ lots, animals }: { lots: Lot[]; animals: Animal[] }) {
  return (
    <div className="theme-paper grid gap-6 print:block">
      {lots.map((lot) => {
        const stats = getLotStats(lot, animals)
        const members = getLotAnimals(lot, animals)
        const url = `${window.location.origin}/lots/${lot.id}`
        return (
          <article
            key={lot.id}
            className="grid min-w-[38rem] gap-4 rounded-lg border bg-card p-6 text-foreground shadow-sm print:min-w-0 print:break-after-page print:rounded-none print:border-0 print:p-0 print:shadow-none print:last:break-after-auto"
          >
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
                Lot sheet
                <br />
                {formatToday()}
              </p>
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)_9rem] gap-5">
              <div className="grid content-start gap-2">
                <p className="text-sm font-semibold">
                  Lot {lot.number}, {LOT_CLASS_LABELS[lot.class]}
                </p>
                <h3 className="font-heading text-3xl leading-tight font-bold">{lot.title}</h3>
                <p>{lot.description}</p>
              </div>
              <div className="aspect-4/3 overflow-hidden rounded border">
                <CattleImage {...lotIllustration(lot, stats)} alt="" />
              </div>
            </div>

            <dl className="grid grid-cols-4 gap-px overflow-hidden rounded border bg-border text-sm">
              {[
                ['Head', String(stats.headCount)],
                ['Average weight', `${formatNumber(stats.avgWeight)} lb`],
                ['Weight range', `${formatNumber(stats.minWeight)}–${formatNumber(stats.maxWeight)} lb`],
                [`Asking $/${priceUnit(lot.class)}`, formatCurrency(lot.pricePerHead)],
                ['Asking $/cwt', lot.class === 'pairs' ? 'n/a' : formatCwt(stats.pricePerCwt).replace('/cwt', '')],
                ['Lot total', formatCurrency(stats.lotTotal)],
                ['How to buy', PRICING_MODE_LABELS[lot.pricingMode]],
                ['Pickup', `${formatShortDate(lot.pickupWindow.start)} to ${formatShortDate(lot.pickupWindow.end)}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-card px-3 py-2">
                  <dt className="text-xs">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            {lot.highlights.length > 0 && <p className="text-sm">{lot.highlights.join('. ')}.</p>}

            <table className="w-full border-collapse text-left text-sm tabular-nums">
              <thead>
                <tr className="border-b-2 border-leather">
                  {['Tag', 'Sex', 'Breed', 'Coat', 'Weight (lb)', 'Frame', 'BCS'].map((h) => (
                    <th key={h} scope="col" className="py-1 pr-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((a) => (
                  <tr key={a.tagId} className="border-b">
                    <td className="py-1 pr-2 font-semibold">{a.tagId}</td>
                    <td className="py-1 pr-2">{SEX_LABELS[a.sex]}</td>
                    <td className="py-1 pr-2">{a.breed}</td>
                    <td className="py-1 pr-2">{COAT_LABELS[a.coatColor]}</td>
                    <td className="py-1 pr-2">{formatNumber(a.estWeight)}</td>
                    <td className="py-1 pr-2">{a.frameScore}</td>
                    <td className="py-1 pr-2">{a.bcs}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <footer className="flex items-center justify-between gap-4 border-t pt-3 text-sm">
              <p>
                Cattle are at {lot.location.pasture}, {lot.location.city}, {lot.location.state}. Every animal's record, with shots and weights, is
                online. Call {ranch.owner} at {ranch.phone}.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <QRCodeSVG value={url} size={64} level="M" bgColor="#FFFFFF" fgColor="#1F1A16" title={`QR code for Lot ${lot.number}`} />
                <span className="w-20 text-xs">Scan for the full listing</span>
              </div>
            </footer>
          </article>
        )
      })}
    </div>
  )
}
