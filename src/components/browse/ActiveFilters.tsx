import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatNumber } from '@/lib/format'
import { LOT_CLASS_LABELS, LOT_STATUS_LABELS } from '@/lib/labels'
import type { LotFilters } from '@/lib/lotFilters'

interface Chip {
  key: string
  label: string
  remove: Partial<LotFilters>
}

function chipsFor(f: LotFilters): Chip[] {
  const chips: Chip[] = []
  if (f.q) chips.push({ key: 'q', label: `“${f.q}”`, remove: { q: '' } })
  for (const c of f.classes) {
    chips.push({ key: `c-${c}`, label: LOT_CLASS_LABELS[c], remove: { classes: f.classes.filter((x) => x !== c) } })
  }
  for (const s of f.statuses) {
    chips.push({ key: `s-${s}`, label: LOT_STATUS_LABELS[s], remove: { statuses: f.statuses.filter((x) => x !== s) } })
  }
  for (const b of f.breeds) {
    chips.push({ key: `b-${b}`, label: b, remove: { breeds: f.breeds.filter((x) => x !== b) } })
  }
  if (f.weight) {
    chips.push({ key: 'w', label: `${formatNumber(f.weight[0])}–${formatNumber(f.weight[1])} lb`, remove: { weight: null } })
  }
  if (f.price) {
    chips.push({ key: 'p', label: `${formatCurrency(f.price[0])}–${formatCurrency(f.price[1])}/head`, remove: { price: null } })
  }
  if (f.minHead) chips.push({ key: 'h', label: `${f.minHead}+ head`, remove: { minHead: 0 } })
  return chips
}

/** Removable chips for every active filter, plus "Clear all". */
export function ActiveFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: LotFilters
  onChange: (patch: Partial<LotFilters>) => void
  onClear: () => void
}) {
  const chips = chipsFor(filters)
  if (!chips.length) return null

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full pr-2"
            onClick={() => onChange(chip.remove)}
            aria-label={`Remove filter: ${chip.label}`}
          >
            {chip.label}
            <X aria-hidden />
          </Button>
        </li>
      ))}
      <li>
        <Button variant="link" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </li>
    </ul>
  )
}
