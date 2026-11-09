import { type ReactNode, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { EarTag } from '@/components/cattle/EarTag'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Animal, Lot } from '@/data/types'
import { formatAge, formatDate, formatNumber, formatShortDate } from '@/lib/format'
import { SEX_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

type SortKey = 'tag' | 'age' | 'weight' | 'frame' | 'bcs' | 'confidence'

interface Column {
  key: string
  label: string
  sort?: SortKey
  align?: 'right'
  cell: (a: Animal) => ReactNode
}

const SORTERS: Record<SortKey, (a: Animal, b: Animal) => number> = {
  tag: (a, b) => a.tagId.localeCompare(b.tagId),
  // Oldest first when ascending
  age: (a, b) => a.birthDate.localeCompare(b.birthDate),
  weight: (a, b) => a.estWeight - b.estWeight,
  frame: (a, b) => a.frameScore - b.frameScore,
  bcs: (a, b) => a.bcs - b.bcs,
  confidence: (a, b) => a.scanConfidence - b.scanConfidence,
}

function columnsFor(lot: Lot, animals: Animal[]): Column[] {
  const cols: Column[] = []
  // Only worth a column when the animals differ; otherwise the lot title says it.
  const kinds = new Set(animals.map((a) => `${a.breed} ${a.sex}`))
  if (kinds.size > 1) {
    cols.push({
      key: 'animal',
      label: 'Animal',
      cell: (a) => (
        <span className="whitespace-nowrap">
          {a.breed} {SEX_LABELS[a.sex].toLowerCase()}
        </span>
      ),
    })
  }
  cols.push(
    { key: 'age', label: 'Age', sort: 'age', cell: (a) => <span className="whitespace-nowrap">{formatAge(a.birthDate)}</span> },
    { key: 'weight', label: 'Est. weight', sort: 'weight', align: 'right', cell: (a) => `${formatNumber(a.estWeight)} lb` },
    { key: 'frame', label: 'Frame', sort: 'frame', align: 'right', cell: (a) => a.frameScore },
    { key: 'bcs', label: 'BCS', sort: 'bcs', align: 'right', cell: (a) => a.bcs },
  )
  if (lot.class === 'bred') {
    cols.push({ key: 'due', label: 'Due', cell: (a) => (a.pregnancy?.dueDate ? formatDate(a.pregnancy.dueDate) : 'Open') })
  }
  if (lot.class === 'pairs') {
    cols.push({
      key: 'calf',
      label: 'Calf at side',
      cell: (a) =>
        a.calfAtSide ? (
          <span className="whitespace-nowrap">
            {a.calfAtSide.sex}, {formatNumber(a.calfAtSide.estWeight)} lb
          </span>
        ) : (
          'None'
        ),
    })
  }
  if (lot.class === 'bulls') {
    cols.push({ key: 'reg', label: 'Registration', cell: (a) => <span className="whitespace-nowrap">{a.registration ?? 'Commercial'}</span> })
  }
  cols.push({
    key: 'scan',
    label: 'Camera scan',
    sort: 'confidence',
    align: 'right',
    cell: (a) => (
      <span className="whitespace-nowrap">
        {a.scanConfidence}%<span className="block text-sm text-muted-foreground">{formatShortDate(a.scanDate)}</span>
      </span>
    ),
  })
  return cols
}

/** Every ear tag in the lot. Sortable; each row opens that animal's passport. */
export function AnimalTable({ lot, animals }: { lot: Lot; animals: Animal[] }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'tag', dir: 'asc' })
  const columns = columnsFor(lot, animals)
  const rows = [...animals].sort((a, b) => SORTERS[sort.key](a, b) * (sort.dir === 'asc' ? 1 : -1))

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'tag' ? 'asc' : 'desc' }))

  const header = (label: string, key?: SortKey, align?: 'right') => {
    if (!key) return label
    const active = sort.key === key
    const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <button
        type="button"
        onClick={() => toggle(key)}
        className={cn(
          '-mx-2 inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 font-semibold hover:bg-muted',
          align === 'right' && 'flex-row-reverse',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
        <Icon className={cn('size-4', !active && 'opacity-50')} aria-hidden />
      </button>
    )
  }
  const ariaSort = (key?: SortKey) => (key && sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : key ? 'none' : undefined)

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-base">
        <caption className="sr-only">
          Animals in Lot {lot.number}. Select a column heading to sort. Select a row to open that animal's record.
        </caption>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead aria-sort={ariaSort('tag')} className="sticky left-0 z-10 h-12 bg-muted pl-4">
              {header('Ear tag', 'tag')}
            </TableHead>
            {columns.map((c) => (
              <TableHead key={c.key} aria-sort={ariaSort(c.sort)} className={cn('h-12', c.align === 'right' && 'text-right')}>
                {header(c.label, c.sort, c.align)}
              </TableHead>
            ))}
            <TableHead className="w-10">
              <span className="sr-only">Open record</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.tagId} className="group cursor-pointer" onClick={() => navigate(`/animal/${a.tagId}`)}>
              <TableCell className="sticky left-0 z-10 bg-card py-3 pl-4 group-hover:bg-muted">
                <Link to={`/animal/${a.tagId}`} className="rounded-md" onClick={(e) => e.stopPropagation()}>
                  <EarTag tagId={a.tagId} size="sm" />
                </Link>
              </TableCell>
              {columns.map((c) => (
                <TableCell key={c.key} className={cn('py-3 tabular-nums', c.align === 'right' && 'text-right')}>
                  {c.cell(a)}
                </TableCell>
              ))}
              <TableCell className="pr-4 text-muted-foreground">
                <ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
