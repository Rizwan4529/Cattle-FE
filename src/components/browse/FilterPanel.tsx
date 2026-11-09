import { type ReactNode, useId, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import type { LotClass, LotStatus } from '@/data/types'
import { formatCurrency, formatNumber } from '@/lib/format'
import { LOT_CLASS_LABELS, LOT_STATUS_LABELS } from '@/lib/labels'
import {
  type FilterBounds,
  HEAD_OPTIONS,
  type LotFilters,
  normalizeRange,
  PRICE_STEP,
  type Range,
  WEIGHT_STEP,
} from '@/lib/lotFilters'
import type { LotRow } from '@/lib/lots'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b pb-6 last:border-b-0">
      <legend className="mb-3 font-heading text-xl font-bold">{title}</legend>
      {children}
    </fieldset>
  )
}

function CheckList<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string; count: number }[]
  selected: T[]
  onChange: (next: T[]) => void
}) {
  const id = useId()
  return (
    <ul className="grid gap-1">
      {options.map((o) => {
        const checked = selected.includes(o.value)
        const inputId = `${id}-${o.value}`
        return (
          <li key={o.value}>
            <Label
              htmlFor={inputId}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 font-normal hover:bg-muted"
            >
              <Checkbox
                id={inputId}
                checked={checked}
                onCheckedChange={(c) => onChange(c ? [...selected, o.value] : selected.filter((v) => v !== o.value))}
              />
              <span className="flex-1">{o.label}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{o.count}</span>
            </Label>
          </li>
        )
      })}
    </ul>
  )
}

/** Dual-thumb slider. Moves locally while dragging; commits to the URL on release. */
function RangeFilter({
  label,
  value,
  bounds,
  step,
  format,
  onCommit,
}: {
  label: string
  value: Range | null
  bounds: Range
  step: number
  format: (n: number) => string
  onCommit: (range: Range | null) => void
}) {
  const current = value ?? bounds
  const [local, setLocal] = useState<Range>(current)
  const [synced, setSynced] = useState<Range>(current)
  // Follow outside changes (e.g. "Clear all") without fighting the drag.
  if (synced[0] !== current[0] || synced[1] !== current[1]) {
    setSynced(current)
    setLocal(current)
  }

  return (
    <div className="grid gap-4 px-1">
      <p className="flex justify-between text-base font-semibold tabular-nums" aria-hidden>
        <span>{format(local[0])}</span>
        <span>{format(local[1])}</span>
      </p>
      <Slider
        min={bounds[0]}
        max={bounds[1]}
        step={step}
        minStepsBetweenThumbs={1}
        value={local}
        onValueChange={(v) => setLocal([v[0], v[1]])}
        onValueCommit={(v) => onCommit(normalizeRange([v[0], v[1]], bounds))}
        thumbLabels={[`Minimum ${label}`, `Maximum ${label}`]}
        getValueText={format}
        className="py-2"
      />
    </div>
  )
}

const count = <T,>(rows: LotRow[], pick: (r: LotRow) => T, value: T) => rows.filter((r) => pick(r) === value).length

export function FilterPanel({
  filters,
  bounds,
  rows,
  onChange,
}: {
  filters: LotFilters
  bounds: FilterBounds
  rows: LotRow[]
  onChange: (patch: Partial<LotFilters>) => void
}) {
  const id = useId()
  const classOptions = (Object.keys(LOT_CLASS_LABELS) as LotClass[]).map((value) => ({
    value,
    label: LOT_CLASS_LABELS[value],
    count: count(rows, (r) => r.lot.class, value),
  }))
  const statusOptions = (Object.keys(LOT_STATUS_LABELS) as LotStatus[]).map((value) => ({
    value,
    label: LOT_STATUS_LABELS[value],
    count: count(rows, (r) => r.lot.status, value),
  }))
  const breedOptions = bounds.breeds.map((value) => ({ value, label: value, count: count(rows, (r) => r.lot.breedSummary, value) }))

  return (
    <div className="grid gap-6">
      <Section title="Class">
        <CheckList options={classOptions} selected={filters.classes} onChange={(classes) => onChange({ classes })} />
      </Section>

      <Section title="Status">
        <CheckList options={statusOptions} selected={filters.statuses} onChange={(statuses) => onChange({ statuses })} />
      </Section>

      <Section title="Average weight">
        <RangeFilter
          label="average weight"
          value={filters.weight}
          bounds={bounds.weight}
          step={WEIGHT_STEP}
          format={(n) => `${formatNumber(n)} lb`}
          onCommit={(weight) => onChange({ weight })}
        />
      </Section>

      <Section title="Price per head">
        <RangeFilter
          label="price per head"
          value={filters.price}
          bounds={bounds.price}
          step={PRICE_STEP}
          format={formatCurrency}
          onCommit={(price) => onChange({ price })}
        />
      </Section>

      <Section title="Head in the lot">
        <RadioGroup
          value={String(filters.minHead)}
          onValueChange={(v) => onChange({ minHead: Number(v) })}
          className="grid gap-1"
        >
          {HEAD_OPTIONS.map((n) => (
            <Label
              key={n}
              htmlFor={`${id}-head-${n}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 font-normal hover:bg-muted"
            >
              <RadioGroupItem id={`${id}-head-${n}`} value={String(n)} />
              {n === 0 ? 'Any number' : `${n} or more`}
            </Label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="Breed">
        <CheckList options={breedOptions} selected={filters.breeds} onChange={(breeds) => onChange({ breeds })} />
      </Section>
    </div>
  )
}
