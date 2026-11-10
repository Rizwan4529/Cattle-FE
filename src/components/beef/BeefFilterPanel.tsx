import { useId } from 'react'
import { CheckList, Section } from '@/components/browse/FilterPanel'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { beefConfig } from '@/config/beef'
import type { FeedProgramId, ShareSize } from '@/data/beefTypes'
import type { PoolRow } from '@/lib/beef'
import { monthLabel, type PoolFilters } from '@/lib/poolFilters'
import { availableShareSizes, SHARE_LABELS } from '@/lib/yield'

function RadioList({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: string
  options: { value: string; label: string; count?: number }[]
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <RadioGroup value={value} onValueChange={onChange} aria-label={name} className="grid gap-1">
      {options.map((o) => (
        <Label
          key={o.value || 'any'}
          htmlFor={`${id}-${o.value || 'any'}`}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 font-normal hover:bg-muted"
        >
          <RadioGroupItem id={`${id}-${o.value || 'any'}`} value={o.value} />
          <span className="flex-1">{o.label}</span>
          {o.count !== undefined && <span className="text-sm text-muted-foreground tabular-nums">{o.count}</span>}
        </Label>
      ))}
    </RadioGroup>
  )
}

/** Feed program, breed, finish date, and share size filters for the Claim Your Beef page. Counts are of open animals. */
export function BeefFilterPanel({
  filters,
  rows,
  onChange,
}: {
  filters: PoolFilters
  rows: PoolRow[]
  onChange: (patch: Partial<PoolFilters>) => void
}) {
  const count = (pred: (r: PoolRow) => boolean) => rows.filter(pred).length
  const breeds = [...new Set(rows.map((r) => r.animal.breed))].sort()
  const months = [...new Set(rows.map((r) => r.animal.finishDate?.slice(0, 7)).filter((m): m is string => Boolean(m)))].sort()

  return (
    <div className="grid gap-6">
      <Section title="Feed program">
        <CheckList<FeedProgramId>
          options={beefConfig.feedPrograms.map((p) => ({ value: p.id, label: p.short, count: count((r) => r.pool.feedProgram === p.id) }))}
          selected={filters.programs}
          onChange={(programs) => onChange({ programs })}
        />
      </Section>
      <Section title="Breed">
        <CheckList
          options={breeds.map((b) => ({ value: b, label: b, count: count((r) => r.animal.breed === b) }))}
          selected={filters.breeds}
          onChange={(next) => onChange({ breeds: next })}
        />
      </Section>
      <Section title="Finish date">
        <RadioList
          name="Finish date"
          value={filters.finish}
          onChange={(finish) => onChange({ finish })}
          options={[
            { value: '', label: 'Any time' },
            ...months.map((m) => ({
              value: m,
              label: `Finishing ${monthLabel(m)}`,
              count: count((r) => Boolean(r.animal.finishDate?.startsWith(m))),
            })),
          ]}
        />
      </Section>
      <Section title="Share still open">
        <RadioList
          name="Share still open"
          value={filters.share}
          onChange={(v) => onChange({ share: v as ShareSize | '' })}
          options={[
            { value: '', label: 'Any size' },
            ...availableShareSizes().map((s) => ({
              value: s,
              label: `${SHARE_LABELS[s]}${s === 'whole' ? ' animal' : ''}`,
              count: count((r) => r.sizes.includes(s)),
            })),
          ]}
        />
      </Section>
    </div>
  )
}
