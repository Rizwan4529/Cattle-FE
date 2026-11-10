import { BrandMark } from '@/components/layout/RanchBrand'
import { beefConfig } from '@/config/beef'
import { ranch } from '@/config/ranch'
import type { CutSheet, SharePool } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { beefTitle } from '@/lib/beef'
import { formatDate, formatNumber, formatToday } from '@/lib/format'
import { carcassShares } from '@/lib/processorExport'

/** Printable processor packet: one page per carcass, with every owner's cut sheet. Hidden on screen. */
export function ProcessorSheet({ entries, sheets }: { entries: { pool: SharePool; animal: Animal }[]; sheets: CutSheet[] }) {
  return (
    <div className="theme-paper hidden bg-white text-foreground print:block">
      {entries.map(({ pool, animal }) => (
        <article key={pool.id} className="break-after-page last:break-after-auto">
          <header className="flex items-start justify-between gap-4 border-b-2 border-leather pb-3">
            <div className="flex items-center gap-3">
              <BrandMark className="h-10 text-primary" />
              <div>
                <p className="font-heading text-xl leading-tight font-bold">{ranch.name}</p>
                <p className="text-sm">
                  {ranch.phone}. To {beefConfig.processor.name}, {beefConfig.processor.city}
                </p>
              </div>
            </div>
            <p className="text-right text-sm">
              <span className="font-heading text-lg font-bold">Carcass {pool.tagId}</span>
              <br />
              Harvest {pool.harvestDate ? formatDate(pool.harvestDate) : 'to be booked'}
              <br />
              Printed {formatToday()}
            </p>
          </header>
          <p className="mt-3 text-sm">
            {beefTitle(animal)}, {formatNumber(animal.estWeight)} lb live. Hang {pool.agingDays ?? beefConfig.dryAgeDays.max} days.
            {pool.hangingWeight ? ` Hanging weight ${formatNumber(pool.hangingWeight)} lb.` : ''}
          </p>
          {carcassShares(pool, animal, sheets).map((s, i) => (
            <section key={i} className="mt-4 break-inside-avoid">
              <h2 className="font-heading text-lg font-bold">
                {s.size}: {s.owner}
              </h2>
              <p className="text-sm">
                About {formatNumber(s.hangingLb)} lb hanging. Cut sheet: {s.sheetName}. Label every pack with {pool.tagId} and the owner’s name.
              </p>
              <table className="mt-1 w-full border-collapse text-left text-sm">
                <tbody>
                  {s.rows.map((r) => (
                    <tr key={r.section} className="border-b">
                      <th scope="row" className="w-44 py-1 pr-3 align-top font-semibold">
                        {r.section}
                      </th>
                      <td className="py-1">{r.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </article>
      ))}
    </div>
  )
}
