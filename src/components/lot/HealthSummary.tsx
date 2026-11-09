import { CircleCheck, ShieldCheck, Stethoscope } from 'lucide-react'
import { Link } from 'react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Animal } from '@/data/types'
import { formatDate } from '@/lib/format'
import { getHealthSummary, getVerifications } from '@/lib/lotHealth'

export function VerificationBadges({ animals }: { animals: Animal[] }) {
  const items = getVerifications(animals)
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map(({ id, label, detail, icon: Icon }) => (
        <li key={id} className="flex gap-3 rounded-xl border bg-card p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/15 text-success">
            <Icon className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold">{label}</span>
            <span className="block text-sm text-muted-foreground">{detail}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Every vaccine and dewormer given to the lot, plus any treatments, listed openly. */
export function HealthSummary({ animals }: { animals: Animal[] }) {
  const { products, treatments, notes } = getHealthSummary(animals)
  const head = animals.length

  return (
    <div className="grid gap-6">
      {notes.length > 0 && (
        <ul className="grid gap-2">
          {notes.map((n) => (
            <li key={n} className="flex gap-2.5">
              <CircleCheck className="mt-1 size-5 shrink-0 text-success" aria-hidden />
              {n}
            </li>
          ))}
        </ul>
      )}

      {products.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table className="text-base">
            <caption className="sr-only">Vaccines and dewormers given to this lot</caption>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-12 pl-4 font-semibold">Product</TableHead>
                <TableHead className="h-12 font-semibold">What it's for</TableHead>
                <TableHead className="h-12 text-right font-semibold">Head</TableHead>
                <TableHead className="h-12 pr-4 text-right font-semibold">Last given</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.product}>
                  <TableCell className="py-3 pl-4 font-semibold whitespace-nowrap">{p.product}</TableCell>
                  <TableCell className="min-w-56 py-3 whitespace-normal text-muted-foreground">{p.purpose}</TableCell>
                  <TableCell className="py-3 text-right whitespace-nowrap tabular-nums">
                    {p.head} of {head}
                  </TableCell>
                  <TableCell className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">{formatDate(p.lastDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <h4 className="flex items-center gap-2 font-heading text-xl font-bold">
          <Stethoscope className="size-5 text-primary" aria-hidden />
          Treatments
        </h4>
        {treatments.length === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="size-5 text-success" aria-hidden />
            No animal in this lot has needed treatment.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {treatments.map(({ tagId, event }) => (
              <li key={event.id}>
                <Link to={`/animal/${tagId}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                  {tagId}
                </Link>
                <span className="text-muted-foreground"> on {formatDate(event.date)}: </span>
                {event.detail}
                {event.product && <span className="block text-sm text-muted-foreground">Product used: {event.product}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
